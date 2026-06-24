// ============================================================================
// Minimal, dependency-free ZIP writer — STORE method only (no compression).
// PNGs are already DEFLATE-compressed internally, so storing them keeps the
// archive tiny while avoiding a runtime dependency. Good for our scale (a
// handful of ~1 MB slides); no ZIP64, so keep total under ~4 GB.
//
// Browser-only: returns a Blob. Call from a click handler.
// ============================================================================

// Standard CRC-32 (polynomial 0xEDB88320), table built once.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Filenames are slugified to ASCII upstream, so a byte-per-char copy is safe.
function asciiBytes(s) {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

// files: [{ name: string, data: Uint8Array }] → application/zip Blob.
export function makeZip(files) {
  const DOS_TIME = 0;       // 00:00:00
  const DOS_DATE = 0x0021;  // 1980-01-01 (valid: day 1, month 1, year 1980)
  const body = [];          // local headers + file data, in order
  const central = [];       // central directory records
  let offset = 0;           // running offset = next local header position

  for (const f of files) {
    const nameBytes = asciiBytes(f.name);
    const data = f.data;
    const crc = crc32(data);
    const size = data.length;

    // ---- Local file header (30 bytes + name) ----
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); // signature
    lh.setUint16(4, 20, true);         // version needed to extract
    lh.setUint16(6, 0, true);          // general purpose flags
    lh.setUint16(8, 0, true);          // method: 0 = store
    lh.setUint16(10, DOS_TIME, true);
    lh.setUint16(12, DOS_DATE, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, size, true);      // compressed size (== uncompressed)
    lh.setUint32(22, size, true);      // uncompressed size
    lh.setUint16(26, nameBytes.length, true);
    lh.setUint16(28, 0, true);         // extra field length
    const lhBytes = new Uint8Array(lh.buffer);
    body.push(lhBytes, nameBytes, data);

    // ---- Central directory record (46 bytes + name) ----
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true); // signature
    cd.setUint16(4, 20, true);         // version made by
    cd.setUint16(6, 20, true);         // version needed
    cd.setUint16(8, 0, true);          // flags
    cd.setUint16(10, 0, true);         // method
    cd.setUint16(12, DOS_TIME, true);
    cd.setUint16(14, DOS_DATE, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, size, true);
    cd.setUint32(24, size, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint16(30, 0, true);         // extra field length
    cd.setUint16(32, 0, true);         // comment length
    cd.setUint16(34, 0, true);         // disk number start
    cd.setUint16(36, 0, true);         // internal attributes
    cd.setUint32(38, 0, true);         // external attributes
    cd.setUint32(42, offset, true);    // offset of local header
    central.push(new Uint8Array(cd.buffer), nameBytes);

    offset += lhBytes.length + nameBytes.length + size;
  }

  let centralSize = 0;
  for (const c of central) centralSize += c.length;

  // ---- End of central directory (22 bytes, no comment) ----
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true); // signature
  eocd.setUint16(4, 0, true);          // disk number
  eocd.setUint16(6, 0, true);          // disk with central dir
  eocd.setUint16(8, files.length, true);  // records on this disk
  eocd.setUint16(10, files.length, true); // total records
  eocd.setUint32(12, centralSize, true);  // central dir size
  eocd.setUint32(16, offset, true);       // central dir offset (== body size)
  eocd.setUint16(20, 0, true);            // comment length

  return new Blob([...body, ...central, new Uint8Array(eocd.buffer)], { type: "application/zip" });
}

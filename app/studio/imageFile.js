"use client";
// Read an image File → a downscaled data-URL pair {src, thumb} plus natural size,
// PRESERVING PNG transparency (PNG in → PNG out; JPG/WEBP → JPEG for size). The
// Photos-panel uploader flattens to JPEG, which is fine for photos but kills a
// logo's alpha — so the canvas drop path uses this instead. Browser-only.
const MAX_SRC = 1600, MAX_THUMB = 400, QUALITY = 0.85;

function scaleCanvas(img, max) {
  const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * r));
  const h = Math.max(1, Math.round(img.naturalHeight * r));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  return c;
}

export function isImageFile(file) {
  return !!(file && (/^image\//.test(file.type || "") || /\.(png|jpe?g|webp|gif)$/i.test(file.name || "")));
}

export function readImageFile(file, cb) {
  if (!isImageFile(file)) { cb(null); return; }
  const png = /png$/i.test(file.type || "") || /\.png$/i.test(file.name || "");
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const enc = (canvas) => (png ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", QUALITY));
      let src, thumb;
      try { src = enc(scaleCanvas(img, MAX_SRC)); } catch (e) { src = String(reader.result); }
      try { thumb = enc(scaleCanvas(img, MAX_THUMB)); } catch (e) { thumb = src; }
      cb({ src, thumb, w: img.naturalWidth, h: img.naturalHeight, png, name: file.name || "image" });
    };
    img.onerror = () => cb(null);
    img.src = String(reader.result);
  };
  reader.onerror = () => cb(null);
  reader.readAsDataURL(file);
}

// Element box for a dropped image: fit within half the artboard, preserve aspect,
// centre on the drop point, clamp inside the board. Pure (testable).
export function fitDroppedImage(natW, natH, dropX, dropY, boardW, boardH) {
  const maxW = boardW * 0.5, maxH = boardH * 0.5;
  const nW = natW > 0 ? natW : maxW, nH = natH > 0 ? natH : maxH;
  const r = Math.min(1, maxW / nW, maxH / nH);
  const w = Math.max(16, Math.round(nW * r));
  const h = Math.max(16, Math.round(nH * r));
  const x = Math.round(Math.min(Math.max(0, dropX - w / 2), Math.max(0, boardW - w)));
  const y = Math.round(Math.min(Math.max(0, dropY - h / 2), Math.max(0, boardH - h)));
  return { x, y, w, h };
}

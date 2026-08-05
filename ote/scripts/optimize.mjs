#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
//  OTE media optimizer  ·  drive → variants → Cloudflare R2
// ─────────────────────────────────────────────────────────────────────────
//  Reads masters from ./drive-in/<discipline>/<id>.<ext>, generates optimized
//  variants, and uploads them to R2 under <discipline>/<id>/<variant>.
//
//  Usage (from ote/scripts):
//    npm install                 # sharp + aws-sdk + dotenv (one time)
//    node optimize.mjs           # optimize ALL + upload to R2
//    node optimize.mjs --no-upload            # write ./media-out only
//    node optimize.mjs --only=photography     # one discipline
//    node optimize.mjs --dry                  # list what would happen
//
//  Requires ffmpeg on PATH for video (poster + clip). Images need only sharp.
//  Reads credentials from ../.env (see .env.example).

import { readdir, mkdir, writeFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env") });

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split("=")[1] : undefined;
};
const NO_UPLOAD = flag("no-upload");
const DRY = flag("dry");
const ONLY = opt("only");

const IN_DIR = path.join(ROOT, "drive-in");
const OUT_DIR = path.join(ROOT, "media-out");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".heic"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".m4v", ".webm", ".avi"]);

// Variant specs (WebP). Video also emits poster.webp + clip.mp4.
const SIZES = { wall: 720, full: 2200 };

// ---- R2 client ----
let s3 = null;
function r2() {
  if (s3) return s3;
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error("Missing R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY in ../.env");
  }
  s3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  return s3;
}
const BUCKET = process.env.R2_BUCKET || "otes-media";

async function upload(key, body, contentType) {
  if (NO_UPLOAD || DRY) return;
  await r2().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

function ffmpeg(inArgs) {
  return new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", ["-y", "-loglevel", "error", ...inArgs], { stdio: "inherit" });
    p.on("error", reject);
    p.on("exit", (c) => (c === 0 ? resolve() : reject(new Error("ffmpeg exit " + c))));
  });
}

async function writeOut(key, buf) {
  const dest = path.join(OUT_DIR, key);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buf);
}

async function processImage(discipline, id, file) {
  const base = sharp(file, { failOn: "none" }).rotate();
  for (const [variant, size] of Object.entries(SIZES)) {
    const buf = await base
      .clone()
      .resize({ width: size, height: size, fit: "inside", withoutEnlargement: true })
      .webp({ quality: variant === "wall" ? 72 : 82 })
      .toBuffer();
    const key = `${discipline}/${id}/${variant}.webp`;
    await writeOut(key, buf);
    await upload(key, buf, "image/webp");
    console.log(`  ${key}  ${(buf.length / 1024).toFixed(0)}KB`);
  }
  // tiny blur LQIP as base64 data URI
  const blur = await base
    .clone()
    .resize({ width: 24 })
    .webp({ quality: 40 })
    .toBuffer();
  const dataUri = `data:image/webp;base64,${blur.toString("base64")}`;
  const bkey = `${discipline}/${id}/blur.txt`;
  await writeOut(bkey, Buffer.from(dataUri));
  await upload(bkey, dataUri, "text/plain");
}

async function processVideo(discipline, id, file) {
  const outDir = path.join(OUT_DIR, discipline, id);
  await mkdir(outDir, { recursive: true });
  const posterPng = path.join(outDir, "_poster.png");
  const clipMp4 = path.join(outDir, "clip.mp4");
  // grab a frame ~1s in for the poster
  await ffmpeg(["-ss", "1", "-i", file, "-frames:v", "1", posterPng]);
  // compressed, muted, web-friendly loop capped at 1080p
  await ffmpeg([
    "-i", file,
    "-an",
    "-vf", "scale='min(1920,iw)':-2",
    "-c:v", "libx264", "-crf", "24", "-preset", "veryfast",
    "-movflags", "+faststart",
    clipMp4,
  ]);
  // poster → wall.webp + poster.webp via sharp
  const poster = sharp(posterPng).rotate();
  for (const [variant, size] of [["poster", SIZES.full], ["wall", SIZES.wall]]) {
    const buf = await poster
      .clone()
      .resize({ width: size, height: size, fit: "inside", withoutEnlargement: true })
      .webp({ quality: variant === "wall" ? 72 : 82 })
      .toBuffer();
    const key = `${discipline}/${id}/${variant}.webp`;
    await writeOut(key, buf);
    await upload(key, buf, "image/webp");
    console.log(`  ${key}`);
  }
  const clipKey = `${discipline}/${id}/clip.mp4`;
  await upload(clipKey, createReadStream(clipMp4), "video/mp4");
  console.log(`  ${clipKey}`);
}

async function main() {
  let disciplines;
  try {
    disciplines = (await readdir(IN_DIR, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    console.error(`No input folder. Create ${IN_DIR}/<discipline>/<id>.<ext> and retry.`);
    process.exit(1);
  }
  if (ONLY) disciplines = disciplines.filter((d) => d === ONLY);

  let count = 0;
  for (const discipline of disciplines) {
    const dir = path.join(IN_DIR, discipline);
    const files = (await readdir(dir)).filter((f) => !f.startsWith("."));
    for (const f of files) {
      const ext = path.extname(f).toLowerCase();
      const id = path.basename(f, ext);
      const file = path.join(dir, f);
      if ((await stat(file)).isDirectory()) continue;
      console.log(`${discipline}/${id}${DRY ? "  (dry)" : ""}`);
      if (DRY) { count++; continue; }
      if (IMAGE_EXT.has(ext)) await processImage(discipline, id, file);
      else if (VIDEO_EXT.has(ext)) await processVideo(discipline, id, file);
      else { console.log(`  skip (unknown ext ${ext})`); continue; }
      count++;
    }
  }
  console.log(
    `\nDone: ${count} work(s) ${DRY ? "listed" : NO_UPLOAD ? "written to media-out/" : "uploaded to R2 " + BUCKET}.`
  );
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

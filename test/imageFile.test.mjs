import test from "node:test";
import assert from "node:assert/strict";
import { fitDroppedImage, isImageFile } from "../app/studio/imageFile";

const BW = 1080, BH = 1350;

test("fitDroppedImage: a large image is scaled to fit half the board", () => {
  const box = fitDroppedImage(4000, 3000, BW / 2, BH / 2, BW, BH);
  assert.ok(box.w <= BW * 0.5 + 1, "width within half board");
  assert.ok(box.h <= BH * 0.5 + 1, "height within half board");
  // aspect preserved (4:3)
  assert.ok(Math.abs(box.w / box.h - 4 / 3) < 0.02);
});

test("fitDroppedImage: centred on the drop point", () => {
  const box = fitDroppedImage(400, 400, 540, 675, BW, BH);
  assert.equal(box.x, Math.round(540 - box.w / 2));
  assert.equal(box.y, Math.round(675 - box.h / 2));
});

test("fitDroppedImage: clamped inside the board near an edge", () => {
  const box = fitDroppedImage(400, 400, 0, 0, BW, BH); // dropped top-left corner
  assert.equal(box.x, 0);
  assert.equal(box.y, 0);
  const box2 = fitDroppedImage(400, 400, BW, BH, BW, BH); // bottom-right corner
  assert.equal(box2.x, BW - box2.w);
  assert.equal(box2.y, BH - box2.h);
});

test("fitDroppedImage: a tiny image keeps near its natural size (no upscale)", () => {
  const box = fitDroppedImage(120, 90, 540, 675, BW, BH);
  assert.equal(box.w, 120);
  assert.equal(box.h, 90);
});

test("fitDroppedImage: zero/unknown dimensions fall back to half-board, never < 16", () => {
  const box = fitDroppedImage(0, 0, 540, 675, BW, BH);
  assert.ok(box.w >= 16 && box.h >= 16);
});

test("isImageFile: accepts png/jpg/webp by type or extension, rejects others", () => {
  assert.ok(isImageFile({ type: "image/png", name: "logo.png" }));
  assert.ok(isImageFile({ type: "", name: "photo.JPEG" }));
  assert.ok(isImageFile({ type: "image/webp", name: "x" }));
  assert.ok(!isImageFile({ type: "application/pdf", name: "doc.pdf" }));
  assert.ok(!isImageFile(null));
});

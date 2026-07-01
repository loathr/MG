// Unit checks for app/studio/driveExport.js — the PURE Drive request builders
// (folder/file metadata, folder URL, deck folder name, multipart framing). The
// network upload itself is browser-+-live-Drive-only and verified on deploy.
import test from "node:test";
import assert from "node:assert/strict";
import {
  driveFolderMetadata, driveFileMetadata, driveFolderUrl, driveFolderName,
  multipartHead, multipartTail,
} from "../app/studio/driveExport.js";

test("driveFolderMetadata: names the folder + the Drive folder mime", () => {
  assert.deepEqual(driveFolderMetadata("My Deck"), { name: "My Deck", mimeType: "application/vnd.google-apps.folder" });
  assert.equal(driveFolderMetadata("").name, "LOATHR carousel"); // blank → default
});

test("driveFileMetadata: name + parent folder (omits parents when none)", () => {
  assert.deepEqual(driveFileMetadata("deck-1.png", "FID"), { name: "deck-1.png", parents: ["FID"] });
  assert.deepEqual(driveFileMetadata("deck-1.png"), { name: "deck-1.png" });
});

test("driveFolderUrl / driveFolderName", () => {
  assert.equal(driveFolderUrl("abc123"), "https://drive.google.com/drive/folders/abc123");
  assert.equal(driveFolderUrl(""), null);
  assert.equal(driveFolderName("Ozempic"), "Ozempic — LOATHR");
  assert.equal(driveFolderName("  "), "LOATHR carousel");
});

test("multipartHead/Tail: frame a JSON metadata part + a binary part with the boundary", () => {
  const head = multipartHead({ name: "x.png" }, "image/png", "BND");
  assert.match(head, /^--BND\r\n/);
  assert.match(head, /Content-Type: application\/json; charset=UTF-8/);
  assert.match(head, /\{"name":"x\.png"\}/);
  assert.match(head, /Content-Type: image\/png\r\n\r\n$/);
  assert.equal(multipartTail("BND"), "\r\n--BND--");
});

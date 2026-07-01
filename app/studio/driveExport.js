"use client";
import { getDriveAccessToken } from "./firebaseClient";
import { renderSlidePngBytes, slug } from "./export";

// Google Drive export: render every slide to PNG (the same renderer the .zip
// export uses) and upload them into a deck-named folder in the user's Drive via
// the Drive REST API, authorised with the minimal `drive.file` scope from the
// existing Firebase Google sign-in. No server, no new API key.
//
// The request BUILDERS (folder/file metadata, folder URL, multipart framing) are
// PURE and unit-tested; the network calls are best-effort and only run in the
// browser with a live Drive token — untestable in the sandbox, verified on deploy.

const FOLDER_MIME = "application/vnd.google-apps.folder";
const FILES_URL = "https://www.googleapis.com/drive/v3/files";
const UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

// --- pure request builders (unit-tested) ---
export function driveFolderMetadata(name) {
  return { name: String(name || "LOATHR carousel"), mimeType: FOLDER_MIME };
}
export function driveFileMetadata(name, parentId) {
  const meta = { name: String(name || "slide.png") };
  if (parentId) meta.parents = [parentId];
  return meta;
}
export function driveFolderUrl(folderId) {
  return folderId ? "https://drive.google.com/drive/folders/" + encodeURIComponent(folderId) : null;
}
// The deck's Drive folder name from its project name.
export function driveFolderName(deckName) {
  const n = String(deckName || "").trim();
  return n ? n + " — LOATHR" : "LOATHR carousel";
}
// The multipart/related preamble + tail framing one metadata JSON part and one
// binary part. Returned as strings so the binary can be spliced between them (as a
// Blob) without stringifying the bytes. Pure.
export function multipartHead(metadata, mimeType, boundary) {
  return "--" + boundary + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) + "\r\n--" + boundary + "\r\nContent-Type: " + (mimeType || "application/octet-stream") + "\r\n\r\n";
}
export function multipartTail(boundary) { return "\r\n--" + boundary + "--"; }

// Turn a failed Drive API response into an actionable message. The Drive REST API
// returns { error: { message, errors:[{ reason }], status } }; a bare "HTTP 403"
// hides the real cause, so decode it and, for the common deploy misconfigurations,
// point at the fix (CLOUD_SETUP §8). Pure — unit-tested with real error shapes.
export function driveErrorMessage(status, body, action) {
  const err = body && body.error;
  const reason = String((err && ((err.errors && err.errors[0] && err.errors[0].reason) || err.status)) || "");
  const detail = String((err && err.message) || "");
  const probe = reason + " " + detail;
  let msg = (action || "Drive request") + " failed (HTTP " + status + ")";
  if (detail) msg += ": " + detail;
  if (status === 401 || /UNAUTHENTICATED|invalid credentials|expired/i.test(probe)) {
    msg += " — the Drive sign-in expired; try Save to Google Drive again.";
  } else if (status === 403) {
    if (/accessNotConfigured|SERVICE_DISABLED|has not been used/i.test(probe)) {
      msg += " — enable the Google Drive API for this project (CLOUD_SETUP §8, step 1), then retry.";
    } else if (/insufficient|scope|ACCESS_TOKEN_SCOPE/i.test(probe)) {
      msg += " — grant Drive access: add the drive.file scope to the OAuth consent screen (§8, step 2), then retry.";
    } else {
      msg += " — check the Drive API is enabled and the drive.file scope is consented (CLOUD_SETUP §8).";
    }
  }
  return msg;
}

// Read a failed response body (best-effort) and build the decoded error.
async function driveError(r, action) {
  let body = null;
  try { body = await r.json(); } catch (e) { /* non-JSON error body */ }
  return new Error(driveErrorMessage(r.status, body, action));
}

// --- network (browser-only, live-Drive-only) ---
function multipartBody(metadata, bytes, mimeType, boundary) {
  const enc = new TextEncoder();
  return new Blob([enc.encode(multipartHead(metadata, mimeType, boundary)), bytes, enc.encode(multipartTail(boundary))],
    { type: "multipart/related; boundary=" + boundary });
}

async function driveCreateFolder(token, name) {
  const r = await fetch(FILES_URL, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(driveFolderMetadata(name)),
  });
  if (!r.ok) throw await driveError(r, "Couldn't create the Drive folder");
  return (await r.json()).id;
}

async function driveUpload(token, name, parentId, bytes, mimeType, boundary) {
  const body = multipartBody(driveFileMetadata(name, parentId), bytes, mimeType, boundary);
  const r = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "multipart/related; boundary=" + boundary },
    body,
  });
  if (!r.ok) throw await driveError(r, "Drive upload failed for " + name);
  return (await r.json()).id;
}

// Render + upload the whole deck to a new Drive folder. opts.onProgress(done,total)
// fires before each slide and once at the end. opts.boundary lets a test inject a
// fixed multipart boundary; runtime uses a distinctive per-run one. Returns
// { folderId, folderUrl, count }. Throws on auth/API failure (caller surfaces it).
export async function exportDeckToDrive(slides, name, caption, opts) {
  const o = opts || {};
  const token = await getDriveAccessToken();
  if (!token) throw new Error("Google Drive isn't available — sign in with Google (cloud) first.");
  const boundary = o.boundary || ("----LOATHRDrive" + (typeof Date !== "undefined" ? Date.now().toString(36) : "x"));
  const folderId = await driveCreateFolder(token, driveFolderName(name));
  const base = slug(name);
  const list = Array.isArray(slides) ? slides : [];
  const total = list.length;
  let count = 0;
  for (let i = 0; i < list.length; i++) {
    if (o.onProgress) o.onProgress(i, total);
    const bytes = await renderSlidePngBytes(list[i]);            // tainted slide → null, skipped
    if (bytes) { await driveUpload(token, base + "-" + (i + 1) + ".png", folderId, bytes, "image/png", boundary); count++; }
  }
  if (caption && String(caption).trim()) {
    await driveUpload(token, base + "-caption.txt", folderId, new TextEncoder().encode(String(caption)), "text/plain; charset=UTF-8", boundary);
  }
  if (o.onProgress) o.onProgress(total, total);
  return { folderId, folderUrl: driveFolderUrl(folderId), count };
}

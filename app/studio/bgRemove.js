"use client";
// In-browser background remover. Lazy-loads @imgly/background-removal (ONNX/WASM,
// no API key, no server) only when first used, so it never bloats the initial
// bundle. Returns a transparent-PNG data URL, or null on failure (e.g. the model
// CDN is unreachable). The caller keeps the original src so the cut-out is
// non-destructive / restorable.
export async function removeBackground(src) {
  if (!src || typeof window === "undefined") return null;
  try {
    const mod = await import("@imgly/background-removal");
    const removeFn = mod.removeBackground || (mod.default && mod.default.removeBackground) || mod.default;
    const blob = await removeFn(src, { output: { format: "image/png" } });
    return await blobToDataUrl(blob);
  } catch (e) {
    return null;
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => resolve(null);
    r.readAsDataURL(blob);
  });
}

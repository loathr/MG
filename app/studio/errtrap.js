// errtrap.js — the PURE core of the global error trap. A render crash is caught by
// ErrorBoundary, but the two failure modes it CANNOT see are (1) a module-load /
// import-time error (thrown before React mounts → today a blank white screen) and
// (2) an unhandled promise rejection from an async path. These functions normalise
// either browser event into one display record { kind, message, source, stack } so
// the on-screen ErrorWindow (and the early inline trap in app/layout.tsx, which
// mirrors this logic as a string) report them identically.
//
// Pure + dependency-free so it's unit-tested headless; the DOM wiring lives in
// ErrorWindow.jsx and the inline <script>.

// A window "error" event. A RESOURCE-load failure (a chunk/script/img that 404s or
// blocks) has no `.error`, but its `target` is the element carrying the URL — that
// is exactly the module-load case, so we surface the URL that failed.
export function fromErrorEvent(e) {
  const win = typeof window !== "undefined" ? window : null;
  const target = e && e.target;
  if (target && target !== win && (target.src || target.href)) {
    const url = target.src || target.href;
    return { kind: "load", message: "Failed to load resource: " + url, source: url, stack: "" };
  }
  const err = e && e.error;
  return {
    kind: "error",
    message: (err && err.message) || (e && e.message) || "Uncaught error",
    source: e && e.filename ? e.filename + ":" + (e.lineno || 0) + ":" + (e.colno || 0) : "",
    stack: (err && err.stack) || "",
  };
}

// A window "unhandledrejection" event. `reason` is usually an Error but can be any
// thrown value (string, object), so fall back gracefully.
export function fromRejection(e) {
  const r = e && e.reason;
  const msg = r && typeof r === "object" ? r.message : (typeof r === "string" ? r : "");
  return {
    kind: "rejection",
    message: msg || "Unhandled promise rejection",
    source: "",
    stack: (r && r.stack) || "",
  };
}

// Stable identity so the same error firing repeatedly (a poll loop, a re-render)
// isn't listed a dozen times.
export function recordKey(r) {
  return (r.kind || "") + "|" + (r.message || "") + "|" + (r.source || "");
}

// The plain-text blob the "Copy all" button puts on the clipboard.
export function formatForCopy(records) {
  return (records || [])
    .map((r, i) =>
      "#" + (i + 1) + " [" + (r.kind || "error") + "] " + (r.message || "") +
      (r.source ? "\n  at " + r.source : "") +
      (r.stack ? "\n" + r.stack : ""),
    )
    .join("\n\n");
}

// Human label for the type badge.
export function kindLabel(kind) {
  return kind === "load" ? "Module load" : kind === "rejection" ? "Unhandled rejection" : "Uncaught error";
}

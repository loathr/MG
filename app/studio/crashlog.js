"use client";
// crashlog.js — a persistent, tab-kill-surviving diagnostic. The share crashes are
// the browser reaping an unresponsive/OOM tab ("This page couldn't load"): NO error
// event fires and DevTools changes the timing enough to hide it, so nothing can be
// caught in-tab. Instead we write small breadcrumbs + captured console output to
// localStorage SYNCHRONOUSLY as they happen, plus a JS-heap sample, and a per-session
// "alive" record that a clean unload clears. An OOM-kill never fires unload, so the
// record survives — on the NEXT load we snapshot it into a report the CrashBanner
// shows. Temporary: instrument, diagnose, then remove.
//
// The ring/report/format helpers are pure + unit-tested; the localStorage + hooks
// are browser-only and guarded.

const K_ALIVE = "loathr_crash_alive";
const K_CRUMBS = "loathr_crash_crumbs";
const K_CONSOLE = "loathr_crash_console";
const K_REPORT = "loathr_crash_report";
const CRUMB_CAP = 40;
const CONSOLE_CAP = 25;

// --- pure helpers (unit-tested) -------------------------------------------

// Append to a capped ring, keeping the last `cap` entries.
export function pushRing(arr, item, cap) {
  const out = (arr || []).concat(item);
  return out.length > cap ? out.slice(out.length - cap) : out;
}

// From a previous session's alive-record + rings, build a crash report — or null
// when there's nothing worth showing. A report exists only when the previous
// session left an alive-record (it never recorded a clean exit) AND did something
// beyond just starting.
export function buildReport(prevAlive, crumbs, consoleLog) {
  if (!prevAlive) return null;
  const c = crumbs || [];
  const cl = consoleLog || [];
  if (c.length <= 1 && cl.length === 0) return null;
  return {
    diedAt: prevAlive.lastBeat || prevAlive.startedAt || 0,
    startedAt: prevAlive.startedAt || 0,
    heapPeak: prevAlive.heapPeak || 0,
    heapStart: prevAlive.heapStart || 0,
    crumbs: c,
    console: cl,
  };
}

function mb(bytes) { return Math.round((bytes || 0) / 1048576) + "MB"; }

// The plain-text blob for the Copy button.
export function formatReport(r) {
  if (!r) return "";
  const lines = ["LOATHR crash capture — previous session ended without a clean exit"];
  if (r.diedAt) lines.push("died ~" + new Date(r.diedAt).toISOString());
  if (r.heapPeak) lines.push("JS heap: " + mb(r.heapStart) + " -> " + mb(r.heapPeak) + " peak");
  lines.push("", "TIMELINE (last " + (r.crumbs || []).length + "):");
  let prev = null;
  for (const c of r.crumbs || []) {
    const d = prev == null ? 0 : c.t - prev; prev = c.t;
    lines.push("  +" + d + "ms  " + c.name);
  }
  if ((r.console || []).length) {
    lines.push("", "CONSOLE (last " + r.console.length + "):");
    for (const e of r.console) lines.push("  [" + e.level + "] " + e.msg);
  }
  return lines.join("\n");
}

// --- browser wiring (guarded) ---------------------------------------------

function ls() { try { return typeof window !== "undefined" ? window.localStorage : null; } catch (e) { return null; } }
function readJSON(key, fallback) { const s = ls(); if (!s) return fallback; try { const v = s.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
function writeJSON(key, val) { const s = ls(); if (!s) return; try { s.setItem(key, JSON.stringify(val)); } catch (e) { /* quota — drop */ } }
function del(key) { const s = ls(); if (!s) return; try { s.removeItem(key); } catch (e) { /* ignore */ } }

let installed = false;
let heapPeak = 0, heapStart = 0;

function usedHeap() {
  try { return (performance && performance.memory && performance.memory.usedJSHeapSize) || 0; } catch (e) { return 0; }
}

// Update the alive-record's heartbeat + heap peak. Cheap; called on every crumb and
// on a 1s timer, so a stalled session's last beat pins the time of death.
function beat() {
  const a = readJSON(K_ALIVE, null); if (!a) return;
  a.lastBeat = Date.now();
  const used = usedHeap();
  if (used > heapPeak) heapPeak = used;
  a.heapPeak = heapPeak; a.heapStart = heapStart;
  writeJSON(K_ALIVE, a);
}

// Synchronous breadcrumb — safe from a hot path; writes a capped ring so even a
// freeze leaves the last steps behind for the next load.
export function breadcrumb(name) {
  if (!ls()) return;
  writeJSON(K_CRUMBS, pushRing(readJSON(K_CRUMBS, []), { t: Date.now(), name: String(name) }, CRUMB_CAP));
  beat();
}

function record(level, args) {
  const msg = args.map((x) => {
    try { return typeof x === "string" ? x : (x && x.message) || JSON.stringify(x); } catch (e) { return String(x); }
  }).join(" ").slice(0, 300);
  writeJSON(K_CONSOLE, pushRing(readJSON(K_CONSOLE, []), { t: Date.now(), level, msg }, CONSOLE_CAP));
  beat();
}

// Install once, as the app mounts. Snapshots a prior unclean session into K_REPORT
// for CrashBanner, then starts a fresh capture for this session.
export function installCrashCapture() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const report = buildReport(readJSON(K_ALIVE, null), readJSON(K_CRUMBS, []), readJSON(K_CONSOLE, []));
  if (report) writeJSON(K_REPORT, report);

  heapStart = usedHeap();
  heapPeak = heapStart;
  writeJSON(K_ALIVE, { startedAt: Date.now(), lastBeat: Date.now(), heapStart, heapPeak });
  writeJSON(K_CRUMBS, []);
  writeJSON(K_CONSOLE, []);

  const origErr = console.error, origWarn = console.warn;
  console.error = function () { try { record("error", [].slice.call(arguments)); } catch (e) { /* ignore */ } return origErr.apply(console, arguments); };
  console.warn = function () { try { record("warn", [].slice.call(arguments)); } catch (e) { /* ignore */ } return origWarn.apply(console, arguments); };
  window.addEventListener("error", (e) => { try { record("error", [(e && e.message) || "error", e && e.filename ? e.filename + ":" + e.lineno : ""]); } catch (x) { /* ignore */ } }, true);
  window.addEventListener("unhandledrejection", (e) => { try { record("error", ["unhandledrejection", (e && e.reason && (e.reason.message || e.reason)) || ""]); } catch (x) { /* ignore */ } });

  const beater = setInterval(beat, 1000);
  const cleanExit = () => { try { clearInterval(beater); del(K_ALIVE); } catch (e) { /* ignore */ } };
  window.addEventListener("pagehide", cleanExit);
  window.addEventListener("beforeunload", cleanExit);
  breadcrumb("session:start");
}

export function readReport() { return readJSON(K_REPORT, null); }
export function clearReport() { del(K_REPORT); }

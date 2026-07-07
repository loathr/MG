// group.js — pure helpers for multi-select + element grouping. Artboard-coordinate
// space; no React, no store. A "group" is just a shared `groupId` on the elements
// (no schema break); a transient multi-selection is a set of ids. Everything here
// is a pure function so it's unit-tested and the store/Artboard only wire it to IO.
import { uid } from "./model";

// Every element id that shares `id`'s group — or just [id] when it's ungrouped
// (and [] if the element is gone). Pure.
export function groupmates(elements, id) {
  const els = elements || [];
  const el = els.find((e) => e.id === id);
  if (!el) return [];
  if (!el.groupId) return [id];
  return els.filter((e) => e.groupId === el.groupId).map((e) => e.id);
}

// Expand a set of ids so that selecting one member of a group selects the whole
// group. Returns a deduped array in element order. Pure.
export function expandGroups(elements, ids) {
  const want = new Set();
  for (const id of ids || []) for (const g of groupmates(elements, id)) want.add(g);
  return (elements || []).filter((e) => want.has(e.id)).map((e) => e.id);
}

// Toggle `id`'s whole group in/out of the current selection (⇧-click). If every
// member is already selected they're removed, else they're all added. Pure.
export function toggleSelection(elements, current, id) {
  const set = new Set(current || []);
  const mates = groupmates(elements, id);
  const allIn = mates.length > 0 && mates.every((m) => set.has(m));
  for (const m of mates) { if (allIn) set.delete(m); else set.add(m); }
  return expandGroups(elements, [...set]);
}

// Bounding box (x,y,w,h) of the selected elements, or null when none. Pure.
export function selectionBox(elements, ids) {
  const set = new Set(ids || []);
  const els = (elements || []).filter((e) => set.has(e.id));
  if (!els.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const e of els) {
    x0 = Math.min(x0, e.x); y0 = Math.min(y0, e.y);
    x1 = Math.max(x1, e.x + e.w); y1 = Math.max(y1, e.y + e.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// Ids of UNLOCKED elements whose box intersects the marquee rect (which may have
// negative w/h from an up-left drag). Pure.
export function marqueeHits(elements, rect) {
  const r = { x: Math.min(rect.x, rect.x + rect.w), y: Math.min(rect.y, rect.y + rect.h), w: Math.abs(rect.w), h: Math.abs(rect.h) };
  const hit = (e) => e.x < r.x + r.w && e.x + e.w > r.x && e.y < r.y + r.h && e.y + e.h > r.y;
  return (elements || []).filter((e) => !e.locked && hit(e)).map((e) => e.id);
}

// Align patches for the selected ids to their shared bounding box.
// mode ∈ left|centerX|right|top|centerY|bottom. Returns { id: {x}|{y} }. Locked
// elements are skipped. Pure.
export function alignPatches(elements, ids, mode) {
  const box = selectionBox(elements, ids);
  if (!box) return {};
  const set = new Set(ids || []);
  const out = {};
  for (const e of elements || []) {
    if (!set.has(e.id) || e.locked) continue;
    if (mode === "left") out[e.id] = { x: Math.round(box.x) };
    else if (mode === "right") out[e.id] = { x: Math.round(box.x + box.w - e.w) };
    else if (mode === "centerX") out[e.id] = { x: Math.round(box.x + (box.w - e.w) / 2) };
    else if (mode === "top") out[e.id] = { y: Math.round(box.y) };
    else if (mode === "bottom") out[e.id] = { y: Math.round(box.y + box.h - e.h) };
    else if (mode === "centerY") out[e.id] = { y: Math.round(box.y + (box.h - e.h) / 2) };
  }
  return out;
}

// A fresh, unique group id.
export function newGroupId() { return uid("grp"); }

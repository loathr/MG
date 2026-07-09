// Unit checks for the placement-aware chrome stampers in store.js:
// stampLogo (scope + corner) and stampPageNumbers (on/off + side).
import test from "node:test";
import assert from "node:assert/strict";
import { stampLogo, stampPageNumbers, rebuildContentFooter, stampClientFooter, reducer, initStudio } from "../app/studio/store.js";
import { ARTBOARD_W, ARTBOARD_H, makeElement } from "../app/studio/model.js";
import { brandFromStyle } from "../app/studio/styles.js";

const doc4 = () => ({ brand: { muted: "#888" }, slides: [{ elements: [] }, { elements: [] }, { elements: [] }, { elements: [] }] });
const logosOf = (d) => d.slides.map((s) => s.elements.filter((e) => e.role === "logo").length);
const pagenosOf = (d) => d.slides.map((s) => (s.elements.find((e) => e.role === "pageno") || {}).content || null);

test("stampLogo default: bookends + top-right (back-compat, no opts)", () => {
  const d = stampLogo(doc4(), { src: "x", w: 160, h: 160 });
  assert.deepEqual(logosOf(d), [1, 0, 0, 1]);                 // cover + closer only
  const cover = d.slides[0].elements.find((e) => e.role === "logo");
  assert.equal(cover.x, ARTBOARD_W - 80 - 160);              // right edge
  assert.equal(cover.y, 80);                                  // top
  assert.equal(d.brand.logoScope, "coverclose");
  assert.equal(d.brand.logoPos, "tr");
});

test("stampLogo scope=every, pos=bl: every slide, bottom-left", () => {
  const d = stampLogo(doc4(), { src: "x", w: 160, h: 160 }, { scope: "every", pos: "bl" });
  assert.deepEqual(logosOf(d), [1, 1, 1, 1]);
  const e = d.slides[2].elements.find((el) => el.role === "logo");
  assert.equal(e.x, 80);                                      // left
  assert.equal(e.y, ARTBOARD_H - 80 - 160);                   // bottom
});

test("stampLogo pos=tc: top-center on the cover (x centered), wordmark steps aside", () => {
  const doc = { brand: {}, slides: [{ elements: [{ role: "wordmark", content: "X" }] }, { elements: [] }, { elements: [] }, { elements: [] }] };
  const d = stampLogo(doc, { src: "x", w: 160, h: 160 }, { scope: "cover", pos: "tc" });
  const lg = d.slides[0].elements.find((e) => e.role === "logo");
  assert.equal(lg.x, Math.round((ARTBOARD_W - 160) / 2));      // centered X
  assert.equal(lg.y, 80);                                       // top margin
  assert.equal(d.slides[0].elements.some((e) => e.role === "wordmark"), false); // wordmark stepped aside
  assert.equal(d.brand.logoPos, "tc");
});

test("stampClientFooter: text footer on content slides, sided; off strips it", () => {
  const doc = { brand: {}, slides: [{ elements: [] }, { elements: [] }, { elements: [] }, { elements: [] }] };
  const brand = { muted: "#888", footer: { content: "text", text: "Acme · @acme", align: "right", scope: "every" } };
  const on = stampClientFooter(doc, brand);
  const foots = on.slides.map((s) => (s.elements.find((e) => e.role === "cfooter") || {}).content || null);
  assert.deepEqual(foots, ["Acme · @acme", "Acme · @acme", "Acme · @acme", "Acme · @acme"]); // scope every
  assert.equal(on.slides[1].elements.find((e) => e.role === "cfooter").align, "right");
  // off strips every cfooter
  const off = stampClientFooter(on, { footer: { content: "off" } });
  assert.equal(off.slides.every((s) => !s.elements.some((e) => e.role === "cfooter")), true);
});

test("stampClientFooter: logo footer places an image; falls back to name·handle text", () => {
  const doc = { brand: {}, slides: [{ elements: [] }, { elements: [] }] };
  const logoBrand = { logo: { src: "L" }, footer: { content: "logo", align: "center", scope: "every" } };
  const d = stampClientFooter(doc, logoBrand);
  const el = d.slides[0].elements.find((e) => e.role === "cfooter");
  assert.equal(el.type, "image");
  assert.equal(el.src, "L");
  // text content defaults to wordmark · handle when no explicit footer.text
  const t = stampClientFooter(doc, { wordmark: "Acme", handle: "@acme", footer: { content: "text", scope: "cover" } });
  assert.equal(t.slides[0].elements.find((e) => e.role === "cfooter").content, "Acme · @acme");
  assert.equal(t.slides[1].elements.some((e) => e.role === "cfooter"), false); // scope cover → slide 0 only
});

test("stampLogo scope=cover: cover only", () => {
  assert.deepEqual(logosOf(stampLogo(doc4(), { src: "x", w: 160, h: 160 }, { scope: "cover", pos: "tl" })), [1, 0, 0, 0]);
});

test("stampLogo null clears every logo", () => {
  const stamped = stampLogo(doc4(), { src: "x", w: 160, h: 160 }, { scope: "every" });
  assert.deepEqual(logosOf(stampLogo(stamped, null)), [0, 0, 0, 0]);
});

test("stampPageNumbers on: content slides only, 1-based, sided", () => {
  const d = stampPageNumbers(doc4(), { on: true, side: "right" });
  assert.deepEqual(pagenosOf(d), [null, "2", "3", null]);     // not cover/closer
  const p = d.slides[1].elements.find((e) => e.role === "pageno");
  assert.equal(p.align, "right");
  assert.equal(p.x, ARTBOARD_W - 80 - 200);
  assert.equal(d.brand.pageNumbers, true);
});

test("rebuildContentFooter: strips the LOATHR running footer in client mode, restores it in loathr", () => {
  // A deck whose content slides carry the generated LOATHR footer + rule + pageno.
  const doc = {
    brand: { muted: "#888" },
    slides: [
      { style: "editorial", elements: [{ role: "wordmark", content: "LOATHR" }] },                       // cover
      { style: "editorial", elements: [{ role: "footer", content: "LOATHR" }, { role: "footrule" }, { role: "pageno", content: "2" }, { type: "text", content: "body" }] },
      { style: "editorial", elements: [{ role: "footer", content: "LOATHR" }, { role: "footrule" }, { role: "pageno", content: "3" }] },
      { style: "editorial", elements: [{ role: "wordmark", content: "LOATHR" }] },                       // closer
    ],
  };
  const footersOf = (d) => d.slides.map((s) => s.elements.filter((e) => e.role === "footer").length);
  // Client mode: strip the running footer + template page numbers from content slides.
  const client = rebuildContentFooter(doc, { muted: "#888" }, { footer: false, pageno: false });
  assert.deepEqual(footersOf(client), [0, 0, 0, 0]);                       // no LOATHR footer anywhere
  assert.equal(client.slides[1].elements.some((e) => e.role === "pageno"), false);
  assert.equal(client.slides[1].elements.some((e) => e.type === "text"), true); // content untouched
  assert.equal(client.slides[0].elements.some((e) => e.role === "wordmark"), true); // cover wordmark untouched
  // Back to LOATHR: the running footer + page numbers come back on content slides.
  const back = rebuildContentFooter(client, { muted: "#888" }, { footer: true, pageno: true });
  assert.deepEqual(footersOf(back), [0, 1, 1, 0]);                        // footer restored on content only
  assert.equal(back.slides[1].elements.filter((e) => e.role === "pageno").length, 1);
  assert.equal(back.slides[1].elements.find((e) => e.role === "footer").content, "LOATHR");
});

test("setBrandMode round-trip: client mode strips the LOATHR footer, loathr restores it", () => {
  const doc = {
    brand: brandFromStyle("editorial"),
    brandMode: "loathr",
    slides: [
      { style: "editorial", elements: [{ id: "w", role: "wordmark", content: "LOATHR" }] },
      { style: "editorial", elements: [{ id: "f", role: "footer", content: "LOATHR" }, { id: "fr", role: "footrule" }, { id: "pn", role: "pageno", content: "2" }, makeElement("text", { id: "b", content: "body" })] },
      { style: "editorial", elements: [{ id: "w2", role: "wordmark", content: "LOATHR" }] },
    ],
  };
  const footers = (st) => st.doc.slides.reduce((a, sl) => a + sl.elements.filter((e) => e.role === "footer").length, 0);
  let s = initStudio();
  s = reducer(s, { type: "loadDoc", doc });
  assert.equal(footers(s), 1);                                   // starts with the LOATHR footer
  s = reducer(s, { type: "setBrandMode", mode: "client" });
  assert.equal(footers(s), 0);                                   // client mode = white-label, footer gone
  assert.equal(s.doc.brandMode, "client");
  assert.equal(s.doc.slides[1].elements.some((e) => e.content === "body"), true); // body untouched
  s = reducer(s, { type: "setBrandMode", mode: "loathr" });
  assert.ok(footers(s) >= 1);                                    // toggling back restores it
  assert.equal(s.doc.brandMode, "loathr");
});

test("setClientBrand embeds the client's uploaded fonts into doc.fonts", () => {
  let s = initStudio();
  s = reducer(s, { type: "loadDoc", doc: { brand: brandFromStyle("editorial"), brandMode: "loathr", fonts: [], slides: [{ style: "editorial", elements: [] }, { style: "editorial", elements: [] }] } });
  const cb = { name: "Acme", fonts: [{ id: "f1", name: "Acme Sans", family: "AcmeSans", dataUrl: "data:font/woff2;base64,AA" }] };
  s = reducer(s, { type: "setClientBrand", clientBrand: cb });
  assert.equal(s.doc.fonts.length, 1);
  assert.equal(s.doc.fonts[0].id, "f1");
  // idempotent — re-applying the same font doesn't duplicate it
  s = reducer(s, { type: "setClientBrand", clientBrand: cb });
  assert.equal(s.doc.fonts.length, 1);
});

test("stampPageNumbers left side + off", () => {
  const left = stampPageNumbers(doc4(), { on: true, side: "left" });
  assert.equal(left.slides[1].elements.find((e) => e.role === "pageno").x, 80);
  assert.equal(left.slides[1].elements.find((e) => e.role === "pageno").align, "left");
  // off strips them all
  const off = stampPageNumbers(left, { on: false });
  assert.deepEqual(pagenosOf(off), [null, null, null, null]);
  assert.equal(off.brand.pageNumbers, false);
});

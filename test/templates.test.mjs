// Unit checks for app/studio/templates.js — the layout registry, the FLAT-LAYERS
// §3 one-image-per-slide guarantee, the reflowSlide photo round-trip, and the
// slidesToDoc generation routing (cover / closer / stat / versus / caution).
import test from "node:test";
import assert from "node:assert/strict";
import {
  coverTemplate, closerTemplate, cautionElement, LAYOUT_LIST,
  renderLayout, reflowSlide, slidesToDoc, deriveContent, previewCover,
} from "../app/studio/templates.js";
import { makeElement } from "../app/studio/model.js";

// Decoded full-bleed images on a slide: the background image (if any) plus any
// image ELEMENTS that aren't the small contain-fit logo. FLAT-LAYERS §3 caps this
// at one per slide — never a background photo AND a feature photo, never stacked.
function heavyImageCount(slide) {
  const bg = slide.background && slide.background.type === "image" ? 1 : 0;
  const els = (slide.elements || []).filter((e) => e.type === "image" && e.role !== "logo").length;
  return bg + els;
}

test("LAYOUT_LIST registers every layout key incl. the feature family", () => {
  const keys = LAYOUT_LIST.map((l) => l.key);
  for (const k of ["cover", "classic", "stat", "versus", "feature", "featureBottom", "featureSplit"]) {
    assert.ok(keys.includes(k), `missing ${k}`);
  }
  for (const l of LAYOUT_LIST) assert.ok(l.key && l.label);
});

test("coverTemplate: solid background, zero image elements (§3)", () => {
  const s = coverTemplate({ heading: "Hello", kicker: "EDITORIAL" }, "editorial");
  assert.equal(s.background.type, "color");
  assert.equal(heavyImageCount(s), 0);
  assert.ok(s.elements.some((e) => e.type === "text" && e.content === "Hello"));
});

test("coverTemplate with a photo: one image background, still no image elements (§3)", () => {
  const s = coverTemplate({ heading: "H" }, "editorial", { url: "p.jpg", thumb: "p-t.jpg" });
  assert.equal(s.background.type, "image");
  assert.equal(s.background.src, "p.jpg");
  assert.ok(s.background.scrim != null);                                  // one baked scrim
  assert.equal(s.elements.filter((e) => e.type === "image").length, 0);
  assert.equal(heavyImageCount(s), 1);
});

test("feature layout: photo is a single image ELEMENT over a solid panel (§3)", () => {
  const els = renderLayout("feature", { heading: "H", body: "b", image: { url: "p.jpg" } }, "editorial", false);
  const imgs = els.filter((e) => e.type === "image");
  assert.equal(imgs.length, 1);
  assert.equal(imgs[0].src, "p.jpg");
});

test("feature layout with no photo falls back to a solid accent block", () => {
  const els = renderLayout("feature", { heading: "H", body: "b" }, "editorial", false);
  assert.equal(els.filter((e) => e.type === "image").length, 0);
  assert.ok(els.some((e) => e.type === "rect" && e.x === 0 && e.y === 0)); // the band block
});

test("renderLayout applies a body `highlight` to body-sized text only, never the headline", () => {
  const els = renderLayout(
    "classic",
    { heading: "Big headline", body: "the quick brown fox", highlight: "quick brown" },
    "editorial", false,
  );
  const body = els.find((e) => e.type === "text" && e.content === "the quick brown fox");
  const head = els.find((e) => e.type === "text" && e.content === "Big headline");
  assert.equal(body.highlight, "quick brown");
  assert.equal(head.highlight, undefined);
});

test("reflowSlide moves the photo bg -> feature element and back, preserving it", () => {
  const start = {
    style: "editorial", layout: "classic",
    background: { type: "image", src: "p.jpg", thumb: "p-t.jpg" },
    elements: [], content: { heading: "H", body: "b" },
  };
  const toFeature = reflowSlide(start, "feature");
  assert.equal(toFeature.layout, "feature");
  assert.equal(toFeature.background.type, "color");                       // bg vacated
  const featImg = toFeature.elements.filter((e) => e.type === "image");
  assert.equal(featImg.length, 1);
  assert.equal(featImg[0].src, "p.jpg");                                  // photo carried into element

  const featureSlide = {
    style: "editorial", layout: toFeature.layout,
    background: toFeature.background, elements: toFeature.elements, content: toFeature.content,
  };
  const back = reflowSlide(featureSlide, "classic");
  assert.equal(back.background.type, "image");                            // photo restored to bg
  assert.equal(back.background.src, "p.jpg");
  assert.equal(back.elements.filter((e) => e.type === "image").length, 0);
});

test("reflowSlide between two non-feature layouts keeps the manual background", () => {
  const slide = {
    style: "editorial", layout: "classic",
    background: { type: "color", color: "#123456" },
    content: { heading: "H", body: "b" }, elements: [],
  };
  const out = reflowSlide(slide, "split");
  assert.equal(out.layout, "split");
  assert.deepEqual(out.background, { type: "color", color: "#123456" }); // untouched
});

test("slidesToDoc routes cover/closer/stat/versus and tags each slide", () => {
  const slides = [
    { role: "COVER", heading: "Cover" },
    { heading: "Plain", body: "b" },
    { heading: "Big", stat: "42", statLabel: "percent" },
    { heading: "A vs B", versus: { left: "A", right: "B" } },
    { role: "CLOSER", heading: "Bye" },
  ];
  const doc = slidesToDoc(slides, "editorial");
  assert.equal(doc.slides.length, 5);
  assert.equal(doc.slides[0].layout, "cover");
  assert.equal(doc.slides[1].layout, "classic");
  assert.equal(doc.slides[2].layout, "stat");
  assert.equal(doc.slides[3].layout, "versus");
  assert.equal(doc.slides[4].layout, "closer");
  for (const s of doc.slides) {
    assert.ok(s.content);
    assert.equal(s.style, "editorial");
  }
  assert.equal(doc.brand.accent, "#e23744"); // brandFromStyle(editorial)
});

test("slidesToDoc selects the family cover layout (masthead / dossier)", () => {
  const slides = [{ role: "COVER", heading: "C" }, { role: "CLOSER", heading: "E" }];
  assert.equal(slidesToDoc(slides, "newsdesk").slides[0].layout, "masthead");
  assert.equal(slidesToDoc(slides, "enterprise").slides[0].layout, "dossier");
});

test("slidesToDoc keeps every generated slide within the §3 one-image cap", () => {
  const slides = [
    { role: "COVER", heading: "C" },
    { heading: "One", body: "b" },
    { heading: "Two", body: "b" },
    { role: "CLOSER", heading: "E" },
  ];
  const imgMap = { 0: { url: "a.jpg", thumb: "a-t.jpg" }, 1: { url: "b.jpg" } };
  const doc = slidesToDoc(slides, "editorial", imgMap);
  for (const s of doc.slides) assert.ok(heavyImageCount(s) <= 1, `slide over §3 cap: ${s.layout}`);
  assert.equal(doc.slides[0].background.type, "image"); // cover took its photo
  assert.equal(doc.slides[0].content.image.url, "a.jpg");
});

test("slidesToDoc threads a caution onto the brand and the closing slide", () => {
  const slides = [{ role: "COVER", heading: "C" }, { role: "CLOSER", heading: "E" }];
  const doc = slidesToDoc(slides, "editorial", null, { caution: "Not advice." });
  assert.equal(doc.brand.caution, "Not advice.");
  const closer = doc.slides[doc.slides.length - 1];
  assert.ok(closer.elements.some((e) => e.role === "caution" && e.content === "Not advice."));
});

test("slidesToDoc on empty input still yields a single fallback slide", () => {
  assert.equal(slidesToDoc([], "editorial").slides.length, 1);
});

test("deriveContent infers heading/body/sources from a hand-built slide", () => {
  const slide = { elements: [
    makeElement("text", { content: "BIG TITLE", fontSize: 90 }),
    makeElement("text", { content: "some body copy", fontSize: 30 }),
    makeElement("text", { content: "Sources: Opta", fontSize: 18 }),
  ] };
  const c = deriveContent(slide);
  assert.equal(c.heading, "BIG TITLE");          // biggest text wins
  assert.ok(c.body.includes("some body copy"));
  assert.deepEqual(c.sources, ["Opta"]);
});

test("deriveContent returns an existing content object untouched", () => {
  const content = { heading: "Pre" };
  assert.equal(deriveContent({ content }), content);
});

test("previewCover renders a family's own cover with no photo", () => {
  const s = previewCover({ heading: "Preview", kicker: "K" }, "newsdesk");
  assert.equal(s.background.type, "color");
  assert.ok(s.elements.length > 0);
});

test("cautionElement is a centered, role-tagged caution text", () => {
  const el = cautionElement("editorial", "Be careful", false);
  assert.equal(el.role, "caution");
  assert.equal(el.content, "Be careful");
  assert.equal(el.align, "center");
});

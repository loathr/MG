// Unit checks for app/studio/templates.js — the layout registry, the FLAT-LAYERS
// §3 one-image-per-slide guarantee, the reflowSlide photo round-trip, and the
// slidesToDoc generation routing (cover / closer / stat / versus / caution).
import test from "node:test";
import assert from "node:assert/strict";
import {
  coverTemplate, closerTemplate, cautionElement, LAYOUT_LIST,
  renderLayout, reflowSlide, slidesToDoc, deriveContent, previewCover,
  coverWordmark, footerElements, frameElements, CONTENT_LAYOUTS,
} from "../app/studio/templates.js";
import { makeElement } from "../app/studio/model.js";
import { BRAND_FONT, STYLES, brandFromStyle } from "../app/studio/styles.js";

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

test("reflowSlide renders in the deck's brand, not the family default (#4)", () => {
  const slide = {
    style: "editorial", layout: "classic",
    background: { type: "color", color: "#0c0c0c" },
    content: { heading: "H", body: "b" }, elements: [],
  };
  const brand = {
    accent: "#00ff00", bg: "#0c0c0c", ink: "#ffffff", sub: "#eaeaea", muted: "#9a9a9a",
    headFont: "Georgia, serif", bodyFont: "Helvetica, Arial, sans-serif",
  };
  const branded = reflowSlide(slide, "classic", brand);
  assert.ok(branded.elements.some((e) => e.type === "rect" && e.fill === "#00ff00")); // accent bar follows brand
  const plain = reflowSlide(slide, "classic");
  assert.ok(plain.elements.some((e) => e.type === "rect" && e.fill === "#e23744"));   // family default w/o brand
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

test("coverWordmark: editorial is a struck-out LOATHR in Courier, right-aligned", () => {
  const els = coverWordmark("editorial");
  assert.equal(els.length, 1);
  const wm = els[0];
  assert.equal(wm.role, "wordmark");
  assert.equal(wm.content, "LOATHR");
  assert.equal(wm.align, "right");
  assert.equal(wm.fontFamily, BRAND_FONT);
  assert.equal(wm.strike, true);
  assert.equal(wm.strikeColor, STYLES.editorial.accent); // red strike follows the accent
});

test("coverWordmark: enterprise is an 'Enterprise' / 'by Loathr' lockup; news has none", () => {
  const ent = coverWordmark("enterprise");
  assert.equal(ent.length, 2);
  assert.ok(ent.every((e) => e.role === "wordmark"));
  assert.equal(ent[0].content, "Enterprise");
  assert.equal(ent[1].content, "by Loathr");
  assert.equal(ent[1].fontFamily, BRAND_FONT);          // the Loathr token is Courier
  assert.deepEqual(coverWordmark("newsdesk"), []);      // no Loathr on the News Desk cover
});

test("coverWordmark editorial follows a brand wordmark + accent", () => {
  const els = coverWordmark("editorial", Object.assign({}, brandFromStyle("editorial"), { wordmark: "ACME", accent: "#00ff00" }));
  assert.equal(els[0].content, "ACME");
  assert.equal(els[0].strikeColor, "#00ff00");
});

test("footerElements: LOATHR + page number in Courier; News Desk drops the LOATHR", () => {
  const ed = footerElements("editorial", 3);
  const foot = ed.find((e) => e.role === "footer");
  const page = ed.find((e) => e.role === "pageno");
  const rule = ed.find((e) => e.role === "footrule");
  assert.ok(foot && foot.content === "LOATHR" && foot.fontFamily === BRAND_FONT);
  assert.ok(page && page.content === "3" && page.align === "right" && page.fontFamily === BRAND_FONT);
  assert.ok(rule && rule.type === "rect");
  const nw = footerElements("newsdesk", 2);
  assert.equal(nw.find((e) => e.role === "footer"), undefined); // page only on News Desk
  assert.ok(nw.find((e) => e.role === "pageno"));
});

test("slidesToDoc: wordmark on the cover, footer + page number on content slides only", () => {
  const slides = [
    { role: "COVER", heading: "C" },
    { heading: "One", body: "the body" },
    { heading: "Two", body: "b" },
    { role: "CLOSER", heading: "E" },
  ];
  const doc = slidesToDoc(slides, "editorial");
  const cover = doc.slides[0], c1 = doc.slides[1], c2 = doc.slides[2], closer = doc.slides[3];
  assert.ok(cover.elements.some((e) => e.role === "wordmark"));        // cover wordmark present
  assert.ok(!c1.elements.some((e) => e.role === "wordmark"));          // not on content slides
  assert.equal(c1.elements.find((e) => e.role === "pageno").content, "1"); // content numbered from 1
  assert.equal(c2.elements.find((e) => e.role === "pageno").content, "2");
  assert.ok(!closer.elements.some((e) => e.role === "pageno"));        // no footer on the closer
  // body uses the Body font (Helvetica), not the Georgia headline font
  const body = c1.elements.find((e) => e.type === "text" && e.content === "the body");
  assert.equal(body.fontFamily, STYLES.editorial.bodyFont);
  // closer wordmark is Courier
  const wm = closer.elements.find((e) => e.content === "LOATHR");
  assert.equal(wm.fontFamily, BRAND_FONT);
});

test("generated text carries font tiers; brand marks stay untiered (Courier-locked)", () => {
  const doc = slidesToDoc([
    { role: "COVER", kicker: "K", heading: "C" },
    { kicker: "THE TURN", heading: "H", body: "the body", sources: ["Opta"] },
    { role: "CLOSER", heading: "Bye" },
  ], "editorial");
  const content = doc.slides[1];
  assert.equal(content.elements.find((e) => e.content === "THE TURN").tier, "label");
  assert.equal(content.elements.find((e) => e.content === "H").tier, "heading");
  assert.equal(content.elements.find((e) => e.content === "the body").tier, "body");
  assert.equal(content.elements.find((e) => e.role === "sources").tier, "body");
  // sources must sit ABOVE the footer (not collide with the LOATHR footer text)
  const srcY = content.elements.find((e) => e.role === "sources").y;
  const footY = content.elements.find((e) => e.role === "footer").y;
  assert.ok(srcY + 40 <= footY, "sources line clears the footer (" + srcY + " vs " + footY + ")");
  // brand marks: no tier → font stays Courier
  assert.equal(content.elements.find((e) => e.role === "footer").tier, undefined);
  assert.equal(content.elements.find((e) => e.role === "pageno").tier, undefined);
  assert.equal(doc.slides[0].elements.find((e) => e.role === "wordmark").tier, undefined);
});

test("closer is a registered layout; renderLayout('closer') builds the sign-off", () => {
  assert.ok(LAYOUT_LIST.some((l) => l.key === "closer"));
  const els = renderLayout("closer", { heading: "Thanks", cta: "Follow" }, "editorial", false, brandFromStyle("editorial"));
  assert.ok(els.some((e) => e.content === "LOATHR" && /Courier/.test(e.fontFamily)));
  assert.ok(els.some((e) => e.content === "Thanks"));
});

test("frameElements: off yields nothing; edge/inset are 4 locked bars; corners are 8 (R4)", () => {
  assert.deepEqual(frameElements("editorial", { frame: "off" }), []);
  assert.deepEqual(frameElements("editorial", null), []);
  const inset = frameElements("editorial", { frame: "inset" });
  assert.equal(inset.length, 4);
  assert.ok(inset.every((e) => e.type === "rect" && e.role === "frame" && e.locked === true));
  assert.ok(inset.every((e) => e.fill === STYLES.editorial.accent)); // editorial frame = accent
  assert.equal(frameElements("editorial", { frame: "edge" }).length, 4);
  assert.equal(frameElements("editorial", { frame: "corners" }).length, 8);
});

test("frameElements: News Desk frames in ink (near-black), not its loud accent (R4)", () => {
  const nw = frameElements("newsdesk", { frame: "inset" });
  assert.ok(nw.length === 4 && nw.every((e) => e.fill === STYLES.newsdesk.ink));
  assert.notEqual(STYLES.newsdesk.ink, STYLES.newsdesk.accent);
});

test("every layout is categorized; CONTENT_LAYOUTS = text+feature only (no bookends/data)", () => {
  const cats = new Set(["text", "feature", "data", "bookend"]);
  assert.ok(LAYOUT_LIST.every((l) => cats.has(l.category)));
  assert.ok(CONTENT_LAYOUTS.includes("classic") && CONTENT_LAYOUTS.includes("feature"));
  for (const k of ["cover", "closer", "masthead", "dossier", "stat", "versus"]) {
    assert.ok(!CONTENT_LAYOUTS.includes(k), k + " is not a pickable content layout");
  }
});

test("slidesToDoc honors a model-picked content layout; rejects invalid/bookend ones", () => {
  const doc = slidesToDoc([
    { role: "COVER", heading: "C" },
    { heading: "H1", body: "b", layout: "statement" },
    { heading: "H2", body: "b", layout: "cover" },   // bookend → not allowed for content
    { role: "CLOSER", heading: "Z" },
  ], "editorial");
  assert.equal(doc.slides[1].layout, "statement");
  assert.equal(doc.slides[2].layout, "classic");      // falls back to the family default
});

test("slidesToDoc: a feature layout needs a photo and routes it to an element (§3)", () => {
  const withImg = slidesToDoc(
    [{ role: "COVER", heading: "C" }, { heading: "H", body: "b", layout: "feature" }, { role: "CLOSER", heading: "Z" }],
    "editorial", { 1: { url: "u.jpg", thumb: "t.jpg" } },
  );
  const f = withImg.slides[1];
  assert.equal(f.layout, "feature");
  assert.equal(f.background.type, "color");                                  // solid bg, photo not in the background
  assert.equal(f.elements.filter((e) => e.type === "image").length, 1);     // exactly one decoded image — as an element
  // no photo available → never an empty feature; falls back to clean text
  const noImg = slidesToDoc(
    [{ role: "COVER", heading: "C" }, { heading: "H", body: "b", layout: "feature" }, { role: "CLOSER", heading: "Z" }],
    "editorial",
  );
  assert.equal(noImg.slides[1].layout, "classic");
});

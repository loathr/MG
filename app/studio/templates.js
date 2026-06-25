// ============================================================================
// Editorial templates: turn a generated slide (role/heading/body/...) into a
// polished arrangement of free canvas elements (the "hybrid" model). Pure.
// Deliberately GPU-light: a single background (solid OR one photo + one scrim)
// + positioned type + a thin accent bar — no stacked gradient/filter/scrim
// layers like the old renderers (the native/GPU memory hog behind the crashes).
//
// Look is driven by a STYLE family (styles.js): families swap palette + fonts
// AND select distinct cover/content layouts (styles.js `layouts`). When a slide
// has a PHOTO background, text flips to the style's `onPhoto` palette (light,
// readable over a darkened photo) so even a light family (News Desk's newsprint
// cream) stays legible.
// ============================================================================
import { ARTBOARD_W, ARTBOARD_H, uid, makeElement } from "./model";
import { getStyle, brandFromStyle } from "./styles";

const M = 80; // side margin

function makeText(font, props) {
  return makeElement("text", Object.assign({ id: uid("t"), fontFamily: font, lineHeight: 1.1 }, props));
}

// Resolve the text palette for a slide. Over-photo slides use the style's light
// `onPhoto` palette so any family stays readable on a darkened photo.
function palette(st, hasImage) {
  if (hasImage && st.onPhoto) {
    return { ink: st.onPhoto.ink, sub: st.onPhoto.sub, muted: st.onPhoto.muted, accent: st.onPhoto.accent, accentBar: st.accentBar };
  }
  return { ink: st.ink, sub: st.sub, muted: st.muted, accent: st.accent, accentBar: st.accentBar };
}

// FLAT-LAYERS §3 background: one image (capped `src` + small `thumb`) plus one
// scrim, OR a solid color. Never stacked layers.
function backgroundFor(st, image) {
  if (image && image.url) {
    return {
      type: "image",
      src: image.url,
      thumb: image.thumb || image.url,
      scrim: st.onPhoto && st.onPhoto.scrim != null ? st.onPhoto.scrim : 0.45,
      color: st.bg,
      credit: image.credit || "",
      source: image.source || "",
    };
  }
  return { type: "color", color: st.bg };
}

function kickerEl(st, pal, content, y, size) {
  return makeText(st.kickerFont, {
    x: M, y, w: ARTBOARD_W - 2 * M, h: 40,
    content: (content || "").toUpperCase(), fontSize: size, fontWeight: st.kickerWeight,
    color: pal.accent, letterSpacing: st.kickerSpacing, lineHeight: 1.2,
  });
}

function sourcesEl(st, pal, sources) {
  const s = Array.isArray(sources) ? sources.filter(Boolean).join(" · ") : (sources || "");
  if (!s) return null;
  return makeText(st.bodyFont, {
    x: M, y: 1262, w: ARTBOARD_W - 2 * M, h: 40,
    content: "Sources: " + s, fontSize: 19, fontWeight: 400, color: pal.muted, lineHeight: 1.2, letterSpacing: 0.5,
  });
}

function slideShell(st, image, elements) {
  return {
    id: uid("slide"),
    w: ARTBOARD_W, h: ARTBOARD_H,
    background: backgroundFor(st, image),
    elements: elements.filter(Boolean),
  };
}

export function coverTemplate(s, style, image) {
  const st = getStyle(style);
  const pal = palette(st, !!(image && image.url));
  return slideShell(st, image, [
    pal.accentBar ? makeElement("rect", { id: uid("r"), x: M, y: 232, w: 64, h: 7, fill: pal.accent }) : null,
    kickerEl(st, pal, s.kicker || "EDITORIAL", 262, 25),
    makeText(st.headFont, { x: M, y: 320, w: ARTBOARD_W - 2 * M, h: 560, content: s.heading || "Untitled", fontSize: 94, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.03 }),
    s.subhead ? makeText(st.headFont, { x: M, y: 1010, w: ARTBOARD_W - 2 * M, h: 180, content: s.subhead, fontSize: 33, fontWeight: 400, color: pal.sub, lineHeight: 1.4 }) : null,
    sourcesEl(st, pal, s.sources),
  ]);
}

export function contentTemplate(s, index, style, image) {
  const st = getStyle(style);
  const pal = palette(st, !!(image && image.url));
  return slideShell(st, image, [
    pal.accentBar ? makeElement("rect", { id: uid("r"), x: M, y: 232, w: 48, h: 6, fill: pal.accent }) : null,
    kickerEl(st, pal, s.role || "", 258, 22),
    makeText(st.headFont, { x: M, y: 312, w: ARTBOARD_W - 2 * M, h: 360, content: s.heading || "", fontSize: 60, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.08 }),
    s.body ? makeText(st.headFont, { x: M, y: 712, w: ARTBOARD_W - 2 * M, h: 470, content: s.body, fontSize: 32, fontWeight: 400, color: pal.sub, lineHeight: 1.46 }) : null,
    sourcesEl(st, pal, s.sources),
  ]);
}

export function closerTemplate(s, style, image) {
  const st = getStyle(style);
  const pal = palette(st, !!(image && image.url));
  const cy = 470;
  return slideShell(st, image, [
    makeText(st.bodyFont, { x: M, y: cy, w: ARTBOARD_W - 2 * M, h: 60, content: "LOATHR", fontSize: 30, fontWeight: 700, color: pal.ink, align: "center", letterSpacing: 8, lineHeight: 1 }),
    makeElement("rect", { id: uid("r"), x: ARTBOARD_W / 2 - 30, y: cy + 86, w: 60, h: 4, fill: pal.accent }),
    makeText(st.headFont, { x: M, y: cy + 130, w: ARTBOARD_W - 2 * M, h: 320, content: s.heading || s.body || "Thanks for reading.", fontSize: 52, fontWeight: st.headWeight, color: pal.ink, align: "center", lineHeight: 1.15 }),
    s.cta ? makeText(st.bodyFont, { x: M, y: cy + 470, w: ARTBOARD_W - 2 * M, h: 60, content: s.cta, fontSize: 26, fontWeight: 400, color: pal.accent, align: "center", lineHeight: 1.3 }) : null,
  ]);
}

// --- Layout registry -------------------------------------------------------
// A layout is a pure (content, style, palette) -> elements arrangement of the
// slide's text. The Templates panel re-flows a slide's content through any of
// these on explicit click; nothing auto-reflows, so manual edits persist until
// the user picks a layout. Each obeys the same palette + photo-awareness.

// Normalize any slide content (generated cover/content/closer, or derived) into
// the four fields layouts arrange.
function norm(content) {
  const c = content || {};
  return {
    kicker: c.kicker || c.role || "",
    heading: c.heading || c.title || "Untitled",
    body: c.body || c.subhead || c.cta || "",
    sources: Array.isArray(c.sources) ? c.sources : (c.sources ? [c.sources] : []),
    number: c.number,
    // Optional structured data for the data-driven layouts (stat / versus). Pass
    // through untouched; the layouts read them and fall back when absent.
    stat: c.stat, statLabel: c.statLabel,
    versus: c.versus, left: c.left, right: c.right,
  };
}

function centeredKicker(st, pal, content, y) {
  return content ? makeText(st.kickerFont, { x: M, y, w: ARTBOARD_W - 2 * M, h: 40, content: content.toUpperCase(), fontSize: 24, fontWeight: st.kickerWeight, color: pal.accent, letterSpacing: st.kickerSpacing, align: "center", lineHeight: 1.2 }) : null;
}

function L_classic(c, st, pal) {
  return [
    pal.accentBar ? makeElement("rect", { id: uid("r"), x: M, y: 232, w: 48, h: 6, fill: pal.accent }) : null,
    c.kicker ? kickerEl(st, pal, c.kicker, 258, 22) : null,
    makeText(st.headFont, { x: M, y: 312, w: ARTBOARD_W - 2 * M, h: 360, content: c.heading, fontSize: 60, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.08 }),
    c.body ? makeText(st.headFont, { x: M, y: 712, w: ARTBOARD_W - 2 * M, h: 470, content: c.body, fontSize: 32, fontWeight: 400, color: pal.sub, lineHeight: 1.46 }) : null,
    sourcesEl(st, pal, c.sources),
  ];
}

function L_cover(c, st, pal) {
  return [
    pal.accentBar ? makeElement("rect", { id: uid("r"), x: M, y: 232, w: 64, h: 7, fill: pal.accent }) : null,
    kickerEl(st, pal, c.kicker || "EDITORIAL", 262, 25),
    makeText(st.headFont, { x: M, y: 320, w: ARTBOARD_W - 2 * M, h: 560, content: c.heading, fontSize: 94, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.03 }),
    c.body ? makeText(st.headFont, { x: M, y: 1010, w: ARTBOARD_W - 2 * M, h: 180, content: c.body, fontSize: 33, fontWeight: 400, color: pal.sub, lineHeight: 1.4 }) : null,
    sourcesEl(st, pal, c.sources),
  ];
}

function L_centered(c, st, pal) {
  return [
    centeredKicker(st, pal, c.kicker, 430),
    makeText(st.headFont, { x: M, y: 490, w: ARTBOARD_W - 2 * M, h: 360, content: c.heading, fontSize: 78, fontWeight: st.headWeight, color: pal.ink, align: "center", lineHeight: 1.05 }),
    c.body ? makeText(st.headFont, { x: M, y: 880, w: ARTBOARD_W - 2 * M, h: 260, content: c.body, fontSize: 32, fontWeight: 400, color: pal.sub, align: "center", lineHeight: 1.45 }) : null,
  ];
}

function L_statement(c, st, pal) {
  return [
    centeredKicker(st, pal, c.kicker, 300),
    makeText(st.headFont, { x: M, y: 380, w: ARTBOARD_W - 2 * M, h: 600, content: c.heading, fontSize: 118, fontWeight: st.headWeight, color: pal.ink, align: "center", lineHeight: 1.0 }),
  ];
}

function L_bottom(c, st, pal) {
  return [
    c.kicker ? kickerEl(st, pal, c.kicker, 742, 22) : null,
    pal.accentBar ? makeElement("rect", { id: uid("r"), x: M, y: 720, w: 48, h: 6, fill: pal.accent }) : null,
    makeText(st.headFont, { x: M, y: 800, w: ARTBOARD_W - 2 * M, h: 300, content: c.heading, fontSize: 66, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.06 }),
    c.body ? makeText(st.headFont, { x: M, y: 1120, w: ARTBOARD_W - 2 * M, h: 150, content: c.body, fontSize: 28, fontWeight: 400, color: pal.sub, lineHeight: 1.4 }) : null,
  ];
}

// --- New layouts (Phase 1): quote / numbered / split. Pure text + flat rects,
// reusing the existing content fields (heading/body/kicker/sources + an optional
// `number`) — no schema change. Available in every family via the panel.

// Pull-quote: a big accent quotation mark, the heading set as a centered italic
// quote, the kicker as attribution. (Re-flowing turns any headline into a quote.)
function L_quote(c, st, pal) {
  return [
    makeText(st.headFont, { x: M, y: 330, w: ARTBOARD_W - 2 * M, h: 160, content: "“", fontSize: 200, fontWeight: st.headWeight, color: pal.accent, align: "center", lineHeight: 1 }),
    makeText(st.headFont, { x: M, y: 556, w: ARTBOARD_W - 2 * M, h: 470, content: c.heading, fontSize: 50, fontWeight: st.headWeight, color: pal.ink, align: "center", lineHeight: 1.26, italic: true }),
    c.kicker ? makeText(st.kickerFont, { x: M, y: 1086, w: ARTBOARD_W - 2 * M, h: 40, content: "— " + c.kicker.toUpperCase(), fontSize: 22, fontWeight: st.kickerWeight, color: pal.accent, align: "center", letterSpacing: st.kickerSpacing, lineHeight: 1.2 }) : null,
  ];
}

// Numbered "step": a large accent numeral (from `number`, else 01) over the
// kicker, heading, and body. Reads as a playbook/list slide.
function L_numbered(c, st, pal) {
  const n = c.number != null ? String(c.number).padStart(2, "0") : "01";
  return [
    makeText(st.headFont, { x: M, y: 244, w: ARTBOARD_W - 2 * M, h: 230, content: n, fontSize: 184, fontWeight: st.headWeight, color: pal.accent, lineHeight: 1, letterSpacing: -2 }),
    c.kicker ? kickerEl(st, pal, c.kicker, 486, 22) : null,
    makeText(st.headFont, { x: M, y: 536, w: ARTBOARD_W - 2 * M, h: 320, content: c.heading, fontSize: 58, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.08 }),
    c.body ? makeText(st.headFont, { x: M, y: 884, w: ARTBOARD_W - 2 * M, h: 340, content: c.body, fontSize: 30, fontWeight: 400, color: pal.sub, lineHeight: 1.5 }) : null,
    sourcesEl(st, pal, c.sources),
  ];
}

// Split/feature: kicker + heading up top, a full-width rule, body below. The
// rule gives an editorial "above/below the fold" structure classic lacks.
function L_split(c, st, pal) {
  return [
    c.kicker ? kickerEl(st, pal, c.kicker, 258, 22) : null,
    makeText(st.headFont, { x: M, y: 312, w: ARTBOARD_W - 2 * M, h: 320, content: c.heading, fontSize: 62, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.06 }),
    makeElement("rect", { id: uid("r"), x: M, y: 700, w: ARTBOARD_W - 2 * M, h: 2, fill: pal.accentBar ? pal.accent : pal.muted }),
    c.body ? makeText(st.headFont, { x: M, y: 748, w: ARTBOARD_W - 2 * M, h: 470, content: c.body, fontSize: 32, fontWeight: 400, color: pal.sub, lineHeight: 1.5 }) : null,
    sourcesEl(st, pal, c.sources),
  ];
}

// --- Data-driven layouts (Phase 2): stat / versus. Both read OPTIONAL structured
// fields the generator may emit (stat/statLabel, versus{left,right}) and degrade
// gracefully when applied from the Templates panel to a slide that lacks them, so
// every family can use them on any slide. Same palette + photo-awareness.

// Big-number hero: one large stat in the accent color over a short label. With no
// `stat` field, the heading becomes the hero (reads as a statement + note).
function L_stat(c, st, pal) {
  const hasStat = !!(c.stat != null && String(c.stat).trim());
  const big = hasStat ? String(c.stat) : c.heading;
  const label = c.statLabel || (hasStat ? c.heading : c.body) || "";
  return [
    centeredKicker(st, pal, c.kicker, 300),
    makeText(st.headFont, { x: M, y: 372, w: ARTBOARD_W - 2 * M, h: 320, content: big, fontSize: hasStat ? 268 : 150, fontWeight: st.headWeight, color: pal.accent, align: "center", lineHeight: 0.96, letterSpacing: -2 }),
    label ? makeText(st.headFont, { x: M, y: hasStat ? 720 : 760, w: ARTBOARD_W - 2 * M, h: 240, content: label, fontSize: 40, fontWeight: 400, color: pal.ink, align: "center", lineHeight: 1.3 }) : null,
    (hasStat && c.body) ? makeText(st.bodyFont, { x: M, y: 1000, w: ARTBOARD_W - 2 * M, h: 180, content: c.body, fontSize: 27, fontWeight: 400, color: pal.sub, align: "center", lineHeight: 1.45 }) : null,
    sourcesEl(st, pal, c.sources),
  ];
}

// Normalize a versus comparison from explicit data, else by splitting an "A vs B"
// heading, else heading-vs-body — so the layout always has two sides to show.
function normVersus(c) {
  const side = (x) => {
    if (x && typeof x === "object") return { label: String(x.label || ""), value: String(x.value != null && x.value !== "" ? x.value : (x.label || "")) };
    return { label: "", value: x != null ? String(x) : "" };
  };
  const v = c.versus || (c.left && c.right ? { left: c.left, right: c.right } : null);
  if (v && v.left && v.right) return { l: side(v.left), r: side(v.right) };
  const parts = String(c.heading || "").split(/\s+(?:vs\.?|versus)\s+/i);
  if (parts.length === 2) return { l: { label: "", value: parts[0].trim() }, r: { label: "", value: parts[1].trim() } };
  return { l: { label: "", value: c.heading || "" }, r: { label: "", value: c.body || "" } };
}

// Head-to-head: two centered columns with an accent "vs" between them.
function L_versus(c, st, pal) {
  const v = normVersus(c);
  const gap = 76;
  const colW = (ARTBOARD_W - 2 * M - gap) / 2;
  const rx = M + colW + gap;
  const mid = ARTBOARD_W / 2;
  const colLabel = (txt, x) => txt ? makeText(st.kickerFont, { x, y: 452, w: colW, h: 40, content: txt.toUpperCase(), fontSize: 22, fontWeight: st.kickerWeight, color: pal.accent, align: "center", letterSpacing: st.kickerSpacing, lineHeight: 1.2 }) : null;
  const colValue = (txt, x) => makeText(st.headFont, { x, y: 520, w: colW, h: 320, content: txt, fontSize: 52, fontWeight: st.headWeight, color: pal.ink, align: "center", lineHeight: 1.12 });
  return [
    c.kicker ? centeredKicker(st, pal, c.kicker, 250) : null,
    colLabel(v.l.label, M),
    colValue(v.l.value, M),
    makeText(st.headFont, { x: mid - 70, y: 600, w: 140, h: 90, content: "vs", fontSize: 46, fontWeight: st.headWeight, color: pal.accent, align: "center", italic: true, lineHeight: 1 }),
    colLabel(v.r.label, rx),
    colValue(v.r.value, rx),
    c.body ? makeText(st.bodyFont, { x: M, y: 920, w: ARTBOARD_W - 2 * M, h: 200, content: c.body, fontSize: 28, fontWeight: 400, color: pal.sub, align: "center", lineHeight: 1.45 }) : null,
    sourcesEl(st, pal, c.sources),
  ];
}

// Newspaper front-page nameplate (the News Desk cover): a section name set
// between an accent top rule and a hairline, then a big serif headline and a
// standfirst. Generic — applies from the panel to any family using its palette.
function L_masthead(c, st, pal) {
  const name = String(c.kicker || "NEWS DESK").toUpperCase();
  return [
    makeElement("rect", { id: uid("r"), x: M, y: 190, w: ARTBOARD_W - 2 * M, h: 6, fill: pal.accent }),
    makeText(st.kickerFont, { x: M, y: 214, w: ARTBOARD_W - 2 * M, h: 64, content: name, fontSize: 40, fontWeight: st.kickerWeight, color: pal.ink, align: "center", letterSpacing: 6, lineHeight: 1 }),
    makeElement("rect", { id: uid("r"), x: M, y: 292, w: ARTBOARD_W - 2 * M, h: 1, fill: pal.ink }),
    makeText(st.headFont, { x: M, y: 360, w: ARTBOARD_W - 2 * M, h: 540, content: c.heading, fontSize: 86, fontWeight: st.headWeight, color: pal.ink, align: "center", lineHeight: 1.05 }),
    c.body ? makeText(st.headFont, { x: M, y: 1020, w: ARTBOARD_W - 2 * M, h: 170, content: c.body, fontSize: 32, fontWeight: 400, color: pal.sub, align: "center", lineHeight: 1.4 }) : null,
    sourcesEl(st, pal, c.sources),
  ];
}

// Enterprise "intelligence brief" cover: a thin accent top rule with a small
// uppercase label, a large left-aligned headline, a serif standfirst, and a meta
// hairline — austere and corporate (reads as B&W, but generic over palette).
function L_dossier(c, st, pal) {
  return [
    makeElement("rect", { id: uid("r"), x: M, y: 196, w: ARTBOARD_W - 2 * M, h: 2, fill: pal.accent }),
    makeText(st.kickerFont, { x: M, y: 212, w: ARTBOARD_W - 2 * M, h: 36, content: String(c.kicker || "INTELLIGENCE BRIEF").toUpperCase(), fontSize: 22, fontWeight: st.kickerWeight, color: pal.accent, letterSpacing: 4, lineHeight: 1.2 }),
    makeText(st.headFont, { x: M, y: 300, w: ARTBOARD_W - 2 * M, h: 600, content: c.heading, fontSize: 92, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.02 }),
    c.body ? makeText(st.bodyFont, { x: M, y: 1010, w: ARTBOARD_W - 2 * M, h: 150, content: c.body, fontSize: 31, fontWeight: 400, color: pal.sub, lineHeight: 1.4 }) : null,
    makeElement("rect", { id: uid("r"), x: M, y: 1186, w: ARTBOARD_W - 2 * M, h: 1, fill: pal.muted }),
    sourcesEl(st, pal, c.sources),
  ];
}

const LAYOUT_FNS = { classic: L_classic, cover: L_cover, masthead: L_masthead, dossier: L_dossier, centered: L_centered, statement: L_statement, bottom: L_bottom, split: L_split, numbered: L_numbered, quote: L_quote, stat: L_stat, versus: L_versus };

export const LAYOUT_LIST = [
  { key: "cover", label: "Cover" },
  { key: "masthead", label: "Masthead" },
  { key: "dossier", label: "Dossier" },
  { key: "classic", label: "Classic" },
  { key: "centered", label: "Centered" },
  { key: "statement", label: "Statement" },
  { key: "bottom", label: "Bottom" },
  { key: "split", label: "Split" },
  { key: "numbered", label: "Numbered" },
  { key: "quote", label: "Quote" },
  { key: "stat", label: "Stat" },
  { key: "versus", label: "Versus" },
];

// Render a slide's content through a layout -> elements. `hasImage` switches the
// text to the readable over-photo palette.
export function renderLayout(layoutKey, content, style, hasImage) {
  const st = getStyle(style);
  const pal = palette(st, !!hasImage);
  const fn = LAYOUT_FNS[layoutKey] || LAYOUT_FNS.classic;
  return fn(norm(content), st, pal).filter(Boolean);
}

// A single cover slide rendered through a style's OWN cover layout — so the
// Create-screen gallery card previews exactly what that family will generate.
export function previewCover(content, style) {
  const st = getStyle(style);
  const layout = (st.layouts && st.layouts.cover) || "cover";
  return slideShell(st, null, renderLayout(layout, content, style, false));
}

// Best-effort content for a slide that wasn't generated from a template (sample,
// blank, demo, or hand-built): infer heading/body/sources from its text.
export function deriveContent(slide) {
  if (slide && slide.content) return slide.content;
  const texts = ((slide && slide.elements) || []).filter((e) => e.type === "text" && e.content);
  if (!texts.length) return { heading: "Untitled" };
  const bySize = texts.slice().sort((a, b) => (b.fontSize || 0) - (a.fontSize || 0));
  const headEl = bySize[0];
  const srcEl = texts.find((t) => /^sources:/i.test(t.content));
  const rest = texts.filter((t) => t !== headEl && t !== srcEl);
  return {
    heading: headEl ? headEl.content : "Untitled",
    body: rest.map((t) => t.content).join("\n\n"),
    sources: srcEl ? [srcEl.content.replace(/^sources:\s*/i, "")] : [],
  };
}

// Map a generated slides array into a full document of canvas slides in `style`.
// `imgMap` (optional) is { slideIndex: { url, thumb, credit, source } } from
// /api/images — each becomes that slide's single §3-safe photo background.
export function slidesToDoc(slides, style, imgMap) {
  const imgs = imgMap || {};
  const st = getStyle(style);
  // Per-family layout map (styles.js); fall back to the editorial arrangement.
  const lmap = st.layouts || { cover: "cover", content: "classic" };
  const arr = Array.isArray(slides) ? slides.filter(Boolean) : [];
  const out = arr.map((s, i) => {
    const image = imgs[i] || null;
    const role = String(s.role || "").toUpperCase();
    const isCover = i === 0 || role === "COVER";
    const isCloser = !isCover && (i === arr.length - 1 || role === "CLOSER" || role === "OUTRO");
    // Carry a 1-based slide number so the "numbered" layout has a value to show
    // (the source content wins on any real conflict).
    const content = Object.assign({ number: i + 1 }, s);
    let slide, layout;
    if (isCloser) {
      // The closer is brand-anchored (wordmark + CTA), uniform across families.
      slide = closerTemplate(s, style, image);
      layout = "closer";
    } else {
      // Content slides adopt a data-driven layout when the model supplied the
      // structured fields (a stat, or a two-sided comparison); otherwise the
      // family default. Covers always use the family cover layout.
      const dataLayout = s.stat != null ? "stat" : ((s.versus || (s.left && s.right)) ? "versus" : null);
      layout = isCover ? lmap.cover : (dataLayout || lmap.content);
      slide = slideShell(st, image, renderLayout(layout, content, style, !!(image && image.url)));
    }
    // Keep the source content + style + layout so the Templates panel can re-flow
    // this slide into another layout without losing its text.
    slide.content = content;
    slide.style = style || "editorial";
    slide.layout = layout;
    return slide;
  });
  return { id: uid("doc"), brand: brandFromStyle(style), slides: out.length ? out : [coverTemplate({ heading: "Empty" }, style)] };
}

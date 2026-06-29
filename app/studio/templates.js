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
import { getStyle, brandFromStyle, effectiveStyle, BRAND_FONT } from "./styles";

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
  return makeText(st.kickerFont, { tier: "label",
    x: M, y, w: ARTBOARD_W - 2 * M, h: 40,
    content: (content || "").toUpperCase(), fontSize: size, fontWeight: st.kickerWeight,
    color: pal.accent, letterSpacing: st.kickerSpacing, lineHeight: 1.2,
  });
}

function sourcesEl(st, pal, sources, y) {
  const s = Array.isArray(sources) ? sources.filter(Boolean).join(" · ") : (sources || "");
  if (!s) return null;
  // Content slides carry the footer (rule at FOOTER_RULE_Y + LOATHR text at
  // FOOTER_Y), so the sources line sits ABOVE the rule (FOOTER_SOURCES_Y) to avoid
  // colliding with it; the cover (no footer) passes its own bottom y.
  return makeText(st.bodyFont, {
    tier: "body", role: "sources",
    x: M, y: y != null ? y : FOOTER_SOURCES_Y, w: ARTBOARD_W - 2 * M, h: 40,
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
    makeText(st.headFont, { tier: "heading", x: M, y: 320, w: ARTBOARD_W - 2 * M, h: 560, content: s.heading || "Untitled", fontSize: 94, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.03 }),
    s.subhead ? makeText(st.bodyFont, { tier: "body", x: M, y: 1010, w: ARTBOARD_W - 2 * M, h: 180, content: s.subhead, fontSize: 33, fontWeight: 400, color: pal.sub, lineHeight: 1.4 }) : null,
    sourcesEl(st, pal, s.sources, 1262), // cover has no footer — keep sources at the bottom
  ]);
}

export function contentTemplate(s, index, style, image) {
  const st = getStyle(style);
  const pal = palette(st, !!(image && image.url));
  return slideShell(st, image, [
    pal.accentBar ? makeElement("rect", { id: uid("r"), x: M, y: 232, w: 48, h: 6, fill: pal.accent }) : null,
    kickerEl(st, pal, s.role || "", 258, 22),
    makeText(st.headFont, { tier: "heading", x: M, y: 312, w: ARTBOARD_W - 2 * M, h: 360, content: s.heading || "", fontSize: 60, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.08 }),
    s.body ? makeText(st.bodyFont, { tier: "body", x: M, y: 712, w: ARTBOARD_W - 2 * M, h: 470, content: s.body, fontSize: 32, fontWeight: 400, color: pal.sub, lineHeight: 1.46 }) : null,
    sourcesEl(st, pal, s.sources),
  ]);
}

export function closerTemplate(s, style, image, caution, brand) {
  const st = effectiveStyle(style, brand);
  const pal = palette(st, !!(image && image.url));
  const cy = 470;
  return slideShell(st, image, [
    makeText(BRAND_FONT, { x: M, y: cy, w: ARTBOARD_W - 2 * M, h: 60, content: (brand && brand.wordmark) || "LOATHR", fontSize: 30, fontWeight: 700, color: pal.ink, align: "center", letterSpacing: 8, lineHeight: 1 }),
    makeElement("rect", { id: uid("r"), x: ARTBOARD_W / 2 - 30, y: cy + 86, w: 60, h: 4, fill: pal.accent }),
    makeText(st.headFont, { tier: "heading", x: M, y: cy + 130, w: ARTBOARD_W - 2 * M, h: 320, content: s.heading || s.body || "Thanks for reading.", fontSize: 52, fontWeight: st.headWeight, color: pal.ink, align: "center", lineHeight: 1.15 }),
    s.cta ? makeText(st.bodyFont, { tier: "body", x: M, y: cy + 470, w: ARTBOARD_W - 2 * M, h: 60, content: s.cta, fontSize: 26, fontWeight: 400, color: pal.accent, align: "center", lineHeight: 1.3 }) : null,
    caution ? cautionElement(style, caution, !!(image && image.url), brand) : null,
  ]);
}

// Small-print caution line for the closing slide (legal/credibility disclaimer).
// A role-tagged text element so the Brand panel's setCaution can find/replace it,
// and it's a normal draggable element after placement. Pinned to the bottom.
export function cautionElement(style, text, hasImage, brand) {
  const st = effectiveStyle(style, brand);
  const pal = palette(st, !!hasImage);
  return makeText(st.bodyFont, {
    tier: "body", id: uid("caution"), role: "caution",
    x: M, y: 1196, w: ARTBOARD_W - 2 * M, h: 96,
    content: text, fontSize: 18, fontWeight: 400, color: pal.muted,
    align: "center", lineHeight: 1.35, letterSpacing: 0.2,
  });
}

// --- Brand chrome: per-desk cover wordmark + the content-slide footer ---------
// Pure, role-tagged element factories (like cautionElement) — so they're editable/
// draggable and the Brand·Elements panel (R2) can find them. Text + one hairline
// vector rule only; zero image layers (crash-safe).

const FOOTER_RULE_Y = 1240, FOOTER_Y = 1262;
// On content slides the sources line lifts to just above the footer rule.
export const FOOTER_SOURCES_Y = 1186;

// The per-desk cover lockup. Editorial: a struck-out wordmark, top-right.
// Enterprise: "Enterprise" over "by Loathr", top-left. News Desk: none (it signs
// off on the closer). The editorial mark uses `wordmark` (default "LOATHR") so a
// Brand-panel wordmark change re-themes it; its red strike follows the accent.
export function coverWordmark(style, brand) {
  const st = effectiveStyle(style, brand);
  if (style === "newsdesk") return [];
  if (style === "enterprise") {
    return [
      makeText(st.headFont, { id: uid("wm"), role: "wordmark", x: M, y: 92, w: 700, h: 50, content: "Enterprise", fontSize: 34, fontWeight: st.headWeight, color: st.ink, lineHeight: 1 }),
      makeText(BRAND_FONT, { id: uid("wm"), role: "wordmark", x: M, y: 138, w: 700, h: 36, content: "by Loathr", fontSize: 19, fontWeight: 400, color: st.muted, lineHeight: 1, letterSpacing: 1 }),
    ];
  }
  const wm = (brand && brand.wordmark) || "LOATHR";
  return [
    makeText(BRAND_FONT, {
      id: uid("wm"), role: "wordmark",
      x: ARTBOARD_W - M - 520, y: 120, w: 520, h: 56,
      content: wm, fontSize: 38, fontWeight: 700, color: st.ink,
      align: "right", letterSpacing: 3, lineHeight: 1,
      strike: true, strikeColor: st.accent,
    }),
  ];
}

// The content-slide footer: a hairline rule, the LOATHR running mark (Courier,
// omitted on News Desk), and the 1-based content-slide page number (Courier).
export function footerElements(style, pageNum, brand) {
  const st = effectiveStyle(style, brand);
  const showLoathr = style !== "newsdesk";
  const els = [
    makeElement("rect", { id: uid("r"), role: "footrule", x: M, y: FOOTER_RULE_Y, w: ARTBOARD_W - 2 * M, h: 1, fill: st.muted, opacity: 0.32 }),
    makeText(BRAND_FONT, { id: uid("pageno"), role: "pageno", x: ARTBOARD_W - M - 220, y: FOOTER_Y, w: 220, h: 30, content: String(pageNum), fontSize: 20, fontWeight: 400, color: st.muted, align: "right", letterSpacing: 2, lineHeight: 1 }),
  ];
  if (showLoathr) {
    els.unshift(makeText(BRAND_FONT, { id: uid("foot"), role: "footer", x: M, y: FOOTER_Y, w: 320, h: 30, content: "LOATHR", fontSize: 20, fontWeight: 400, color: st.muted, letterSpacing: 2, lineHeight: 1 }));
  }
  return els;
}

// The deck-wide slide frame (R4), revived from the old carousel's per-slide
// border. `brand.frame` selects the treatment: "edge" (a rule near the bezel),
// "inset" (a rule set further in — the editorial default), "corners" (L-marks
// only), or "off". Built from thin FILLED bars rather than one hollow stroked
// rect so it renders identically in all three renderers (Element / StaticSlide /
// export, which all draw rect fills) and — being thin, edge-pinned, and locked —
// never intercepts a click in the content area. Color follows the brand: the
// accent, except News Desk (its accent is loud red on cream) which uses ink, the
// near-black the old News border used. Re-themes via store.rethemeDoc.
export function frameColor(st) {
  return st.key === "newsdesk" ? st.ink : st.accent;
}

export function frameElements(style, brand) {
  const mode = (brand && brand.frame) || "off";
  if (mode === "off") return [];
  const st = effectiveStyle(style, brand);
  // An explicit deck-wide frame colour wins; otherwise the family default
  // (accent, or News Desk ink). So the frame is editable, not just auto-themed.
  const color = (brand && brand.frameColor) || frameColor(st);
  const W = ARTBOARD_W, H = ARTBOARD_H;
  // The frame is now a real, selectable element (NOT locked chrome) — move /
  // resize / recolour it on the canvas. The Brand-panel modes just set its
  // starting shape; setFrame places it at the BACK so it never blocks content.
  if (mode === "corners") {
    // Corner marks can't be one box, so they stay as bars (each movable). Recolour
    // follows `fill` (solid bars).
    const bar = (x, y, w, h) => makeElement("rect", { id: uid("frame"), role: "frame", x, y, w, h, fill: color });
    const L = 120, t = 5, m = 30;
    return [
      bar(m, m, L, t), bar(m, m, t, L),
      bar(W - m - L, m, L, t), bar(W - m - t, m, t, L),
      bar(m, H - m - t, L, t), bar(m, H - m - L, t, L),
      bar(W - m - L, H - m - t, L, t), bar(W - m - t, H - m - L, t, L),
    ];
  }
  // Edge / Inset → ONE bordered rect (transparent fill, the colour on the stroke),
  // so it's a single selectable/movable element. Element.jsx renders a rect's
  // stroke as a CSS border.
  const m = mode === "edge" ? 16 : 32; // inset distance
  const t = mode === "edge" ? 4 : 3;   // border thickness
  return [makeElement("rect", { id: uid("frame"), role: "frame", x: m, y: m, w: W - 2 * m, h: H - 2 * m, fill: "none", stroke: color, strokeWidth: t, radius: 0 })];
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
    // Optional structured data for the data-driven layouts (stat / versus) plus
    // the body `highlight` phrase. Pass through untouched; layouts/post-process
    // read them and fall back when absent.
    stat: c.stat, statLabel: c.statLabel,
    versus: c.versus, left: c.left, right: c.right,
    highlight: c.highlight,
    // The slide's photo as canonical data — feature layouts present it as an
    // element; other layouts use it as a background and ignore this here.
    image: c.image || null,
  };
}

function centeredKicker(st, pal, content, y) {
  return content ? makeText(st.kickerFont, { tier: "label", x: M, y, w: ARTBOARD_W - 2 * M, h: 40, content: content.toUpperCase(), fontSize: 24, fontWeight: st.kickerWeight, color: pal.accent, letterSpacing: st.kickerSpacing, align: "center", lineHeight: 1.2 }) : null;
}

function L_classic(c, st, pal) {
  return [
    pal.accentBar ? makeElement("rect", { id: uid("r"), x: M, y: 232, w: 48, h: 6, fill: pal.accent }) : null,
    c.kicker ? kickerEl(st, pal, c.kicker, 258, 22) : null,
    makeText(st.headFont, { tier: "heading", x: M, y: 312, w: ARTBOARD_W - 2 * M, h: 360, content: c.heading, fontSize: 60, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.08 }),
    c.body ? makeText(st.bodyFont, { tier: "body", x: M, y: 712, w: ARTBOARD_W - 2 * M, h: 470, content: c.body, fontSize: 32, fontWeight: 400, color: pal.sub, lineHeight: 1.46 }) : null,
    sourcesEl(st, pal, c.sources),
  ];
}

function L_cover(c, st, pal) {
  return [
    pal.accentBar ? makeElement("rect", { id: uid("r"), x: M, y: 232, w: 64, h: 7, fill: pal.accent }) : null,
    kickerEl(st, pal, c.kicker || "EDITORIAL", 262, 25),
    makeText(st.headFont, { tier: "heading", x: M, y: 320, w: ARTBOARD_W - 2 * M, h: 560, content: c.heading, fontSize: 94, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.03 }),
    c.body ? makeText(st.bodyFont, { tier: "body", x: M, y: 1010, w: ARTBOARD_W - 2 * M, h: 180, content: c.body, fontSize: 33, fontWeight: 400, color: pal.sub, lineHeight: 1.4 }) : null,
    sourcesEl(st, pal, c.sources),
  ];
}

function L_centered(c, st, pal) {
  return [
    centeredKicker(st, pal, c.kicker, 430),
    makeText(st.headFont, { tier: "heading", x: M, y: 490, w: ARTBOARD_W - 2 * M, h: 360, content: c.heading, fontSize: 78, fontWeight: st.headWeight, color: pal.ink, align: "center", lineHeight: 1.05 }),
    c.body ? makeText(st.bodyFont, { tier: "body", x: M, y: 880, w: ARTBOARD_W - 2 * M, h: 260, content: c.body, fontSize: 32, fontWeight: 400, color: pal.sub, align: "center", lineHeight: 1.45 }) : null,
  ];
}

function L_statement(c, st, pal) {
  return [
    centeredKicker(st, pal, c.kicker, 300),
    makeText(st.headFont, { tier: "heading", x: M, y: 380, w: ARTBOARD_W - 2 * M, h: 600, content: c.heading, fontSize: 118, fontWeight: st.headWeight, color: pal.ink, align: "center", lineHeight: 1.0 }),
  ];
}

function L_bottom(c, st, pal) {
  return [
    c.kicker ? kickerEl(st, pal, c.kicker, 742, 22) : null,
    pal.accentBar ? makeElement("rect", { id: uid("r"), x: M, y: 720, w: 48, h: 6, fill: pal.accent }) : null,
    makeText(st.headFont, { tier: "heading", x: M, y: 800, w: ARTBOARD_W - 2 * M, h: 300, content: c.heading, fontSize: 66, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.06 }),
    c.body ? makeText(st.bodyFont, { tier: "body", x: M, y: 1120, w: ARTBOARD_W - 2 * M, h: 150, content: c.body, fontSize: 28, fontWeight: 400, color: pal.sub, lineHeight: 1.4 }) : null,
  ];
}

// --- New layouts (Phase 1): quote / numbered / split. Pure text + flat rects,
// reusing the existing content fields (heading/body/kicker/sources + an optional
// `number`) — no schema change. Available in every family via the panel.

// Pull-quote: a big accent quotation mark, the heading set as a centered italic
// quote, the kicker as attribution. (Re-flowing turns any headline into a quote.)
function L_quote(c, st, pal) {
  return [
    makeText(st.headFont, { tier: "heading", x: M, y: 330, w: ARTBOARD_W - 2 * M, h: 160, content: "“", fontSize: 200, fontWeight: st.headWeight, color: pal.accent, align: "center", lineHeight: 1 }),
    makeText(st.headFont, { tier: "heading", x: M, y: 556, w: ARTBOARD_W - 2 * M, h: 470, content: c.heading, fontSize: 50, fontWeight: st.headWeight, color: pal.ink, align: "center", lineHeight: 1.26, italic: true }),
    c.kicker ? makeText(st.kickerFont, { tier: "label", x: M, y: 1086, w: ARTBOARD_W - 2 * M, h: 40, content: "— " + c.kicker.toUpperCase(), fontSize: 22, fontWeight: st.kickerWeight, color: pal.accent, align: "center", letterSpacing: st.kickerSpacing, lineHeight: 1.2 }) : null,
  ];
}

// Numbered "step": a large accent numeral (from `number`, else 01) over the
// kicker, heading, and body. Reads as a playbook/list slide.
function L_numbered(c, st, pal) {
  const n = c.number != null ? String(c.number).padStart(2, "0") : "01";
  return [
    makeText(st.headFont, { tier: "heading", x: M, y: 244, w: ARTBOARD_W - 2 * M, h: 230, content: n, fontSize: 184, fontWeight: st.headWeight, color: pal.accent, lineHeight: 1, letterSpacing: -2 }),
    c.kicker ? kickerEl(st, pal, c.kicker, 486, 22) : null,
    makeText(st.headFont, { tier: "heading", x: M, y: 536, w: ARTBOARD_W - 2 * M, h: 320, content: c.heading, fontSize: 58, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.08 }),
    c.body ? makeText(st.bodyFont, { tier: "body", x: M, y: 884, w: ARTBOARD_W - 2 * M, h: 340, content: c.body, fontSize: 30, fontWeight: 400, color: pal.sub, lineHeight: 1.5 }) : null,
    sourcesEl(st, pal, c.sources),
  ];
}

// Split/feature: kicker + heading up top, a full-width rule, body below. The
// rule gives an editorial "above/below the fold" structure classic lacks.
function L_split(c, st, pal) {
  return [
    c.kicker ? kickerEl(st, pal, c.kicker, 258, 22) : null,
    makeText(st.headFont, { tier: "heading", x: M, y: 312, w: ARTBOARD_W - 2 * M, h: 320, content: c.heading, fontSize: 62, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.06 }),
    makeElement("rect", { id: uid("r"), x: M, y: 700, w: ARTBOARD_W - 2 * M, h: 2, fill: pal.accentBar ? pal.accent : pal.muted }),
    c.body ? makeText(st.bodyFont, { tier: "body", x: M, y: 748, w: ARTBOARD_W - 2 * M, h: 470, content: c.body, fontSize: 32, fontWeight: 400, color: pal.sub, lineHeight: 1.5 }) : null,
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
    makeText(st.headFont, { tier: "heading", x: M, y: 372, w: ARTBOARD_W - 2 * M, h: 320, content: big, fontSize: hasStat ? 268 : 150, fontWeight: st.headWeight, color: pal.accent, align: "center", lineHeight: 0.96, letterSpacing: -2 }),
    label ? makeText(st.headFont, { tier: "heading", x: M, y: hasStat ? 720 : 760, w: ARTBOARD_W - 2 * M, h: 240, content: label, fontSize: 40, fontWeight: 400, color: pal.ink, align: "center", lineHeight: 1.3 }) : null,
    (hasStat && c.body) ? makeText(st.bodyFont, { tier: "body", x: M, y: 1000, w: ARTBOARD_W - 2 * M, h: 180, content: c.body, fontSize: 27, fontWeight: 400, color: pal.sub, align: "center", lineHeight: 1.45 }) : null,
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
  const colLabel = (txt, x) => txt ? makeText(st.kickerFont, { tier: "label", x, y: 452, w: colW, h: 40, content: txt.toUpperCase(), fontSize: 22, fontWeight: st.kickerWeight, color: pal.accent, align: "center", letterSpacing: st.kickerSpacing, lineHeight: 1.2 }) : null;
  const colValue = (txt, x) => makeText(st.headFont, { tier: "heading", x, y: 520, w: colW, h: 320, content: txt, fontSize: 52, fontWeight: st.headWeight, color: pal.ink, align: "center", lineHeight: 1.12 });
  return [
    c.kicker ? centeredKicker(st, pal, c.kicker, 250) : null,
    colLabel(v.l.label, M),
    colValue(v.l.value, M),
    makeText(st.headFont, { tier: "heading", x: mid - 70, y: 600, w: 140, h: 90, content: "vs", fontSize: 46, fontWeight: st.headWeight, color: pal.accent, align: "center", italic: true, lineHeight: 1 }),
    colLabel(v.r.label, rx),
    colValue(v.r.value, rx),
    c.body ? makeText(st.bodyFont, { tier: "body", x: M, y: 920, w: ARTBOARD_W - 2 * M, h: 200, content: c.body, fontSize: 28, fontWeight: 400, color: pal.sub, align: "center", lineHeight: 1.45 }) : null,
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
    makeText(st.kickerFont, { tier: "label", x: M, y: 214, w: ARTBOARD_W - 2 * M, h: 64, content: name, fontSize: 40, fontWeight: st.kickerWeight, color: pal.ink, align: "center", letterSpacing: 6, lineHeight: 1 }),
    makeElement("rect", { id: uid("r"), x: M, y: 292, w: ARTBOARD_W - 2 * M, h: 1, fill: pal.ink }),
    makeText(st.headFont, { tier: "heading", x: M, y: 360, w: ARTBOARD_W - 2 * M, h: 540, content: c.heading, fontSize: 86, fontWeight: st.headWeight, color: pal.ink, align: "center", lineHeight: 1.05 }),
    c.body ? makeText(st.bodyFont, { tier: "body", x: M, y: 1020, w: ARTBOARD_W - 2 * M, h: 170, content: c.body, fontSize: 32, fontWeight: 400, color: pal.sub, align: "center", lineHeight: 1.4 }) : null,
    sourcesEl(st, pal, c.sources),
  ];
}

// Enterprise "intelligence brief" cover: a thin accent top rule with a small
// uppercase label, a large left-aligned headline, a serif standfirst, and a meta
// hairline — austere and corporate (reads as B&W, but generic over palette).
function L_dossier(c, st, pal) {
  return [
    makeElement("rect", { id: uid("r"), x: M, y: 196, w: ARTBOARD_W - 2 * M, h: 2, fill: pal.accent }),
    makeText(st.kickerFont, { tier: "label", x: M, y: 212, w: ARTBOARD_W - 2 * M, h: 36, content: String(c.kicker || "INTELLIGENCE BRIEF").toUpperCase(), fontSize: 22, fontWeight: st.kickerWeight, color: pal.accent, letterSpacing: 4, lineHeight: 1.2 }),
    makeText(st.headFont, { tier: "heading", x: M, y: 300, w: ARTBOARD_W - 2 * M, h: 600, content: c.heading, fontSize: 92, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.02 }),
    c.body ? makeText(st.bodyFont, { tier: "body", x: M, y: 1010, w: ARTBOARD_W - 2 * M, h: 150, content: c.body, fontSize: 31, fontWeight: 400, color: pal.sub, lineHeight: 1.4 }) : null,
    makeElement("rect", { id: uid("r"), x: M, y: 1186, w: ARTBOARD_W - 2 * M, h: 1, fill: pal.muted }),
    sourcesEl(st, pal, c.sources),
  ];
}

// --- Image+text "Feature" layout (Phase 3). The photo becomes an ELEMENT filling
// a band of the board (top by default, or bottom) while the text sits on a solid
// panel in the NORMAL palette — the inverse of the full-bleed photo backgrounds
// the other layouts use. With no photo the band is a solid accent block so the
// split still reads. Which "home" the photo lives in (background vs element) is
// reconciled on re-flow by reflowSlide(), so toggling Feature moves it cleanly.
const FEATURE_BAND = 748; // image-band height (~55% of the 1350 board)

function isFeature(key) {
  return key === "feature" || key === "featureBottom" || key === "featureSplit";
}

// The photo element (or, with no photo, a solid accent block) filling a rect.
// One decoded image, never a stacked layer — same crash profile as a bg photo.
function featureImageEl(image, pal, rect) {
  const { x, y, w, h } = rect;
  if (image && image.url) {
    return makeElement("image", {
      id: uid("img"), x, y, w, h,
      src: image.url, thumb: image.thumb || image.url, fit: "cover", radius: 0,
    });
  }
  return makeElement("rect", { id: uid("r"), x, y, w, h, fill: pal.accent });
}

// Text panel for a feature layout, laid into a region {x, w, topY, panelBottom}
// (band variants use full width; the split uses the narrow column, with type
// sized down via headSize/bodySize). Accent bar + kicker + heading + body, with
// the sources line pinned to the panel bottom and the body height bounded to it.
function featureText(c, st, pal, r) {
  const headSize = r.headSize || 50, bodySize = r.bodySize || 27;
  const src = Array.isArray(c.sources) ? c.sources.filter(Boolean).join(" · ") : (c.sources || "");
  const bodyY = r.topY + (r.bodyGap || 300);
  const bodyH = Math.max(70, r.panelBottom - 56 - bodyY);
  return [
    pal.accentBar ? makeElement("rect", { id: uid("r"), x: r.x, y: r.topY - 18, w: 48, h: 6, fill: pal.accent }) : null,
    c.kicker ? makeText(st.kickerFont, { tier: "label", x: r.x, y: r.topY, w: r.w, h: 40, content: c.kicker.toUpperCase(), fontSize: 22, fontWeight: st.kickerWeight, color: pal.accent, letterSpacing: st.kickerSpacing, lineHeight: 1.2 }) : null,
    makeText(st.headFont, { tier: "heading", x: r.x, y: r.topY + 52, w: r.w, h: 230, content: c.heading, fontSize: headSize, fontWeight: st.headWeight, color: pal.ink, lineHeight: 1.08 }),
    c.body ? makeText(st.bodyFont, { tier: "body", x: r.x, y: bodyY, w: r.w, h: bodyH, content: c.body, fontSize: bodySize, fontWeight: 400, color: pal.sub, lineHeight: 1.42 }) : null,
    src ? makeText(st.bodyFont, { tier: "body", x: r.x, y: r.panelBottom - 40, w: r.w, h: 40, content: "Sources: " + src, fontSize: 19, fontWeight: 400, color: pal.muted, lineHeight: 1.2, letterSpacing: 0.5 }) : null,
  ];
}

function L_feature(c, st, pal) {
  return [
    featureImageEl(c.image, pal, { x: 0, y: 0, w: ARTBOARD_W, h: FEATURE_BAND }),
    ...featureText(c, st, pal, { x: M, w: ARTBOARD_W - 2 * M, topY: FEATURE_BAND + 58, panelBottom: ARTBOARD_H - 30 }),
  ];
}

function L_featureBottom(c, st, pal) {
  const imgY = ARTBOARD_H - FEATURE_BAND;
  return [
    featureImageEl(c.image, pal, { x: 0, y: imgY, w: ARTBOARD_W, h: FEATURE_BAND }),
    ...featureText(c, st, pal, { x: M, w: ARTBOARD_W - 2 * M, topY: 150, panelBottom: imgY - 20 }),
  ];
}

// Side-by-side: photo fills the left half, text the right column. Type is sized
// down for the narrow (~440px) column. Crash profile is identical to the bands —
// one image element + flat type, never stacked layers.
function L_featureSplit(c, st, pal) {
  const half = 540, padL = 52, padR = 48, tx = half + padL;
  return [
    featureImageEl(c.image, pal, { x: 0, y: 0, w: half, h: ARTBOARD_H }),
    ...featureText(c, st, pal, { x: tx, w: ARTBOARD_W - tx - padR, topY: 250, panelBottom: ARTBOARD_H - 60, headSize: 40, bodySize: 24, bodyGap: 250 }),
  ];
}

const LAYOUT_FNS = { classic: L_classic, cover: L_cover, masthead: L_masthead, dossier: L_dossier, centered: L_centered, statement: L_statement, bottom: L_bottom, split: L_split, numbered: L_numbered, quote: L_quote, stat: L_stat, versus: L_versus, feature: L_feature, featureBottom: L_featureBottom, featureSplit: L_featureSplit };

// Each layout belongs to a FAMILY (category) so the Templates panel can group
// them and new variants slot into a home instead of a flat list:
//   text     — text-led compositions (photo optional as background)
//   feature  — photo-forward (the image is an element, incl. split)
//   data     — evidence designs (stat / versus), driven by data fields
//   bookend  — the deck's open + close (per-desk covers + closer)
export const LAYOUT_LIST = [
  { key: "cover", label: "Cover", category: "bookend" },
  { key: "masthead", label: "Masthead", category: "bookend" },
  { key: "dossier", label: "Dossier", category: "bookend" },
  { key: "classic", label: "Classic", category: "text" },
  { key: "centered", label: "Centered", category: "text" },
  { key: "statement", label: "Statement", category: "text" },
  { key: "bottom", label: "Bottom", category: "text" },
  { key: "split", label: "Split", category: "feature" },
  { key: "numbered", label: "Numbered", category: "text" },
  { key: "quote", label: "Quote", category: "text" },
  { key: "stat", label: "Stat", category: "data" },
  { key: "versus", label: "Versus", category: "data" },
  { key: "feature", label: "Feature", category: "feature" },
  { key: "featureBottom", label: "Feature ↓", category: "feature" },
  { key: "featureSplit", label: "Feature ⇆", category: "feature" },
  { key: "closer", label: "Closer", category: "bookend" },
];

// Display order + labels for the grouped Templates panel.
export const LAYOUT_CATEGORIES = [
  { key: "text", label: "Text" },
  { key: "feature", label: "Feature · photo" },
  { key: "data", label: "Data" },
  { key: "bookend", label: "Bookends" },
];

// Layouts the generator may explicitly pick for a CONTENT slide (text + feature
// families). Data layouts are driven by the stat/versus fields, not picked here;
// bookends are never content. Used to validate a model-supplied `layout`.
export const CONTENT_LAYOUTS = LAYOUT_LIST
  .filter((l) => l.category === "text" || l.category === "feature")
  .map((l) => l.key);
const CONTENT_SET = CONTENT_LAYOUTS.reduce((a, k) => ((a[k] = 1), a), {});

// Body-band emphasis: a generated `highlight` phrase becomes a knockout marker
// on the body/standfirst text that contains it — not headings (too loud) nor
// kickers/sources. The font-size band keeps it to body-like text across every
// layout without each layout having to opt in.
const HL_MIN = 26, HL_MAX = 44;
function applyHighlight(els, highlight, color, knockout) {
  const hl = highlight ? String(highlight).trim() : "";
  if (!hl) return els;
  const needle = hl.toLowerCase();
  return els.map((e) => {
    if (e.type !== "text") return e;
    const fs = e.fontSize || 0;
    if (fs < HL_MIN || fs > HL_MAX) return e;
    if (!e.content || String(e.content).toLowerCase().indexOf(needle) < 0) return e;
    return Object.assign({}, e, { highlight: hl, highlightColor: color, highlightText: knockout });
  });
}

// Render a slide's content through a layout -> elements. `hasImage` switches the
// text to the readable over-photo palette. A body `highlight` is applied last.
export function renderLayout(layoutKey, content, style, hasImage, brand) {
  const st = effectiveStyle(style, brand);
  const c = norm(content);
  // The closer is brand-anchored (sign-off wordmark + CTA + caution), built by
  // closerTemplate. Register it as a real layout so reflow / reset / the Templates
  // panel handle it like any other instead of falling back to classic.
  if (layoutKey === "closer") {
    const img = c.image && c.image.url ? c.image : null;
    return closerTemplate(content || {}, style, img, (brand && brand.caution) || "", brand).elements;
  }
  // Feature layouts carry the photo as an element on a solid panel, so their text
  // uses the normal palette. Every other layout sets text over the photo bg and
  // flips to the readable onPhoto palette whenever a photo is present (taken from
  // the canonical content.image, else the caller's background-derived flag).
  const feature = isFeature(layoutKey);
  const overPhoto = !feature && (c.image && c.image.url ? true : !!hasImage);
  const pal = palette(st, overPhoto);
  const fn = LAYOUT_FNS[layoutKey] || LAYOUT_FNS.classic;
  const els = fn(c, st, pal).filter(Boolean);
  return applyHighlight(els, c.highlight, pal.accent, st.bg);
}

// Pure re-flow: the slide patch for applying `layoutKey` to `slide`. The photo is
// kept as canonical slide data (content.image) and moved between the background
// and a feature element ONLY when crossing the feature boundary — so re-flowing
// between two non-feature layouts preserves any manual background the user set.
export function reflowSlide(slide, layoutKey, brand) {
  const style = slide.style || "editorial";
  const st = effectiveStyle(style, brand);
  const content = slide.content ? Object.assign({}, slide.content) : deriveContent(slide);
  // Recover the photo from an existing image background if it isn't on content yet
  // (older docs, or a photo dropped straight onto the background via Photos).
  if (!content.image && slide.background && slide.background.type === "image") {
    content.image = { url: slide.background.src, thumb: slide.background.thumb, credit: slide.background.credit, source: slide.background.source };
  }
  const wasFeature = isFeature(slide.layout);
  const willFeature = isFeature(layoutKey);
  let background = slide.background;
  if (willFeature && !wasFeature) {
    // Photo (if any) moves into the element; keep the user's solid color if set.
    background = { type: "color", color: (slide.background && slide.background.type === "color" && slide.background.color) || st.bg };
  } else if (!willFeature && wasFeature) {
    // Restore the photo as a full-bleed background (solid when there's no photo).
    background = backgroundFor(st, content.image && content.image.url ? content.image : null);
  }
  return { elements: renderLayout(layoutKey, content, style, undefined, brand), background, layout: layoutKey, content };
}

// A single cover slide rendered through a style's OWN cover layout — so the
// Create-screen gallery card previews exactly what that family will generate.
export function previewCover(content, style) {
  const st = getStyle(style);
  const layout = (st.layouts && st.layouts.cover) || "cover";
  const els = renderLayout(layout, content, style, false).concat(coverWordmark(style));
  return slideShell(st, null, els);
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
export function slidesToDoc(slides, style, imgMap, opts) {
  const o = opts || {};
  const caution = o.caution || "";
  const imgs = imgMap || {};
  const st = getStyle(style);
  // Per-family layout map (styles.js); fall back to the editorial arrangement.
  const lmap = st.layouts || { cover: "cover", content: "classic" };
  const arr = Array.isArray(slides) ? slides.filter(Boolean) : [];
  let pageNum = 0; // 1-based index over CONTENT slides (footer page number)
  const out = arr.map((s, i) => {
    const image = imgs[i] || null;
    const role = String(s.role || "").toUpperCase();
    const isCover = i === 0 || role === "COVER";
    const isCloser = !isCover && (i === arr.length - 1 || role === "CLOSER" || role === "OUTRO");
    // Carry a 1-based slide number so the "numbered" layout has a value to show
    // (the source content wins on any real conflict), plus the slide's photo as
    // canonical data so re-flowing to a feature layout later can find it.
    const content = Object.assign({ number: i + 1 }, s);
    if (image) content.image = image;
    let slide, layout;
    if (isCloser) {
      // The closer is brand-anchored (wordmark + CTA), uniform across families,
      // plus an optional small-print caution line (category-seeded).
      slide = closerTemplate(s, style, image, caution);
      layout = "closer";
    } else {
      // Content layout, by fit (never a forced pattern): data fields win (stat /
      // versus), else an explicit model-picked layout from the text/feature
      // families, else the family default (classic). A feature needs a real photo
      // — otherwise it falls back to clean text. Covers always use the family cover.
      const dataLayout = s.stat != null ? "stat" : ((s.versus || (s.left && s.right)) ? "versus" : null);
      let wanted = isCover ? null : (CONTENT_SET[s.layout] ? s.layout : null);
      if (wanted && isFeature(wanted) && !(image && image.url)) wanted = null;
      layout = isCover ? lmap.cover : (dataLayout || wanted || lmap.content);
      // §3: a feature content layout carries the photo as an ELEMENT on a solid
      // panel (no background image); every other layout keeps the one photo as the
      // background. Same background↔element rule reflowSlide uses.
      const asFeature = !isCover && isFeature(layout);
      slide = slideShell(st, asFeature ? null : image, renderLayout(layout, content, style, asFeature ? false : !!(image && image.url)));
      if (isCover) {
        // Per-desk cover wordmark — a brand element, not generated content.
        slide.elements = slide.elements.concat(coverWordmark(style));
      } else {
        // Content slide: a running footer (LOATHR + page number); the sources
        // line lifts just above the footer rule so they don't collide.
        pageNum += 1;
        slide.elements = slide.elements
          .map((e) => (e.role === "sources" ? Object.assign({}, e, { y: FOOTER_SOURCES_Y }) : e))
          .concat(footerElements(style, pageNum));
      }
    }
    // Keep the source content + style + layout so the Templates panel can re-flow
    // this slide into another layout without losing its text.
    slide.content = content;
    slide.style = style || "editorial";
    slide.layout = layout;
    return slide;
  });
  const brand = brandFromStyle(style);
  if (caution) brand.caution = caution;
  return { id: uid("doc"), category: o.category || null, brand, slides: out.length ? out : [coverTemplate({ heading: "Empty" }, style)] };
}

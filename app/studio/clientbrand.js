// clientbrand.js — the PURE core of the self-branding module ("Client mode").
//
// A deck carries an optional `clientBrand` (the deck owner's / a client's own
// identity) and a `brandMode`: "loathr" (the team's LOATHR branding, the default
// for members) or "client" (white-label with the clientBrand). GUESTS are always
// "client" — they never see LOATHR branding. Members toggle it per-deck.
//
// The single trick that keeps the renderers simple: `effectiveBrand()` folds the
// clientBrand into the SAME `brand` shape the templates already read (wordmark /
// logo / accent / fonts / footer), so the existing chrome functions produce client
// branding with no per-call branching. No React, no firebase — fully unit-tested.

// Member = signed in with an email on one of the member domains (default loathr.com).
export function isMember(email, memberDomains) {
  const doms = (memberDomains && memberDomains.length ? memberDomains : ["loathr.com"]).map((d) => String(d).toLowerCase());
  const s = String(email || "").toLowerCase();
  const at = s.lastIndexOf("@");
  return at >= 0 && doms.includes(s.slice(at + 1));
}

// The brand mode a deck should render in: guests are forced "client"; a member's
// deck uses its stored brandMode (default "loathr"). Pure.
export function brandModeFor(doc, isMemberFlag) {
  if (!isMemberFlag) return "client";
  return (doc && doc.brandMode === "client") ? "client" : "loathr";
}

// A fresh, empty client brand with sensible defaults.
export function blankClientBrand() {
  return {
    name: "", handle: "", logo: null,
    logoPos: "tr",          // tl | tr | bl | br — which corner the logo sits in
    logoScope: "coverclose", // cover | coverclose | every — which slides carry it
    accent1: "#3a86ff", accent2: "#f4b740", accent3: null,
    labelFont: null, headFont: null, bodyFont: null,
    footer: { align: "left", scope: "coverclose" }, // none|left|center|right × every|coverclose|cover
    pageNumbers: false,     // show page numbers on content slides
    pageNumSide: "right",   // left | right
    closeout: { on: false, cta: "Follow for more →" },
    fonts: [],              // uploaded brand fonts {id,name,family,dataUrl} — embedded + presaved
    images: [],             // uploaded brand images {src,thumb,name} — a reusable library
  };
}

// Normalise a raw clientBrand (from a saved kit or the UI) — fills missing fields
// from the blank defaults so a partial kit never breaks a render. Pure.
export function normalizeClientBrand(cb) {
  const base = blankClientBrand();
  if (!cb) return base;
  return {
    name: cb.name || "", handle: cb.handle || "", logo: cb.logo || null,
    logoPos: cb.logoPos || base.logoPos,
    logoScope: cb.logoScope || base.logoScope,
    accent1: cb.accent1 || base.accent1, accent2: cb.accent2 || base.accent2, accent3: cb.accent3 || null,
    labelFont: cb.labelFont || null, headFont: cb.headFont || null, bodyFont: cb.bodyFont || null,
    footer: Object.assign({}, base.footer, cb.footer || {}),
    pageNumbers: !!cb.pageNumbers,
    pageNumSide: cb.pageNumSide === "left" ? "left" : "right",
    closeout: Object.assign({}, base.closeout, cb.closeout || {}),
    fonts: Array.isArray(cb.fonts) ? cb.fonts : [],
    images: Array.isArray(cb.images) ? cb.images : [],
  };
}

// Fold a clientBrand into the base brand shape when in client mode, so the chrome
// (coverWordmark / footerElements / closerMarks, all of which read `brand.*`) emits
// the client's identity instead of LOATHR's. In "loathr" mode the base brand is
// returned untouched. Pure — a NEW object, never mutating the input.
export function effectiveBrand(baseBrand, clientBrand, mode) {
  const b = baseBrand || {};
  if (mode !== "client") return b;
  const c = normalizeClientBrand(clientBrand);
  return Object.assign({}, b, {
    wordmark: c.name || "",                          // "" → the chrome shows no LOATHR wordmark
    handle: c.handle || "",
    // A square contain-box (data-URL logos carry no intrinsic size); fit:"contain"
    // in stampLogo letterboxes any aspect ratio, and it's a normal draggable/resizable
    // element afterward.
    logo: c.logo ? { src: c.logo, w: 160, h: 160 } : null,
    logoPos: c.logoPos,
    logoScope: c.logoScope,
    accent: c.accent1,
    secondary: c.accent2 || c.accent1,
    accent3: c.accent3 || null,
    labelFont: c.labelFont || b.labelFont,
    headFont: c.headFont || b.headFont,
    bodyFont: c.bodyFont || b.bodyFont,
    footer: c.footer,
    pageNumbers: c.pageNumbers,
    pageNumSide: c.pageNumSide,
    closeout: c.closeout,
    clientMode: true,
  });
}

// Which slides carry the footer, given the footer scope + a slide's role/index.
// "every" → all; "cover" → cover only; "coverclose" → cover + the closeout. Pure.
export function footerOnSlide(scope, slideIndex, slideCount, isCloser) {
  if (scope === "none") return false;
  if (scope === "every") return true;
  const isCover = slideIndex === 0;
  if (scope === "cover") return isCover;
  return isCover || !!isCloser; // "coverclose"
}

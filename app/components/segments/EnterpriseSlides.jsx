"use client";
// Enterprise — 8 alternating layouts + cover/playbook/closer

var CP = { fontFamily: "'Courier Prime',monospace" };
var FN = { fontFamily: "'Foun',Georgia,serif" };
var HD = { fontFamily: "'Maheni',Georgia,serif", fontStyle: "normal" };
var WS = { fontFamily: "'Wenssep',Georgia,serif", textTransform: "uppercase" };
// Enterprise-specific fonts
var OT = { fontFamily: "'Otilito','Foun',sans-serif" };
var QG = { fontFamily: "'Qogee','Maheni',serif", fontStyle: "normal" };
var MT = { fontFamily: "'Matina','Maheni',serif", fontStyle: "normal" };
var FONT_MAP = { maheni: HD, foun: FN, courier: CP, wenssep: WS, otilito: OT, qogee: QG, matina: MT };
export var ENTERPRISE_FONTS = [
  { id: "otilito", label: "Otilito" },
  { id: "qogee", label: "Qogee" },
  { id: "matina", label: "Matina" },
  { id: "maheni", label: "Maheni" },
  { id: "foun", label: "Foun" },
  { id: "courier", label: "Courier" },
  { id: "wenssep", label: "Wenssep" },
];
function bodyFont(slide) { return FONT_MAP[slide.bodyFont] || QG; }
function headFont(slide) { return FONT_MAP[slide.headingFont] || OT; }
function headColor(slide, def) { return slide.headingColor || def || "#ffffff"; }
function bodyColor(slide, def) { return slide.bodyColor || def || "#ffffffcc"; }
function srcColor(slide, def) { return slide.sourcesColor || def || "#ffffff"; }
function headAlign(slide) { return slide.headingAlign ? { textAlign: slide.headingAlign } : {}; }
function bodyAlign(slide) { return slide.bodyAlign ? { textAlign: slide.bodyAlign } : {}; }
function srcAlign(slide) { return slide.sourcesAlign ? { textAlign: slide.sourcesAlign } : {}; }
var IMG_FILTERS = {
  none: "none",
  bw: "grayscale(1) contrast(1.1) brightness(0.85)",
  grain: "saturate(0.8) contrast(1.05) brightness(0.95)",
  contrast: "contrast(1.4) brightness(0.8) saturate(0.9)",
  muted: "saturate(0.5) contrast(0.95) brightness(1.05) sepia(0.1)",
  duotone: "grayscale(1) contrast(1.2) brightness(0.9) sepia(0.15)",
};
export var ENTERPRISE_IMG_FILTERS = [
  { id: "none", label: "None" },
  { id: "bw", label: "B&W" },
  { id: "grain", label: "Film Grain" },
  { id: "contrast", label: "Hi-Contrast" },
  { id: "muted", label: "Muted" },
  { id: "duotone", label: "Duotone" },
];
var _globalImgFilter = "none";
export function setGlobalImgFilter(f) { _globalImgFilter = f || "none"; }
function getImgFilter(slide) { return IMG_FILTERS[(slide && slide.imgFilter) || _globalImgFilter] || "none"; }

// Enterprise text styling — underline KEY TERMS + custom keywords
export function enterpriseStyleBody(text, keywords, underlineWeight) {
  if (!text) return "";
  var uw = typeof underlineWeight === "number" ? underlineWeight : 1.5;
  // Build a regex that matches ALL-CAPS phrases OR any user-specified keyword
  var kwList = (keywords && keywords.length > 0) ? keywords.filter(function(k) { return k && k.trim().length > 1; }) : [];
  var kwPattern = kwList.length > 0 ? kwList.map(function(k) { return k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") : null;
  var capsPattern = "\\b[A-Z][A-Z\\s]{2,}[A-Z]\\b";
  var fullPattern = kwPattern ? "(" + capsPattern + "|" + kwPattern + ")" : "(" + capsPattern + ")";
  var regex = new RegExp(fullPattern, "gi");
  var parts = text.split(regex);
  var hitCount = 0;
  return parts.map(function(part, i) {
    if (!part) return null;
    var isCaps = /^[A-Z\s]+$/.test(part) && part.trim().length > 2;
    var isKw = kwPattern && kwList.some(function(k) { return part.toLowerCase() === k.toLowerCase(); });
    if ((isCaps || isKw) && hitCount < 5) {
      hitCount++;
      return <span key={i} style={{ borderBottom: uw + "px solid #ffffff", paddingBottom: 1, fontWeight: 700, color: "#ffffff" }}>{part}</span>;
    }
    return part;
  });
}
var watermark = function() { return <div style={{ position: "absolute", bottom: 5, left: 8, zIndex: 10, ...CP, fontSize: 4, letterSpacing: "0.12em", color: "#ffffff55" }}>LOATHR</div>; };
var srcLine = function(s, slide) {
  if (!s) return null;
  var sz = 4 + (slide && slide.sourcesSize || 0);
  var srcFont = slide && slide.sourcesFont ? (FONT_MAP[slide.sourcesFont] || CP) : CP;
  // marginTop: auto pushes srcLine to the bottom of a flex-column panel so highlight stays glued to body, source anchors to panel bottom
  return <div style={Object.assign({}, { ...srcFont, fontSize: sz, color: srcColor(slide), textAlign: "right", marginTop: "auto", paddingTop: 8 }, srcAlign(slide), elementTransform(slide, "sources"))}>{s}</div>;
};
var dividerLine = function(slide) {
  if (slide && slide.dividerHidden) return null;
  var w = slide && typeof slide.dividerWeight === "number" ? slide.dividerWeight : 0.5;
  var c = slide && slide.dividerColor ? slide.dividerColor : "#ffffff22";
  return <div style={{ height: w, background: c, marginBottom: 6 }} />;
};
var sectionLabel = function(t) { return <div style={{ ...CP, fontSize: 6, letterSpacing: "0.2em", color: "#ffffff55", marginBottom: 4, textTransform: "uppercase" }}>{t}</div>; };
var highlightFont = function(slide) { return FONT_MAP[slide && slide.highlightFont] || MT; };

// Highlight design styles — shared across segments
export var HIGHLIGHT_STYLES = [
  { id: "bar", label: "Bar" },
  { id: "pill", label: "Pill" },
  { id: "underline", label: "Underline" },
  { id: "box", label: "Box" },
  { id: "quote", label: "Quote" },
  { id: "tag", label: "Tag" },
];

// Render highlight with style variants — used by Enterprise directly, exported for others
export function styledHighlight(t, slide, opts) {
  if (!t) return null;
  var o = opts || {};
  var style = (slide && slide.highlightStyle) || o.defaultStyle || "bar";
  var userColor = slide && slide.highlightColor;
  var fg = userColor || o.fg || "#ffffff88";
  var accent = o.accent || "#ffffff";
  var bg = o.bg || "transparent";
  var font = highlightFont(slide);
  var sz = 8 + (slide && slide.highlightSize || 0);
  var ht = slide ? elementTransform(slide, "highlight") : {};
  var textStyle = Object.assign({}, font, { fontSize: sz, color: fg, lineHeight: 1.4 });

  if (style === "pill") return <div style={Object.assign({}, { marginTop: 6 }, ht)}><span style={Object.assign({}, textStyle, { background: accent, color: userColor || o.pillText || "#0a0a0a", padding: "2px 8px", fontWeight: 700, fontStyle: "italic", display: "inline-block" })}>{t}</span></div>;
  if (style === "underline") return <div style={Object.assign({}, { marginTop: 6 }, ht)}><div style={Object.assign({}, textStyle, { borderBottom: "2px solid " + accent, paddingBottom: 2, fontStyle: "italic", display: "inline", background: "rgba(0,0,0,0.6)", padding: "2px 6px", color: userColor || "#ffffff" })}>{t}</div></div>;
  if (style === "box") return <div style={Object.assign({}, { marginTop: 6, border: "1px solid " + accent + "44", padding: "4px 8px" }, ht)}><div style={Object.assign({}, textStyle, { fontStyle: "italic" })}>{t}</div></div>;
  if (style === "quote") return <div style={Object.assign({}, { marginTop: 6, paddingLeft: 4 }, ht)}><span style={Object.assign({}, font, { fontSize: sz + 6, color: accent + "44", lineHeight: 0.8, verticalAlign: "top" })}>{"\u201C"}</span><span style={Object.assign({}, textStyle, { fontStyle: "italic" })}>{t}</span><span style={Object.assign({}, font, { fontSize: sz + 6, color: accent + "44", lineHeight: 0.8, verticalAlign: "bottom" })}>{"\u201D"}</span></div>;
  if (style === "tag") return <div style={Object.assign({}, { marginTop: 6, display: "flex", alignItems: "center", gap: 4 }, ht)}><div style={{ width: 2, height: 14, background: accent, flexShrink: 0 }} /><div style={Object.assign({}, textStyle, { textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, fontSize: sz - 1 })}>{t}</div></div>;
  // default: bar — inline-flex wrapper + alignSelf so the bar stays flush against the text even inside a flex-column parent
  return <div style={Object.assign({}, { marginTop: 6, display: "inline-flex", alignItems: "stretch", gap: 8, maxWidth: "100%", alignSelf: "flex-start", width: "fit-content" }, ht)}>
    <div style={{ width: 2, background: accent + "44", flexShrink: 0 }} />
    <div style={Object.assign({}, textStyle, { fontStyle: "italic" })}>{t}</div>
  </div>;
}

var highlightBlock = function(t, slide) { return styledHighlight(t, slide, { fg: "#ffffff88", accent: "#ffffff", pillText: "#0a0a0a", defaultStyle: "bar" }); };

// Split ratio + text offset helpers
function getSplit(slide) { return (slide.enterpriseSplit || 50); }
function getTextOffset(slide) { return slide.enterpriseTextOffset || { top: 0, left: 0 }; }
function offsetStyle(slide) { var o = getTextOffset(slide); return (o.top || o.left) ? { transform: "translate(" + (o.left || 0) + "px," + (o.top || 0) + "px)" } : {}; }
// Per-element offset from customPosition
function elementTransform(slide, element) {
  var cp = slide.customPosition && typeof slide.customPosition === "object" ? slide.customPosition : {};
  var o = cp[element] || { top: 0, left: 0 };
  var result = (o.top || o.left) ? { transform: "translate(" + (o.left || 0) + "px," + (o.top || 0) + "px)" } : {};
  // Text alignment override
  var alignKey = element + "Align";
  if (slide[alignKey]) result.textAlign = slide[alignKey];
  return result;
}

export var ENTERPRISE_LAYOUT_COUNT = 8;
export var ENTERPRISE_LAYOUT_LABELS = ["Top/Bottom", "Bottom/Top", "Left/Right", "Right/Left", "Strip+2Col", "Text Only", "Diagonal", "Center Band"];
export var ENTERPRISE_COVER_LABELS = ["Standard", "Full Bleed", "Split L/R", "Text Only", "Center"];

// Masthead component (reused across cover layouts)
function Masthead({ isBreaking, align, slide }) {
  var logo = slide && slide._templateLogo;
  var brandMode = slide && slide._templateBrandMode || "text";
  var showLogo = (brandMode === "logo" || brandMode === "both") && logo;
  return <>
    <div style={{ padding: "8px 16px 4px", borderBottom: "1px solid #ffffff33", textAlign: align || "right", flexShrink: 0 }}>
      {showLogo && <img src={logo} alt="" style={{ maxHeight: 24, maxWidth: "40%", objectFit: "contain", marginBottom: 2, filter: "brightness(2)" }} />}
      {brandMode !== "logo" && <div style={{ ...CP, fontSize: 9, letterSpacing: "0.25em", marginRight: "-0.25em", color: "#ffffff66" }}>LOATHR</div>}
      {brandMode !== "logo" && <div style={{ ...CP, fontSize: 5, letterSpacing: "0.15em", marginRight: "-0.15em", color: "#ffffff44", marginTop: 1 }}>ENTERPRISE</div>}
    </div>
    {isBreaking && <div style={{ background: "#ffffff", padding: "3px 16px", textAlign: "center", flexShrink: 0 }}>
      <div style={{ ...CP, fontSize: 6, letterSpacing: "0.25em", color: "#0a0a0a", fontWeight: 700 }}>JUST IN</div>
    </div>}
  </>;
}

function CoverTitle({ slide }) {
  var baseTitleSize = slide.title && slide.title.length > 35 ? 22 : 28;
  return <div style={Object.assign({}, offsetStyle(slide))}>
    <div style={Object.assign({}, { ...headFont(slide), fontSize: baseTitleSize + (slide.headingSize || 0), color: slide.headingColor || "#ffffff", lineHeight: 1.1 }, elementTransform(slide, "heading"))}>{slide.title || ""}</div>
    {dividerLine(slide)}
    {slide.subtitle && <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9 + (slide.bodySize || 0), color: slide.bodyColor || "#ffffff88" }, elementTransform(slide, "body"))}>{slide.subtitle}</div>}
    {slide.timestamp && <div style={{ ...CP, fontSize: 4 + (slide.sourcesSize || 0), color: slide.sourcesColor || "#ffffff44", marginTop: 4 }}>{slide.timestamp}</div>}
  </div>;
}

// Cover
export function EnterpriseCover({ slide, images, index }) {
  var url = images && images[0] ? images[0].url : null;
  var isBreaking = slide.breaking;
  var sp = getSplit(slide);
  var imgF = getImgFilter(slide);
  var coverLayout = slide.enterpriseCoverLayout || 0; // 0=standard, 1=full bleed, 2=split, 3=text only, 4=center

  // Layout 0 — Standard (masthead → image strip → title)
  if (coverLayout === 0) return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
      <Masthead isBreaking={isBreaking} slide={slide} />
      {url && <div style={{ height: sp + "%", overflow: "hidden", flexShrink: 0, borderBottom: "1px solid #ffffff22" }}>
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF || "none" }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>}
      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <CoverTitle slide={slide} />
      </div>
      {watermark()}
    </div>
  );

  // Layout 1 — Full Bleed (image background, text overlay at bottom)
  if (coverLayout === 1) return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
      {url && <img src={url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: imgF || "none" }} onError={function(e) { e.target.style.display = "none"; }} />}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.95))" }} />
      <div style={{ position: "absolute", top: 10, right: 16, zIndex: 2 }}>
        <div style={{ ...CP, fontSize: 9, letterSpacing: "0.25em", marginRight: "-0.25em", color: "#ffffff66", textAlign: "right" }}>LOATHR</div>
        <div style={{ ...CP, fontSize: 5, letterSpacing: "0.15em", marginRight: "-0.15em", color: "#ffffff44", textAlign: "right" }}>ENTERPRISE</div>
      </div>
      {isBreaking && <div style={{ position: "absolute", top: 36, left: 0, right: 0, background: "#ffffff", padding: "3px 16px", textAlign: "center", zIndex: 2 }}>
        <div style={{ ...CP, fontSize: 6, letterSpacing: "0.25em", color: "#0a0a0a", fontWeight: 700 }}>JUST IN</div>
      </div>}
      <div style={{ position: "absolute", bottom: 20, left: 16, right: 16, zIndex: 3 }}>
        <CoverTitle slide={slide} />
      </div>
      {watermark()}
    </div>
  );

  // Layout 2 — Split (image left, text right)
  if (coverLayout === 2) return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a", display: "flex" }}>
      {url ? <div style={{ width: sp + "%", overflow: "hidden" }}><img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF || "none" }} onError={function(e) { e.target.style.display = "none"; }} /></div>
        : <div style={{ width: sp + "%", background: "#111" }} />}
      <div style={{ width: (100 - sp) + "%", padding: "10px 14px", display: "flex", flexDirection: "column" }}>
        <div style={{ textAlign: "right", marginBottom: 8 }}>
          <div style={{ ...CP, fontSize: 8, letterSpacing: "0.2em", marginRight: "-0.2em", color: "#ffffff55" }}>LOATHR</div>
          <div style={{ ...CP, fontSize: 4, letterSpacing: "0.12em", marginRight: "-0.12em", color: "#ffffff33" }}>ENTERPRISE</div>
        </div>
        {isBreaking && <div style={{ background: "#ffffff", padding: "2px 8px", textAlign: "center", marginBottom: 8 }}>
          <div style={{ ...CP, fontSize: 5, letterSpacing: "0.2em", color: "#0a0a0a", fontWeight: 700 }}>JUST IN</div>
        </div>}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <CoverTitle slide={slide} />
        </div>
      </div>
      {watermark()}
    </div>
  );

  // Layout 3 — Text Only
  if (coverLayout === 3) return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
      <Masthead isBreaking={isBreaking} slide={slide} />
      <div style={{ flex: 1, padding: "20px 16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <CoverTitle slide={slide} />
      </div>
      {watermark()}
    </div>
  );

  // Layout 4 — Center Aligned
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ padding: "10px 16px 6px", textAlign: "center", flexShrink: 0 }}>
        <div style={{ ...CP, fontSize: 9, letterSpacing: "0.25em", marginRight: "-0.25em", color: "#ffffff66" }}>LOATHR</div>
        <div style={{ ...CP, fontSize: 5, letterSpacing: "0.15em", marginRight: "-0.15em", color: "#ffffff44", marginTop: 1 }}>ENTERPRISE</div>
      </div>
      {isBreaking && <div style={{ background: "#ffffff", padding: "3px 16px", textAlign: "center", flexShrink: 0, width: "100%" }}>
        <div style={{ ...CP, fontSize: 6, letterSpacing: "0.25em", color: "#0a0a0a", fontWeight: 700 }}>JUST IN</div>
      </div>}
      {url && <div style={{ height: sp + "%", width: "100%", overflow: "hidden", flexShrink: 0, borderBottom: "1px solid #ffffff22", borderTop: "1px solid #ffffff22" }}>
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF || "none" }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>}
      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
        <CoverTitle slide={slide} />
      </div>
      {watermark()}
    </div>
  );
}

// Render image or mosaic
function ImgOrMosaic({ url, mosaic, mosaicLayout, height, width, slide }) {
  var f = getImgFilter(slide);
  if (mosaic) return <EnterpriseMosaic urls={mosaic} height={height} width={width} layout={mosaicLayout} imgF={f} />;
  if (url) return <div style={{ width: width || "100%", height: height || "100%", overflow: "hidden" }}><img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: f }} onError={function(e) { e.target.style.display = "none"; }} /></div>;
  return <div style={{ width: width || "100%", height: height || "100%", background: "#111" }} />;
}

// Layout 1 — Top Image / Bottom Text
function Layout1({ slide, url, mosaic, mosaicLayout }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ height: sp + "%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} mosaicLayout={mosaicLayout} slide={slide} /></div>
      <div style={Object.assign({}, { height: (100 - sp) + "%", padding: "8px 14px", display: "flex", flexDirection: "column", overflow: "hidden" }, offsetStyle(slide))}>
        {sectionLabel(slide.role || "")}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 14 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.15, marginBottom: 6 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.55, overflow: "hidden" }, elementTransform(slide, "body"))}>{enterpriseStyleBody(slide.body, slide.keywords, slide.underlineWeight)}</div>
        {highlightBlock(slide.highlight, slide)}
        {srcLine(slide.sources, slide)}
      </div>
      {watermark()}
    </div>
  );
}

// Layout 2 — Bottom Image / Top Text
function Layout2({ slide, url, mosaic, mosaicLayout }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={Object.assign({}, { height: (100 - sp) + "%", padding: "8px 14px", display: "flex", flexDirection: "column", overflow: "hidden" }, offsetStyle(slide))}>
        {sectionLabel(slide.role || "")}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 14 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.15, marginBottom: 6 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.55, overflow: "hidden" }, elementTransform(slide, "body"))}>{enterpriseStyleBody(slide.body, slide.keywords, slide.underlineWeight)}</div>
        {highlightBlock(slide.highlight, slide)}
        {srcLine(slide.sources, slide)}
      </div>
      <div style={{ height: sp + "%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} mosaicLayout={mosaicLayout} slide={slide} /></div>
      {watermark()}
    </div>
  );
}

// Layout 3 — Left Image / Right Text
function Layout3({ slide, url, mosaic, mosaicLayout }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", overflow: "hidden" }}>
      <div style={{ width: sp + "%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} mosaicLayout={mosaicLayout} slide={slide} /></div>
      <div style={Object.assign({}, { width: (100 - sp) + "%", padding: "10px 12px", display: "flex", flexDirection: "column", overflow: "hidden" }, offsetStyle(slide))}>
        {sectionLabel(slide.role || "")}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 13 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.15, marginBottom: 6 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        {dividerLine(slide)}
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8.5 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.55, overflow: "hidden" }, elementTransform(slide, "body"))}>{enterpriseStyleBody(slide.body, slide.keywords, slide.underlineWeight)}</div>
        {highlightBlock(slide.highlight, slide)}
        {srcLine(slide.sources, slide)}
      </div>
      {watermark()}
    </div>
  );
}

// Layout 4 — Right Image / Left Text
function Layout4({ slide, url, mosaic, mosaicLayout }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", overflow: "hidden" }}>
      <div style={Object.assign({}, { width: (100 - sp) + "%", padding: "10px 12px", display: "flex", flexDirection: "column", overflow: "hidden" }, offsetStyle(slide))}>
        {sectionLabel(slide.role || "")}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 13 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.15, marginBottom: 6 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        {dividerLine(slide)}
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8.5 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.55, overflow: "hidden" }, elementTransform(slide, "body"))}>{enterpriseStyleBody(slide.body, slide.keywords, slide.underlineWeight)}</div>
        {highlightBlock(slide.highlight, slide)}
        {srcLine(slide.sources, slide)}
      </div>
      <div style={{ width: sp + "%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} mosaicLayout={mosaicLayout} slide={slide} /></div>
      {watermark()}
    </div>
  );
}

// Layout 5 — Image Strip Top + 2-Column Text
function Layout5({ slide, url, mosaic, mosaicLayout }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ height: sp + "%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} mosaicLayout={mosaicLayout} slide={slide} /></div>
      <div style={Object.assign({}, { flex: 1, padding: "8px 14px", overflow: "hidden" }, offsetStyle(slide))}>
        {sectionLabel(slide.role || "")}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 14 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.15, marginBottom: 6 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        {dividerLine(slide)}
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8.5 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.55, columnCount: 2, columnGap: 10, columnRule: "0.5px solid #ffffff11", overflow: "hidden" }, elementTransform(slide, "body"))}>{enterpriseStyleBody(slide.body, slide.keywords, slide.underlineWeight)}</div>
        {highlightBlock(slide.highlight, slide)}
        {srcLine(slide.sources, slide)}
      </div>
      {watermark()}
    </div>
  );
}

// Layout 6 — Full Text (no image)
function Layout6({ slide }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {dividerLine(slide)}
      <div style={Object.assign({}, { flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column" }, offsetStyle(slide))}>
        {sectionLabel(slide.role || "")}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 18 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.1, marginBottom: 10 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        {dividerLine(slide)}
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 10 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.6, flex: 1 }, elementTransform(slide, "body"))}>{enterpriseStyleBody(slide.body, slide.keywords, slide.underlineWeight)}</div>
        {highlightBlock(slide.highlight, slide)}
        {srcLine(slide.sources, slide)}
      </div>
      {watermark()}
    </div>
  );
}

// Layout 7 — Diagonal Split (image top-left, text bottom-right)
function Layout7({ slide, url, mosaic, mosaicLayout }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", height: sp + "%" }}>
        <div style={{ width: sp + "%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} mosaicLayout={mosaicLayout} slide={slide} /></div>
        <div style={Object.assign({}, { width: (100 - sp) + "%", padding: "8px 10px" }, offsetStyle(slide))}>
          {sectionLabel(slide.role || "")}
          <div style={Object.assign({}, { ...headFont(slide), fontSize: 12 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.15 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        </div>
      </div>
      {dividerLine(slide)}
      <div style={Object.assign({}, { flex: 1, padding: "8px 14px", overflow: "hidden" }, offsetStyle(slide))}>
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.55 }, elementTransform(slide, "body"))}>{enterpriseStyleBody(slide.body, slide.keywords, slide.underlineWeight)}</div>
        {highlightBlock(slide.highlight, slide)}
        {srcLine(slide.sources, slide)}
      </div>
      {watermark()}
    </div>
  );
}

// Layout 8 — Center Band (text top, image center, text bottom)
function Layout8({ slide, url, mosaic, mosaicLayout }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={Object.assign({}, { padding: "8px 14px", flexShrink: 0 }, offsetStyle(slide))}>
        {sectionLabel(slide.role || "")}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 14 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.15 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
      </div>
      <div style={{ height: sp + "%", overflow: "hidden", flexShrink: 0, borderTop: "0.5px solid #ffffff22", borderBottom: "0.5px solid #ffffff22" }}><ImgOrMosaic url={url} mosaic={mosaic} mosaicLayout={mosaicLayout} slide={slide} /></div>
      <div style={Object.assign({}, { flex: 1, padding: "8px 14px", overflow: "hidden" }, offsetStyle(slide))}>
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.55 }, elementTransform(slide, "body"))}>{enterpriseStyleBody(slide.body, slide.keywords, slide.underlineWeight)}</div>
        {highlightBlock(slide.highlight, slide)}
        {srcLine(slide.sources, slide)}
      </div>
      {watermark()}
    </div>
  );
}

// Mosaic image renderer for Enterprise — B&W grid
function EnterpriseMosaic({ urls, height, width, layout, imgF }) {
  if (!urls || urls.length < 2) return null;
  var count = Math.min(urls.length, 4);
  // If a layout config is provided (from MOSAIC_LAYOUTS), use its grid template
  if (layout && layout.cols) {
    var letters = ["a","b","c","d"];
    return (
      <div style={{ width: width || "100%", height: height || "100%", display: "grid", gridTemplateColumns: layout.cols, gridTemplateRows: layout.rows || "1fr", gridTemplateAreas: layout.areas || undefined, gap: 2, background: "#ffffff", overflow: "hidden" }}>
        {urls.slice(0, count).map(function(u, i) { return (
          <div key={i} style={{ gridArea: layout.areas ? letters[i] : undefined, overflow: "hidden" }}>
            <img src={u} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF || "none" }} onError={function(e) { e.target.style.display = "none"; }} />
          </div>
        ); })}
      </div>
    );
  }
  // Fallback: auto layouts when no layout config
  if (count === 2) return (
    <div style={{ width: width || "100%", height: height || "100%", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 2, background: "#ffffff", overflow: "hidden" }}>
      {urls.slice(0, 2).map(function(u, i) { return (
        <div key={i} style={{ overflow: "hidden" }}>
          <img src={u} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF || "none" }} onError={function(e) { e.target.style.display = "none"; }} />
        </div>
      ); })}
    </div>
  );
  if (count === 3) return (
    <div style={{ width: width || "100%", height: height || "100%", display: "grid", gridTemplateColumns: "1.6fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2, background: "#ffffff", overflow: "hidden" }}>
      <div style={{ gridRow: "1 / 3", overflow: "hidden" }}>
        <img src={urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF || "none" }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>
      <div style={{ overflow: "hidden" }}>
        <img src={urls[1]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF || "none" }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>
      <div style={{ overflow: "hidden" }}>
        <img src={urls[2]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF || "none" }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>
    </div>
  );
  return (
    <div style={{ width: width || "100%", height: height || "100%", display: "grid", gridTemplateColumns: "1.5fr 1fr", gridTemplateRows: "1.3fr 1fr", gap: 2, background: "#ffffff", overflow: "hidden" }}>
      <div style={{ overflow: "hidden" }}>
        <img src={urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF || "none" }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>
      <div style={{ gridRow: "1 / 3", overflow: "hidden" }}>
        <img src={urls[1]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF || "none" }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>
      <div style={{ overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <div style={{ overflow: "hidden" }}><img src={urls[2]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF || "none" }} onError={function(e) { e.target.style.display = "none"; }} /></div>
        <div style={{ overflow: "hidden" }}><img src={urls[3]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF || "none" }} onError={function(e) { e.target.style.display = "none"; }} /></div>
      </div>
    </div>
  );
}

// Enterprise Content — picks layout based on index or slide.enterpriseLayout override
var ENTERPRISE_LAYOUTS = [Layout1, Layout2, Layout3, Layout4, Layout5, Layout6, Layout7, Layout8];

export function EnterpriseContent({ slide, images, index, mosaicUrls, mosaicLayout }) {
  var url = images && images[index] ? images[index].url : null;
  var mosaic = mosaicUrls && mosaicUrls.length >= 2 ? mosaicUrls : null;
  var layoutIdx = typeof slide.enterpriseLayout === "number" ? slide.enterpriseLayout : ((index - 1) % ENTERPRISE_LAYOUTS.length);
  var LayoutComp = ENTERPRISE_LAYOUTS[layoutIdx] || Layout1;
  return <LayoutComp slide={slide} url={mosaic ? null : url} mosaic={mosaic} mosaicLayout={mosaicLayout} />;
}

// Playbook — numbered steps
export function EnterprisePlaybook({ slide, images, index }) {
  var steps = (slide.body || "").split(/\d+[\.\)]\s*/g).filter(Boolean);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 1, background: "#ffffff33", margin: "0 16px" }} />
      <div style={{ padding: "10px 16px", flex: 1 }}>
        <div style={{ ...CP, fontSize: 6, letterSpacing: "0.2em", color: "#ffffff55", marginBottom: 4 }}>THE PLAYBOOK</div>
        <div style={{ ...headFont(slide), fontSize: 14 + (slide.headingSize || 0), color: headColor(slide), marginBottom: 10, lineHeight: 1.15 }}>{slide.heading || "Action Steps"}</div>
        <div style={{ height: 0.5, background: "#ffffff22", marginBottom: 10 }} />
        {steps.length > 1 ? steps.map(function(step, i) {
          return <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{ ...CP, fontSize: 20, color: "#ffffff22", fontWeight: 700, lineHeight: 0.85, flexShrink: 0, width: 18, textAlign: "right" }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ ...bodyFont(slide), fontSize: 9, color: "#ffffffcc", lineHeight: 1.5 }}>{step.trim()}</div>
              {i < steps.length - 1 && <div style={{ height: 0.5, background: "#ffffff11", marginTop: 8 }} />}
            </div>
          </div>;
        }) : <div style={{ ...bodyFont(slide), fontSize: 9.5, color: "#ffffffcc", lineHeight: 1.6 }}>{slide.body}</div>}
      </div>
      {srcLine(slide.sources, slide)}
      {watermark()}
    </div>
  );
}

// Closer — supports 5 templates + layout/wordmark/background/divider/cta overrides
export var CLOSER_TEMPLATES = [
  { id: "minimal", label: "Minimal" },
  { id: "manifesto", label: "Manifesto" },
  { id: "statpunch", label: "Stat Punch" },
  { id: "cta", label: "CTA" },
  { id: "split", label: "Split" },
];
export var CLOSER_DIVIDER_STYLES = [
  { id: "none", label: "None" },
  { id: "hairline", label: "Hairline" },
  { id: "dotted", label: "Dotted" },
  { id: "decorative", label: "Decorative" },
  { id: "accent", label: "Accent" },
];
export var CLOSER_BG_MODES = [
  { id: "solid", label: "Solid" },
  { id: "gradient", label: "Gradient" },
  { id: "accent", label: "Accent" },
  { id: "image", label: "Image" },
];
export var CLOSER_ALIGNS = [
  { id: "top", label: "Top" },
  { id: "center", label: "Center" },
  { id: "bottom", label: "Bottom" },
];
export var CLOSER_DISCLAIMER_POS = [
  { id: "center", label: "Center" },
  { id: "left", label: "Left" },
  { id: "corner", label: "Corner" },
];

function closerWordmark(slide) {
  var w = slide.wordmark || "LOATHR";
  var ws = slide.wordmarkSub != null ? slide.wordmarkSub : "ENTERPRISE";
  return <div>
    <div style={{ ...CP, fontSize: 9, letterSpacing: "0.25em", marginRight: "-0.25em", color: "#ffffff77", fontWeight: 700 }}>{w}</div>
    {ws && <div style={{ ...CP, fontSize: 5, letterSpacing: "0.12em", marginRight: "-0.12em", color: "#ffffff44", marginTop: 2 }}>{ws}</div>}
  </div>;
}

function closerDivider(slide) {
  var style = slide.dividerStyle || "hairline";
  if (style === "none") return null;
  if (style === "dotted") return <div style={{ borderTop: "1px dotted #ffffff44", width: "40%", margin: "0 auto 14px" }} />;
  if (style === "decorative") return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", gap: 6 }}>
    <div style={{ width: 30, height: 0.5, background: "#ffffff33" }} />
    <div style={{ width: 4, height: 4, background: "#ffffff77" }} />
    <div style={{ width: 30, height: 0.5, background: "#ffffff33" }} />
  </div>;
  if (style === "accent") return <div style={{ height: 1, background: "#ffffff88", width: "20%", margin: "0 auto 14px" }} />;
  return <div style={{ height: 0.5, background: "#ffffff22", width: "40%", margin: "0 auto 14px" }} />;
}

function closerBgLayer(slide) {
  var mode = slide.closerBgMode || "solid";
  if (mode === "gradient") return <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #1a1a1a 0%, #050505 100%)" }} />;
  if (mode === "accent") return <div style={{ position: "absolute", inset: 0, background: slide.closerBgColor || "#1a1a1a" }} />;
  if (mode === "image" && slide.closerBgImage) {
    var scrim = typeof slide.closerScrimOpacity === "number" ? Math.max(0, Math.min(0.95, slide.closerScrimOpacity / 100)) : 0.72;
    return <>
      <img src={slide.closerBgImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.55) brightness(0.7)" }} onError={function(e) { e.target.style.display = "none"; }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0," + scrim + ")" }} />
    </>;
  }
  return null;
}

function closerDisclaimer(slide) {
  if (!slide.disclaimer) return null;
  var pos = slide.disclaimerPos || "center";
  var base = { ...CP, fontSize: 4.5, color: "#ffffff44", lineHeight: 1.5, position: "absolute", zIndex: 5 };
  if (pos === "left") return <div style={Object.assign({}, base, { bottom: 14, left: 18, right: 18, textAlign: "left" })}>{slide.disclaimer}</div>;
  if (pos === "corner") return <div style={Object.assign({}, base, { bottom: 14, left: 18, maxWidth: "55%", textAlign: "left" })}>{slide.disclaimer}</div>;
  return <div style={Object.assign({}, base, { bottom: 14, left: 18, right: 18, textAlign: "center" })}>{slide.disclaimer}</div>;
}

function closerCta(slide) {
  if (!slide.ctaText) return null;
  return <div style={{ marginTop: 18, padding: "5px 12px", border: "0.5px solid #ffffff44", display: "inline-block" }}>
    <span style={{ ...CP, fontSize: 7, letterSpacing: "0.12em", color: "#ffffffcc", textTransform: "uppercase" }}>{slide.ctaText}</span>
    {slide.ctaUrl && <div style={{ ...CP, fontSize: 5, color: "#ffffff66", marginTop: 2, letterSpacing: "0.05em" }}>{slide.ctaUrl}</div>}
  </div>;
}

function closerAlignStyle(align) {
  if (align === "top") return { justifyContent: "flex-start", paddingTop: 56 };
  if (align === "bottom") return { justifyContent: "flex-end", paddingBottom: 64 };
  return { justifyContent: "center" };
}

export function EnterpriseCloser({ slide, images, index }) {
  var tpl = slide.closerTemplate || "minimal";
  var align = slide.closerAlign || "center";
  var alignStyle = closerAlignStyle(align);
  var rootBase = { width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center" };
  var showWm = !slide.hideWatermark;

  if (tpl === "split") {
    var imgUrl = slide.closerBgImage || (images && images[index] ? images[index].url : null) || (images && images[0] ? images[0].url : null);
    return <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
      <div style={{ height: "50%", overflow: "hidden", position: "relative" }}>
        {imgUrl ? <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.55) brightness(0.7)" }} onError={function(e) { e.target.style.display = "none"; }} /> : <div style={{ width: "100%", height: "100%", background: "#1a1a1a" }} />}
      </div>
      <div style={{ height: "50%", padding: "24px 24px 36px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", position: "relative" }}>
        {slide.funnyLine && <div style={{ ...MT, fontSize: 10, color: "#ffffffbb", fontStyle: "italic", lineHeight: 1.4, marginBottom: 14, maxWidth: "85%" }}>{"“" + slide.funnyLine + "”"}</div>}
        {closerDivider(slide)}
        {closerWordmark(slide)}
        {closerCta(slide)}
      </div>
      {showWm && watermark()}
      {closerDisclaimer(slide)}
    </div>;
  }

  if (tpl === "manifesto") {
    return <div style={Object.assign({}, rootBase, { justifyContent: "space-between", padding: "44px 28px 56px" })}>
      {closerBgLayer(slide)}
      <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", alignItems: "center", maxWidth: "92%" }}>
        {slide.funnyLine && <div style={{ ...MT, fontSize: 17, color: "#ffffff", fontStyle: "italic", lineHeight: 1.28, textAlign: "left" }}>{"“" + slide.funnyLine + "”"}</div>}
      </div>
      <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
        {closerDivider(slide)}
        {closerWordmark(slide)}
        {closerCta(slide)}
      </div>
      {showWm && watermark()}
      {closerDisclaimer(slide)}
    </div>;
  }

  if (tpl === "statpunch") {
    var stat = slide.closerStat || "—";
    var caption = slide.closerStatLabel || slide.funnyLine || "";
    return <div style={Object.assign({}, rootBase, alignStyle, { padding: "0 24px" })}>
      {closerBgLayer(slide)}
      <div style={{ textAlign: "center", position: "relative", zIndex: 2, maxWidth: "90%" }}>
        <div style={{ ...WS, fontSize: 56, color: "#ffffff", letterSpacing: -2, lineHeight: 0.85 }}>{stat}</div>
        {caption && <div style={{ ...HD, fontSize: 9.5, color: "#ffffffcc", marginTop: 14, lineHeight: 1.45, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>{caption}</div>}
        <div style={{ height: 14 }} />
        {closerDivider(slide)}
        {closerWordmark(slide)}
        {closerCta(slide)}
      </div>
      {showWm && watermark()}
      {closerDisclaimer(slide)}
    </div>;
  }

  if (tpl === "cta") {
    var ctaPrimary = slide.ctaText || "Follow @LOATHR for the next brief";
    return <div style={Object.assign({}, rootBase, alignStyle, { padding: "0 24px" })}>
      {closerBgLayer(slide)}
      <div style={{ textAlign: "center", position: "relative", zIndex: 2, maxWidth: "90%" }}>
        {slide.funnyLine && <div style={{ ...MT, fontSize: 10, color: "#ffffff88", fontStyle: "italic", lineHeight: 1.4, marginBottom: 20 }}>{slide.funnyLine}</div>}
        <div style={{ ...FN, fontSize: 22, color: "#ffffff", lineHeight: 1.18, textTransform: "uppercase", marginBottom: 12, letterSpacing: "0.02em" }}>{ctaPrimary}</div>
        {slide.ctaUrl && <div style={{ ...CP, fontSize: 8, color: "#ffffffaa", letterSpacing: "0.06em", marginBottom: 20 }}>{slide.ctaUrl}</div>}
        {closerDivider(slide)}
        {closerWordmark(slide)}
      </div>
      {showWm && watermark()}
      {closerDisclaimer(slide)}
    </div>;
  }

  // minimal (default)
  return <div style={Object.assign({}, rootBase, alignStyle)}>
    {closerBgLayer(slide)}
    <div style={{ textAlign: "center", padding: "0 24px", maxWidth: "85%", position: "relative", zIndex: 2 }}>
      {slide.funnyLine && <div style={{ ...MT, fontSize: 10, color: "#ffffff99", fontStyle: "italic", lineHeight: 1.5, marginBottom: 16 }}>{"“" + slide.funnyLine + "”"}</div>}
      {closerDivider(slide)}
      {closerWordmark(slide)}
      {closerCta(slide)}
    </div>
    {showWm && watermark()}
    {closerDisclaimer(slide)}
  </div>;
}

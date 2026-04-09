"use client";
// Enterprise — 8 alternating layouts + cover/playbook/closer

var CP = { fontFamily: "'Courier Prime',monospace" };
var FN = { fontFamily: "'Foun',Georgia,serif" };
var HD = { fontFamily: "'Maheni',Georgia,serif", fontStyle: "normal" };
var WS = { fontFamily: "'Wenssep',Georgia,serif", textTransform: "uppercase" };
var FONT_MAP = { maheni: HD, foun: FN, courier: CP, wenssep: WS };
export var ENTERPRISE_FONTS = [
  { id: "maheni", label: "Maheni" },
  { id: "foun", label: "Foun" },
  { id: "courier", label: "Courier" },
  { id: "wenssep", label: "Wenssep" },
];
function bodyFont(slide) { return FONT_MAP[slide.bodyFont] || HD; }
function headFont(slide) { return FONT_MAP[slide.headingFont] || FN; }
var imgFilter = "grayscale(1) contrast(1.1) brightness(0.6)";

// Enterprise text styling — underline KEY TERMS + custom keywords
export function enterpriseStyleBody(text, keywords) {
  if (!text) return "";
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
      return <span key={i} style={{ borderBottom: "1.5px solid #ffffff", paddingBottom: 1, fontWeight: 700, color: "#ffffff" }}>{part}</span>;
    }
    return part;
  });
}
var watermark = function() { return <div style={{ position: "absolute", bottom: 5, left: 8, zIndex: 10, ...CP, fontSize: 4, letterSpacing: "0.12em", color: "#ffffff55" }}>LOATHR</div>; };
var srcLine = function(s) { return s ? <div style={{ ...CP, fontSize: 4, color: "#ffffff33", textAlign: "right", marginTop: 4 }}>{s}</div> : null; };
var sectionLabel = function(t) { return <div style={{ ...CP, fontSize: 6, letterSpacing: "0.2em", color: "#ffffff55", marginBottom: 4, textTransform: "uppercase" }}>{t}</div>; };
var highlightFont = function(slide) { return FONT_MAP[slide && slide.highlightFont] || HD; };

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
  var fg = o.fg || "#ffffff88";
  var accent = o.accent || "#ffffff";
  var bg = o.bg || "transparent";
  var font = highlightFont(slide);
  var sz = 8 + (slide && slide.highlightSize || 0);
  var ht = slide ? elementTransform(slide, "highlight") : {};
  var textStyle = Object.assign({}, font, { fontSize: sz, color: fg, lineHeight: 1.4 });

  if (style === "pill") return <div style={Object.assign({}, { marginTop: 6 }, ht)}><span style={Object.assign({}, textStyle, { background: accent, color: o.pillText || "#0a0a0a", padding: "2px 8px", fontWeight: 700, fontStyle: "italic", display: "inline-block" })}>{t}</span></div>;
  if (style === "underline") return <div style={Object.assign({}, { marginTop: 6 }, ht)}><div style={Object.assign({}, textStyle, { borderBottom: "2px solid " + accent, paddingBottom: 2, fontStyle: "italic", display: "inline" })}>{t}</div></div>;
  if (style === "box") return <div style={Object.assign({}, { marginTop: 6, border: "1px solid " + accent + "44", padding: "4px 8px" }, ht)}><div style={Object.assign({}, textStyle, { fontStyle: "italic" })}>{t}</div></div>;
  if (style === "quote") return <div style={Object.assign({}, { marginTop: 6, paddingLeft: 4 }, ht)}><span style={Object.assign({}, font, { fontSize: sz + 6, color: accent + "44", lineHeight: 0.8, verticalAlign: "top" })}>{"\u201C"}</span><span style={Object.assign({}, textStyle, { fontStyle: "italic" })}>{t}</span><span style={Object.assign({}, font, { fontSize: sz + 6, color: accent + "44", lineHeight: 0.8, verticalAlign: "bottom" })}>{"\u201D"}</span></div>;
  if (style === "tag") return <div style={Object.assign({}, { marginTop: 6, display: "flex", alignItems: "center", gap: 4 }, ht)}><div style={{ width: 2, height: 14, background: accent, flexShrink: 0 }} /><div style={Object.assign({}, textStyle, { textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, fontSize: sz - 1 })}>{t}</div></div>;
  // default: bar
  return <div style={Object.assign({}, { marginTop: 6, borderLeft: "2px solid " + accent + "44", paddingLeft: 8 }, ht)}><div style={Object.assign({}, textStyle, { fontStyle: "italic" })}>{t}</div></div>;
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
  return (o.top || o.left) ? { transform: "translate(" + (o.left || 0) + "px," + (o.top || 0) + "px)" } : {};
}

export var ENTERPRISE_LAYOUT_COUNT = 8;
export var ENTERPRISE_LAYOUT_LABELS = ["Top/Bottom", "Bottom/Top", "Left/Right", "Right/Left", "Strip+2Col", "Text Only", "Diagonal", "Center Band"];
export var ENTERPRISE_COVER_LABELS = ["Standard", "Full Bleed", "Split L/R", "Text Only", "Center"];

// Masthead component (reused across cover layouts)
function Masthead({ isBreaking, align }) {
  return <>
    <div style={{ padding: "8px 16px 4px", borderBottom: "1px solid #ffffff33", textAlign: align || "right", flexShrink: 0 }}>
      <div style={{ ...CP, fontSize: 9, letterSpacing: "0.25em", color: "#ffffff66" }}>LOATHR</div>
      <div style={{ ...CP, fontSize: 5, letterSpacing: "0.15em", color: "#ffffff44", marginTop: 1 }}>ENTERPRISE</div>
    </div>
    {isBreaking && <div style={{ background: "#ffffff", padding: "3px 16px", textAlign: "center", flexShrink: 0 }}>
      <div style={{ ...CP, fontSize: 6, letterSpacing: "0.25em", color: "#0a0a0a", fontWeight: 700 }}>JUST IN</div>
    </div>}
  </>;
}

function CoverTitle({ slide }) {
  return <div style={Object.assign({}, offsetStyle(slide))}>
    <div style={{ ...headFont(slide), fontSize: slide.title && slide.title.length > 35 ? 22 : 28, color: "#ffffff", lineHeight: 1.1 }}>{slide.title || ""}</div>
    <div style={{ height: 1.5, background: "#ffffff44", margin: "10px 0", width: "35%" }} />
    {slide.subtitle && <div style={{ ...bodyFont(slide), fontSize: 9, color: "#ffffff88" }}>{slide.subtitle}</div>}
    {slide.timestamp && <div style={{ ...CP, fontSize: 4, color: "#ffffff44", marginTop: 4 }}>{slide.timestamp}</div>}
  </div>;
}

// Cover
export function EnterpriseCover({ slide, images, index }) {
  var url = images && images[0] ? images[0].url : null;
  var isBreaking = slide.breaking;
  var sp = getSplit(slide);
  var coverLayout = slide.enterpriseCoverLayout || 0; // 0=standard, 1=full bleed, 2=split, 3=text only, 4=center

  // Layout 0 — Standard (masthead → image strip → title)
  if (coverLayout === 0) return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
      <Masthead isBreaking={isBreaking} />
      {url && <div style={{ height: sp + "%", overflow: "hidden", flexShrink: 0, borderBottom: "1px solid #ffffff22" }}>
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} />
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
      {url && <img src={url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} />}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.95))" }} />
      <div style={{ position: "absolute", top: 10, right: 16, zIndex: 2 }}>
        <div style={{ ...CP, fontSize: 9, letterSpacing: "0.25em", color: "#ffffff66", textAlign: "right" }}>LOATHR</div>
        <div style={{ ...CP, fontSize: 5, letterSpacing: "0.15em", color: "#ffffff44", textAlign: "right" }}>ENTERPRISE</div>
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
      {url ? <div style={{ width: sp + "%", overflow: "hidden" }}><img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} /></div>
        : <div style={{ width: sp + "%", background: "#111" }} />}
      <div style={{ width: (100 - sp) + "%", padding: "10px 14px", display: "flex", flexDirection: "column" }}>
        <div style={{ textAlign: "right", marginBottom: 8 }}>
          <div style={{ ...CP, fontSize: 8, letterSpacing: "0.2em", color: "#ffffff55" }}>LOATHR</div>
          <div style={{ ...CP, fontSize: 4, letterSpacing: "0.12em", color: "#ffffff33" }}>ENTERPRISE</div>
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
      <Masthead isBreaking={isBreaking} />
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
        <div style={{ ...CP, fontSize: 9, letterSpacing: "0.25em", color: "#ffffff66" }}>LOATHR</div>
        <div style={{ ...CP, fontSize: 5, letterSpacing: "0.15em", color: "#ffffff44", marginTop: 1 }}>ENTERPRISE</div>
      </div>
      {isBreaking && <div style={{ background: "#ffffff", padding: "3px 16px", textAlign: "center", flexShrink: 0, width: "100%" }}>
        <div style={{ ...CP, fontSize: 6, letterSpacing: "0.25em", color: "#0a0a0a", fontWeight: 700 }}>JUST IN</div>
      </div>}
      {url && <div style={{ height: sp + "%", width: "100%", overflow: "hidden", flexShrink: 0, borderBottom: "1px solid #ffffff22", borderTop: "1px solid #ffffff22" }}>
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>}
      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
        <CoverTitle slide={slide} />
      </div>
      {watermark()}
    </div>
  );
}

// Render image or mosaic
function ImgOrMosaic({ url, mosaic, mosaicLayout, height, width }) {
  if (mosaic) return <EnterpriseMosaic urls={mosaic} height={height} width={width} layout={mosaicLayout} />;
  if (url) return <div style={{ width: width || "100%", height: height || "100%", overflow: "hidden" }}><img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} /></div>;
  return <div style={{ width: width || "100%", height: height || "100%", background: "#111" }} />;
}

// Layout 1 — Top Image / Bottom Text
function Layout1({ slide, url, mosaic, mosaicLayout }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ height: sp + "%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} mosaicLayout={mosaicLayout} /></div>
      <div style={Object.assign({}, { height: (100 - sp) + "%", padding: "8px 14px", display: "flex", flexDirection: "column", overflow: "hidden" }, offsetStyle(slide))}>
        {sectionLabel(slide.role || "")}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 14 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.15, marginBottom: 6 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.55, flex: 1, overflow: "hidden" }, elementTransform(slide, "body"))}>{enterpriseStyleBody(slide.body, slide.keywords)}</div>
        {highlightBlock(slide.highlight, slide)}
        {srcLine(slide.sources)}
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
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 14 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.15, marginBottom: 6 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.55, flex: 1, overflow: "hidden" }, elementTransform(slide, "body"))}>{enterpriseStyleBody(slide.body, slide.keywords)}</div>
        {highlightBlock(slide.highlight, slide)}
        {srcLine(slide.sources)}
      </div>
      <div style={{ height: sp + "%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} mosaicLayout={mosaicLayout} /></div>
      {watermark()}
    </div>
  );
}

// Layout 3 — Left Image / Right Text
function Layout3({ slide, url, mosaic, mosaicLayout }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", overflow: "hidden" }}>
      <div style={{ width: sp + "%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} mosaicLayout={mosaicLayout} /></div>
      <div style={Object.assign({}, { width: (100 - sp) + "%", padding: "10px 12px", display: "flex", flexDirection: "column", overflow: "hidden" }, offsetStyle(slide))}>
        {sectionLabel(slide.role || "")}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 13 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.15, marginBottom: 6 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        <div style={{ height: 0.5, background: "#ffffff22", marginBottom: 6 }} />
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8.5 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.55, flex: 1, overflow: "hidden" }, elementTransform(slide, "body"))}>{enterpriseStyleBody(slide.body, slide.keywords)}</div>
        {highlightBlock(slide.highlight, slide)}
        {srcLine(slide.sources)}
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
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 13 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.15, marginBottom: 6 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        <div style={{ height: 0.5, background: "#ffffff22", marginBottom: 6 }} />
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8.5 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.55, flex: 1, overflow: "hidden" }, elementTransform(slide, "body"))}>{enterpriseStyleBody(slide.body, slide.keywords)}</div>
        {highlightBlock(slide.highlight, slide)}
        {srcLine(slide.sources)}
      </div>
      <div style={{ width: sp + "%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} mosaicLayout={mosaicLayout} /></div>
      {watermark()}
    </div>
  );
}

// Layout 5 — Image Strip Top + 2-Column Text
function Layout5({ slide, url, mosaic, mosaicLayout }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ height: "30%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} mosaicLayout={mosaicLayout} /></div>
      <div style={{ flex: 1, padding: "8px 14px", overflow: "hidden" }}>
        {sectionLabel(slide.role || "")}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 14 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.15, marginBottom: 6 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        <div style={{ height: 0.5, background: "#ffffff22", marginBottom: 6 }} />
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8.5 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.55, columnCount: 2, columnGap: 10, columnRule: "0.5px solid #ffffff11" }, elementTransform(slide, "body"))}>{enterpriseStyleBody(slide.body, slide.keywords)}</div>
        {highlightBlock(slide.highlight, slide)}
        {srcLine(slide.sources)}
      </div>
      {watermark()}
    </div>
  );
}

// Layout 6 — Full Text (no image)
function Layout6({ slide }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ height: 1.5, background: "#ffffff33", margin: "0 16px" }} />
      <div style={Object.assign({}, { flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column" }, offsetStyle(slide))}>
        {sectionLabel(slide.role || "")}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 18 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.1, marginBottom: 10 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        <div style={{ height: 1, background: "#ffffff22", marginBottom: 10 }} />
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 10 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.6, flex: 1 }, elementTransform(slide, "body"))}>{enterpriseStyleBody(slide.body, slide.keywords)}</div>
        {highlightBlock(slide.highlight, slide)}
        {srcLine(slide.sources)}
      </div>
      {watermark()}
    </div>
  );
}

// Layout 7 — Diagonal Split (image top-left, text bottom-right)
function Layout7({ slide, url, mosaic, mosaicLayout }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", height: "45%" }}>
        <div style={{ width: "55%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} mosaicLayout={mosaicLayout} /></div>
        <div style={{ width: "45%", padding: "8px 10px" }}>
          {sectionLabel(slide.role || "")}
          <div style={Object.assign({}, { ...headFont(slide), fontSize: 12 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.15 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        </div>
      </div>
      <div style={{ height: 0.5, background: "#ffffff22" }} />
      <div style={{ flex: 1, padding: "8px 14px", overflow: "hidden" }}>
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.55 }, elementTransform(slide, "body"))}>{enterpriseStyleBody(slide.body, slide.keywords)}</div>
        {highlightBlock(slide.highlight, slide)}
        {srcLine(slide.sources)}
      </div>
      {watermark()}
    </div>
  );
}

// Layout 8 — Center Band (text top, image center, text bottom)
function Layout8({ slide, url, mosaic, mosaicLayout }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "8px 14px", flexShrink: 0 }}>
        {sectionLabel(slide.role || "")}
        <div style={{ ...headFont(slide), fontSize: 14 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.15 }}>{slide.heading || ""}</div>
      </div>
      <div style={{ height: "30%", overflow: "hidden", flexShrink: 0, borderTop: "0.5px solid #ffffff22", borderBottom: "0.5px solid #ffffff22" }}><ImgOrMosaic url={url} mosaic={mosaic} mosaicLayout={mosaicLayout} /></div>
      <div style={{ flex: 1, padding: "8px 14px", overflow: "hidden" }}>
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.55 }, elementTransform(slide, "body"))}>{enterpriseStyleBody(slide.body, slide.keywords)}</div>
        {highlightBlock(slide.highlight, slide)}
        {srcLine(slide.sources)}
      </div>
      {watermark()}
    </div>
  );
}

// Mosaic image renderer for Enterprise — B&W grid
function EnterpriseMosaic({ urls, height, width, layout }) {
  if (!urls || urls.length < 2) return null;
  var count = Math.min(urls.length, 4);
  // If a layout config is provided (from MOSAIC_LAYOUTS), use its grid template
  if (layout && layout.cols) {
    var letters = ["a","b","c","d"];
    return (
      <div style={{ width: width || "100%", height: height || "100%", display: "grid", gridTemplateColumns: layout.cols, gridTemplateRows: layout.rows || "1fr", gridTemplateAreas: layout.areas || undefined, gap: 2, background: "#ffffff", overflow: "hidden" }}>
        {urls.slice(0, count).map(function(u, i) { return (
          <div key={i} style={{ gridArea: layout.areas ? letters[i] : undefined, overflow: "hidden" }}>
            <img src={u} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} />
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
          <img src={u} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} />
        </div>
      ); })}
    </div>
  );
  if (count === 3) return (
    <div style={{ width: width || "100%", height: height || "100%", display: "grid", gridTemplateColumns: "1.6fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2, background: "#ffffff", overflow: "hidden" }}>
      <div style={{ gridRow: "1 / 3", overflow: "hidden" }}>
        <img src={urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>
      <div style={{ overflow: "hidden" }}>
        <img src={urls[1]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>
      <div style={{ overflow: "hidden" }}>
        <img src={urls[2]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>
    </div>
  );
  return (
    <div style={{ width: width || "100%", height: height || "100%", display: "grid", gridTemplateColumns: "1.5fr 1fr", gridTemplateRows: "1.3fr 1fr", gap: 2, background: "#ffffff", overflow: "hidden" }}>
      <div style={{ overflow: "hidden" }}>
        <img src={urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>
      <div style={{ gridRow: "1 / 3", overflow: "hidden" }}>
        <img src={urls[1]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>
      <div style={{ overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <div style={{ overflow: "hidden" }}><img src={urls[2]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} /></div>
        <div style={{ overflow: "hidden" }}><img src={urls[3]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} /></div>
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
        <div style={{ ...headFont(slide), fontSize: 14, color: "#ffffff", marginBottom: 10, lineHeight: 1.15 }}>{slide.heading || "Action Steps"}</div>
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
      {srcLine(slide.sources)}
      {watermark()}
    </div>
  );
}

// Closer
export function EnterpriseCloser({ slide }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center", padding: "0 24px", maxWidth: "85%" }}>
        {slide.funnyLine && <div style={{ ...HD, fontSize: 10, color: "#ffffff99", fontStyle: "italic", lineHeight: 1.5, marginBottom: 16 }}>"{slide.funnyLine}"</div>}
        <div style={{ height: 0.5, background: "#ffffff22", width: "40%", margin: "0 auto 14px" }} />
        <div style={{ ...CP, fontSize: 9, letterSpacing: "0.25em", color: "#ffffff66" }}>LOATHR</div>
        <div style={{ ...CP, fontSize: 5, letterSpacing: "0.12em", color: "#ffffff44", marginTop: 2 }}>ENTERPRISE</div>
        {slide.disclaimer && <div style={{ ...CP, fontSize: 4.5, color: "#ffffff33", marginTop: 12, lineHeight: 1.5 }}>{slide.disclaimer}</div>}
      </div>
      {watermark()}
    </div>
  );
}

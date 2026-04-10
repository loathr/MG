"use client";
// News Desk — newspaper-style layouts with full editability

import { styledHighlight, HIGHLIGHT_STYLES } from "./EnterpriseSlides";

// Font constants
var CP = { fontFamily: "'Courier Prime',monospace" };
var FN = { fontFamily: "'Foun',Georgia,serif" };
var HD = { fontFamily: "'Maheni',Georgia,serif", fontStyle: "normal" };
var WS = { fontFamily: "'Wenssep',Georgia,serif", textTransform: "uppercase" };
var OT = { fontFamily: "'Otilito','Foun',sans-serif" };
var QG = { fontFamily: "'Qogee','Maheni',serif", fontStyle: "normal" };
var MT = { fontFamily: "'Matina','Maheni',serif", fontStyle: "normal" };
var QZ = { fontFamily: "'QuickZip','Otilito',sans-serif", textTransform: "uppercase" };
var GH = { fontFamily: "'GrandHalva','Foun',serif" };
var CT = { fontFamily: "'CarbonText','Maheni',sans-serif", fontStyle: "normal" };
var MH = { fontFamily: "'Medhorn','Foun',serif" };

var FONT_MAP = { maheni: HD, foun: FN, courier: CP, wenssep: WS, otilito: OT, qogee: QG, matina: MT, quickzip: QZ, grandhalva: GH, carbon: CT, medhorn: MH };

// News Desk defaults: Grand Halva masthead, Medhorn headlines, Carbon Text body, Quick-Zip banners
function headFont(slide) { return FONT_MAP[slide && slide.headingFont] || MH; }
function bodyFont(slide) { return FONT_MAP[slide && slide.bodyFont] || CT; }
function hlFont(slide) { return FONT_MAP[slide && slide.highlightFont] || GH; }
function mastheadFont(slide) { return FONT_MAP[slide && slide.mastheadFont] || GH; }
function bannerFont(slide) { return FONT_MAP[slide && slide.bannerFont] || QZ; }

// Color helpers
function headColor(slide, def) { return slide && slide.headingColor || def || "#1a1a1a"; }
function bodyColor(slide, def) { return slide && slide.bodyColor || def || "#1a1a1a"; }
function srcColor(slide, def) { return slide && slide.sourcesColor || def || "#1a1a1a44"; }

// Element transform — position + alignment
function elementTransform(slide, element) {
  if (!slide) return {};
  var cp = slide.customPosition && typeof slide.customPosition === "object" ? slide.customPosition : {};
  var o = cp[element] || { top: 0, left: 0 };
  var result = (o.top || o.left) ? { transform: "translate(" + (o.left || 0) + "px," + (o.top || 0) + "px)" } : {};
  var alignKey = element + "Align";
  if (slide[alignKey]) result.textAlign = slide[alignKey];
  return result;
}

// Divider line — editable weight + visibility
function dividerLine(slide, defaults) {
  if (slide && slide.dividerHidden) return null;
  var w = slide && typeof slide.dividerWeight === "number" ? slide.dividerWeight : (defaults && defaults.weight || 1);
  var c = slide && slide.dividerColor ? slide.dividerColor : (defaults && defaults.color || "#1a1a1a33");
  return <div style={{ height: w, background: c, marginBottom: defaults && defaults.mb || 6 }} />;
}

// Sources line — editable
function srcLine(s, slide) {
  if (!s) return null;
  var sz = 4 + (slide && slide.sourcesSize || 0);
  var srcFont = slide && slide.sourcesFont ? (FONT_MAP[slide.sourcesFont] || CP) : CP;
  var align = slide && slide.sourcesAlign ? { textAlign: slide.sourcesAlign } : { textAlign: "right" };
  return <div style={Object.assign({}, srcFont, { fontSize: sz, color: srcColor(slide), marginTop: 4 }, align, elementTransform(slide, "sources"))}>{s}</div>;
}

// Edition strip — Vol/No/Date/City bar
function editionStrip(slide) {
  if (slide && slide.editionStripHidden) return null;
  var d = new Date();
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var dateStr = months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  var text = slide && slide.editionStripText ? slide.editionStripText : "Vol. 1 \u00b7 No. " + (d.getDate()) + " \u00b7 " + dateStr;
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 14px", borderBottom: "0.5px solid #1a1a1a22", flexShrink: 0 }}>
    <div style={{ ...CP, fontSize: 3.5, color: "#1a1a1a55", letterSpacing: "0.05em" }}>{text}</div>
    <div style={{ ...CP, fontSize: 3.5, color: "#1a1a1a55" }}>Page {slide && slide.pageNumber || 1}</div>
  </div>;
}

// Watermark
var watermark = function() { return <div style={{ position: "absolute", bottom: 4, left: 8, ...CP, fontSize: 4, letterSpacing: "0.1em", color: "#1a1a1a22" }}>LOATHR</div>; };

// Photo caption — editable
function photoCaption(slide) {
  var text = slide && slide.photoCaption ? slide.photoCaption : "Photo: Wire Services";
  return <div style={{ ...CP, fontSize: 3.5, color: "#1a1a1a44", marginTop: 1 }}>{text}</div>;
}

// Image filter
function getImgFilter(slide) {
  var filters = { none: "none", bw: "grayscale(1) contrast(1.1) brightness(0.85)", grain: "saturate(0.8) contrast(1.05) brightness(0.95)", contrast: "contrast(1.4) brightness(0.8) saturate(0.9)", muted: "saturate(0.5) contrast(0.95) brightness(1.05) sepia(0.1)", duotone: "grayscale(1) contrast(1.2) brightness(0.9) sepia(0.15)", newspaper: "saturate(0.6) contrast(1.1) sepia(0.15)" };
  return filters[slide && slide.imgFilter || "newspaper"] || "saturate(0.6) contrast(1.1) sepia(0.15)";
}

// Torn edge clip path for images
var tornEdgeClip = "polygon(0 0, 3% 1%, 6% 0, 9% 1.5%, 12% 0, 15% 1%, 18% 0.5%, 21% 1.5%, 24% 0, 27% 1%, 30% 0, 33% 1.5%, 36% 0.5%, 39% 1%, 42% 0, 45% 1.5%, 48% 0, 51% 1%, 54% 0.5%, 57% 1.5%, 60% 0, 63% 1%, 66% 0, 69% 1.5%, 72% 0.5%, 75% 1%, 78% 0, 81% 1.5%, 84% 0, 87% 1%, 90% 0.5%, 93% 1.5%, 96% 0, 100% 1%, 100% 97%, 97% 98%, 94% 97%, 91% 98.5%, 88% 97%, 85% 98%, 82% 97.5%, 79% 98.5%, 76% 97%, 73% 98%, 70% 97%, 67% 98.5%, 64% 97.5%, 61% 98%, 58% 97%, 55% 98.5%, 52% 97%, 49% 98%, 46% 97.5%, 43% 98.5%, 40% 97%, 37% 98%, 34% 97%, 31% 98.5%, 28% 97.5%, 25% 98%, 22% 97%, 19% 98.5%, 16% 97%, 13% 98%, 10% 97.5%, 7% 98.5%, 4% 97%, 0 98%)";

// Split ratio helper
function getSplit(slide) { return slide && slide.newsSplit || 45; }

// Column count helper
function getCols(slide) { return slide && slide.columnCount || 2; }

// Layout labels
export var NEWS_COVER_LABELS = ["Broadsheet", "Tabloid", "Modern Split", "Breaking Banner"];
export var NEWS_LAYOUT_LABELS = ["Standard", "Feature", "Sidebar", "Wire Report", "Torn Edge"];
export var NEWS_COVER_COUNT = 4;
export var NEWS_LAYOUT_COUNT = 5;

// ======== FRONT PAGE LAYOUTS ========

// Masthead block — reused across cover layouts
function Masthead({ slide, isBreaking, isDeveloping }) {
  return <>
    <div style={Object.assign({}, { padding: "8px 14px 4px", borderBottom: "2.5px solid #1a1a1a", textAlign: "center", flexShrink: 0 }, elementTransform(slide, "heading"))}>
      <div style={{ ...mastheadFont(slide), fontSize: 18 + (slide.mastheadSize || 0), color: headColor(slide), letterSpacing: "0.06em", lineHeight: 1 }}>{slide.mastheadText || "LOATHR NEWS DESK"}</div>
    </div>
    {editionStrip(slide)}
    {isBreaking && <div style={{ background: "#c41e1e", padding: "3px 14px", textAlign: "center", flexShrink: 0 }}>
      <div style={{ ...bannerFont(slide), fontSize: 8, letterSpacing: "0.25em", color: "#ffffff", fontWeight: 700 }}>BREAKING NEWS</div>
    </div>}
    {isDeveloping && <div style={{ background: "#e67e22", padding: "3px 14px", textAlign: "center", flexShrink: 0 }}>
      <div style={{ ...bannerFont(slide), fontSize: 8, letterSpacing: "0.25em", color: "#ffffff", fontWeight: 700 }}>DEVELOPING STORY</div>
    </div>}
  </>;
}

// Cover 0 — Broadsheet (classic front page)
function CoverBroadsheet({ slide, url }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      <Masthead slide={slide} isBreaking={slide.breaking} isDeveloping={slide.developing} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "6px 14px" }}>
        <div style={Object.assign({}, { ...headFont(slide), fontSize: (slide.title && slide.title.length > 40 ? 18 : 24) + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.1, marginBottom: 6 }, elementTransform(slide, "heading"))}>{slide.title || ""}</div>
        {dividerLine(slide, { weight: 1, color: "#1a1a1a33" })}
        <div style={{ display: "flex", gap: 8, flex: 1 }}>
          {url && <div style={{ width: sp + "%", flexShrink: 0 }}>
            <div style={{ width: "100%", height: 130, overflow: "hidden", border: "0.5px solid #1a1a1a22" }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: getImgFilter(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
            </div>
            {photoCaption(slide)}
          </div>}
          <div style={{ flex: 1 }}>
            {slide.leadParagraph && <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.55 }, elementTransform(slide, "body"))}>{slide.leadParagraph}</div>}
          </div>
        </div>
      </div>
      {watermark()}
    </div>
  );
}

// Cover 1 — Tabloid (giant headline dominant)
function CoverTabloid({ slide, url }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      <Masthead slide={slide} isBreaking={slide.breaking} isDeveloping={slide.developing} />
      <div style={{ flex: 1, padding: "10px 14px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={Object.assign({}, { ...headFont(slide), fontSize: (slide.title && slide.title.length > 30 ? 26 : 34) + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.05, marginBottom: 8 }, elementTransform(slide, "heading"))}>{slide.title || ""}</div>
        {dividerLine(slide, { weight: 2, color: "#1a1a1a" })}
        {slide.leadParagraph && <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.55, marginTop: 4 }, elementTransform(slide, "body"))}>{slide.leadParagraph}</div>}
      </div>
      {url && <div style={{ height: "30%", overflow: "hidden", flexShrink: 0, borderTop: "1px solid #1a1a1a22" }}>
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: getImgFilter(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>}
      {watermark()}
    </div>
  );
}

// Cover 2 — Modern Split (image left, text right)
function CoverModernSplit({ slide, url }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex" }}>
      {url ? <div style={{ width: sp + "%", overflow: "hidden" }}>
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: getImgFilter(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
      </div> : <div style={{ width: sp + "%", background: "#e8e3d4" }} />}
      <div style={{ width: (100 - sp) + "%", padding: "10px 12px", display: "flex", flexDirection: "column" }}>
        <div style={{ ...mastheadFont(slide), fontSize: 12 + (slide.mastheadSize || 0), color: "#1a1a1a", letterSpacing: "0.06em", textAlign: "right", marginBottom: 4 }}>{slide.mastheadText || "LOATHR NEWS DESK"}</div>
        {editionStrip(slide)}
        {slide.breaking && <div style={{ background: "#c41e1e", padding: "2px 6px", textAlign: "center", marginTop: 4, marginBottom: 4 }}>
          <div style={{ ...bannerFont(slide), fontSize: 6, letterSpacing: "0.2em", color: "#ffffff", fontWeight: 700 }}>BREAKING</div>
        </div>}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={Object.assign({}, { ...headFont(slide), fontSize: 18 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.1, marginBottom: 8 }, elementTransform(slide, "heading"))}>{slide.title || ""}</div>
          {dividerLine(slide, { weight: 1.5, color: "#c41e1e" })}
          {slide.leadParagraph && <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.5 }, elementTransform(slide, "body"))}>{slide.leadParagraph}</div>}
        </div>
        {photoCaption(slide)}
      </div>
      {watermark()}
    </div>
  );
}

// Cover 3 — Breaking Banner (full-width red banner, centered)
function CoverBreakingBanner({ slide, url }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "6px 14px", textAlign: "center", flexShrink: 0 }}>
        <div style={{ ...mastheadFont(slide), fontSize: 14 + (slide.mastheadSize || 0), color: "#1a1a1a", letterSpacing: "0.06em" }}>{slide.mastheadText || "LOATHR NEWS DESK"}</div>
      </div>
      <div style={{ background: slide.breaking ? "#c41e1e" : "#1a1a1a", padding: "6px 14px", textAlign: "center", flexShrink: 0 }}>
        <div style={{ ...bannerFont(slide), fontSize: 14, letterSpacing: "0.3em", color: "#ffffff", fontWeight: 700 }}>{slide.breaking ? "BREAKING NEWS" : slide.developing ? "DEVELOPING" : "LATEST"}</div>
      </div>
      {editionStrip(slide)}
      <div style={{ flex: 1, padding: "10px 14px", display: "flex", flexDirection: "column" }}>
        <div style={Object.assign({}, { ...headFont(slide), fontSize: (slide.title && slide.title.length > 35 ? 20 : 26) + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.1, marginBottom: 8, textAlign: "center" }, elementTransform(slide, "heading"))}>{slide.title || ""}</div>
        {dividerLine(slide, { weight: 1, color: "#1a1a1a33" })}
        {url && <div style={{ width: "100%", height: 120, overflow: "hidden", border: "0.5px solid #1a1a1a22", marginBottom: 4 }}>
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: getImgFilter(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
        </div>}
        {slide.leadParagraph && <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8.5 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.5, columnCount: 2, columnGap: 10, columnRule: "0.5px solid #1a1a1a11" }, elementTransform(slide, "body"))}>{slide.leadParagraph}</div>}
      </div>
      {watermark()}
    </div>
  );
}

// ======== FRONT PAGE ROUTER ========
var COVER_LAYOUTS = [CoverBroadsheet, CoverTabloid, CoverModernSplit, CoverBreakingBanner];

export function NewsFrontPage({ slide, images, index }) {
  var url = images && images[0] ? images[0].url : null;
  var layoutIdx = typeof slide.newsCoverLayout === "number" ? slide.newsCoverLayout : 0;
  var Layout = COVER_LAYOUTS[layoutIdx] || CoverBroadsheet;
  return <Layout slide={slide} url={url} />;
}

// ======== CONTENT LAYOUTS ========

// Role label
function roleLabel(slide) {
  return <div style={Object.assign({}, { ...bannerFont(slide), fontSize: 6, letterSpacing: "0.15em", color: "#c41e1e", marginBottom: 4, textTransform: "uppercase" }, elementTransform(slide, "sources"))}>{slide.role || ""}</div>;
}

// Layout 0 — Standard Columns
function LayoutStandard({ slide, url }) {
  var cols = getCols(slide);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 2, background: "#1a1a1a", margin: "0 14px" }} />
      {editionStrip(slide)}
      <div style={{ padding: "6px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        {roleLabel(slide)}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 15 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.15, marginBottom: 6 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        {dividerLine(slide, { weight: 0.5, color: "#1a1a1a22" })}
        {url && <div style={{ width: "100%", height: 95, overflow: "hidden", border: "0.5px solid #1a1a1a22", marginBottom: 5 }}>
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: getImgFilter(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
        </div>}
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.55, columnCount: cols, columnGap: 10, columnRule: "0.5px solid #1a1a1a11", flex: 1 }, elementTransform(slide, "body"))}>{slide.body || ""}</div>
        {styledHighlight(slide.highlight, slide, { fg: "#1a1a1a", accent: "#c41e1e", pillText: "#ffffff", defaultStyle: "bar" })}
      </div>
      {srcLine(slide.sources, slide)}
      {watermark()}
    </div>
  );
}

// Layout 1 — Feature (large photo top, single column)
function LayoutFeature({ slide, url }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      {url && <div style={{ height: sp + "%", overflow: "hidden", flexShrink: 0 }}>
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: getImgFilter(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>}
      {url && <div style={{ padding: "1px 14px" }}>{photoCaption(slide)}</div>}
      <div style={{ padding: "6px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        {roleLabel(slide)}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 16 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.15, marginBottom: 6 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        {dividerLine(slide, { weight: 1, color: "#c41e1e", mb: 6 })}
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.55, flex: 1 }, elementTransform(slide, "body"))}>{slide.body || ""}</div>
        {styledHighlight(slide.highlight, slide, { fg: "#1a1a1a", accent: "#c41e1e", pillText: "#ffffff", defaultStyle: "bar" })}
      </div>
      {srcLine(slide.sources, slide)}
      {watermark()}
    </div>
  );
}

// Layout 2 — Sidebar (main story left, sidebar right)
function LayoutSidebar({ slide, url }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex" }}>
      <div style={{ width: (100 - sp + 15) + "%", padding: "8px 10px 8px 14px", display: "flex", flexDirection: "column", borderRight: "1px solid #1a1a1a22" }}>
        <div style={{ height: 2, background: "#1a1a1a", marginBottom: 6 }} />
        {roleLabel(slide)}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 14 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.15, marginBottom: 6 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        {dividerLine(slide, { weight: 0.5, color: "#1a1a1a22" })}
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8.5 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.5, flex: 1 }, elementTransform(slide, "body"))}>{slide.body || ""}</div>
        {srcLine(slide.sources, slide)}
      </div>
      <div style={{ width: (sp - 15) + "%", padding: "8px 10px", background: "#ebe6d6", display: "flex", flexDirection: "column" }}>
        {url && <div style={{ width: "100%", height: 90, overflow: "hidden", border: "0.5px solid #1a1a1a22", marginBottom: 4 }}>
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: getImgFilter(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
        </div>}
        {styledHighlight(slide.highlight, slide, { fg: "#1a1a1a", accent: "#c41e1e", pillText: "#ffffff", defaultStyle: "quote" })}
        {slide.highlight && <div style={{ height: 0.5, background: "#1a1a1a22", margin: "6px 0" }} />}
        {slide.relatedBody && <div style={{ ...CT, fontSize: 7, color: "#1a1a1a88", lineHeight: 1.5 }}>{slide.relatedBody}</div>}
      </div>
      {watermark()}
    </div>
  );
}

// Layout 3 — Wire Report (no image, dense 3-column text)
function LayoutWireReport({ slide }) {
  var cols = getCols(slide) || 3;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 2, background: "#1a1a1a", margin: "0 14px" }} />
      {editionStrip(slide)}
      <div style={{ padding: "8px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        {roleLabel(slide)}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 18 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.1, marginBottom: 8 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        <div style={{ height: 1, background: "#1a1a1a", marginBottom: 8 }} />
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8.5 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.55, columnCount: cols, columnGap: 10, columnRule: "0.5px solid #1a1a1a22", flex: 1 }, elementTransform(slide, "body"))}>{slide.body || ""}</div>
        {styledHighlight(slide.highlight, slide, { fg: "#1a1a1a", accent: "#c41e1e", pillText: "#ffffff", defaultStyle: "tag" })}
      </div>
      {srcLine(slide.sources, slide)}
      {watermark()}
    </div>
  );
}

// Layout 4 — Torn Edge (photo with torn paper edge effect)
function LayoutTornEdge({ slide, url }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 2, background: "#1a1a1a", margin: "0 14px" }} />
      {editionStrip(slide)}
      {url && <div style={{ height: "40%", overflow: "hidden", flexShrink: 0, position: "relative" }}>
        <img src={url} alt="" style={{ width: "100%", height: "110%", objectFit: "cover", filter: getImgFilter(slide), clipPath: tornEdgeClip }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>}
      <div style={{ padding: "6px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        {roleLabel(slide)}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 15 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.15, marginBottom: 6 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        {dividerLine(slide, { weight: 0.5, color: "#1a1a1a22" })}
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.55, columnCount: 2, columnGap: 10, columnRule: "0.5px solid #1a1a1a11", flex: 1 }, elementTransform(slide, "body"))}>{slide.body || ""}</div>
        {styledHighlight(slide.highlight, slide, { fg: "#1a1a1a", accent: "#c41e1e", pillText: "#ffffff", defaultStyle: "bar" })}
      </div>
      {srcLine(slide.sources, slide)}
      {watermark()}
    </div>
  );
}

// ======== CONTENT ROUTER ========
var CONTENT_LAYOUTS = [LayoutStandard, LayoutFeature, LayoutSidebar, LayoutWireReport, LayoutTornEdge];

export function NewsStory({ slide, images, index }) {
  var url = images && images[index] ? images[index].url : null;
  var layoutIdx = typeof slide.newsLayout === "number" ? slide.newsLayout : ((index - 1) % CONTENT_LAYOUTS.length);
  var Layout = CONTENT_LAYOUTS[layoutIdx] || LayoutStandard;
  return <Layout slide={slide} url={url} />;
}

// ======== REACTION (quote-focused) ========
export function NewsReaction({ slide, images, index }) {
  var url = images && images[index] ? images[index].url : null;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 2, background: "#1a1a1a", margin: "0 14px" }} />
      {editionStrip(slide)}
      <div style={{ padding: "8px 14px", flex: 1 }}>
        {roleLabel(slide)}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 14 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.15, marginBottom: 10 }, elementTransform(slide, "heading"))}>{slide.heading || ""}</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          {url && <div style={{ width: 55, height: 55, borderRadius: "50%", overflow: "hidden", border: "1px solid #1a1a1a22", flexShrink: 0 }}>
            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: getImgFilter(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
          </div>}
          <div style={{ flex: 1 }}>
            {slide.quote && <div style={{ ...hlFont(slide), fontSize: 11 + (slide.highlightSize || 0), color: "#1a1a1a", lineHeight: 1.4, fontStyle: "italic" }}>{"\u201C"}{slide.quote}{"\u201D"}</div>}
            <div style={{ ...CP, fontSize: 6, color: "#1a1a1a88", marginTop: 3 }}>{"\u2014"} {slide.source || slide.person || ""}</div>
          </div>
        </div>
        {dividerLine(slide, { weight: 0.5, color: "#1a1a1a22", mb: 6 })}
        {slide.body && <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8.5 + (slide.bodySize || 0), color: bodyColor(slide), lineHeight: 1.5, marginTop: 4, columnCount: getCols(slide), columnGap: 10, columnRule: "0.5px solid #1a1a1a11" }, elementTransform(slide, "body"))}>{slide.body}</div>}
      </div>
      {srcLine(slide.sources, slide)}
      {watermark()}
    </div>
  );
}

// ======== SOURCES CLOSER (classified-style) ========
export function NewsSourcesCloser({ slide }) {
  var sources = slide.fullSources || [];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 2, background: "#1a1a1a", margin: "0 14px" }} />
      {editionStrip(slide)}
      <div style={{ padding: "8px 14px", flex: 1 }}>
        <div style={{ ...bannerFont(slide), fontSize: 7, letterSpacing: "0.15em", color: "#c41e1e", marginBottom: 4 }}>SOURCES & REFERENCES</div>
        <div style={{ height: 1, background: "#1a1a1a", marginBottom: 6 }} />
        <div style={{ columnCount: 3, columnGap: 8, columnRule: "0.5px solid #1a1a1a22" }}>
          {sources.length > 0 ? sources.map(function(src, i) {
            return <div key={i} style={{ marginBottom: 4, breakInside: "avoid", borderBottom: "0.5px solid #1a1a1a11", paddingBottom: 3 }}>
              <div style={{ ...CT, fontSize: 6, color: "#1a1a1a", fontWeight: 700 }}>{src.publication || "Source"}</div>
              <div style={{ ...CT, fontSize: 5.5, color: "#1a1a1a88", lineHeight: 1.3 }}>{src.title || ""}</div>
              {src.date && <div style={{ ...CP, fontSize: 3.5, color: "#1a1a1a55" }}>{src.date}</div>}
            </div>;
          }) : <div style={{ ...CT, fontSize: 7, color: "#1a1a1a66" }}>Sources available upon request.</div>}
        </div>
        {slide.developingNote && <div style={{ marginTop: 4, padding: "3px 6px", background: "#e67e2215", border: "0.5px solid #e67e2233" }}>
          <div style={{ ...CP, fontSize: 5, color: "#e67e22", fontStyle: "italic" }}>{slide.developingNote}</div>
        </div>}
        <div style={{ height: 1, background: "#1a1a1a22", marginTop: 6, marginBottom: 6 }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ ...mastheadFont(slide), fontSize: 12, color: "#1a1a1a", letterSpacing: "0.06em" }}>{slide.mastheadText || "LOATHR NEWS DESK"}</div>
          <div style={{ ...CP, fontSize: 4, color: "#1a1a1a55", marginTop: 2 }}>Reporting. Context. Perspective.</div>
          {slide.hashtags && <div style={{ ...CP, fontSize: 5, color: "#c41e1e66", marginTop: 4 }}>{slide.hashtags}</div>}
        </div>
      </div>
      {watermark()}
    </div>
  );
}

"use client";
// News Desk — authentic newspaper-style layouts

import { styledHighlight } from "./EnterpriseSlides";

// Font constants
var CP = { fontFamily: "'Courier Prime',monospace" };
var FN = { fontFamily: "'Foun',Georgia,serif" };
var HD = { fontFamily: "'Maheni',Georgia,serif", fontStyle: "normal" };
var QZ = { fontFamily: "'QuickZip','Otilito',sans-serif", textTransform: "uppercase" };
var GH = { fontFamily: "'GrandHalva','Foun',serif" };
var CT = { fontFamily: "'CarbonText','Maheni',sans-serif", fontStyle: "normal" };
var MH = { fontFamily: "'Medhorn','Foun',serif" };
var ER = { fontFamily: "'Eroded','Medhorn',serif" };
var VT = { fontFamily: "'VintageTypist','CarbonText',serif", fontWeight: 700 };
var BR = { fontFamily: "'Bramos','QuickZip',sans-serif" };
var CL = { fontFamily: "'Cheelaved','GrandHalva',serif" };
var RS = { fontFamily: "'RealityStone','Medhorn',serif" };

var FONT_MAP = { maheni: HD, foun: FN, courier: CP, wenssep: { fontFamily: "'Wenssep',Georgia,serif", textTransform: "uppercase" }, otilito: { fontFamily: "'Otilito','Foun',sans-serif" }, qogee: { fontFamily: "'Qogee','Maheni',serif", fontStyle: "normal" }, matina: { fontFamily: "'Matina','Maheni',serif", fontStyle: "normal" }, quickzip: QZ, grandhalva: GH, carbon: CT, medhorn: MH, eroded: ER, vintage: VT, bramos: BR, cheelaved: CL, realitystone: RS };

// Defaults: Eroded masthead, Cheelaved headlines, VintageTypist body, Bramos banners, Medhorn quotes
function headFont(s) { return FONT_MAP[s && s.headingFont] || CL; }
function bodyFont(s) { return FONT_MAP[s && s.bodyFont] || VT; }
function hlFont(s) { return FONT_MAP[s && s.highlightFont] || MH; }
function headColor(s, d) { return s && s.headingColor || d || "#1a1a1a"; }
function bodyColor(s, d) { return s && s.bodyColor || d || "#1a1a1a"; }

// Element transform
function elT(s, el) {
  if (!s) return {};
  var cp = s.customPosition && typeof s.customPosition === "object" ? s.customPosition : {};
  var o = cp[el] || { top: 0, left: 0 };
  var r = (o.top || o.left) ? { transform: "translate(" + (o.left || 0) + "px," + (o.top || 0) + "px)" } : {};
  if (s[el + "Align"]) r.textAlign = s[el + "Align"];
  return r;
}

// Image filter
function imgF(s) {
  var f = { none: "none", bw: "grayscale(1) contrast(1.1)", grain: "saturate(0.8) contrast(1.05)", contrast: "contrast(1.4) brightness(0.8)", muted: "saturate(0.5) sepia(0.1)", newspaper: "saturate(0.6) contrast(1.05) sepia(0.12)" };
  return f[s && s.imgFilter || "newspaper"] || f.newspaper;
}

// Newspaper texture background
var NEWS_BG = "#f5f0e4";
var NEWS_BG_TEXTURE = "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.008) 1px, rgba(0,0,0,0.008) 2px)";

function newsBg(s) {
  return { background: (s && s.bgColor) || NEWS_BG, backgroundImage: (s && s.bgTextureHidden) ? "none" : NEWS_BG_TEXTURE };
}

// Context-aware dividers
function divider(s, opts) {
  if (s && s.dividerHidden) return null;
  var o = opts || {};
  var w = s && typeof s.dividerWeight === "number" ? s.dividerWeight : (o.w || 0.5);
  var c = s && s.dividerColor ? s.dividerColor : (o.c || "#1a1a1a22");
  return <div style={{ height: w, background: c, margin: o.m || "0 0 4px 0" }} />;
}
// Short rule — 30% width, newspaper section marker after headlines
function headRule(s) {
  if (s && s.dividerHidden) return null;
  var w = s && typeof s.dividerWeight === "number" ? s.dividerWeight : 0.5;
  var c = s && s.dividerColor ? s.dividerColor : "#1a1a1a44";
  return <div style={{ height: w, background: c, width: "30%", margin: "2px 0 3px 0" }} />;
}
// Dotted hairline — subtle transition (after quotes, between sections)
function dottedRule(s) {
  if (s && s.dividerHidden) return null;
  return <div style={{ borderBottom: "0.5px dotted #1a1a1a22", margin: "3px 0" }} />;
}

// Sources
function srcLine(t, s) {
  if (!t) return null;
  var sz = 4 + (s && s.sourcesSize || 0);
  var font = s && s.sourcesFont ? (FONT_MAP[s.sourcesFont] || CP) : CP;
  return <div style={Object.assign({}, font, { fontSize: sz, color: s && s.sourcesColor || "#1a1a1a44", textAlign: "right", padding: "0 14px 3px" }, elT(s, "sources"))}>{t}</div>;
}

// Edition bar — date only, clean
function editionBar(s) {
  if (s && s.editionBarHidden) return null;
  var d = new Date();
  var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var dateStr = s && s.editionDate ? s.editionDate : months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  var city = s && s.editionCity || "";
  return <div style={{ textAlign: "center", padding: "2px 14px", flexShrink: 0 }}>
    <div style={{ ...CP, fontSize: 4, color: "#1a1a1a88", letterSpacing: "0.08em" }}>{city ? city + " \u2014 " : ""}{dateStr}</div>
  </div>;
}

// Page footer
function pageFooter(s, pageNum) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 14px", flexShrink: 0, borderTop: "0.5px solid #1a1a1a22" }}>
    <div style={{ ...CP, fontSize: 3.5, color: "#1a1a1a33", letterSpacing: "0.1em" }}>NEWS DESK <span style={{ fontSize: 2.5, color: "#1a1a1a22" }}>by LOATHR</span></div>
    <div style={{ ...CP, fontSize: 3.5, color: "#1a1a1a33" }}>Page {pageNum || s && s.pageNumber || 1}</div>
  </div>;
}

// Photo caption
function caption(s) {
  return <div style={{ ...CP, fontSize: 3.5, color: "#1a1a1a55", marginTop: 1 }}>{s && s.photoCaption || "Photo: Wire Services"}</div>;
}

// Decorative rule lines — newspaper-style double/triple rules
function doubleRule(c) { return <div style={{ margin: "0 14px", flexShrink: 0 }}><div style={{ height: 2, background: c || "#1a1a1a" }} /><div style={{ height: 2 }} /><div style={{ height: 0.5, background: c || "#1a1a1a" }} /></div>; }
function tripleRule(c) { return <div style={{ margin: "0 14px", flexShrink: 0 }}><div style={{ height: 1.5, background: c || "#1a1a1a" }} /><div style={{ height: 2 }} /><div style={{ height: 0.5, background: c || "#1a1a1a" }} /><div style={{ height: 2 }} /><div style={{ height: 1.5, background: c || "#1a1a1a" }} /></div>; }

// Bold lead paragraph — first sentence bolded
function leadBody(text, s) {
  if (!text) return null;
  var dot = text.indexOf(". ");
  if (dot > 0 && dot < 120) {
    return <span>
      <span style={{ fontWeight: 700, color: headColor(s) }}>{text.slice(0, dot + 1)}</span>
      {text.slice(dot + 1)}
    </span>;
  }
  return text;
}

// Torn edge clip path
var tornClip = "polygon(0 0, 3% 1.2%, 7% 0, 11% 1.5%, 15% 0.3%, 19% 1.8%, 23% 0, 27% 1%, 31% 0.5%, 35% 1.5%, 39% 0, 43% 1.2%, 47% 0.3%, 51% 1.5%, 55% 0, 59% 1.8%, 63% 0.5%, 67% 1%, 71% 0, 75% 1.5%, 79% 0.3%, 83% 1.2%, 87% 0, 91% 1.5%, 95% 0.5%, 100% 1%, 100% 97.5%, 97% 98.8%, 93% 97%, 89% 98.5%, 85% 97.3%, 81% 98.8%, 77% 97%, 73% 98%, 69% 97.5%, 65% 98.5%, 61% 97%, 57% 98.2%, 53% 97.3%, 49% 98.5%, 45% 97%, 41% 98.8%, 37% 97.5%, 33% 98%, 29% 97%, 25% 98.5%, 21% 97.3%, 17% 98.2%, 13% 97%, 9% 98.5%, 5% 97.5%, 0 98.5%)";

// Helpers
function getSplit(s) { return s && s.newsSplit || 45; }

// Smart column count — auto based on text length unless user overrides
function getCols(s, text) {
  if (s && s.columnCount) return s.columnCount;
  if (!text) return 1;
  var len = text.length;
  if (len < 150) return 1;
  if (len < 400) return 2;
  return 2;
}

// Auto body font size — shrinks when text is long to prevent overflow
function autoBodySize(s, baseSize) {
  var bs = baseSize || 8.5;
  var userAdj = s && s.bodySize || 0;
  var text = s && (s.body || s.leadParagraph || "");
  var len = text.length;
  if (len > 600) return bs - 1.5 + userAdj;
  if (len > 400) return bs - 0.5 + userAdj;
  return bs + userAdj;
}

// Inline stat block — newspaper-style call-out box (hideable + moveable)
function inlineStat(s) {
  if (!s || !s.stat || s.statHidden) return null;
  var statSize = 24 + (s.statSize || 0);
  var boxBg = s.statBoxBg || "#1a1a1a";
  var boxHidden = s.statBoxHidden;
  var captionText = s.statCaption || s.caption || s.statLabel;
  var beside = s.statLayout === "beside";
  // Beside layout: number in box + caption to the right
  if (beside && captionText) {
    return <div style={Object.assign({}, { margin: "4px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }, elT(s, "stat"))}>
      <div style={Object.assign({}, boxHidden ? {} : { background: boxBg, padding: "4px 12px" })}>
        <div style={{ ...MH, fontSize: statSize, color: s.statColor || "#c41e1e", lineHeight: 1 }}>{s.stat}</div>
      </div>
      <div style={{ ...CT, fontSize: 6.5 + (s.statCaptionSize || 0), color: "#1a1a1a99", lineHeight: 1.3, textAlign: "left", maxWidth: "55%" }}>{captionText}</div>
    </div>;
  }
  // Below layout (default): number in box, caption below unboxed
  return <div style={Object.assign({}, { margin: "4px 0", textAlign: "center" }, elT(s, "stat"))}>
    <div style={Object.assign({}, boxHidden ? { display: "inline-block" } : { background: boxBg, padding: "4px 14px", display: "inline-block" })}>
      <div style={{ ...MH, fontSize: statSize, color: s.statColor || "#c41e1e", lineHeight: 1 }}>{s.stat}</div>
    </div>
    {captionText && <div style={{ ...CT, fontSize: 6 + (s.statCaptionSize || 0), color: "#1a1a1a99", marginTop: 3, lineHeight: 1.3 }}>{captionText}</div>}
  </div>;
}

// Related story block — compact sidebar-style
function relatedBlock(s) {
  if (!s || !s.relatedBody) return null;
  return <div style={{ borderTop: "0.5px dashed #1a1a1a22", marginTop: 4, paddingTop: 3 }}>
    <div style={{ ...BR, fontSize: 5, letterSpacing: "0.1em", color: "#c41e1e", marginBottom: 2 }}>RELATED</div>
    <div style={{ ...CT, fontSize: 7, color: "#1a1a1a99", lineHeight: 1.45, textAlign: "justify" }}>{s.relatedBody}</div>
  </div>;
}

// Layout labels
export var NEWS_COVER_LABELS = ["Broadsheet", "Tabloid", "Modern Split", "Breaking Banner", "Full Bleed"];
export var NEWS_LAYOUT_LABELS = ["Standard", "Feature", "Sidebar", "Wire Report", "Torn Edge", "Center Wrap", "Split", "L-Shape", "Reverse L"];
export var NEWS_COVER_COUNT = 5;
export var NEWS_LAYOUT_COUNT = 9;

// ===== MASTHEAD =====
function Masthead({ slide, size }) {
  var isBreaking = slide.breaking;
  var isDev = slide.developing;
  var mSize = (size || 28) + (slide.mastheadSize || 0);
  return <>
    {tripleRule()}
    <div style={Object.assign({}, { padding: "6px 14px 4px", textAlign: "center", flexShrink: 0 }, elT(slide, "heading"))}>
      <div style={{ ...(FONT_MAP[slide.mastheadFont] || ER), fontSize: mSize, color: headColor(slide), letterSpacing: "0.03em", lineHeight: 1 }}>{slide.mastheadText || "NEWS DESK"}</div>
      <div style={{ ...CP, fontSize: 3.5, color: "#1a1a1a33", letterSpacing: "0.15em", marginTop: 2 }}>by LOATHR</div>
    </div>
    {editionBar(slide)}
    {isBreaking && <div style={{ background: "#c41e1e", padding: "5px 14px", textAlign: "center", flexShrink: 0 }}>
      <div style={{ ...BR, fontSize: 12, letterSpacing: "0.35em", color: "#ffffff", fontWeight: 700 }}>BREAKING NEWS</div>
    </div>}
    {isDev && <div style={{ background: "#e67e22", padding: "5px 14px", textAlign: "center", flexShrink: 0 }}>
      <div style={{ ...BR, fontSize: 12, letterSpacing: "0.35em", color: "#ffffff", fontWeight: 700 }}>DEVELOPING STORY</div>
    </div>}
    {(isBreaking || isDev) && doubleRule()}
  </>;
}

// ===== COVER 0: BROADSHEET (NY Times style) =====
function CoverBroadsheet({ slide, url, images }) {
  var sp = getSplit(slide);
  return (
    <div style={Object.assign({}, { width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }, newsBg(slide))}>
      <Masthead slide={slide} size={30} />
      <div style={{ flex: 1, padding: "4px 14px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={Object.assign({}, { ...headFont(slide), fontSize: (slide.title && slide.title.length > 40 ? 20 : 28) + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.05, marginBottom: 4 }, elT(slide, "heading"))}>{slide.title || ""}</div>
        {divider(slide, { w: 1, c: "#1a1a1a" })}
        {/* Hero photo — dominant like NY Times */}
        {url && <div style={{ width: "100%", height: sp + "%", overflow: "hidden", border: "0.5px solid #1a1a1a22", marginBottom: 2, flexShrink: 0 }}>
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
        </div>}
        {url && caption(slide)}
        {/* Dense text below photo */}
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: autoBodySize(slide, 8), color: bodyColor(slide), lineHeight: 1.5, textAlign: "justify", columnCount: getCols(slide, (slide.leadParagraph || "") + (slide.body || "")), columnGap: 10, columnRule: "0.25px solid #1a1a1a0d", flex: 1 }, elT(slide, "body"))}>
          {leadBody(slide.leadParagraph || slide.body, slide)}
          {slide.leadParagraph && slide.body && <span> {slide.body}</span>}
        </div>
      </div>
      {pageFooter(slide, 1)}
    </div>
  );
}

// ===== COVER 1: TABLOID (headline top + image-left text-right grid) =====
function CoverTabloid({ slide, url }) {
  var sp = getSplit(slide);
  return (
    <div style={Object.assign({}, { width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }, newsBg(slide))}>
      <Masthead slide={slide} size={32} />
      <div style={{ padding: "4px 14px", flexShrink: 0 }}>
        <div style={Object.assign({}, { ...headFont(slide), fontSize: (slide.title && slide.title.length > 30 ? 22 : 28) + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.02, marginBottom: 4 }, elT(slide, "heading"))}>{slide.title || ""}</div>
        {divider(slide, { w: 1, c: "#1a1a1a" })}
      </div>
      {/* Image left + text right grid */}
      <div style={{ flex: 1, padding: "0 14px", display: "grid", gridTemplateColumns: sp + "% 1fr", gap: 10, overflow: "hidden" }}>
        {url ? <div style={{ overflow: "hidden", border: "0.5px solid #1a1a1a22" }}>
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
        </div> : <div style={{ background: "#e8e3d4" }} />}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={Object.assign({}, { ...bodyFont(slide), fontSize: autoBodySize(slide, 8.5), color: bodyColor(slide), lineHeight: 1.5, textAlign: "justify", flex: 1, overflow: "hidden" }, elT(slide, "body"))}>
            {leadBody(slide.leadParagraph || slide.body, slide)}
            {slide.leadParagraph && slide.body && <span> {slide.body}</span>}
          </div>
          {url && caption(slide)}
        </div>
      </div>
      {pageFooter(slide, 1)}
    </div>
  );
}

// ===== COVER 2: MODERN SPLIT =====
function CoverModernSplit({ slide, url }) {
  var sp = getSplit(slide);
  return (
    <div style={Object.assign({}, { width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex" }, newsBg(slide))}>
      {url ? <div style={{ width: sp + "%", overflow: "hidden", borderRight: "2px solid #1a1a1a" }}>
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
      </div> : <div style={{ width: sp + "%", background: "#e8e3d4", borderRight: "2px solid #1a1a1a" }} />}
      <div style={{ width: (100 - sp) + "%", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "6px 10px", textAlign: "right", borderBottom: "1px solid #1a1a1a22" }}>
          <div style={{ ...(FONT_MAP[slide.mastheadFont] || ER), fontSize: 13 + (slide.mastheadSize || 0), color: "#1a1a1a", letterSpacing: "0.04em" }}>{slide.mastheadText || "NEWS DESK"}</div>
        </div>
        {editionBar(slide)}
        {slide.breaking && <div style={{ background: "#c41e1e", padding: "3px 8px", textAlign: "center" }}>
          <div style={{ ...BR, fontSize: 7, letterSpacing: "0.25em", color: "#ffffff" }}>BREAKING</div>
        </div>}
        <div style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={Object.assign({}, { ...headFont(slide), fontSize: 19 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.08, marginBottom: 6 }, elT(slide, "heading"))}>{slide.title || ""}</div>
          {divider(slide, { w: 2, c: "#c41e1e", m: "0 0 8px 0" })}
          {slide.leadParagraph && <div style={Object.assign({}, { ...bodyFont(slide), fontSize: autoBodySize(slide, 8), color: bodyColor(slide), lineHeight: 1.5, textAlign: "justify" }, elT(slide, "body"))}>{leadBody(slide.leadParagraph, slide)}</div>}
        </div>
        {pageFooter(slide, 1)}
      </div>
    </div>
  );
}

// ===== COVER 3: BREAKING BANNER =====
function CoverBreakingBanner({ slide, url }) {
  return (
    <div style={Object.assign({}, { width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }, newsBg(slide))}>
      {tripleRule()}
      <div style={{ padding: "4px 14px", textAlign: "center", flexShrink: 0 }}>
        <div style={{ ...(FONT_MAP[slide.mastheadFont] || ER), fontSize: 18 + (slide.mastheadSize || 0), color: "#1a1a1a", letterSpacing: "0.03em" }}>{slide.mastheadText || "NEWS DESK"}</div>
      </div>
      {doubleRule()}
      <div style={{ background: slide.breaking ? "#c41e1e" : "#1a1a1a", padding: "8px 14px", textAlign: "center", flexShrink: 0 }}>
        <div style={{ ...BR, fontSize: 18, letterSpacing: "0.35em", color: "#ffffff", fontWeight: 700 }}>{slide.breaking ? "BREAKING NEWS" : slide.developing ? "DEVELOPING" : "LATEST"}</div>
      </div>
      {doubleRule()}
      {editionBar(slide)}
      <div style={{ flex: 1, padding: "4px 14px", display: "flex", flexDirection: "column" }}>
        <div style={Object.assign({}, { ...headFont(slide), fontSize: (slide.title && slide.title.length > 35 ? 18 : 24) + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.05, marginBottom: 4, textAlign: "center" }, elT(slide, "heading"))}>{slide.title || ""}</div>
        {headRule(slide)}
        {url && <div style={{ width: "100%", maxHeight: "30%", overflow: "hidden", border: "0.5px solid #1a1a1a22", marginBottom: 3, flexShrink: 0 }}>
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
        </div>}
        {url && caption(slide)}
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: autoBodySize(slide, 8), color: bodyColor(slide), lineHeight: 1.5, textAlign: "justify", columnCount: getCols(slide, slide.leadParagraph), columnGap: 10, columnRule: getCols(slide, slide.leadParagraph) > 1 ? "0.25px solid #1a1a1a0d" : "none", flex: 1, overflow: "hidden" }, elT(slide, "body"))}>

          {leadBody(slide.leadParagraph || slide.body, slide)}
          {slide.leadParagraph && slide.body && <span> {slide.body}</span>}
        </div>
      </div>
      {pageFooter(slide, 1)}
    </div>
  );
}

// ===== COVER 4: FULL BLEED (image background + text overlay) =====
function CoverFullBleed({ slide, url }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#1a1a1a" }}>
      {url && <img src={url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: imgF(slide) }} onError={function(e) { e.target.style.display = "none"; }} />}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.7) 65%, rgba(0,0,0,0.92))" }} />
      {/* Top: masthead + date */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 2, padding: "8px 14px 0", textAlign: "center" }}>
        <div style={{ ...(FONT_MAP[slide.mastheadFont] || ER), fontSize: 16 + (slide.mastheadSize || 0), color: "#ffffffcc", letterSpacing: "0.03em" }}>{slide.mastheadText || "NEWS DESK"}</div>
        <div style={{ ...CP, fontSize: 3, color: "#ffffff44", letterSpacing: "0.12em", marginTop: 1 }}>by LOATHR</div>
      </div>
      {/* Breaking banner */}
      {slide.breaking && <div style={{ position: "absolute", top: 36, left: 0, right: 0, background: "#c41e1e", padding: "3px 14px", textAlign: "center", zIndex: 2 }}>
        <div style={{ ...BR, fontSize: 8, letterSpacing: "0.25em", color: "#ffffff" }}>BREAKING NEWS</div>
      </div>}
      {/* Bottom: headline + lead */}
      <div style={{ position: "absolute", bottom: 20, left: 14, right: 14, zIndex: 3 }}>
        <div style={Object.assign({}, { ...headFont(slide), fontSize: (slide.title && slide.title.length > 40 ? 20 : 28) + (slide.headingSize || 0), color: slide.headingColor || "#ffffff", lineHeight: 1.08, marginBottom: 6, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }, elT(slide, "heading"))}>{slide.title || ""}</div>
        {divider(slide, { w: 2, c: "#c41e1e", m: "0 0 6px 0" })}
        {slide.leadParagraph && <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8 + (slide.bodySize || 0), color: slide.bodyColor || "#ffffffcc", lineHeight: 1.5, textShadow: "0 1px 6px rgba(0,0,0,0.6)" }, elT(slide, "body"))}>{leadBody(slide.leadParagraph, slide)}</div>}
        {editionBar(Object.assign({}, slide, { editionBarColor: "#ffffff66" }))}
      </div>
    </div>
  );
}

// ===== COVER ROUTER =====
var COVERS = [CoverBroadsheet, CoverTabloid, CoverModernSplit, CoverBreakingBanner, CoverFullBleed];
export function NewsFrontPage({ slide, images, index }) {
  var url = images && images[0] ? images[0].url : null;
  var li = typeof slide.newsCoverLayout === "number" ? slide.newsCoverLayout : 0;
  var L = COVERS[li] || CoverBroadsheet;
  return <L slide={slide} url={url} images={images} />;
}

// ===== ROLE LABEL =====
function roleLabel(s) {
  // Hide role label if heading matches role (Claude echoed the role as heading)
  var role = s.role || "";
  var heading = s.heading || "";
  if (role && heading && heading.toLowerCase().replace(/[^a-z]/g, "").indexOf(role.toLowerCase().replace(/[^a-z]/g, "")) === 0) return null;
  if (!role) return null;
  return <div style={Object.assign({}, { ...BR, fontSize: 5, letterSpacing: "0.12em", color: "#c41e1e", marginBottom: 2 }, elT(s, "sources"))}>{role}</div>;
}

// ===== CONTENT 0: STANDARD (image block + dense columns) =====
function LayoutStandard({ slide, url }) {
  var cols = getCols(slide, slide.body);
  var sp = getSplit(slide);
  return (
    <div style={Object.assign({}, { width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }, newsBg(slide))}>
      {doubleRule()}
      {editionBar(slide)}
      <div style={{ padding: "4px 14px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {roleLabel(slide)}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 16 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.1, marginBottom: 4 }, elT(slide, "heading"))}>{slide.heading || ""}</div>
        {headRule(slide)}
        {/* Image — prominent block, not tiny float */}
        {url && <div style={{ width: "100%", height: sp + "%", maxHeight: "40%", overflow: "hidden", border: "0.5px solid #1a1a1a22", marginBottom: 3, flexShrink: 0 }}>
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
        </div>}
        {url && caption(slide)}
        {/* Body text fills remaining space */}
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: autoBodySize(slide, 8.5), color: bodyColor(slide), lineHeight: 1.55, textAlign: "justify", columnCount: cols, columnGap: 10, columnRule: cols > 1 ? "0.25px solid #1a1a1a0d" : "none", flex: 1, overflow: "hidden" }, elT(slide, "body"))}>
          {leadBody(slide.body, slide)}
        </div>
        {inlineStat(slide)}
        {styledHighlight(slide.highlight, slide, { fg: "#1a1a1a", accent: "#c41e1e", pillText: "#ffffff", defaultStyle: "bar" })}
        {relatedBlock(slide)}
      </div>
      {srcLine(slide.sources, slide)}
      {pageFooter(slide)}
    </div>
  );
}

// ===== CONTENT 1: FEATURE (large photo top) =====
function LayoutFeature({ slide, url }) {
  var sp = getSplit(slide);
  var cols = getCols(slide, slide.body);
  return (
    <div style={Object.assign({}, { width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }, newsBg(slide))}>
      {url && <div style={{ maxHeight: "35%", overflow: "hidden", flexShrink: 0, borderBottom: "2px solid #1a1a1a" }}>
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>}
      {url && <div style={{ padding: "0 14px" }}>{caption(slide)}</div>}
      <div style={{ padding: "4px 14px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
        {roleLabel(slide)}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 16 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.1, marginBottom: 4, flexShrink: 0 }, elT(slide, "heading"))}>{slide.heading || ""}</div>
        {divider(slide, { w: 1.5, c: "#c41e1e", m: "0 0 4px 0" })}
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: autoBodySize(slide, 8), color: bodyColor(slide), lineHeight: 1.5, textAlign: "justify", columnCount: cols, columnGap: 10, columnRule: cols > 1 ? "0.25px solid #1a1a1a0d" : "none", flex: 1, overflow: "hidden" }, elT(slide, "body"))}>{leadBody(slide.body, slide)}</div>
        {inlineStat(slide)}
        {styledHighlight(slide.highlight, slide, { fg: "#1a1a1a", accent: "#c41e1e", pillText: "#ffffff", defaultStyle: "bar" })}
        {relatedBlock(slide)}
      </div>
      {srcLine(slide.sources, slide)}
      {pageFooter(slide)}
    </div>
  );
}

// ===== CONTENT 2: SIDEBAR (dark call-out box right) =====
function LayoutSidebar({ slide, url }) {
  return (
    <div style={Object.assign({}, { width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex" }, newsBg(slide))}>
      {/* Main story */}
      <div style={{ width: "62%", display: "flex", flexDirection: "column", borderRight: "1px solid #1a1a1a22" }}>
        <div style={{ height: 2, background: "#1a1a1a", margin: "0 14px" }} />
        {editionBar(slide)}
        <div style={{ padding: "4px 12px 4px 14px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {roleLabel(slide)}
          <div style={Object.assign({}, { ...headFont(slide), fontSize: 14 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.12, marginBottom: 4 }, elT(slide, "heading"))}>{slide.heading || ""}</div>
          {headRule(slide)}
          <div style={Object.assign({}, { ...bodyFont(slide), fontSize: autoBodySize(slide, 8), color: bodyColor(slide), lineHeight: 1.5, textAlign: "justify", flex: 1 }, elT(slide, "body"))}>{leadBody(slide.body, slide)}</div>
          {srcLine(slide.sources, slide)}
        </div>
      </div>
      {/* Dark sidebar */}
      <div style={{ width: "38%", background: "#1a1a1a", display: "flex", flexDirection: "column", padding: "8px 10px" }}>
        {url && <div style={{ width: "100%", height: 90, overflow: "hidden", marginBottom: 6 }}>
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
        </div>}
        {slide.stat && <div style={{ textAlign: "center", marginBottom: 6 }}>
          <div style={{ ...MH, fontSize: 24, color: "#c41e1e", lineHeight: 0.9 }}>{slide.stat}</div>
          {(slide.statCaption || slide.caption) && <div style={{ ...CT, fontSize: 6, color: "#f5f0e4aa", marginTop: 3 }}>{slide.statCaption || slide.caption}</div>}
        </div>}
        {slide.highlight && <div style={{ ...GH, fontSize: 10 + (slide.highlightSize || 0), color: "#f5f0e4", lineHeight: 1.35, fontStyle: "italic", marginBottom: 6 }}>{"\u201C"}{slide.highlight}{"\u201D"}</div>}
        {dottedRule(slide)}
        {slide.relatedBody ? <div style={{ ...CT, fontSize: 7, color: "#f5f0e4aa", lineHeight: 1.45 }}>{slide.relatedBody}</div>
          : slide.body && <div style={{ ...CT, fontSize: 7, color: "#f5f0e4aa", lineHeight: 1.45 }}>{slide.body.split(". ").slice(-2).join(". ")}</div>}
      </div>
    </div>
  );
}

// ===== CONTENT 3: WIRE REPORT (dense, no image, 3 columns) =====
function LayoutWireReport({ slide }) {
  var cols = getCols(slide, slide.body) || 2;
  return (
    <div style={Object.assign({}, { width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }, newsBg(slide))}>
      {doubleRule()}
      {editionBar(slide)}
      <div style={{ padding: "6px 14px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {roleLabel(slide)}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 20 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.05, marginBottom: 4 }, elT(slide, "heading"))}>{slide.heading || ""}</div>
        <div style={{ height: 1.5, background: "#1a1a1a", marginBottom: 6 }} />
        {/* Dark call-out box */}
        {slide.highlight && <div style={{ background: "#1a1a1a", padding: "5px 8px", marginBottom: 6 }}>
          <div style={{ ...BR, fontSize: 7, letterSpacing: "0.1em", color: "#f5f0e4", fontWeight: 700 }}>{slide.highlight}</div>
        </div>}
        {inlineStat(slide)}
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: autoBodySize(slide, 8.5), color: bodyColor(slide), lineHeight: 1.55, textAlign: "justify", columnCount: cols, columnGap: 8, columnRule: "0.5px solid #1a1a1a22", flex: 1 }, elT(slide, "body"))}>{leadBody(slide.body, slide)}</div>
        {relatedBlock(slide)}
      </div>
      {srcLine(slide.sources, slide)}
      {pageFooter(slide)}
    </div>
  );
}

// ===== CONTENT 4: TORN EDGE =====
function LayoutTornEdge({ slide, url }) {
  return (
    <div style={Object.assign({}, { width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }, newsBg(slide))}>
      {doubleRule()}
      {editionBar(slide)}
      {url && <div style={{ height: "38%", overflow: "hidden", flexShrink: 0, position: "relative", margin: "0 14px" }}>
        <img src={url} alt="" style={{ width: "100%", height: "115%", objectFit: "cover", filter: imgF(slide), clipPath: tornClip }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>}
      <div style={{ padding: "4px 14px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {roleLabel(slide)}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 16 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.1, marginBottom: 4 }, elT(slide, "heading"))}>{slide.heading || ""}</div>
        {headRule(slide)}
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: autoBodySize(slide, 8.5), color: bodyColor(slide), lineHeight: 1.55, textAlign: "justify", columnCount: getCols(slide, slide.body), columnGap: 10, columnRule: getCols(slide, slide.body) > 1 ? "0.25px solid #1a1a1a0d" : "none", flex: 1 }, elT(slide, "body"))}>{leadBody(slide.body, slide)}</div>
        {inlineStat(slide)}
        {styledHighlight(slide.highlight, slide, { fg: "#1a1a1a", accent: "#c41e1e", pillText: "#ffffff", defaultStyle: "bar" })}
        {relatedBlock(slide)}
      </div>
      {srcLine(slide.sources, slide)}
      {pageFooter(slide)}
    </div>
  );

}

// Smart text splitter — splits by word count for visual balance
function splitText(text, ratio) {
  if (!text) return ["", ""];
  var words = text.split(/\s+/);
  var splitIdx = Math.floor(words.length * (ratio || 0.55));
  // Find sentence boundary near the split point
  var joined = words.slice(0, splitIdx).join(" ");
  var lastDot = joined.lastIndexOf(". ");
  if (lastDot > joined.length * 0.3) {
    return [joined.slice(0, lastDot + 1).trim(), text.slice(lastDot + 2).trim()];
  }
  return [joined.trim(), words.slice(splitIdx).join(" ").trim()];
}

// ===== CONTENT 5: CENTER WRAP (3-col grid: text | image | text) =====
function LayoutCenterWrap({ slide, url }) {
  var parts = splitText(slide.body, 0.55);
  var leftText = parts[0];
  var rightText = parts[1];
  var bs = autoBodySize(slide, 8);
  return (
    <div style={Object.assign({}, { width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }, newsBg(slide))}>
      {doubleRule()}
      {editionBar(slide)}
      <div style={{ padding: "4px 14px", flexShrink: 0 }}>
        {roleLabel(slide)}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 16 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.1, marginBottom: 4 }, elT(slide, "heading"))}>{slide.heading || ""}</div>
        {headRule(slide)}
      </div>
      <div style={{ flex: 1, padding: "0 14px", display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, overflow: "hidden" }}>
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: bs, color: bodyColor(slide), lineHeight: 1.55, textAlign: "justify", overflow: "hidden" }, elT(slide, "body"))}>{leadBody(leftText, slide)}</div>
        {url ? <div style={{ width: 120, overflow: "hidden", border: "0.5px solid #1a1a1a22", alignSelf: "start" }}>
          <img src={url} alt="" style={{ width: "100%", height: "auto", maxHeight: 200, objectFit: "cover", filter: imgF(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
          <div style={{ padding: "1px 2px" }}>{caption(slide)}</div>
        </div> : <div style={{ width: 1, background: "#1a1a1a22" }} />}
        <div style={{ ...bodyFont(slide), fontSize: bs, color: bodyColor(slide), lineHeight: 1.55, textAlign: "justify", overflow: "hidden" }}>{rightText}</div>
      </div>
      <div style={{ padding: "2px 14px" }}>
        {inlineStat(slide)}
        {styledHighlight(slide.highlight, slide, { fg: "#1a1a1a", accent: "#c41e1e", pillText: "#ffffff", defaultStyle: "bar" })}
        {relatedBlock(slide)}
      </div>
      {srcLine(slide.sources, slide)}
      {pageFooter(slide)}
    </div>
  );
}

// ===== CONTENT 6: SPLIT (image left, text right — side by side) =====
function LayoutSplit({ slide, url }) {
  var sp = getSplit(slide);
  var cols = getCols(slide, slide.body);
  return (
    <div style={Object.assign({}, { width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex" }, newsBg(slide))}>
      {url ? <div style={{ width: sp + "%", overflow: "hidden", borderRight: "1px solid #1a1a1a22", flexShrink: 0 }}>
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
      </div> : <div style={{ width: sp + "%", background: "#e8e3d4", borderRight: "1px solid #1a1a1a22" }} />}
      <div style={{ width: (100 - sp) + "%", display: "flex", flexDirection: "column" }}>
        {doubleRule()}
        {editionBar(slide)}
        <div style={{ padding: "4px 10px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {roleLabel(slide)}
          <div style={Object.assign({}, { ...headFont(slide), fontSize: 14 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.1, marginBottom: 4 }, elT(slide, "heading"))}>{slide.heading || ""}</div>
          {headRule(slide)}
          <div style={Object.assign({}, { ...bodyFont(slide), fontSize: autoBodySize(slide, 8), color: bodyColor(slide), lineHeight: 1.5, textAlign: "justify", flex: 1, overflow: "hidden" }, elT(slide, "body"))}>{leadBody(slide.body, slide)}</div>
          {inlineStat(slide)}
          {styledHighlight(slide.highlight, slide, { fg: "#1a1a1a", accent: "#c41e1e", pillText: "#ffffff", defaultStyle: "bar" })}
          {relatedBlock(slide)}
        </div>
        {srcLine(slide.sources, slide)}
        {pageFooter(slide)}
      </div>
    </div>
  );
}

// ===== CONTENT 7: L-SHAPE (image top-left + text right + text below full width) =====
function LayoutLShape({ slide, url }) {
  var sp = getSplit(slide);
  var bs = autoBodySize(slide, 8);
  var parts = splitText(slide.body, 0.4);
  var topText = parts[0];
  var bottomText = parts[1];
  return (
    <div style={Object.assign({}, { width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }, newsBg(slide))}>
      {doubleRule()}
      {editionBar(slide)}
      <div style={{ padding: "4px 14px", flexShrink: 0 }}>
        {roleLabel(slide)}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 16 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.1, marginBottom: 4 }, elT(slide, "heading"))}>{slide.heading || ""}</div>
        {headRule(slide)}
      </div>
      {/* Top section: image left + text right */}
      <div style={{ display: "grid", gridTemplateColumns: sp + "% 1fr", gap: 8, padding: "0 14px", marginBottom: 4 }}>
        {url ? <div style={{ overflow: "hidden", border: "0.5px solid #1a1a1a22", maxHeight: 180 }}>
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
        </div> : <div style={{ background: "#e8e3d4", minHeight: 100 }} />}
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: bs, color: bodyColor(slide), lineHeight: 1.5, textAlign: "justify", overflow: "hidden" }, elT(slide, "body"))}>{leadBody(topText, slide)}</div>
      </div>
      {/* Bottom section: full width text */}
      <div style={{ padding: "0 14px", flex: 1, overflow: "hidden" }}>
        <div style={{ ...bodyFont(slide), fontSize: bs, color: bodyColor(slide), lineHeight: 1.5, textAlign: "justify", columnCount: getCols(slide, bottomText), columnGap: 10, columnRule: getCols(slide, bottomText) > 1 ? "0.25px solid #1a1a1a0d" : "none" }}>{bottomText}</div>
        {inlineStat(slide)}
        {styledHighlight(slide.highlight, slide, { fg: "#1a1a1a", accent: "#c41e1e", pillText: "#ffffff", defaultStyle: "bar" })}
        {relatedBlock(slide)}
      </div>
      {srcLine(slide.sources, slide)}
      {pageFooter(slide)}
    </div>
  );
}

// ===== CONTENT 8: REVERSE L-SHAPE (image top-right + text left + text below) =====
function LayoutReverseLShape({ slide, url }) {
  var sp = getSplit(slide);
  var bs = autoBodySize(slide, 8);
  var parts = splitText(slide.body, 0.4);
  var topText = parts[0];
  var bottomText = parts[1];
  return (
    <div style={Object.assign({}, { width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }, newsBg(slide))}>
      {doubleRule()}
      {editionBar(slide)}
      <div style={{ padding: "4px 14px", flexShrink: 0 }}>
        {roleLabel(slide)}
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 16 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.1, marginBottom: 4 }, elT(slide, "heading"))}>{slide.heading || ""}</div>
        {headRule(slide)}
      </div>
      {/* Top section: text left + image right */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr " + sp + "%", gap: 8, padding: "0 14px", marginBottom: 4 }}>
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: bs, color: bodyColor(slide), lineHeight: 1.5, textAlign: "justify", overflow: "hidden" }, elT(slide, "body"))}>{leadBody(topText, slide)}</div>
        {url ? <div style={{ overflow: "hidden", border: "0.5px solid #1a1a1a22", maxHeight: 180 }}>
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
        </div> : <div style={{ background: "#e8e3d4", minHeight: 100 }} />}
      </div>
      {/* Bottom section: full width text */}
      <div style={{ padding: "0 14px", flex: 1, overflow: "hidden" }}>
        <div style={{ ...bodyFont(slide), fontSize: bs, color: bodyColor(slide), lineHeight: 1.5, textAlign: "justify", columnCount: getCols(slide, bottomText), columnGap: 10, columnRule: getCols(slide, bottomText) > 1 ? "0.25px solid #1a1a1a0d" : "none" }}>{bottomText}</div>
        {inlineStat(slide)}
        {styledHighlight(slide.highlight, slide, { fg: "#1a1a1a", accent: "#c41e1e", pillText: "#ffffff", defaultStyle: "bar" })}
        {relatedBlock(slide)}
      </div>
      {srcLine(slide.sources, slide)}
      {pageFooter(slide)}
    </div>
  );
}

// ===== CONTENT ROUTER =====
var LAYOUTS = [LayoutStandard, LayoutFeature, LayoutSidebar, LayoutWireReport, LayoutTornEdge, LayoutCenterWrap, LayoutSplit, LayoutLShape, LayoutReverseLShape];
export function NewsStory({ slide, images, index }) {
  var url = images && images[index] ? images[index].url : null;
  var li = typeof slide.newsLayout === "number" ? slide.newsLayout : ((index - 1) % LAYOUTS.length);
  var L = LAYOUTS[li] || LayoutStandard;
  return <L slide={slide} url={url} />;
}

// ===== REACTION (quote top + circle floated in auto-balanced columns) =====
export function NewsReaction({ slide, images, index }) {
  var url = images && images[index] ? images[index].url : null;
  var bs = autoBodySize(slide, 8);
  var cols = getCols(slide, slide.body);
  return (
    <div style={Object.assign({}, { width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }, newsBg(slide))}>
      {doubleRule()}
      {editionBar(slide)}
      <div style={{ padding: "4px 14px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
        <div>
          {roleLabel(slide)}
          <div style={Object.assign({}, { ...headFont(slide), fontSize: 14 + (slide.headingSize || 0), color: headColor(slide), lineHeight: 1.12, marginBottom: 4 }, elT(slide, "heading"))}>{slide.heading || ""}</div>
          {/* Quote block */}
          <div style={{ padding: "4px 0", borderTop: "0.5px dotted #1a1a1a22", borderBottom: "0.5px dotted #1a1a1a22", marginBottom: 3 }}>
            {slide.quote && <div style={{ ...hlFont(slide), fontSize: 10 + (slide.highlightSize || 0), color: "#1a1a1a", lineHeight: 1.35, fontStyle: "italic", textAlign: "center" }}>{"\u201C"}{slide.quote}{"\u201D"}</div>}
            <div style={{ ...CP, fontSize: 6, color: "#1a1a1a88", marginTop: 2, textAlign: "center" }}>{"\u2014"} {slide.source || slide.person || ""}</div>
          </div>
          {/* Body with circle floated right */}
          <div style={Object.assign({}, { ...bodyFont(slide), fontSize: bs, color: bodyColor(slide), lineHeight: 1.5, textAlign: "justify", columnCount: cols, columnGap: 10, columnRule: cols > 1 ? "0.25px solid #1a1a1a0d" : "none" }, elT(slide, "body"))}>
            {url && <div style={{ float: "right", width: 55, margin: "0 0 6px 8px", shapeOutside: "circle(50%)" }}>
              <div style={{ width: 55, height: 55, borderRadius: "50%", overflow: "hidden", border: "1.5px solid #1a1a1a22" }}>
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgF(slide) }} onError={function(e) { e.target.style.display = "none"; }} />
              </div>
            </div>}
            {leadBody(slide.body, slide)}
          </div>
          {inlineStat(slide)}
        </div>
        {/* Related pushed to bottom */}
        {relatedBlock(slide)}
      </div>
      {srcLine(slide.sources, slide)}
      {pageFooter(slide)}
    </div>
  );
}

// ===== SOURCES CLOSER (classified-style) =====
export function NewsSourcesCloser({ slide }) {
  var sources = slide.fullSources || [];
  return (
    <div style={Object.assign({}, { width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }, newsBg(slide))}>
      <div style={{ padding: "6px 14px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ ...BR, fontSize: 8, letterSpacing: "0.12em", color: "#c41e1e", marginBottom: 3, textAlign: "center" }}>SOURCES & REFERENCES</div>
        {doubleRule()}
        <div style={{ columnCount: sources.length > 3 ? 3 : sources.length > 1 ? 2 : 1, columnGap: 8, columnRule: "0.5px solid #1a1a1a22", margin: "6px 0" }}>
          {sources.length > 0 ? sources.map(function(src, i) {
            return <div key={i} style={{ marginBottom: 4, breakInside: "avoid", borderBottom: "0.25px solid #1a1a1a0d", paddingBottom: 3 }}>
              <div style={{ ...CT, fontSize: 6, color: "#1a1a1a", fontWeight: 700, lineHeight: 1.3 }}>{src.publication || "Source"}</div>
              <div style={{ ...CT, fontSize: 5.5, color: "#1a1a1a88", lineHeight: 1.3 }}>{src.title || ""}</div>
              {src.date && <div style={{ ...CP, fontSize: 3.5, color: "#1a1a1a55" }}>{src.date}</div>}
            </div>;
          }) : <div style={{ ...CT, fontSize: 7, color: "#1a1a1a66" }}>Sources available upon request.</div>}
        </div>
        {slide.developingNote && <div style={{ marginTop: 4, padding: "3px 6px", background: "#e67e2215", border: "0.5px solid #e67e2233" }}>
          <div style={{ ...CP, fontSize: 5, color: "#e67e22", fontStyle: "italic" }}>{slide.developingNote}</div>
        </div>}
        {tripleRule("#1a1a1a33")}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <div style={{ ...(FONT_MAP[slide.mastheadFont] || ER), fontSize: 18, color: "#1a1a1a", letterSpacing: "0.03em" }}>{slide.mastheadText || "NEWS DESK"}</div>
          <div style={{ ...CP, fontSize: 4.5, color: "#1a1a1a55", marginTop: 3 }}>Reporting. Context. Perspective.</div>
          {slide.hashtags && <div style={{ ...CP, fontSize: 5, color: "#c41e1e66", marginTop: 6, lineHeight: 1.5 }}>{slide.hashtags}</div>}
        </div>
      </div>
      {pageFooter(slide)}
    </div>
  );
}

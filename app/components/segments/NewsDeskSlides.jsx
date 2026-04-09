"use client";
// News Desk — newspaper column format, larger readable text

import { styledHighlight } from "./EnterpriseSlides";

var CP = { fontFamily: "'Courier Prime',monospace" };
var FN = { fontFamily: "'Foun',Georgia,serif" };
var HD = { fontFamily: "'Maheni',Georgia,serif", fontStyle: "normal" };
var WS = { fontFamily: "'Wenssep',Georgia,serif", textTransform: "uppercase" };
var FONT_MAP = { maheni: HD, foun: FN, courier: CP, wenssep: WS };
function bodyFont(slide) { return FONT_MAP[slide && slide.bodyFont] || HD; }
function headFont(slide) { return FONT_MAP[slide && slide.headingFont] || FN; }
function hlFont(slide) { return FONT_MAP[slide && slide.highlightFont] || HD; }

// Front Page
export function NewsFrontPage({ slide, images, index }) {
  var url = images && images[0] ? images[0].url : null;
  var isBreaking = slide.breaking;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "6px 14px 4px", borderBottom: "2.5px solid #1a1a1a", textAlign: "center", flexShrink: 0 }}>
        <div style={{ ...FN, fontSize: 16, color: "#1a1a1a", letterSpacing: "0.08em", lineHeight: 1 }}>LOATHR NEWS DESK</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
          <div style={{ ...CP, fontSize: 4, color: "#1a1a1a66" }}>{slide.subtitle || ""}</div>
          <div style={{ ...CP, fontSize: 4, color: "#1a1a1a66" }}>Est. 2026</div>
        </div>
      </div>
      {isBreaking && <div style={{ background: "#c41e1e", padding: "3px 14px", textAlign: "center", flexShrink: 0 }}>
        <div style={{ ...CP, fontSize: 7, letterSpacing: "0.3em", color: "#ffffff", fontWeight: 700 }}>BREAKING NEWS</div>
      </div>}
      {slide.developing && <div style={{ background: "#e67e22", padding: "3px 14px", textAlign: "center", flexShrink: 0 }}>
        <div style={{ ...CP, fontSize: 7, letterSpacing: "0.3em", color: "#ffffff", fontWeight: 700 }}>DEVELOPING STORY</div>
      </div>}
      {slide.timestamp && <div style={{ textAlign: "center", padding: "2px 14px", flexShrink: 0 }}>
        <div style={{ ...CP, fontSize: 3.5, color: "#1a1a1a55" }}>Generated: {slide.timestamp}</div>
      </div>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 14px" }}>
        <div style={Object.assign({}, { ...headFont(slide), fontSize: (slide.title && slide.title.length > 40 ? 18 : 24) + (slide.headingSize || 0), color: slide.headingColor || "#1a1a1a", lineHeight: 1.1, marginBottom: 6 }, slide.headingAlign ? { textAlign: slide.headingAlign } : {})}>{slide.title || ""}</div>
        <div style={{ height: 1, background: "#1a1a1a33", marginBottom: 6 }} />
        <div style={{ display: "flex", gap: 8, flex: 1 }}>
          {url && <div style={{ width: "45%", flexShrink: 0 }}>
            <div style={{ width: "100%", height: 130, overflow: "hidden", border: "0.5px solid #1a1a1a22" }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.7) contrast(1.05)" }} onError={function(e) { e.target.style.display = "none"; }} />
            </div>
            <div style={{ ...CP, fontSize: 3.5, color: "#1a1a1a44", marginTop: 1 }}>Photo: Wire Services</div>
          </div>}
          <div style={{ flex: 1 }}>
            {slide.leadParagraph && <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9 + (slide.bodySize || 0), color: slide.bodyColor || "#1a1a1a", lineHeight: 1.55 }, slide.bodyAlign ? { textAlign: slide.bodyAlign } : {})}>{slide.leadParagraph}</div>}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 4, left: 8, ...CP, fontSize: 4, letterSpacing: "0.1em", color: "#1a1a1a33" }}>LOATHR</div>
    </div>
  );
}

// Story — newspaper columns with image in designated box
export function NewsStory({ slide, images, index }) {
  var url = images && images[index] ? images[index].url : null;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 2, background: "#1a1a1a", margin: "0 14px" }} />
      <div style={{ padding: "8px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ ...CP, fontSize: 6, letterSpacing: "0.2em", color: "#c41e1e", marginBottom: 4, textTransform: "uppercase" }}>{slide.role || ""}</div>
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 15 + (slide.headingSize || 0), color: slide.headingColor || "#1a1a1a", lineHeight: 1.15, marginBottom: 6 }, slide.headingAlign ? { textAlign: slide.headingAlign } : {})}>{slide.heading || ""}</div>
        <div style={{ height: 0.5, background: "#1a1a1a22", marginBottom: 6 }} />
        {url && <div style={{ width: "100%", height: 95, overflow: "hidden", border: "0.5px solid #1a1a1a22", marginBottom: 5 }}>
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.7)" }} onError={function(e) { e.target.style.display = "none"; }} />
        </div>}
        <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9 + (slide.bodySize || 0), color: slide.bodyColor || "#1a1a1a", lineHeight: 1.55, columnCount: 2, columnGap: 10, columnRule: "0.5px solid #1a1a1a11", flex: 1 }, slide.bodyAlign ? { textAlign: slide.bodyAlign } : {})}>{slide.body || ""}</div>
        {styledHighlight(slide.highlight, slide, { fg: "#1a1a1a", accent: "#c41e1e", pillText: "#ffffff", defaultStyle: "bar" })}
      </div>
      {slide.sources && <div style={{ padding: "0 14px 4px", ...CP, fontSize: 4, color: "#1a1a1a44", textAlign: "right" }}>{slide.sources}</div>}
      <div style={{ position: "absolute", bottom: 4, left: 8, ...CP, fontSize: 4, letterSpacing: "0.1em", color: "#1a1a1a33" }}>LOATHR</div>
    </div>
  );
}

// Reaction — quote focused
export function NewsReaction({ slide, images, index }) {
  var url = images && images[index] ? images[index].url : null;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 2, background: "#1a1a1a", margin: "0 14px" }} />
      <div style={{ padding: "8px 14px", flex: 1 }}>
        <div style={{ ...CP, fontSize: 6, letterSpacing: "0.2em", color: "#c41e1e", marginBottom: 4 }}>THE REACTION</div>
        <div style={Object.assign({}, { ...headFont(slide), fontSize: 14 + (slide.headingSize || 0), color: slide.headingColor || "#1a1a1a", lineHeight: 1.15, marginBottom: 10 }, slide.headingAlign ? { textAlign: slide.headingAlign } : {})}>{slide.heading || ""}</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          {url && <div style={{ width: 55, height: 55, borderRadius: "50%", overflow: "hidden", border: "1px solid #1a1a1a22", flexShrink: 0 }}>
            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.7)" }} onError={function(e) { e.target.style.display = "none"; }} />
          </div>}
          <div style={{ flex: 1 }}>
            {slide.quote && <div style={{ ...hlFont(slide), fontSize: 11 + (slide.highlightSize || 0), color: "#1a1a1a", lineHeight: 1.4, fontStyle: "italic" }}>{"\u201C"}{slide.quote}{"\u201D"}</div>}
            <div style={{ ...CP, fontSize: 6, color: "#1a1a1a88", marginTop: 3 }}>— {slide.source || slide.person || ""}</div>
          </div>
        </div>
        <div style={{ height: 0.5, background: "#1a1a1a22" }} />
        {slide.body && <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8.5 + (slide.bodySize || 0), color: slide.bodyColor || "#1a1a1a", lineHeight: 1.5, marginTop: 6, columnCount: 2, columnGap: 10, columnRule: "0.5px solid #1a1a1a11" }, slide.bodyAlign ? { textAlign: slide.bodyAlign } : {})}>{slide.body}</div>}
      </div>
      {slide.sources && <div style={{ padding: "0 14px 4px", ...CP, fontSize: 4, color: "#1a1a1a44", textAlign: "right" }}>{slide.sources}</div>}
      <div style={{ position: "absolute", bottom: 4, left: 8, ...CP, fontSize: 4, letterSpacing: "0.1em", color: "#1a1a1a33" }}>LOATHR</div>
    </div>
  );
}

// Sources closer
export function NewsSourcesCloser({ slide }) {
  var sources = slide.fullSources || [];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 2, background: "#1a1a1a", margin: "0 14px" }} />
      <div style={{ padding: "8px 14px", flex: 1 }}>
        <div style={{ ...CP, fontSize: 6, letterSpacing: "0.2em", color: "#c41e1e", marginBottom: 6 }}>SOURCES</div>
        <div style={{ columnCount: 2, columnGap: 12, columnRule: "0.5px solid #1a1a1a11" }}>
          {sources.length > 0 ? sources.map(function(src, i) {
            return <div key={i} style={{ marginBottom: 6, breakInside: "avoid" }}>
              <div style={{ ...HD, fontSize: 7, color: "#1a1a1a", fontWeight: 700 }}>{src.publication || "Source"}</div>
              <div style={{ ...HD, fontSize: 6.5, color: "#1a1a1a88" }}>{src.title || ""}</div>
              {src.date && <div style={{ ...CP, fontSize: 4, color: "#1a1a1a55" }}>{src.date}</div>}
            </div>;
          }) : <div style={{ ...HD, fontSize: 7, color: "#1a1a1a66" }}>Sources available upon request.</div>}
        </div>
        {slide.developingNote && <div style={{ marginTop: 6, padding: "4px 6px", background: "#e67e2215", border: "0.5px solid #e67e2233" }}>
          <div style={{ ...CP, fontSize: 5, color: "#e67e22", fontStyle: "italic" }}>{slide.developingNote}</div>
        </div>}
        <div style={{ height: 1, background: "#1a1a1a22", marginTop: 8, marginBottom: 8 }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ ...FN, fontSize: 11, color: "#1a1a1a", letterSpacing: "0.08em" }}>LOATHR NEWS DESK</div>
          <div style={{ ...CP, fontSize: 4, color: "#1a1a1a55", marginTop: 2 }}>Reporting. Context. Perspective.</div>
          {slide.hashtags && <div style={{ ...CP, fontSize: 5, color: "#c41e1e66", marginTop: 4 }}>{slide.hashtags}</div>}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 4, left: 8, ...CP, fontSize: 4, letterSpacing: "0.1em", color: "#1a1a1a33" }}>LOATHR</div>
    </div>
  );
}

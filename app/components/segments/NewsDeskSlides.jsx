"use client";
// News Desk slide components — newspaper template design

var CP = { fontFamily: "'Courier Prime',monospace" };
var FN = { fontFamily: "'Foun',Georgia,serif" };
var HD = { fontFamily: "'Maheni',Georgia,serif", fontStyle: "normal" };
var WS = { fontFamily: "'Wenssep',Georgia,serif", textTransform: "uppercase" };

// Front Page — newspaper masthead + headline
export function NewsFrontPage({ slide, images, index }) {
  var url = images && images[0] ? images[0].url : null;
  var isBreaking = slide.breaking;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4" }}>
      {/* Newspaper masthead */}
      <div style={{ padding: "8px 16px 6px", borderBottom: "2px solid #1a1a1a", textAlign: "center" }}>
        <div style={{ ...CP, fontSize: 5, letterSpacing: "0.15em", color: "#1a1a1a88" }}>THE</div>
        <div style={{ ...FN, fontSize: 16, color: "#1a1a1a", letterSpacing: "0.1em", lineHeight: 1 }}>LOATHR NEWS DESK</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 3 }}>
          <div style={{ ...CP, fontSize: 4, color: "#1a1a1a88" }}>{slide.subtitle || ""}</div>
          <div style={{ ...CP, fontSize: 4, color: "#1a1a1a88" }}>Est. 2026</div>
        </div>
      </div>
      {/* Breaking banner */}
      {isBreaking && <div style={{ background: "#c41e1e", padding: "3px 16px", textAlign: "center" }}>
        <div style={{ ...CP, fontSize: 7, letterSpacing: "0.3em", color: "#ffffff", fontWeight: 700 }}>BREAKING NEWS</div>
      </div>}
      {/* Hero image */}
      {url && <div style={{ margin: "6px 16px 0", height: 140, overflow: "hidden", border: "0.5px solid #1a1a1a22" }}>
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.7) contrast(1.05)" }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>}
      {url && <div style={{ margin: "0 16px", ...CP, fontSize: 3.5, color: "#1a1a1a55", textAlign: "right" }}>Photo: Wire Services</div>}
      {/* Headline */}
      <div style={{ padding: "8px 16px 0" }}>
        <div style={{ ...FN, fontSize: slide.title && slide.title.length > 40 ? 18 : 24, color: "#1a1a1a", lineHeight: 1.1, marginBottom: 6 }}>
          {slide.title || ""}
        </div>
        <div style={{ height: 1, background: "#1a1a1a33", marginBottom: 6 }} />
        {slide.leadParagraph && <div style={{ ...HD, fontSize: 8, color: "#1a1a1a", lineHeight: 1.5 }}>{slide.leadParagraph}</div>}
      </div>
      <div style={{ position: "absolute", bottom: 6, left: 8, zIndex: 10, ...CP, fontSize: 4, letterSpacing: "0.15em", color: "#1a1a1a44", fontWeight: 700 }}>LOATHR</div>
    </div>
  );
}

// News content slide — column-style layout
export function NewsStory({ slide, images, index }) {
  var url = images && images[index] ? images[index].url : null;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4" }}>
      {/* Top rule */}
      <div style={{ height: 2, background: "#1a1a1a", margin: "0 16px" }} />
      <div style={{ padding: "8px 16px" }}>
        {/* Section label */}
        <div style={{ ...CP, fontSize: 5, letterSpacing: "0.2em", color: "#c41e1e", marginBottom: 4, textTransform: "uppercase" }}>{slide.role || ""}</div>
        {/* Heading */}
        <div style={{ ...FN, fontSize: 14, color: "#1a1a1a", lineHeight: 1.15, marginBottom: 8 }}>{slide.heading || ""}</div>
        <div style={{ height: 0.5, background: "#1a1a1a22", marginBottom: 8 }} />
        {/* Image if available */}
        {url && <div style={{ float: "right", width: "45%", marginLeft: 8, marginBottom: 4, overflow: "hidden" }}>
          <img src={url} alt="" style={{ width: "100%", height: 100, objectFit: "cover", filter: "saturate(0.7)" }} onError={function(e) { e.target.style.display = "none"; }} />
          <div style={{ ...CP, fontSize: 3, color: "#1a1a1a44", textAlign: "right" }}>Wire Services</div>
        </div>}
        {/* Body text */}
        <div style={{ ...HD, fontSize: 8, color: "#1a1a1a", lineHeight: 1.55, columnCount: url ? 1 : 2, columnGap: 10, columnRule: "0.5px solid #1a1a1a22" }}>{slide.body || ""}</div>
        {/* Highlight */}
        {slide.highlight && <div style={{ marginTop: 8, borderLeft: "2px solid #c41e1e", paddingLeft: 8 }}>
          <div style={{ ...HD, fontSize: 7, color: "#1a1a1a", fontStyle: "italic" }}>{slide.highlight}</div>
        </div>}
      </div>
      {/* Source footer */}
      {slide.sources && <div style={{ position: "absolute", bottom: 6, right: 10, ...CP, fontSize: 3.5, color: "#1a1a1a44" }}>{slide.sources}</div>}
      <div style={{ position: "absolute", bottom: 6, left: 8, zIndex: 10, ...CP, fontSize: 4, letterSpacing: "0.15em", color: "#1a1a1a44", fontWeight: 700 }}>LOATHR</div>
    </div>
  );
}

// Reaction slide — quote-heavy
export function NewsReaction({ slide, images, index }) {
  var url = images && images[index] ? images[index].url : null;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4" }}>
      <div style={{ height: 2, background: "#1a1a1a", margin: "0 16px" }} />
      <div style={{ padding: "8px 16px" }}>
        <div style={{ ...CP, fontSize: 5, letterSpacing: "0.2em", color: "#c41e1e", marginBottom: 4 }}>THE REACTION</div>
        <div style={{ ...FN, fontSize: 13, color: "#1a1a1a", lineHeight: 1.15, marginBottom: 10 }}>{slide.heading || ""}</div>
        {/* Quote block */}
        {slide.quote ? (
          <div style={{ borderLeft: "3px solid #1a1a1a", paddingLeft: 12, marginBottom: 10 }}>
            <div style={{ ...HD, fontSize: 11, color: "#1a1a1a", lineHeight: 1.4, fontStyle: "italic" }}>"{slide.quote}"</div>
            <div style={{ ...CP, fontSize: 6, color: "#1a1a1a88", marginTop: 4 }}>— {slide.source || slide.person || "Source"}</div>
          </div>
        ) : (
          <div style={{ ...HD, fontSize: 8, color: "#1a1a1a", lineHeight: 1.55 }}>{slide.body || ""}</div>
        )}
        {/* Person image */}
        {url && <div style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", border: "1px solid #1a1a1a22", margin: "0 auto" }}>
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.7)" }} onError={function(e) { e.target.style.display = "none"; }} />
        </div>}
      </div>
      {slide.sources && <div style={{ position: "absolute", bottom: 6, right: 10, ...CP, fontSize: 3.5, color: "#1a1a1a44" }}>{slide.sources}</div>}
      <div style={{ position: "absolute", bottom: 6, left: 8, zIndex: 10, ...CP, fontSize: 4, letterSpacing: "0.15em", color: "#1a1a1a44", fontWeight: 700 }}>LOATHR</div>
    </div>
  );
}

// Sources closer — full citation list
export function NewsSourcesCloser({ slide }) {
  var sources = slide.fullSources || [];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4" }}>
      <div style={{ height: 2, background: "#1a1a1a", margin: "0 16px" }} />
      <div style={{ padding: "8px 16px" }}>
        <div style={{ ...CP, fontSize: 5, letterSpacing: "0.2em", color: "#c41e1e", marginBottom: 6 }}>SOURCES</div>
        {sources.length > 0 ? sources.map(function(src, i) {
          return <div key={i} style={{ marginBottom: 6, paddingBottom: 4, borderBottom: "0.5px solid #1a1a1a11" }}>
            <div style={{ ...HD, fontSize: 7, color: "#1a1a1a", fontWeight: 700 }}>{src.publication || "Source"}</div>
            <div style={{ ...HD, fontSize: 6, color: "#1a1a1a99" }}>{src.title || ""}</div>
            {src.date && <div style={{ ...CP, fontSize: 4, color: "#1a1a1a66" }}>{src.date}</div>}
          </div>;
        }) : <div style={{ ...HD, fontSize: 7, color: "#1a1a1a88" }}>Sources available upon request.</div>}
        <div style={{ height: 1, background: "#1a1a1a22", marginTop: 8, marginBottom: 8 }} />
        {/* Branding */}
        <div style={{ textAlign: "center" }}>
          <div style={{ ...FN, fontSize: 10, color: "#1a1a1a", letterSpacing: "0.1em" }}>LOATHR NEWS DESK</div>
          <div style={{ ...CP, fontSize: 4, color: "#1a1a1a66", marginTop: 2 }}>Reporting. Context. Perspective.</div>
          {slide.hashtags && <div style={{ ...CP, fontSize: 5, color: "#c41e1e88", marginTop: 4 }}>{slide.hashtags}</div>}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 6, left: 8, zIndex: 10, ...CP, fontSize: 4, letterSpacing: "0.15em", color: "#1a1a1a44", fontWeight: 700 }}>LOATHR</div>
    </div>
  );
}

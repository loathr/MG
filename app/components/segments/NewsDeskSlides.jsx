"use client";
// News Desk — true newspaper column format, no overlapping text on images

var CP = { fontFamily: "'Courier Prime',monospace" };
var FN = { fontFamily: "'Foun',Georgia,serif" };
var HD = { fontFamily: "'Maheni',Georgia,serif", fontStyle: "normal" };

// Front Page — newspaper masthead + headline + image in designated area
export function NewsFrontPage({ slide, images, index }) {
  var url = images && images[0] ? images[0].url : null;
  var isBreaking = slide.breaking;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      {/* Masthead */}
      <div style={{ padding: "6px 14px 4px", borderBottom: "2px solid #1a1a1a", textAlign: "center", flexShrink: 0 }}>
        <div style={{ ...FN, fontSize: 14, color: "#1a1a1a", letterSpacing: "0.08em", lineHeight: 1 }}>LOATHR NEWS DESK</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
          <div style={{ ...CP, fontSize: 3.5, color: "#1a1a1a66" }}>{slide.subtitle || ""}</div>
          <div style={{ ...CP, fontSize: 3.5, color: "#1a1a1a66" }}>Est. 2026</div>
        </div>
      </div>
      <div style={{ height: 0.5, background: "#1a1a1a" }} />
      {/* Breaking banner */}
      {isBreaking && <div style={{ background: "#c41e1e", padding: "2px 14px", textAlign: "center", flexShrink: 0 }}>
        <div style={{ ...CP, fontSize: 6, letterSpacing: "0.3em", color: "#ffffff", fontWeight: 700 }}>BREAKING NEWS</div>
      </div>}
      {/* Content area — 2 column: image left, text right */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "6px 14px" }}>
        {/* Headline */}
        <div style={{ ...FN, fontSize: slide.title && slide.title.length > 40 ? 16 : 20, color: "#1a1a1a", lineHeight: 1.1, marginBottom: 4 }}>{slide.title || ""}</div>
        <div style={{ height: 1, background: "#1a1a1a22", marginBottom: 4 }} />
        {/* Image + lead in columns */}
        <div style={{ display: "flex", gap: 8, flex: 1 }}>
          {url && <div style={{ width: "45%", flexShrink: 0 }}>
            <div style={{ width: "100%", height: 120, overflow: "hidden", border: "0.5px solid #1a1a1a22" }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.7) contrast(1.05)" }} onError={function(e) { e.target.style.display = "none"; }} />
            </div>
            <div style={{ ...CP, fontSize: 3, color: "#1a1a1a44", marginTop: 1 }}>Photo: Wire Services</div>
          </div>}
          <div style={{ flex: 1 }}>
            {slide.leadParagraph && <div style={{ ...HD, fontSize: 7.5, color: "#1a1a1a", lineHeight: 1.5, marginBottom: 4 }}>{slide.leadParagraph}</div>}
            <div style={{ height: 0.5, background: "#1a1a1a11" }} />
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 4, left: 8, ...CP, fontSize: 3.5, letterSpacing: "0.1em", color: "#1a1a1a33" }}>LOATHR</div>
    </div>
  );
}

// News Story — true newspaper columns, image in designated box, not overlapping
export function NewsStory({ slide, images, index }) {
  var url = images && images[index] ? images[index].url : null;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 1.5, background: "#1a1a1a", margin: "0 14px" }} />
      <div style={{ padding: "6px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Section label */}
        <div style={{ ...CP, fontSize: 4.5, letterSpacing: "0.2em", color: "#c41e1e", marginBottom: 3, textTransform: "uppercase" }}>{slide.role || ""}</div>
        {/* Heading */}
        <div style={{ ...FN, fontSize: 13, color: "#1a1a1a", lineHeight: 1.15, marginBottom: 6 }}>{slide.heading || ""}</div>
        <div style={{ height: 0.5, background: "#1a1a1a22", marginBottom: 6 }} />
        {/* Image in designated box — not overlapping text */}
        {url && <div style={{ width: "100%", height: 90, overflow: "hidden", border: "0.5px solid #1a1a1a22", marginBottom: 4 }}>
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.7)" }} onError={function(e) { e.target.style.display = "none"; }} />
        </div>}
        {/* Body in 2-column newspaper format */}
        <div style={{ ...HD, fontSize: 7.5, color: "#1a1a1a", lineHeight: 1.55, columnCount: 2, columnGap: 10, columnRule: "0.5px solid #1a1a1a11", flex: 1 }}>{slide.body || ""}</div>
        {/* Highlight as pull quote */}
        {slide.highlight && <div style={{ marginTop: 4, borderTop: "0.5px solid #1a1a1a22", borderBottom: "0.5px solid #1a1a1a22", padding: "3px 0", textAlign: "center" }}>
          <div style={{ ...HD, fontSize: 6.5, color: "#1a1a1a", fontStyle: "italic" }}>{slide.highlight}</div>
        </div>}
      </div>
      {slide.sources && <div style={{ padding: "0 14px 4px", ...CP, fontSize: 3, color: "#1a1a1a44", textAlign: "right" }}>{slide.sources}</div>}
      <div style={{ position: "absolute", bottom: 4, left: 8, ...CP, fontSize: 3.5, letterSpacing: "0.1em", color: "#1a1a1a33" }}>LOATHR</div>
    </div>
  );
}

// Reaction — quote with proper newspaper formatting
export function NewsReaction({ slide, images, index }) {
  var url = images && images[index] ? images[index].url : null;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 1.5, background: "#1a1a1a", margin: "0 14px" }} />
      <div style={{ padding: "6px 14px", flex: 1 }}>
        <div style={{ ...CP, fontSize: 4.5, letterSpacing: "0.2em", color: "#c41e1e", marginBottom: 3 }}>THE REACTION</div>
        <div style={{ ...FN, fontSize: 12, color: "#1a1a1a", lineHeight: 1.15, marginBottom: 8 }}>{slide.heading || ""}</div>
        {/* Person photo + quote side by side */}
        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          {url && <div style={{ width: 50, height: 50, borderRadius: "50%", overflow: "hidden", border: "1px solid #1a1a1a22", flexShrink: 0 }}>
            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.7)" }} onError={function(e) { e.target.style.display = "none"; }} />
          </div>}
          <div style={{ flex: 1 }}>
            {slide.quote && <div style={{ ...HD, fontSize: 10, color: "#1a1a1a", lineHeight: 1.4, fontStyle: "italic" }}>"{slide.quote}"</div>}
            <div style={{ ...CP, fontSize: 5.5, color: "#1a1a1a88", marginTop: 3 }}>— {slide.source || slide.person || ""}</div>
          </div>
        </div>
        <div style={{ height: 0.5, background: "#1a1a1a22" }} />
        {slide.body && <div style={{ ...HD, fontSize: 7, color: "#1a1a1a", lineHeight: 1.5, marginTop: 6, columnCount: 2, columnGap: 10, columnRule: "0.5px solid #1a1a1a11" }}>{slide.body}</div>}
      </div>
      {slide.sources && <div style={{ padding: "0 14px 4px", ...CP, fontSize: 3, color: "#1a1a1a44", textAlign: "right" }}>{slide.sources}</div>}
      <div style={{ position: "absolute", bottom: 4, left: 8, ...CP, fontSize: 3.5, letterSpacing: "0.1em", color: "#1a1a1a33" }}>LOATHR</div>
    </div>
  );
}

// Sources closer — full citation list
export function NewsSourcesCloser({ slide }) {
  var sources = slide.fullSources || [];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#f5f0e4", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 1.5, background: "#1a1a1a", margin: "0 14px" }} />
      <div style={{ padding: "6px 14px", flex: 1 }}>
        <div style={{ ...CP, fontSize: 4.5, letterSpacing: "0.2em", color: "#c41e1e", marginBottom: 6 }}>SOURCES</div>
        <div style={{ columnCount: 2, columnGap: 12, columnRule: "0.5px solid #1a1a1a11" }}>
          {sources.length > 0 ? sources.map(function(src, i) {
            return <div key={i} style={{ marginBottom: 6, breakInside: "avoid" }}>
              <div style={{ ...HD, fontSize: 6, color: "#1a1a1a", fontWeight: 700 }}>{src.publication || "Source"}</div>
              <div style={{ ...HD, fontSize: 5.5, color: "#1a1a1a88" }}>{src.title || ""}</div>
              {src.date && <div style={{ ...CP, fontSize: 3.5, color: "#1a1a1a55" }}>{src.date}</div>}
            </div>;
          }) : <div style={{ ...HD, fontSize: 6, color: "#1a1a1a66" }}>Sources available upon request.</div>}
        </div>
        <div style={{ height: 1, background: "#1a1a1a22", marginTop: 8, marginBottom: 8 }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ ...FN, fontSize: 9, color: "#1a1a1a", letterSpacing: "0.08em" }}>LOATHR NEWS DESK</div>
          <div style={{ ...CP, fontSize: 3.5, color: "#1a1a1a55", marginTop: 1 }}>Reporting. Context. Perspective.</div>
          {slide.hashtags && <div style={{ ...CP, fontSize: 4, color: "#c41e1e66", marginTop: 3 }}>{slide.hashtags}</div>}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 4, left: 8, ...CP, fontSize: 3.5, letterSpacing: "0.1em", color: "#1a1a1a33" }}>LOATHR</div>
    </div>
  );
}

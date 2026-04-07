"use client";
// Enterprise-specific slide components — B&W only

var CP = { fontFamily: "'Courier Prime',monospace" };
var FN = { fontFamily: "'Foun',Georgia,serif" };
var HD = { fontFamily: "'Maheni',Georgia,serif", fontStyle: "normal" };
var WS = { fontFamily: "'Wenssep',Georgia,serif", textTransform: "uppercase" };

// Enterprise Cover — clean B&W editorial
export function EnterpriseCover({ slide, images, index }) {
  var url = images && images[0] ? images[0].url : null;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
      {url && <img src={url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.1) brightness(0.6)" }} onError={function(e) { e.target.style.display = "none"; }} />}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.95))" }} />
      {/* Masthead */}
      <div style={{ position: "absolute", top: 20, left: 16, right: 16, textAlign: "right", zIndex: 2 }}>
        <div style={{ ...CP, fontSize: 8, letterSpacing: "0.3em", color: "#ffffff88" }}>LOATHR</div>
        <div style={{ ...CP, fontSize: 5, letterSpacing: "0.2em", color: "#ffffff55", marginTop: 1 }}>ENTERPRISE</div>
      </div>
      {/* Title */}
      <div style={{ position: "absolute", bottom: 30, left: 16, right: 16, zIndex: 3 }}>
        <div style={{ ...FN, fontSize: slide.title && slide.title.length > 35 ? 22 : 28, color: "#ffffff", lineHeight: 1.1, textShadow: "0 3px 20px rgba(0,0,0,0.9)" }}>
          {slide.title || ""}
        </div>
        <div style={{ height: 2, background: "#ffffff", margin: "10px 0", width: "40%" }} />
        {slide.subtitle && <div style={{ ...HD, fontSize: 8, color: "#ffffffaa", textTransform: "uppercase", letterSpacing: "0.05em" }}>{slide.subtitle}</div>}
      </div>
      <div style={{ position: "absolute", bottom: 6, left: 8, zIndex: 10, ...CP, fontSize: 4, letterSpacing: "0.15em", color: "#ffffff", fontWeight: 700 }}>LOATHR</div>
    </div>
  );
}

// Enterprise Closer — funny one-liner + disclaimer
export function EnterpriseCloser({ slide, images, index, category }) {
  var url = images && images[index] ? images[index].url : (images && images[0] ? images[0].url : null);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
      {url && <img src={url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.1) brightness(0.3)" }} onError={function(e) { e.target.style.display = "none"; }} />}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)" }} />
      {/* Center content */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", zIndex: 3, width: "80%" }}>
        {/* Funny one-liner */}
        {slide.funnyLine && <div style={{ ...HD, fontSize: 9, color: "#ffffffcc", fontStyle: "italic", lineHeight: 1.5, marginBottom: 16 }}>"{slide.funnyLine}"</div>}
        {/* Brand */}
        <div style={{ ...CP, fontSize: 8, letterSpacing: "0.3em", color: "#ffffff88", marginBottom: 4 }}>LOATHR</div>
        <div style={{ ...CP, fontSize: 5, letterSpacing: "0.15em", color: "#ffffff55" }}>ENTERPRISE</div>
        {/* Disclaimer */}
        {slide.disclaimer && <div style={{ ...CP, fontSize: 4, color: "#ffffff44", marginTop: 12, lineHeight: 1.5 }}>{slide.disclaimer}</div>}
      </div>
      <div style={{ position: "absolute", bottom: 6, left: 8, zIndex: 10, ...CP, fontSize: 4, letterSpacing: "0.15em", color: "#ffffff", fontWeight: 700 }}>LOATHR</div>
    </div>
  );
}

// Enterprise Playbook slide — numbered action steps
export function EnterprisePlaybook({ slide, images, index }) {
  var url = images && images[index] ? images[index].url : null;
  var steps = (slide.body || "").split(/\d+[\.\)]\s*/g).filter(Boolean);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
      {url && <img src={url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.1) brightness(0.3)" }} onError={function(e) { e.target.style.display = "none"; }} />}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)" }} />
      <div style={{ position: "absolute", top: 20, left: 16, right: 16, zIndex: 3 }}>
        <div style={{ ...FN, fontSize: 14, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>{slide.heading || "THE PLAYBOOK"}</div>
        <div style={{ height: 1, background: "#ffffff44", marginBottom: 12 }} />
        {steps.length > 1 ? steps.map(function(step, i) {
          return <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{ ...CP, fontSize: 18, color: "#ffffff33", fontWeight: 700, lineHeight: 0.9, flexShrink: 0, width: 20 }}>{i + 1}</div>
            <div style={{ ...HD, fontSize: 8, color: "#ffffffdd", lineHeight: 1.5 }}>{step.trim()}</div>
          </div>;
        }) : <div style={{ ...HD, fontSize: 8.5, color: "#ffffffdd", lineHeight: 1.6 }}>{slide.body}</div>}
      </div>
      {slide.sources && <div style={{ position: "absolute", bottom: 8, right: 10, zIndex: 3, ...CP, fontSize: 3.5, color: "#ffffff33" }}>{slide.sources}</div>}
      <div style={{ position: "absolute", bottom: 6, left: 8, zIndex: 10, ...CP, fontSize: 4, letterSpacing: "0.15em", color: "#ffffff", fontWeight: 700 }}>LOATHR</div>
    </div>
  );
}

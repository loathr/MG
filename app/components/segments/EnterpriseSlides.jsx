"use client";
// Enterprise — text-driven B&W editorial, minimal images

var CP = { fontFamily: "'Courier Prime',monospace" };
var FN = { fontFamily: "'Foun',Georgia,serif" };
var HD = { fontFamily: "'Maheni',Georgia,serif", fontStyle: "normal" };

// Enterprise Cover
export function EnterpriseCover({ slide, images, index }) {
  var url = images && images[0] ? images[0].url : null;
  var isBreaking = slide.breaking;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px 16px 6px", borderBottom: "1px solid #ffffff33", textAlign: "right", flexShrink: 0 }}>
        <div style={{ ...CP, fontSize: 9, letterSpacing: "0.25em", color: "#ffffff66" }}>LOATHR</div>
        <div style={{ ...CP, fontSize: 5, letterSpacing: "0.15em", color: "#ffffff44", marginTop: 1 }}>ENTERPRISE</div>
      </div>
      {isBreaking && <div style={{ background: "#ffffff", padding: "3px 16px", textAlign: "center", flexShrink: 0 }}>
        <div style={{ ...CP, fontSize: 6, letterSpacing: "0.25em", color: "#0a0a0a", fontWeight: 700 }}>JUST IN</div>
      </div>}
      {url && <div style={{ height: isBreaking ? 70 : 90, overflow: "hidden", flexShrink: 0, borderBottom: "1px solid #ffffff22" }}>
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.1) brightness(0.4)" }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>}
      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ ...FN, fontSize: slide.title && slide.title.length > 35 ? 22 : 28, color: "#ffffff", lineHeight: 1.1 }}>{slide.title || ""}</div>
        <div style={{ height: 1.5, background: "#ffffff44", margin: "10px 0", width: "35%" }} />
        {slide.subtitle && <div style={{ ...HD, fontSize: 9, color: "#ffffff88", letterSpacing: "0.03em" }}>{slide.subtitle}</div>}
        {slide.timestamp && <div style={{ ...CP, fontSize: 4, color: "#ffffff44", marginTop: 4 }}>{slide.timestamp}</div>}
      </div>
      <div style={{ position: "absolute", bottom: 5, left: 8, ...CP, fontSize: 4, letterSpacing: "0.12em", color: "#ffffff55" }}>LOATHR</div>
    </div>
  );
}

// Enterprise Content — text-driven
export function EnterpriseContent({ slide, images, index }) {
  var url = images && images[index] ? images[index].url : null;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 1, background: "#ffffff33", margin: "0 16px" }} />
      <div style={{ padding: "10px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ ...CP, fontSize: 6, letterSpacing: "0.2em", color: "#ffffff55", marginBottom: 4, textTransform: "uppercase" }}>{slide.role || ""}</div>
        <div style={{ ...FN, fontSize: 16 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.15, marginBottom: 8 }}>{slide.heading || ""}</div>
        <div style={{ height: 0.5, background: "#ffffff22", marginBottom: 8 }} />
        {url && <div style={{ width: "40%", height: 65, overflow: "hidden", marginBottom: 6, border: "0.5px solid #ffffff22" }}>
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.1) brightness(0.6)" }} onError={function(e) { e.target.style.display = "none"; }} />
        </div>}
        <div style={{ ...HD, fontSize: 9.5 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.6, flex: 1 }}>{slide.body || ""}</div>
        {slide.highlight && <div style={{ marginTop: 6, borderLeft: "2px solid #ffffff44", paddingLeft: 8 }}>
          <div style={{ ...HD, fontSize: 8, color: "#ffffff88", fontStyle: "italic" }}>{slide.highlight}</div>
        </div>}
      </div>
      {slide.sources && <div style={{ padding: "0 16px 5px", ...CP, fontSize: 4, color: "#ffffff33", textAlign: "right" }}>{slide.sources}</div>}
      <div style={{ position: "absolute", bottom: 5, left: 8, ...CP, fontSize: 4, letterSpacing: "0.12em", color: "#ffffff55" }}>LOATHR</div>
    </div>
  );
}

// Enterprise Playbook — numbered steps
export function EnterprisePlaybook({ slide, images, index }) {
  var steps = (slide.body || "").split(/\d+[\.\)]\s*/g).filter(Boolean);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 1, background: "#ffffff33", margin: "0 16px" }} />
      <div style={{ padding: "10px 16px", flex: 1 }}>
        <div style={{ ...CP, fontSize: 6, letterSpacing: "0.2em", color: "#ffffff55", marginBottom: 4 }}>THE PLAYBOOK</div>
        <div style={{ ...FN, fontSize: 14, color: "#ffffff", marginBottom: 10, lineHeight: 1.15 }}>{slide.heading || "Action Steps"}</div>
        <div style={{ height: 0.5, background: "#ffffff22", marginBottom: 10 }} />
        {steps.length > 1 ? steps.map(function(step, i) {
          return <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{ ...CP, fontSize: 20, color: "#ffffff22", fontWeight: 700, lineHeight: 0.85, flexShrink: 0, width: 18, textAlign: "right" }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ ...HD, fontSize: 9, color: "#ffffffcc", lineHeight: 1.5 }}>{step.trim()}</div>
              {i < steps.length - 1 && <div style={{ height: 0.5, background: "#ffffff11", marginTop: 8 }} />}
            </div>
          </div>;
        }) : <div style={{ ...HD, fontSize: 9.5, color: "#ffffffcc", lineHeight: 1.6 }}>{slide.body}</div>}
      </div>
      {slide.sources && <div style={{ padding: "0 16px 5px", ...CP, fontSize: 4, color: "#ffffff33", textAlign: "right" }}>{slide.sources}</div>}
      <div style={{ position: "absolute", bottom: 5, left: 8, ...CP, fontSize: 4, letterSpacing: "0.12em", color: "#ffffff55" }}>LOATHR</div>
    </div>
  );
}

// Enterprise Closer
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
      <div style={{ position: "absolute", bottom: 5, left: 8, ...CP, fontSize: 4, letterSpacing: "0.12em", color: "#ffffff55" }}>LOATHR</div>
    </div>
  );
}

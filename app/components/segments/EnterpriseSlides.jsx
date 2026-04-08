"use client";
// Enterprise — 8 alternating layouts + cover/playbook/closer

var CP = { fontFamily: "'Courier Prime',monospace" };
var FN = { fontFamily: "'Foun',Georgia,serif" };
var HD = { fontFamily: "'Maheni',Georgia,serif", fontStyle: "normal" };
var imgFilter = "grayscale(1) contrast(1.1) brightness(0.6)";

// Enterprise text styling — underline KEY TERMS instead of background highlight
export function enterpriseStyleBody(text) {
  if (!text) return "";
  var parts = text.split(/(\b[A-Z][A-Z\s]{2,}[A-Z]\b)/g);
  var hitCount = 0;
  return parts.map(function(part, i) {
    if (/^[A-Z\s]+$/.test(part) && part.trim().length > 2 && hitCount < 3) {
      hitCount++;
      var words = part.trim().split(/\s+/);
      return words.map(function(word, wi) {
        return <span key={i + "-" + wi} style={{ borderBottom: "1.5px solid #ffffff", paddingBottom: 1, marginRight: 3, fontWeight: 700, color: "#ffffff" }}>{word}</span>;
      });
    }
    return part;
  });
}
var watermark = function() { return <div style={{ position: "absolute", bottom: 5, left: 8, zIndex: 10, ...CP, fontSize: 4, letterSpacing: "0.12em", color: "#ffffff55" }}>LOATHR</div>; };
var srcLine = function(s) { return s ? <div style={{ ...CP, fontSize: 4, color: "#ffffff33", textAlign: "right", marginTop: 4 }}>{s}</div> : null; };
var sectionLabel = function(t) { return <div style={{ ...CP, fontSize: 6, letterSpacing: "0.2em", color: "#ffffff55", marginBottom: 4, textTransform: "uppercase" }}>{t}</div>; };
var highlightBlock = function(t) { return t ? <div style={{ marginTop: 6, borderLeft: "2px solid #ffffff44", paddingLeft: 8 }}><div style={{ ...HD, fontSize: 8, color: "#ffffff88", fontStyle: "italic" }}>{t}</div></div> : null; };

// Split ratio + text offset helpers
function getSplit(slide) { return (slide.enterpriseSplit || 50); } // 30-70
function getTextOffset(slide) { return slide.enterpriseTextOffset || { top: 0, left: 0 }; }
function offsetStyle(slide) { var o = getTextOffset(slide); return (o.top || o.left) ? { transform: "translate(" + (o.left || 0) + "px," + (o.top || 0) + "px)" } : {}; }

export var ENTERPRISE_LAYOUT_COUNT = 8;
export var ENTERPRISE_LAYOUT_LABELS = ["Top/Bottom", "Bottom/Top", "Left/Right", "Right/Left", "Strip+2Col", "Text Only", "Diagonal", "Center Band"];

// Cover
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
      {url && <div style={{ height: (function() { var sizes = { small: 60, medium: 90, large: 160, full: "100%" }; return isBreaking ? 70 : (sizes[slide.coverPhotoSize] || 90); })(), overflow: "hidden", flexShrink: slide.coverPhotoSize === "full" ? 1 : 0, flex: slide.coverPhotoSize === "full" ? 1 : undefined, borderBottom: "1px solid #ffffff22" }}>
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} />
      </div>}
      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ ...FN, fontSize: slide.title && slide.title.length > 35 ? 22 : 28, color: "#ffffff", lineHeight: 1.1 }}>{slide.title || ""}</div>
        <div style={{ height: 1.5, background: "#ffffff44", margin: "10px 0", width: "35%" }} />
        {slide.subtitle && <div style={{ ...HD, fontSize: 9, color: "#ffffff88" }}>{slide.subtitle}</div>}
        {slide.timestamp && <div style={{ ...CP, fontSize: 4, color: "#ffffff44", marginTop: 4 }}>{slide.timestamp}</div>}
      </div>
      {watermark()}
    </div>
  );
}

// Render image or mosaic
function ImgOrMosaic({ url, mosaic, height, width }) {
  if (mosaic) return <EnterpriseMosaic urls={mosaic} height={height} width={width} />;
  if (url) return <div style={{ width: width || "100%", height: height || "100%", overflow: "hidden" }}><img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} /></div>;
  return <div style={{ width: width || "100%", height: height || "100%", background: "#111" }} />;
}

// Layout 1 — Top Image / Bottom Text
function Layout1({ slide, url, mosaic }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ height: sp + "%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} /></div>
      <div style={Object.assign({}, { height: (100 - sp) + "%", padding: "8px 14px", display: "flex", flexDirection: "column", overflow: "hidden" }, offsetStyle(slide))}>
        {sectionLabel(slide.role || "")}
        <div style={{ ...FN, fontSize: 14 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.15, marginBottom: 6 }}>{slide.heading || ""}</div>
        <div style={{ ...HD, fontSize: 9 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.55, flex: 1, overflow: "hidden" }}>{enterpriseStyleBody(slide.body)}</div>
        {highlightBlock(slide.highlight)}
        {srcLine(slide.sources)}
      </div>
      {watermark()}
    </div>
  );
}

// Layout 2 — Bottom Image / Top Text
function Layout2({ slide, url, mosaic }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={Object.assign({}, { height: (100 - sp) + "%", padding: "8px 14px", display: "flex", flexDirection: "column", overflow: "hidden" }, offsetStyle(slide))}>
        {sectionLabel(slide.role || "")}
        <div style={{ ...FN, fontSize: 14 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.15, marginBottom: 6 }}>{slide.heading || ""}</div>
        <div style={{ ...HD, fontSize: 9 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.55, flex: 1, overflow: "hidden" }}>{enterpriseStyleBody(slide.body)}</div>
        {highlightBlock(slide.highlight)}
        {srcLine(slide.sources)}
      </div>
      <div style={{ height: sp + "%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} /></div>
      {watermark()}
    </div>
  );
}

// Layout 3 — Left Image / Right Text
function Layout3({ slide, url, mosaic }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", overflow: "hidden" }}>
      <div style={{ width: sp + "%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} /></div>
      <div style={Object.assign({}, { width: (100 - sp) + "%", padding: "10px 12px", display: "flex", flexDirection: "column", overflow: "hidden" }, offsetStyle(slide))}>
        {sectionLabel(slide.role || "")}
        <div style={{ ...FN, fontSize: 13 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.15, marginBottom: 6 }}>{slide.heading || ""}</div>
        <div style={{ height: 0.5, background: "#ffffff22", marginBottom: 6 }} />
        <div style={{ ...HD, fontSize: 8.5 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.55, flex: 1, overflow: "hidden" }}>{enterpriseStyleBody(slide.body)}</div>
        {highlightBlock(slide.highlight)}
        {srcLine(slide.sources)}
      </div>
      {watermark()}
    </div>
  );
}

// Layout 4 — Right Image / Left Text
function Layout4({ slide, url, mosaic }) {
  var sp = getSplit(slide);
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", overflow: "hidden" }}>
      <div style={Object.assign({}, { width: (100 - sp) + "%", padding: "10px 12px", display: "flex", flexDirection: "column", overflow: "hidden" }, offsetStyle(slide))}>
        {sectionLabel(slide.role || "")}
        <div style={{ ...FN, fontSize: 13 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.15, marginBottom: 6 }}>{slide.heading || ""}</div>
        <div style={{ height: 0.5, background: "#ffffff22", marginBottom: 6 }} />
        <div style={{ ...HD, fontSize: 8.5 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.55, flex: 1, overflow: "hidden" }}>{enterpriseStyleBody(slide.body)}</div>
        {highlightBlock(slide.highlight)}
        {srcLine(slide.sources)}
      </div>
      <div style={{ width: sp + "%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} /></div>
      {watermark()}
    </div>
  );
}

// Layout 5 — Image Strip Top + 2-Column Text
function Layout5({ slide, url, mosaic }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ height: "30%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} /></div>
      <div style={{ flex: 1, padding: "8px 14px", overflow: "hidden" }}>
        {sectionLabel(slide.role || "")}
        <div style={{ ...FN, fontSize: 14 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.15, marginBottom: 6 }}>{slide.heading || ""}</div>
        <div style={{ height: 0.5, background: "#ffffff22", marginBottom: 6 }} />
        <div style={{ ...HD, fontSize: 8.5 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.55, columnCount: 2, columnGap: 10, columnRule: "0.5px solid #ffffff11" }}>{enterpriseStyleBody(slide.body)}</div>
        {highlightBlock(slide.highlight)}
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
        <div style={{ ...FN, fontSize: 18 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.1, marginBottom: 10 }}>{slide.heading || ""}</div>
        <div style={{ height: 1, background: "#ffffff22", marginBottom: 10 }} />
        <div style={{ ...HD, fontSize: 10 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.6, flex: 1 }}>{enterpriseStyleBody(slide.body)}</div>
        {highlightBlock(slide.highlight)}
        {srcLine(slide.sources)}
      </div>
      {watermark()}
    </div>
  );
}

// Layout 7 — Diagonal Split (image top-left, text bottom-right)
function Layout7({ slide, url, mosaic }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", height: "45%" }}>
        <div style={{ width: "55%", overflow: "hidden" }}><ImgOrMosaic url={url} mosaic={mosaic} /></div>
        <div style={{ width: "45%", padding: "8px 10px" }}>
          {sectionLabel(slide.role || "")}
          <div style={{ ...FN, fontSize: 12 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.15 }}>{slide.heading || ""}</div>
        </div>
      </div>
      <div style={{ height: 0.5, background: "#ffffff22" }} />
      <div style={{ flex: 1, padding: "8px 14px", overflow: "hidden" }}>
        <div style={{ ...HD, fontSize: 9 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.55 }}>{enterpriseStyleBody(slide.body)}</div>
        {highlightBlock(slide.highlight)}
        {srcLine(slide.sources)}
      </div>
      {watermark()}
    </div>
  );
}

// Layout 8 — Center Band (text top, image center, text bottom)
function Layout8({ slide, url, mosaic }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "8px 14px", flexShrink: 0 }}>
        {sectionLabel(slide.role || "")}
        <div style={{ ...FN, fontSize: 14 + (slide.headingSize || 0), color: "#ffffff", lineHeight: 1.15 }}>{slide.heading || ""}</div>
      </div>
      <div style={{ height: "30%", overflow: "hidden", flexShrink: 0, borderTop: "0.5px solid #ffffff22", borderBottom: "0.5px solid #ffffff22" }}><ImgOrMosaic url={url} mosaic={mosaic} /></div>
      <div style={{ flex: 1, padding: "8px 14px", overflow: "hidden" }}>
        <div style={{ ...HD, fontSize: 9 + (slide.bodySize || 0), color: "#ffffffcc", lineHeight: 1.55 }}>{enterpriseStyleBody(slide.body)}</div>
        {highlightBlock(slide.highlight)}
        {srcLine(slide.sources)}
      </div>
      {watermark()}
    </div>
  );
}

// Mosaic image renderer for Enterprise — B&W grid
function EnterpriseMosaic({ urls, height, width }) {
  if (!urls || urls.length < 2) return null;
  var count = Math.min(urls.length, 4);
  var isVertical = height && !width;
  return (
    <div style={{ width: width || "100%", height: height || "100%", display: "grid", gridTemplateColumns: count <= 2 ? "1fr 1fr" : "1fr 1fr", gridTemplateRows: count <= 2 ? "1fr" : "1fr 1fr", gap: 2, background: "#ffffff", overflow: "hidden" }}>
      {urls.slice(0, count).map(function(u, i) { return (
        <div key={i} style={{ overflow: "hidden" }}>
          <img src={u} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} onError={function(e) { e.target.style.display = "none"; }} />
        </div>
      ); })}
    </div>
  );
}

// Enterprise Content — picks layout based on index or slide.enterpriseLayout override
var ENTERPRISE_LAYOUTS = [Layout1, Layout2, Layout3, Layout4, Layout5, Layout6, Layout7, Layout8];

export function EnterpriseContent({ slide, images, index, mosaicUrls }) {
  var url = images && images[index] ? images[index].url : null;
  var mosaic = mosaicUrls && mosaicUrls.length >= 2 ? mosaicUrls : null;
  var layoutIdx = typeof slide.enterpriseLayout === "number" ? slide.enterpriseLayout : ((index - 1) % ENTERPRISE_LAYOUTS.length);
  var LayoutComp = ENTERPRISE_LAYOUTS[layoutIdx] || Layout1;
  return <LayoutComp slide={slide} url={mosaic ? null : url} mosaic={mosaic} />;
}

// Playbook — numbered steps
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

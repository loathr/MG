import { useState, useCallback, useEffect, useRef } from "react";
import { Camera, Film, Music, Trophy, Lightbulb, TrendingUp, Hash, Eye, Mic, Palette, Zap, Star, BookOpen, CircleDot, Clapperboard, Aperture, Users, CheckCircle, AlertTriangle, Loader, Flame, Shuffle, Sparkles, ChevronRight, Archive } from "lucide-react";
import { BarChart, Bar, AreaChart, Area, ResponsiveContainer } from "recharts";

const FONT_URL = "https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&family=DM+Serif+Display&display=swap";
const PAD = 20;
const HD = { fontFamily: "'Maheni','DM Serif Display',Georgia,serif", fontStyle: "normal" };
const CP = { fontFamily: "'Courier Prime',monospace" };

const PALETTES = {
  film:   { bg: "#1a1a2e", accent: "#c8a050", light: "#f5f0e4", text: "#f5f0e4" },
  photo:  { bg: "#3d3d3a", accent: "#d85a30", light: "#f7f5f0", text: "#f7f5f0" },
  sports: { bg: "#111111", accent: "#e63946", light: "#f8f8f8", accent2: "#f2e307", text: "#ffffff" },
  trivia: { bg: "#7ECFC0", accent: "#B8A4D0", light: "#ffffff",    text: "#ffffff" },
  art:    { bg: "#1a0a3e", accent: "#e83e8c", light: "#f8f0ff", accent2: "#4dc9f6", text: "#f8f0ff" },
};

const CATEGORIES = [
  { id: "film", label: "Film & TV", icon: Clapperboard },
  { id: "photo", label: "Photography", icon: Aperture },
  { id: "sports", label: "Sports × Culture", icon: Trophy },
  { id: "trivia", label: "Did You Know?", icon: Lightbulb },
  { id: "art", label: "Art & Music", icon: Palette },
];

const OPTION_TYPES = [
  { id: "deep", label: "Deep Dive", desc: "Educational, long-form", icon: BookOpen },
  { id: "hot", label: "Hot Take", desc: "Provocative, shareable", icon: Zap },
  { id: "timeline", label: "Timeline", desc: "Historical arc", icon: TrendingUp },
];

const SUBCATEGORIES = {
  film: {
    "Directing": ["The rise of the actor-director", "First-time directors who broke out", "Directing actors vs directing camera", "Directors who started in music videos", "The one-take philosophy"],
    "Cinematography": ["Natural light cinematography", "One-take sequences that changed cinema", "Anamorphic vs spherical lenses", "Women in cinematography", "The death of the zoom"],
    "Sound": ["Sound design in horror films", "The Foley artist's dying art", "How silence became a weapon", "The Hans Zimmer effect", "Sound mixing vs sound design"],
    "Production": ["Practical effects vs CGI", "The A24 production model", "Micro-budget filmmaking secrets", "Production design as storytelling", "The virtual production revolution"],
    "History": ["The French New Wave's lasting impact", "Blaxploitation cinema's cultural legacy", "How VHS changed filmmaking", "The birth of the blockbuster", "Silent film techniques still used today"],
    "Trends": ["AI in post-production", "The streaming quality debate", "Vertical cinema for mobile", "The rise of A24", "International cinema crossing over"],
  },
  photo: {
    "Technique": ["Color grading trends", "Dynamic symmetry composition", "High-key vs low-key lighting", "The rule of thirds is dead", "Long exposure as storytelling"],
    "Gear": ["The death of DSLR", "Medium format revival", "Smartphone vs dedicated cameras", "The Leica mystique", "Mirrorless changed everything"],
    "Culture": ["Street photography ethics", "The Instagram aesthetic fatigue", "AI in photo editing", "Photo manipulation and trust", "The rise of self-taught photographers"],
    "History": ["The decisive moment theory", "Color photography's controversial start", "War photographers who changed policy", "The Polaroid comeback", "Darkroom to Lightroom evolution"],
  },
  sports: {
    "Fashion": ["NBA tunnel fashion evolution", "Athletes as brand moguls", "Stadium merch culture", "Sneaker collaborations with artists", "The Met Gala athlete era"],
    "Music": ["Hip-hop and basketball's bond", "Walk-up songs in baseball culture", "Stadium DJs shaping game energy", "Athletes who became rappers", "Halftime shows as cultural events"],
    "Art & Design": ["Sports photography as fine art", "Stadium architecture and design", "Team logo evolution history", "Trading card art renaissance", "Jersey design as graphic design"],
    "Culture": ["Skateboarding meets high fashion", "Esports crossing into mainstream", "The athlete-activist evolution", "Sports and social media identity", "The pregame tunnel phenomenon"],
  },
  trivia: {
    "Science": ["Colors invented by accident", "Foods created by mistake", "Scientific discoveries from errors", "The placebo effect mysteries", "Inventions that came from dreams"],
    "History": ["The shortest war in history", "Lost civilizations rediscovered", "Inventions ahead of their time", "Historical figures with secret lives", "Maps that changed the world"],
    "Culture": ["Banned books that changed literature", "Words that don't translate", "Music that was almost never released", "The origins of everyday objects", "Symbols that changed meaning"],
    "Nature": ["Animals with impossible abilities", "Plants that break the rules", "Ocean mysteries still unsolved", "Weather phenomena that defy logic", "Extinct species rediscovered"],
  },
  art: {
    "Music": ["Album covers as fine art", "The Afrobeats explosion", "Synesthesia in music production", "The vinyl revival economics", "Producers who shaped entire genres"],
    "Visual": ["Street art vs gallery art", "NFT art after the crash", "The new surrealism movement", "Typography as art form", "Collage making a comeback"],
    "People": ["Artists who changed music production", "Designers who shaped album art", "Curators reshaping galleries", "Self-taught artists who went global", "The producer-as-artist evolution"],
    "History": ["The Bauhaus effect on everything", "Punk aesthetics in modern design", "How hip-hop created visual culture", "Art movements born from protest", "The album art golden age"],
  },
};

const CATEGORY_ICONS = {
  film: [Film, Clapperboard, Eye, Mic], photo: [Camera, Aperture, Eye, CircleDot],
  sports: [Trophy, TrendingUp, Star, Users], trivia: [Lightbulb, BookOpen, Star, Eye],
  art: [Music, Palette, Star, Eye],
};


// ─── SHARED COMPONENTS ───
function ColorBlock({ style, children }) {
  return <div style={{ position: "absolute", ...style }}>{children}</div>;
}

function HeadingBar({ num, title, pal }) {
  return (
    <div style={{ background: "#000", padding: "10px 20px", display: "flex", alignItems: "baseline", gap: 6 }}>
      {num != null && <span style={{ ...CP, fontSize: 9, color: "rgba(255,255,255,0.18)" }}>{String(num).padStart(2, "0")} —</span>}
      <span style={{ ...HD, fontSize: 12, color: pal.light || "#fff" }}>{title}</span>
    </div>
  );
}

function StatBox({ value, label, color }) {
  return (
    <div style={{ flex: 1, background: "#000", padding: "14px 10px", textAlign: "center", border: "2px solid #000" }}>
      <div style={{ ...HD, fontSize: 30, color, lineHeight: 1 }}>{value}</div>
      <div style={{ ...CP, fontSize: 7, color: "rgba(255,255,255,0.3)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}

function LabelCard({ label, sublabel, color }) {
  return (
    <div style={{ background: "#000", padding: "10px 12px", flex: 1, textAlign: "center" }}>
      <div style={{ ...HD, fontSize: 11, color }}>{label}</div>
      {sublabel && <div style={{ ...CP, fontSize: 7, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{sublabel}</div>}
    </div>
  );
}

function Accent({ children, color }) {
  return <span style={{ textDecoration: "underline", textDecorationColor: color, textUnderlineOffset: 3, textDecorationThickness: 1, color: "inherit" }}>{children}</span>;
}

function Wm({ color = "rgba(255,255,255,0.08)" }) {
  return <div style={{ position: "absolute", bottom: 8, right: PAD, ...CP, fontSize: 7, color, userSelect: "none", zIndex: 4 }}>LOATHR</div>;
}

function ImgZone({ url, alt, credit, source, placeholder, pal, style }) {
  if (url) return (
    <div style={{ position: "relative", overflow: "hidden", border: "2px solid #000", ...style }}>
      <img src={url} alt={alt || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "saturate(0.85) brightness(0.9)" }} onError={e => { e.target.style.display = "none"; }} />
      {credit && <div style={{ position: "absolute", bottom: 4, right: 6, ...CP, fontSize: 7, color: "rgba(255,255,255,0.4)", zIndex: 2 }}>{credit} / {source}</div>}
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: pal?.bg || "#1a1a2e", border: "2px solid #000", ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Camera size={14} style={{ opacity: 0.25, color: pal?.accent || "#888" }} />
        <span style={{ ...CP, fontSize: 7, color: pal?.accent || "#888", opacity: 0.4, letterSpacing: "0.08em" }}>{placeholder || "IMAGE LOADS IN PRODUCTION"}</span>
      </div>
    </div>
  );
}

function Spark({ data, color, h = 36 }) {
  return <ResponsiveContainer width="100%" height={h}><AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}><Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={1.5} dot={false} /></AreaChart></ResponsiveContainer>;
}

// ─── IMAGE SEARCH ───
const searchUnsplash = async (query, apiKey) => {
  const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=portrait`, { headers: { Authorization: `Client-ID ${apiKey}` } });
  if (!r.ok) throw new Error(`Unsplash ${r.status}`);
  const d = await r.json();
  return (d.results || []).map(img => ({ url: img.urls?.regular, thumb: img.urls?.small, alt: img.alt_description || query, credit: img.user?.name, source: "Unsplash" }));
};

const searchPexels = async (query, apiKey) => {
  const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=portrait`, { headers: { Authorization: apiKey } });
  if (!r.ok) throw new Error(`Pexels ${r.status}`);
  const d = await r.json();
  return (d.photos || []).map(img => ({ url: img.src?.large, thumb: img.src?.medium, alt: query, credit: img.photographer, source: "Pexels" }));
};

const testApiConnection = async (service, key) => {
  try {
    const url = service === "unsplash" ? "https://api.unsplash.com/search/photos?query=test&per_page=1" : "https://api.pexels.com/v1/search?query=test&per_page=1";
    const headers = service === "unsplash" ? { Authorization: `Client-ID ${key}` } : { Authorization: key };
    const r = await fetch(url, { headers });
    if (r.ok) return { ok: true, msg: "Connected" };
    if (r.status === 401) return { ok: false, msg: "Invalid key" };
    return { ok: false, msg: `Error ${r.status}` };
  } catch (e) {
    return { ok: false, msg: e.message?.includes("fetch") ? "Blocked by sandbox — deploy standalone" : (e.message || "Failed") };
  }
};


// ─── COVER SLIDE (unified Oh Hey! color-block structure) ───
function CoverSlide({ slide, category, image }) {
  const p = PALETTES[category];
  const catLabel = CATEGORIES.find(c => c.id === category)?.label || "";
  // Each category gets a unique color-block position
  const blocks = {
    film:   { bottom: 0, right: 0, width: "50%", height: "38%", background: p.accent },
    photo:  { top: 0, right: 0, width: "45%", height: "48%", background: p.accent },
    sports: { bottom: 0, left: 0, width: "100%", height: "30%", background: p.accent },
    trivia: { bottom: 0, right: 0, width: "50%", height: "40%", background: p.accent },
    art:    { top: 0, left: 0, width: "40%", height: "44%", background: p.accent },
  };
  const block = blocks[category];
  const hasImage = image?.url;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: hasImage ? "#000" : p.bg }}>
      {/* Background image with overlay */}
      {hasImage && (
        <>
          <img src={image.url} alt={image.alt || ""} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) brightness(0.7)" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
        </>
      )}
      {/* Color block accent */}
      <ColorBlock style={{ ...block,
        borderLeft: block.left != null ? "none" : "2px solid #000",
        borderTop: block.top != null ? "none" : "2px solid #000",
        borderRight: block.right != null ? "none" : "2px solid #000",
        borderBottom: block.bottom != null ? "none" : "2px solid #000",
        opacity: hasImage ? 0.9 : 1 }} />
      {/* Secondary accent block for sports/art */}
      {category === "sports" && <ColorBlock style={{ top: "11%", right: 16, width: 32, height: 32, background: p.accent2, border: "2px solid #000" }} />}
      {category === "art" && <ColorBlock style={{ bottom: "13%", right: 16, width: 28, height: 28, background: p.accent2, border: "2px solid #000" }} />}

      <div style={{ padding: PAD, display: "flex", flexDirection: "column", height: "100%", position: "relative", zIndex: 1 }}>
        <div style={{ ...CP, fontSize: 7, letterSpacing: "0.15em", color: hasImage ? `rgba(255,255,255,0.7)` : `${p.accent}88` }}>LOATHR — {catLabel.toUpperCase()}</div>
        <div style={{ flex: 1, display: "flex", flexDirection: category === "art" ? "column" : "column", justifyContent: category === "art" ? "flex-end" : "center" }}>
          <div style={{ background: "#000", padding: PAD }}>
            <div style={{ ...HD, fontSize: slide.title?.length > 35 ? 30 : 36, color: p.text, lineHeight: 1.05 }}>
              {formatTitle(slide.title, p.accent)}
            </div>
            <div style={{ ...CP, fontSize: 9, color: `${p.text}66`, marginTop: 10, fontStyle: "italic" }}>{slide.subtitle}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ ...CP, fontSize: 7, color: `${p.text}33` }}>ISSUE {String((slide.title || "").length * 7 % 200 + 1).padStart(3, "0")}</div>
          {slide.heading && <div style={{ background: "#000", padding: "3px 8px" }}><div style={{ ...CP, fontSize: 7, color: p.accent, letterSpacing: "0.08em" }}>{slide.heading?.toUpperCase()}</div></div>}
        </div>
      </div>
    </div>
  );
}

// Format title with accent underline on last phrase
function formatTitle(title, accentColor) {
  if (!title) return "";
  const words = title.split(" ");
  if (words.length <= 3) return <Accent color={accentColor}>{title}</Accent>;
  const cutoff = Math.max(2, words.length - Math.ceil(words.length / 3));
  return <>{words.slice(0, cutoff).join(" ")} <Accent color={accentColor}>{words.slice(cutoff).join(" ")}</Accent></>;
}

// ─── CONTENT SLIDE (unified) ───
function ContentSlide({ slide, index, category, image }) {
  const p = PALETTES[category];
  const bodyColor = "#777777";

  return (
    <div style={{ width: "100%", height: "100%", background: p.light, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <HeadingBar num={index} title={slide.heading || `Part ${index}`} pal={p} />
      {/* Optional color accent strip */}
      {(category === "trivia") && (
        <div style={{ height: 3, display: "flex" }}><div style={{ flex: 1, background: p.bg }} /><div style={{ flex: 1, background: p.accent }} /></div>
      )}
      <div style={{ padding: `16px ${PAD}px`, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Inline image block */}
        {image?.url && (
          <ImgZone url={image.url} alt={image.alt} credit={image.credit} source={image.source} pal={p}
            style={{ width: "100%", height: 80, marginBottom: 10, flexShrink: 0 }} />
        )}
        <div style={{ ...CP, fontSize: 9, color: bodyColor, lineHeight: 1.9, flex: 1 }}>{formatBody(slide.body, p)}</div>

        {/* Label cards for key terms */}
        {slide.highlight && (
          <div style={{ display: "flex", gap: 8, margin: "14px 0" }}>
            <LabelCard label={slide.highlight.split("—")[0]?.trim()} sublabel={slide.highlight.split("—")[1]?.trim()} color={p.accent} />
          </div>
        )}

        {/* Pull quote */}
        {slide.quote && (
          <div style={{ ...CP, fontSize: 9, fontStyle: "italic", color: p.bg?.startsWith("#1") ? "#333333" : p.bg, borderLeft: "2px solid #000", paddingLeft: 10, lineHeight: 1.5 }}>"{slide.quote}"</div>
        )}
        <Wm color={`${bodyColor}22`} />
      </div>
    </div>
  );
}

// Format body with bold caps and accent underlines
function formatBody(text, pal) {
  if (!text) return "";
  // Simple approach: return as-is, the AI prompt should generate styled content
  return text;
}

// ─── STAT SLIDE ───
function StatSlide({ slide, index, category }) {
  const p = PALETTES[category];
  const spark = slide.stat ? Array.from({ length: 8 }, (_, i) => ({ v: Math.round(10 + Math.abs(Math.sin(i * 0.8 + parseInt(slide.stat) || 1)) * 40) })) : null;

  return (
    <div style={{ width: "100%", height: "100%", background: p.light, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <HeadingBar num={index} title={slide.heading || "By the Numbers"} pal={p} />
      <div style={{ padding: `16px ${PAD}px`, flex: 1, display: "flex", flexDirection: "column" }}>
        {slide.stat && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <StatBox value={slide.stat} label={slide.statLabel || "KEY METRIC"} color={p.accent} />
            {slide.stat2 && <StatBox value={slide.stat2} label={slide.stat2Label || "SECONDARY"} color={p.accent2 || p.accent} />}
          </div>
        )}
        {spark && <div style={{ marginBottom: 10, opacity: 0.5 }}><Spark data={spark} color={p.accent} h={28} /></div>}
        <div style={{ ...CP, fontSize: 9, color: "#888", lineHeight: 1.85, flex: 1 }}>{slide.body}</div>
        <Wm color="#ddd" />
      </div>
    </div>
  );
}

// ─── SPLIT FRAME SLIDE (image + content) ───
function SplitSlide({ slide, index, category, image }) {
  const p = PALETTES[category];
  return (
    <div style={{ width: "100%", height: "100%", background: p.light, display: "flex", position: "relative", overflow: "hidden" }}>
      <div style={{ width: "40%", borderRight: "2px solid #000", position: "relative" }}>
        {image?.url ? (
          <img src={image.url} alt={image.alt || ""} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) brightness(0.9)" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: p.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Camera size={18} style={{ opacity: 0.15, color: p.accent }} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#000", padding: "10px 14px", display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ ...CP, fontSize: 9, color: "rgba(255,255,255,0.18)" }}>{String(index).padStart(2, "0")} —</span>
          <span style={{ ...HD, fontSize: 12, color: p.light }}>{slide.heading}</span>
        </div>
        <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ ...CP, fontSize: 9, color: "#888", lineHeight: 1.85 }}>{slide.body}</div>
        </div>
      </div>
    </div>
  );
}

// ─── CLOSER SLIDE ───
function CloserSlide({ category, hashtags }) {
  const p = PALETTES[category];
  return (
    <div style={{ width: "100%", height: "100%", background: p.bg, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", position: "relative" }}>
      <div style={{ ...CP, fontSize: 8, letterSpacing: "0.3em", color: `${p.text}33` }}>FOLLOW FOR MORE</div>
      <div style={{ ...CP, fontSize: 14, letterSpacing: "0.35em", color: `${p.text}18`, marginTop: 14 }}>L O A T H R</div>
      <div style={{ width: 60, height: 1, background: `${p.accent}44`, margin: "10px auto" }} />
      <div style={{ ...CP, fontSize: 8, color: `${p.text}22`, marginTop: 4 }}>{hashtags}</div>
    </div>
  );
}


// ─── SLIDE RENDERER ───
function SlideRenderer({ category, slideData, slideIndex, totalSlides, images }) {
  const img = images?.[slideIndex];
  if (slideIndex === totalSlides - 1) return <CloserSlide category={category} hashtags={slideData.hashtags || ""} />;
  if (slideIndex === 0) return <CoverSlide slide={slideData} category={category} image={img} />;
  // Route to stat slide if it has stat data
  if (slideData.stat) return <StatSlide slide={slideData} index={slideIndex} category={category} />;
  // Route to split slide for even-indexed content slides with images
  if (img?.url && slideIndex % 3 === 0) return <SplitSlide slide={slideData} index={slideIndex} category={category} image={img} />;
  return <ContentSlide slide={slideData} index={slideIndex} category={category} image={img} />;
}

// ─── PNG EXPORT SYSTEM ───
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Script load failed: " + src));
    document.head.appendChild(s);
  });
};

const exportSlides = async (slides, category, slideRef, setCurrentSlide, setExportStatus) => {
  setExportStatus("Loading export libraries...");
  try {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
  } catch (e) {
    setExportStatus("Export requires deployment — CDN blocked in sandbox");
    setTimeout(() => setExportStatus(null), 3000);
    return;
  }

  const zip = new window.JSZip();
  const imgFolder = zip.folder("LOATHR-" + category.toUpperCase());

  for (let i = 0; i < slides.length; i++) {
    setExportStatus("Rendering slide " + (i + 1) + " of " + slides.length + "...");
    setCurrentSlide(i);
    // Wait for React to re-render the preview
    await new Promise(r => setTimeout(r, 300));

    const el = slideRef.current;
    if (!el) continue;

    try {
      const canvas = await window.html2canvas(el, {
        width: el.offsetWidth,
        height: el.offsetHeight,
        scale: 1080 / el.offsetWidth,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });
      const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
      if (blob) imgFolder.file("slide-" + String(i + 1).padStart(2, "0") + ".png", blob);
    } catch (err) {
      console.error("Failed slide " + (i + 1), err);
    }
  }

  setExportStatus("Creating ZIP...");
  try {
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "LOATHR-" + category.toUpperCase() + "-carousel.zip";
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus("Downloaded!");
  } catch (e) {
    setExportStatus("ZIP creation failed");
  }
  setTimeout(() => setExportStatus(null), 2000);
};

// ─── SETTINGS PANEL ───
function Settings({ apiKeys, setApiKeys, show, setShow, apiStatus, onTest }) {
  return (
    <div style={{ marginBottom: 16, textAlign: "center" }}>
      <button onClick={() => setShow(!show)} style={{ background: "none", border: "0.5px solid var(--color-border-tertiary)", padding: "8px 14px", cursor: "pointer", fontSize: 11, ...CP, letterSpacing: "0.05em", color: "var(--color-text-secondary)", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Hash size={12} />{show ? "Hide" : "API"} Settings
        {apiStatus.unsplash?.ok || apiStatus.pexels?.ok ? <CheckCircle size={12} style={{ color: "var(--color-text-success)" }} /> : null}
      </button>
      {show && (
        <div style={{ marginTop: 10, padding: 16, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", textAlign: "left" }}>
          <div style={{ ...CP, fontSize: 10, letterSpacing: "0.1em", color: "var(--color-text-tertiary)", marginBottom: 10, textTransform: "uppercase" }}>Image APIs (optional)</div>
          {[{ key: "unsplash", label: "Unsplash Access Key", hint: "unsplash.com/developers" },
            { key: "pexels", label: "Pexels API Key", hint: "pexels.com/api" }].map(({ key, label, hint }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>{label}
                {apiStatus[key] && <span style={{ fontSize: 9, color: apiStatus[key].ok ? "var(--color-text-success)" : "var(--color-text-warning)", display: "inline-flex", alignItems: "center", gap: 3 }}>
                  {apiStatus[key].ok ? <CheckCircle size={9} /> : <AlertTriangle size={9} />}{apiStatus[key].msg}
                </span>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <input type="password" value={apiKeys[key]} onChange={e => setApiKeys(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={hint} style={{ flex: 1, padding: "6px 10px", border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 11, ...CP }} />
                <button onClick={() => onTest(key)} disabled={!apiKeys[key]}
                  style={{ padding: "6px 12px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: apiKeys[key] ? "pointer" : "default", ...CP, fontSize: 9, color: "var(--color-text-secondary)", opacity: apiKeys[key] ? 1 : 0.4 }}>Test</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── MAIN COMPONENT ───
export default function LoathrMediaGenerator() {
  const [category, setCategory] = useState(null);
  const [topic, setTopic] = useState("");
  const [options, setOptions] = useState(null);
  const [selectedOption, setSelectedOption] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [apiKeys, setApiKeys] = useState({
  unsplash: process.env.NEXT_PUBLIC_UNSPLASH_KEY || "",
  pexels: process.env.NEXT_PUBLIC_PEXELS_KEY || "",
});
  const [showSettings, setShowSettings] = useState(false);
  const [images, setImages] = useState({});
  const [apiStatus, setApiStatus] = useState({});
  const [imgStatus, setImgStatus] = useState(null);
  const [trending, setTrending] = useState([]);
  const [isFetchingTrending, setIsFetchingTrending] = useState(false);
  const [subcat, setSubcat] = useState(null);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [refinedAngles, setRefinedAngles] = useState([]);
  const [isRefining, setIsRefining] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const slideRef = useRef(null);

  useEffect(() => { const l = document.createElement("link"); l.href = FONT_URL; l.rel = "stylesheet"; document.head.appendChild(l); }, []);

  const cat = CATEGORIES.find(c => c.id === category);
  const pal = category ? PALETTES[category] : null;
  const cur = options?.[selectedOption];
  const total = cur?.slides?.length || 0;

  const getVisibleTopics = useCallback(() => {
    if (!category) return [];
    const subs = SUBCATEGORIES[category];
    if (!subs) return [];
    let pool = subcat && subs[subcat] ? subs[subcat] : Object.values(subs).flat();
    const shuffled = [...pool];
    let s = shuffleKey + 1;
    for (let i = shuffled.length - 1; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
    return shuffled.slice(0, 6);
  }, [category, subcat, shuffleKey]);

  const surpriseMe = useCallback(() => {
    if (!category) return;
    const all = Object.values(SUBCATEGORIES[category]).flat();
    const a = all[Math.floor(Math.random() * all.length)];
    let b = all[Math.floor(Math.random() * all.length)];
    while (b === a) b = all[Math.floor(Math.random() * all.length)];
    setTopic(`${a.split(" ").slice(0, 3).join(" ")} meets ${b.split(" ").slice(-3).join(" ")}`);
    setRefinedAngles([]);
  }, [category]);

  const refineTopic = useCallback(async () => {
    if (!topic.trim() || !category) return;
    setIsRefining(true); setRefinedAngles([]);
    try {
      const r = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, messages: [{ role: "user",
          content: `You're a content strategist. Generate 3 sharper angles on "${topic}" for "${cat.label}" Instagram carousels. Respond ONLY with JSON: [{"angle":"title","hook":"one sentence"}]` }] }),
      });
      const d = await r.json().catch(() => null);
      if (!d) throw new Error(`API returned empty response (status ${r.status})`);
      if (d.error) throw new Error(d.error.message || d.error);
      const text = (d.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      if (!text.trim()) throw new Error("No text in response");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (Array.isArray(parsed)) setRefinedAngles(parsed);
    } catch (err) { console.error("Refine failed:", err); }
    finally { setIsRefining(false); }
  }, [topic, category, cat]);

  const fetchTrending = useCallback(async () => {
    if (!category) return;
    setIsFetchingTrending(true); setTrending([]);
    const catContext = { film: "film, TV, cinema, streaming, directing", photo: "photography, cameras, visual storytelling", sports: "sports with music, fashion, art, culture", trivia: "surprising facts, science discoveries, cultural oddities", art: "music, visual arts, album releases, art history" };
    try {
      const msgs = [{ role: "user", content: `Search for trending topics in: ${catContext[category]}. Find 6 specific timely topics for Instagram carousels. Respond ONLY with JSON: [{"topic":"title","hook":"why trending now"}]` }];
      const toolsDef = [{ type: "web_search_20250305", name: "web_search" }];

      let r = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, tools: toolsDef, messages: msgs }),
      });
      let d = await r.json().catch(() => null);
      if (!d) throw new Error(`API returned empty response (status ${r.status})`);
      if (d.error) throw new Error(d.error.message || d.error);

      // Handle pause_turn — server may pause while executing web search
      let loops = 0;
      while (d.stop_reason === "pause_turn" && loops < 3) {
        loops++;
        msgs.push({ role: "assistant", content: d.content });
        r = await fetch("/api/generate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, tools: toolsDef, messages: msgs }),
        });
        d = await r.json().catch(() => null);
        if (!d) throw new Error(`API returned empty response (status ${r.status})`);
        if (d.error) throw new Error(d.error.message || d.error);
      }

      const text = (d.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      if (!text.trim()) throw new Error("No text in response");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (Array.isArray(parsed)) setTrending(parsed);
    } catch (err) { console.error("Trending fetch failed:", err); }
    finally { setIsFetchingTrending(false); }
  }, [category]);

  const handleTest = useCallback(async (service) => {
    setApiStatus(p => ({ ...p, [service]: { ok: false, msg: "Testing..." } }));
    const result = await testApiConnection(service, apiKeys[service]);
    setApiStatus(p => ({ ...p, [service]: result }));
  }, [apiKeys]);

  const generate = useCallback(async () => {
    if (!topic.trim() || !category) return;
    setIsGenerating(true); setError(null); setOptions(null); setImages({});
    setSelectedOption(0); setCurrentSlide(0); setImgStatus(null);

    const catInfo = CATEGORIES.find(c => c.id === category);
    const prompt = `You are a senior content strategist for LOATHR, an editorial Instagram brand. Create 3 carousel post options for "${catInfo.label}" on: "${topic}".

Each option is a different angle (Deep Dive, Hot Take, Timeline). Each has 5-7 slides.

SLIDE TYPES:
- Slide 0 (cover): title, subtitle, heading (sub-topic tag)
- Middle slides: heading, body (2-3 sentences with KEY TERMS IN CAPS), highlight (key phrase), quote (optional), stat/statLabel/stat2/stat2Label (optional for stat slides)
- Last slide: hashtags string

Use CAPS for emphasis words in body text. Make stat slides data-rich with specific numbers.

Respond ONLY with valid JSON, no markdown:
[{"angle":"Deep Dive","slides":[{...}]},{"angle":"Hot Take","slides":[{...}]},{"angle":"Timeline","slides":[{...}]}]`;

    try {
      const r = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
      });
      const d = await r.json().catch(() => null);
      if (!d) throw new Error(`API returned empty response (status ${r.status})`);
      if (d.error) throw new Error(d.error.message || d.error);
      const text = (d.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      if (!text.trim()) throw new Error("Empty response from API");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Invalid response format");
      setOptions(parsed);

      // Attempt image search
      const imgKey = apiKeys.unsplash || apiKeys.pexels;
      if (imgKey && parsed[0]?.slides?.length) {
        setImgStatus("Searching for images...");
        try {
          const searchFn = apiKeys.unsplash ? searchUnsplash : searchPexels;
          const key = apiKeys.unsplash || apiKeys.pexels;
          const results = await searchFn(`${catInfo.label} ${topic}`, key);
          if (results.length > 0) {
            const imgMap = {};
            results.forEach((img, i) => { imgMap[i] = img; });
            setImages(imgMap);
            setImgStatus(`${results.length} images loaded`);
          } else { setImgStatus("No images found — using placeholders"); }
        } catch (e) { setImgStatus(`Image search failed: ${e.message}`); }
      }
    } catch (err) { setError(err.message || "Generation failed"); }
    finally { setIsGenerating(false); }
  }, [topic, category, apiKeys]);

  // ─── RENDER ───
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}`}</style>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ ...CP, fontSize: 14, letterSpacing: "0.4em", color: "var(--color-text-primary)", fontWeight: 700 }}>L O A T H R</div>
        <div style={{ width: 40, height: 1, background: "var(--color-border-tertiary)", margin: "8px auto" }} />
        <div style={{ ...CP, fontSize: 8, letterSpacing: "0.2em", color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>Media Generator</div>
      </div>

      <Settings apiKeys={apiKeys} setApiKeys={setApiKeys} show={showSettings} setShow={setShowSettings} apiStatus={apiStatus} onTest={handleTest} />

      {/* Category selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, justifyContent: "center", flexWrap: "wrap" }}>
        {CATEGORIES.map(c => {
          const p = PALETTES[c.id];
          const sel = category === c.id;
          const Icon = c.icon;
          return (
            <button key={c.id} onClick={() => { setCategory(c.id); setOptions(null); setTrending([]); setSubcat(null); setShuffleKey(0); setRefinedAngles([]); }}
              style={{ padding: "8px 12px", cursor: "pointer", border: sel ? `2px solid ${p.accent}` : "1px solid var(--color-border-tertiary)", background: sel ? `${p.accent}12` : "transparent", display: "flex", alignItems: "center", gap: 5, fontSize: 10, ...CP, color: sel ? p.accent : "var(--color-text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              <Icon size={12} />{c.label}
            </button>
          );
        })}
      </div>

      {/* Topic input area */}
      {category && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <input value={topic} onChange={e => { setTopic(e.target.value); setRefinedAngles([]); }}
              placeholder={`Topic for ${cat.label}...`}
              style={{ flex: 1, padding: "10px 14px", border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 12, ...CP }} />
            <button onClick={generate} disabled={!topic.trim() || isGenerating}
              style={{ padding: "10px 18px", background: pal.accent, color: "#fff", border: "none", cursor: topic.trim() && !isGenerating ? "pointer" : "default", ...CP, fontSize: 10, letterSpacing: "0.1em", fontWeight: 700, opacity: topic.trim() && !isGenerating ? 1 : 0.4 }}>
              {isGenerating ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : "GENERATE"}
            </button>
          </div>

          {/* Action buttons row */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10 }}>
            <button onClick={fetchTrending} disabled={isFetchingTrending} title="Trending topics"
              style={{ padding: "6px 10px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, ...CP, fontSize: 9, color: "var(--color-text-tertiary)" }}>
              <Flame size={11} />{isFetchingTrending ? "..." : "Trending"}
            </button>
            <button onClick={() => setShuffleKey(k => k + 1)} title="Shuffle topics"
              style={{ padding: "6px 10px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, ...CP, fontSize: 9, color: "var(--color-text-tertiary)" }}>
              <Shuffle size={11} />Shuffle
            </button>
            <button onClick={surpriseMe} title="Random mashup"
              style={{ padding: "6px 10px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, ...CP, fontSize: 9, color: "var(--color-text-tertiary)" }}>
              <Zap size={11} />Surprise
            </button>
            {topic.trim() && (
              <button onClick={refineTopic} disabled={isRefining} title="AI refine"
                style={{ padding: "6px 10px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, ...CP, fontSize: 9, color: "var(--color-text-tertiary)" }}>
                <Sparkles size={11} />{isRefining ? "..." : "Refine"}
              </button>
            )}
          </div>

          {/* Refined angles */}
          {refinedAngles.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {refinedAngles.map((r, i) => (
                <button key={i} onClick={() => { setTopic(r.angle); setRefinedAngles([]); }}
                  style={{ padding: "8px 12px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                  <ChevronRight size={12} style={{ color: pal.accent, flexShrink: 0 }} />
                  <div><div style={{ fontSize: 11, color: "var(--color-text-primary)", ...CP }}>{r.angle}</div>
                  <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", marginTop: 2 }}>{r.hook}</div></div>
                </button>
              ))}
            </div>
          )}

          {/* Trending topics */}
          {trending.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 10 }}>
              {trending.map((t, i) => (
                <button key={i} onClick={() => { setTopic(t.topic); setRefinedAngles([]); }}
                  style={{ padding: "6px 12px", border: `1px solid ${pal.accent}44`, background: `${pal.accent}08`, cursor: "pointer", ...CP, fontSize: 10, color: pal.accent }} title={t.hook}>
                  <Flame size={9} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />{t.topic}
                </button>
              ))}
            </div>
          )}

          {/* Subcategory filter pills */}
          {trending.length === 0 && SUBCATEGORIES[category] && (
            <>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginBottom: 8 }}>
                <button onClick={() => setSubcat(null)}
                  style={{ padding: "4px 10px", cursor: "pointer", ...CP, fontSize: 9, letterSpacing: "0.05em", border: `0.5px solid ${!subcat ? pal.accent : "var(--color-border-tertiary)"}`, background: !subcat ? `${pal.accent}15` : "transparent", color: !subcat ? pal.accent : "var(--color-text-tertiary)", textTransform: "uppercase" }}>All</button>
                {Object.keys(SUBCATEGORIES[category]).map(s => (
                  <button key={s} onClick={() => setSubcat(s)}
                    style={{ padding: "4px 10px", cursor: "pointer", ...CP, fontSize: 9, letterSpacing: "0.05em", border: `0.5px solid ${subcat === s ? pal.accent : "var(--color-border-tertiary)"}`, background: subcat === s ? `${pal.accent}15` : "transparent", color: subcat === s ? pal.accent : "var(--color-text-tertiary)", textTransform: "uppercase" }}>{s}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                {getVisibleTopics().map((t, i) => (
                  <button key={`${t}-${shuffleKey}`} onClick={() => { setTopic(t); setRefinedAngles([]); }}
                    style={{ padding: "6px 12px", cursor: "pointer", fontSize: 10, border: "0.5px solid var(--color-border-tertiary)", background: topic === t ? `${pal.accent}12` : "transparent", color: topic === t ? pal.accent : "var(--color-text-tertiary)", ...CP }}>
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Status messages */}
      {isGenerating && <div style={{ textAlign: "center", padding: "50px 0" }}><div style={{ ...CP, fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.1em", animation: "pulse 1.5s ease-in-out infinite" }}>Crafting your carousel...</div></div>}
      {error && <div style={{ padding: "14px 18px", background: "var(--color-background-danger)", border: "1px solid var(--color-border-danger)", color: "var(--color-text-danger)", fontSize: 12, marginBottom: 16 }}>{error}</div>}
      {imgStatus && options && <div style={{ textAlign: "center", marginBottom: 12, ...CP, fontSize: 10, color: imgStatus.includes("loaded") ? "var(--color-text-success)" : "var(--color-text-warning)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>{imgStatus.includes("loaded") ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}{imgStatus}</div>}

      {/* Option selector */}
      {options && (
        <div style={{ marginBottom: 14, textAlign: "center" }}>
          <div style={{ ...CP, fontSize: 10, letterSpacing: "0.15em", color: "var(--color-text-tertiary)", marginBottom: 10, textTransform: "uppercase" }}>Choose an angle</div>
          <div style={{ display: "flex", gap: 8 }}>
            {options.map((opt, i) => { const info = OPTION_TYPES[i]; const InfoIcon = info?.icon || BookOpen; return (
              <button key={i} onClick={() => { setSelectedOption(i); setCurrentSlide(0); }}
                style={{ flex: 1, padding: "12px 10px", cursor: "pointer", border: `1px solid ${selectedOption === i ? pal.accent : "var(--color-border-tertiary)"}`, background: selectedOption === i ? "var(--color-background-secondary)" : "transparent", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)", ...CP }}><InfoIcon size={12} />{info?.label || opt.angle}</div>
                <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2 }}>{info?.desc}</div>
                <div style={{ ...CP, fontSize: 9, color: "var(--color-text-tertiary)", marginTop: 3 }}>{opt.slides?.length || 0} slides</div>
              </button>); })}
          </div>
        </div>
      )}

      {/* Slide preview */}
      {cur && (
        <div style={{ marginBottom: 18, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ ...CP, fontSize: 10, letterSpacing: "0.15em", color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>Slide {currentSlide + 1} / {total}</div>
            {/* Export button */}
            <button onClick={() => exportSlides(cur.slides, category, slideRef, setCurrentSlide, setExportStatus)} disabled={!!exportStatus}
              style={{ padding: "6px 12px", border: `1px solid ${pal.accent}`, background: "transparent", cursor: exportStatus ? "default" : "pointer", display: "flex", alignItems: "center", gap: 5, ...CP, fontSize: 9, color: pal.accent, letterSpacing: "0.08em", opacity: exportStatus ? 0.5 : 1 }}>
              <Archive size={11} />{exportStatus || "EXPORT PNG ZIP"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div ref={slideRef} style={{ width: 340, height: 425, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)" }}>
              <SlideRenderer category={category} slideData={cur.slides[currentSlide]} slideIndex={currentSlide} totalSlides={total} images={images} />
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 14 }}>
            <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}
              style={{ width: 34, height: 34, cursor: currentSlide === 0 ? "default" : "pointer", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", color: "var(--color-text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", opacity: currentSlide === 0 ? 0.3 : 1 }}>&#8249;</button>
            <div style={{ display: "flex", gap: 5 }}>
              {cur.slides.map((_, i) => <button key={i} onClick={() => setCurrentSlide(i)} style={{ width: i === currentSlide ? 18 : 6, height: 6, cursor: "pointer", border: "none", background: i === currentSlide ? pal.accent : "var(--color-border-tertiary)", transition: "all 0.2s" }} />)}
            </div>
            <button onClick={() => setCurrentSlide(Math.min(total - 1, currentSlide + 1))} disabled={currentSlide === total - 1}
              style={{ width: 34, height: 34, cursor: currentSlide === total - 1 ? "default" : "pointer", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", color: "var(--color-text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", opacity: currentSlide === total - 1 ? 0.3 : 1 }}>&#8250;</button>
          </div>

          {/* Thumbnail strip */}
          <div style={{ marginTop: 18 }}>
            <div style={{ ...CP, fontSize: 10, letterSpacing: "0.15em", color: "var(--color-text-tertiary)", marginBottom: 8, textTransform: "uppercase" }}>All Slides</div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, justifyContent: "center" }}>
              {cur.slides.map((slide, i) => (
                <div key={i} onClick={() => setCurrentSlide(i)} style={{ minWidth: 100, height: 125, overflow: "hidden", cursor: "pointer", flexShrink: 0, border: `2px solid ${i === currentSlide ? pal.accent : "transparent"}`, opacity: i === currentSlide ? 1 : 0.6, transition: "all 0.2s" }}>
                  <div style={{ width: 340, height: 425, transform: "scale(0.295)", transformOrigin: "top left", pointerEvents: "none" }}>
                    <SlideRenderer category={category} slideData={slide} slideIndex={i} totalSlides={total} images={images} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", padding: "18px 0 12px", borderTop: "0.5px solid var(--color-border-tertiary)", marginTop: 16 }}>
        <div style={{ ...CP, fontSize: 8, letterSpacing: "0.3em", color: "var(--color-text-tertiary)", opacity: 0.4 }}>L O A T H R — MEDIA GENERATOR</div>
      </div>
    </div>
  );
}

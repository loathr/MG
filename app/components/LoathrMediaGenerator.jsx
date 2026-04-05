"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { Camera, Film, Music, Trophy, Lightbulb, TrendingUp, Hash, Eye, Mic, Palette, Zap, Star, BookOpen, CircleDot, Clapperboard, Aperture, Users, CheckCircle, AlertTriangle, Loader, Flame, Shuffle, Sparkles, ChevronRight, Archive } from "lucide-react";

var FONT_URL = "https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&family=DM+Serif+Display&display=swap";
var PAD = 20;
var PAD_TOP = 25;
var PAD_BOT = 38;
var INNER_TOP = 23; // 1 inch from header border at preview scale
var INNER_BOT = 23; // 1 inch from footer border at preview scale
var HD = { fontFamily: "'Maheni','DM Serif Display',Georgia,serif", fontStyle: "normal" };
var FN = { fontFamily: "'Foun','DM Serif Display',Georgia,serif" };
var WS = { fontFamily: "'Wenssep','Georgia',serif" };
var CP = { fontFamily: "'Courier Prime',monospace" };

var PALETTES = {
  film:   { bg: "#1a1a2e", accent: "#c8a050", text: "#f5f0e4" },
  photo:  { bg: "#3d3d3a", accent: "#d85a30", text: "#f7f5f0" },
  sports: { bg: "#111111", accent: "#e63946", accent2: "#f2e307", text: "#ffffff" },
  trivia: { bg: "#1a3a35", accent: "#7ECFC0", accent2: "#B8A4D0", text: "#ffffff" },
  art:    { bg: "#1a0a3e", accent: "#e83e8c", accent2: "#4dc9f6", text: "#f8f0ff" },
};

var CAT_LABELS = { film: "FILM & TV", photo: "PHOTOGRAPHY", sports: "SPORTS \u00d7 CULTURE", trivia: "DID YOU KNOW?", art: "ART & MUSIC" };
var CLOSER_TAGS = { film: "FOLLOW FOR MORE", photo: "FOLLOW FOR MORE", sports: "GAME. CULTURE. REPEAT.", trivia: "NOW YOU KNOW", art: "SEE. HEAR. FEEL." };

var CATEGORIES = [
  { id: "film", label: "Film & TV", icon: Clapperboard },
  { id: "photo", label: "Photography", icon: Aperture },
  { id: "sports", label: "Sports \u00d7 Culture", icon: Trophy },
  { id: "trivia", label: "Did You Know?", icon: Lightbulb },
  { id: "art", label: "Art & Music", icon: Palette },
];

var OPTION_TYPES = [
  { id: "deep", label: "Deep Dive", desc: "Educational, detailed", icon: BookOpen },
  { id: "hot", label: "Hot Take", desc: "Punchy, provocative", icon: Zap },
  { id: "timeline", label: "Timeline", desc: "Chronological arc", icon: TrendingUp },
];

var SUBCATEGORIES = {
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

// --- HELPERS ---
function Accent({ children, color }) {
  return <span style={{ textDecoration: "underline", textDecorationColor: color, textUnderlineOffset: 3, textDecorationThickness: 2, color: "inherit" }}>{children}</span>;
}

function formatTitle(title, color) {
  if (!title) return "";
  var words = title.split(" ");
  if (words.length <= 3) return <Accent color={color}>{title}</Accent>;
  var cut = Math.max(2, words.length - Math.ceil(words.length / 3));
  return <>{words.slice(0, cut).join(" ")} <Accent color={color}>{words.slice(cut).join(" ")}</Accent></>;
}

// Cover-only: highlight last key word/phrase in accent color, no underline, keep on one line
function formatCoverTitle(title, accentColor, textColor) {
  if (!title) return "";
  var words = title.split(" ");
  if (words.length <= 2) return <span style={{ color: accentColor }}>{title}</span>;
  // Highlight just the last 1-2 words in accent color
  var highlightCount = words.length > 5 ? 2 : 1;
  var mainWords = words.slice(0, words.length - highlightCount).join(" ");
  var accentWords = words.slice(words.length - highlightCount).join(" ");
  return <>{mainWords} <span style={{ color: accentColor, whiteSpace: "nowrap" }}>{accentWords}</span></>;
}

function ImgBg({ url, pal, children, darken }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
      {url && <img src={url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) brightness(0.75)" }} onError={function(e) { e.target.style.display = "none"; }} />}
      {!url && <div style={{ position: "absolute", inset: 0, background: pal.bg }} />}
      {darken && <div style={{ position: "absolute", inset: 0, background: darken }} />}
      {children}
    </div>
  );
}

// Highlight KEY TERMS IN CAPS with accent color
function styleBody(text, accentColor) {
  if (!text) return "";
  var parts = text.split(/(\b[A-Z][A-Z\s]{2,}[A-Z]\b)/g);
  return parts.map(function(part, i) {
    if (/^[A-Z\s]+$/.test(part) && part.trim().length > 2) {
      return <span key={i} style={{ color: accentColor, fontWeight: 700 }}>{part}</span>;
    }
    return part;
  });
}

// Margin awareness: ensures content stays 1" from header/footer borders
function SafeContent({ position, children, style }) {
  var base = { position: "absolute", left: PAD, right: PAD, zIndex: 3 };
  if (position === "top") base.top = INNER_TOP;
  else if (position === "bottom") base.bottom = INNER_BOT;
  else if (position === "full") { base.top = INNER_TOP; base.bottom = INNER_BOT; }
  return <div style={Object.assign({}, base, style || {})}>{children}</div>;
}

function getImg(images, idx) {
  if (!images) return null;
  if (images[idx]) return images[idx].url;
  var keys = Object.keys(images);
  if (keys.length > 0) return images[keys[idx % keys.length]] ? images[keys[idx % keys.length]].url : null;
  return null;
}

// --- S1 COVER (Vibe / The Source) ---
function S1Cover({ slide, category, images }) {
  var p = PALETTES[category];
  var url = getImg(images, 0);
  return (
    <ImgBg url={url} pal={p} darken="linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.9))">
        <div style={{ position: "absolute", top: PAD_TOP, left: PAD, right: PAD, textAlign: "center", zIndex: 2 }}>
          <div style={{ ...CP, fontSize: 18, letterSpacing: "0.5em", color: p.accent + "38", fontWeight: 700 }}>LOATHR</div>
        </div>
        <div style={{ position: "absolute", bottom: PAD_BOT, left: PAD, right: PAD, zIndex: 3 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ ...FN, fontSize: slide.title && slide.title.length > 35 ? 24 : 30, color: p.text, lineHeight: 1.1, textShadow: "0 3px 20px rgba(0,0,0,0.9)" }}>
              {formatCoverTitle(slide.title, p.accent, p.text)}
            </div>
            <div style={{ height: 3, background: "linear-gradient(to right, transparent, " + p.accent + ", transparent)", margin: "12px auto", width: "60%" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
              <div style={{ width: 8, height: 8, background: p.accent }} />
              <div style={{ ...CP, fontSize: 9, color: "#ffffffcc", letterSpacing: "0.1em", fontWeight: 700 }}>{CAT_LABELS[category]}</div>
              <div style={{ width: 8, height: 8, background: p.accent2 || p.accent }} />
            </div>
            {slide.subtitle && <div style={{ ...WS, fontSize: 10, color: "#ffffffaa", marginTop: 8 }}>{slide.subtitle}</div>}
          </div>
        </div>
      </ImgBg>
  );
}

// --- S2 CONTENT (Arena Homme+) ---
function S2Arena({ slide, index, category, images }) {
  var p = PALETTES[category];
  var url = getImg(images, index);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden", background: "#000000" }}>
      <div style={{ width: 28, background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "2px solid " + p.accent, flexShrink: 0 }}>
        <div style={{ ...FN, fontSize: 11, color: p.accent, letterSpacing: "0.1em", writingMode: "vertical-rl", transform: "rotate(180deg)", whiteSpace: "nowrap" }}>{slide.heading || "Part " + index}</div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 7, position: "relative", borderBottom: "2px solid " + p.accent }}>
          {url && <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) brightness(0.75)" }} onError={function(e) { e.target.style.display = "none"; }} />}
          {!url && <div style={{ width: "100%", height: "100%", background: p.bg }} />}
        </div>
        <div style={{ flex: 3, background: "#000000", padding: "10px " + PAD + "px " + INNER_BOT + "px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ ...WS, fontSize: 9, color: "#ffffffe6", lineHeight: 1.5, textAlign: "justify" }}>{styleBody(slide.body, p.accent)}</div>
          {slide.specs && <div style={{ ...WS, fontSize: 7, color: "#ffffffaa", marginTop: 4, textAlign: "justify" }}>{slide.specs}</div>}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 8, left: 32, zIndex: 4 }}>
        <div style={{ ...CP, fontSize: 6, color: "#ffffff33" }}>{String(index).padStart(2, "0")}</div>
      </div>
    </div>
  );
}

// --- S3 CONTENT (Ray Gun / 90s crash) ---
function S3RayGun({ slide, index, category, images }) {
  var p = PALETTES[category];
  var url = getImg(images, index);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "80%", height: "72%" }}>
        {url && <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) brightness(0.75)" }} onError={function(e) { e.target.style.display = "none"; }} />}
        {!url && <div style={{ width: "100%", height: "100%", background: p.bg }} />}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 3, background: p.accent }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: p.accent }} />
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.9)", padding: PAD + "px " + PAD + "px " + PAD_BOT + "px", zIndex: 3 }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ ...FN, fontSize: 13, color: "#ffffff", marginBottom: 4, letterSpacing: "0.03em" }}>{slide.heading || "Part " + index}</div>
          <div style={{ ...WS, fontSize: 9, color: "#ffffffe6", lineHeight: 1.5, textAlign: "justify" }}>{styleBody(slide.body, p.accent)}</div>
          {slide.highlight && <div style={{ ...WS, fontSize: 8, fontStyle: "italic", color: p.accent + "cc", marginTop: 4 }}>{slide.highlight}</div>}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 8, left: PAD, zIndex: 4 }}>
        <div style={{ ...CP, fontSize: 6, color: "#ffffff33" }}>{String(index).padStart(2, "0")}</div>
      </div>
    </div>
  );
}

// --- S4 STAT (Emigre scale clash) ---
function S4Emigre({ slide, index, category, images }) {
  var p = PALETTES[category];
  var url = getImg(images, index);
  return (
    <ImgBg url={url} pal={p} darken="rgba(0,0,0,0.6)">
      <div style={{ position: "absolute", top: PAD_TOP, left: PAD, zIndex: 3 }}>
        <div style={{ ...FN, fontSize: 12, color: "#ffffffcc", letterSpacing: "0.05em" }}>By the Numbers</div>
      </div>
      <div style={{ position: "absolute", top: "24%", left: PAD, zIndex: 3 }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ ...FN, fontSize: slide.stat2 ? 48 : 64, color: p.accent, lineHeight: 0.85, letterSpacing: -1 }}>{slide.stat}</div>
          <div style={{ ...CP, fontSize: 7, color: "#ffffffaa", letterSpacing: "0.1em", marginTop: 4 }}>{slide.statLabel || "Key Metric"}</div>
        </div>
      </div>
      {slide.stat2 && <div style={{ position: "absolute", top: "52%", right: PAD, textAlign: "right", zIndex: 3 }}>
        <div style={{ ...FN, fontSize: 38, color: p.accent2 || p.text, lineHeight: 0.85 }}>{slide.stat2}</div>
        <div style={{ ...CP, fontSize: 7, color: "#ffffffaa", letterSpacing: "0.1em", marginTop: 4 }}>{slide.stat2Label || "Secondary"}</div>
      </div>}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.85)", padding: PAD + "px " + PAD + "px " + PAD_BOT + "px", zIndex: 3 }}>
        <div style={{ ...WS, fontSize: 9, color: "#ffffffcc", lineHeight: 1.5, textAlign: "justify" }}>{styleBody(slide.body, p.accent)}</div>
      </div>
      <div style={{ position: "absolute", bottom: 8, left: PAD, zIndex: 4 }}>
        <div style={{ ...CP, fontSize: 6, color: "#ffffff33" }}>{String(index).padStart(2, "0")}</div>
      </div>
    </ImgBg>
  );
}

// --- S5 CONTENT (i-D / The Face / 80s grid) ---
function S5Face({ slide, index, category, images }) {
  var p = PALETTES[category];
  var url = getImg(images, index);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden", background: "#000000" }}>
      <div style={{ width: 28, background: p.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <div style={{ ...FN, fontSize: 9, color: "#000000", fontWeight: 700, letterSpacing: "0.08em", writingMode: "vertical-rl", transform: "rotate(180deg)", whiteSpace: "nowrap" }}>{slide.heading || "Section"}{slide.year ? " / " + slide.year : ""}</div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 6, position: "relative", borderBottom: "2px solid " + p.accent, borderRight: "2px solid " + p.accent }}>
          {url && <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) brightness(0.75)" }} onError={function(e) { e.target.style.display = "none"; }} />}
          {!url && <div style={{ width: "100%", height: "100%", background: p.bg }} />}
        </div>
        <div style={{ flex: 4, background: "#000000", padding: "10px " + PAD + "px " + INNER_BOT + "px", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "2px solid " + p.accent }}>
          <div style={{ ...WS, fontSize: 9, color: "#ffffffe6", lineHeight: 1.5, textAlign: "justify" }}>{styleBody(slide.body, p.accent)}</div>
          <div style={{ width: "100%", height: 1, background: p.accent + "33", margin: "6px 0" }} />
          {slide.highlight && <div style={{ ...WS, fontSize: 8, color: p.accent + "cc", fontStyle: "italic" }}>{slide.highlight}</div>}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 8, left: 32, zIndex: 5 }}>
        <div style={{ ...CP, fontSize: 6, color: "#ffffff33" }}>{String(index).padStart(2, "0")}</div>
      </div>
    </div>
  );
}

// --- S6 QUOTE (Purple Magazine whisper) ---
function S6Purple({ slide, index, category, images }) {
  var p = PALETTES[category];
  var url = getImg(images, index);
  var quoteText = slide.quote || slide.highlight || slide.body || "";
  return (
    <ImgBg url={url} pal={p} darken="linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.9))">
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.85)", padding: PAD + "px " + PAD + "px " + PAD_BOT + "px", zIndex: 3 }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ ...WS, fontSize: 11, fontStyle: "italic", color: "#ffffffdd", lineHeight: 1.5, textAlign: "justify" }}>{quoteText.charAt(0) === '"' ? quoteText : '"' + quoteText + '"'}</div>
          <div style={{ width: 12, height: 1, background: p.accent + "66", margin: "8px 0" }} />
          {slide.source && <div style={{ ...CP, fontSize: 7, color: p.accent + "99", letterSpacing: "0.08em" }}>{slide.source}</div>}
        </div>
      </div>
    </ImgBg>
  );
}

// --- S7 CLOSER (Blitz geometric fade) ---
function S7Blitz({ category, hashtags, images }) {
  var p = PALETTES[category];
  var url = getImg(images, 0);
  return (
    <ImgBg url={url} pal={p} darken="rgba(0,0,0,0.75)">
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", zIndex: 3 }}>
        <div style={{ ...CP, fontSize: 7, letterSpacing: "0.25em", color: p.accent + "99" }}>{CLOSER_TAGS[category]}</div>
        <div style={{ ...CP, fontSize: 14, letterSpacing: "0.35em", color: "#ffffffbb", marginTop: 10, fontWeight: 700 }}>LOATHR</div>
      </div>
    </ImgBg>
  );
}

// --- SLIDE RENDERER ---
function SlideRenderer({ category, slideData, slideIndex, totalSlides, images }) {
  var lastIdx = totalSlides - 1;
  if (slideIndex === lastIdx) return <S7Blitz category={category} hashtags={slideData.hashtags || ""} images={images} />;
  if (slideIndex === 0) return <S1Cover slide={slideData} category={category} images={images} />;
  if (slideData.stat) return <S4Emigre slide={slideData} index={slideIndex} category={category} images={images} />;
  if (slideData.quote) return <S6Purple slide={slideData} index={slideIndex} category={category} images={images} />;
  var layouts = [S2Arena, S3RayGun, S5Face];
  var pick = slideIndex % layouts.length;
  var Component = layouts[pick];
  return <Component slide={slideData} index={slideIndex} category={category} images={images} />;
}

// --- IMAGE SEARCH ---
var searchUnsplash = async function(query, apiKey) {
  var r = await fetch("https://api.unsplash.com/search/photos?query=" + encodeURIComponent(query) + "&per_page=10&orientation=portrait", { headers: { Authorization: "Client-ID " + apiKey } });
  if (!r.ok) throw new Error("Unsplash " + r.status);
  var d = await r.json();
  return (d.results || []).map(function(img) { return { url: img.urls ? img.urls.regular : null, thumb: img.urls ? img.urls.small : null, alt: img.alt_description || query, credit: img.user ? img.user.name : "", source: "Unsplash" }; });
};

var searchPexels = async function(query, apiKey) {
  var r = await fetch("https://api.pexels.com/v1/search?query=" + encodeURIComponent(query) + "&per_page=10&orientation=portrait", { headers: { Authorization: apiKey } });
  if (!r.ok) throw new Error("Pexels " + r.status);
  var d = await r.json();
  return (d.photos || []).map(function(img) { return { url: img.src ? img.src.large : null, thumb: img.src ? img.src.medium : null, alt: query, credit: img.photographer || "", source: "Pexels" }; });
};

var testApiConnection = async function(service, key) {
  try {
    var url = service === "unsplash" ? "https://api.unsplash.com/search/photos?query=test&per_page=1" : "https://api.pexels.com/v1/search?query=test&per_page=1";
    var headers = service === "unsplash" ? { Authorization: "Client-ID " + key } : { Authorization: key };
    var r = await fetch(url, { headers: headers });
    if (r.ok) return { ok: true, msg: "Connected" };
    if (r.status === 401) return { ok: false, msg: "Invalid key" };
    return { ok: false, msg: "Error " + r.status };
  } catch (e) {
    return { ok: false, msg: e.message && e.message.indexOf("fetch") >= 0 ? "Blocked by sandbox" : (e.message || "Failed") };
  }
};

// --- PNG EXPORT ---
var loadScript = function(src) {
  return new Promise(function(resolve, reject) {
    if (document.querySelector('script[src="' + src + '"]')) return resolve();
    var s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = function() { reject(new Error("Script load failed")); };
    document.head.appendChild(s);
  });
};

var exportSlides = async function(slides, category, slideRef, setCurrentSlide, setExportStatus) {
  setExportStatus("Loading export libraries...");
  try {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
  } catch (e) {
    setExportStatus("Export requires deployment");
    setTimeout(function() { setExportStatus(null); }, 3000);
    return;
  }
  var zip = new window.JSZip();
  var imgFolder = zip.folder("LOATHR-" + category.toUpperCase());
  for (var i = 0; i < slides.length; i++) {
    setExportStatus("Rendering slide " + (i + 1) + " of " + slides.length + "...");
    setCurrentSlide(i);
    await new Promise(function(r) { setTimeout(r, 350); });
    var el = slideRef.current;
    if (!el) continue;
    try {
      var canvas = await window.html2canvas(el, { width: el.offsetWidth, height: el.offsetHeight, scale: 1080 / el.offsetWidth, useCORS: true, allowTaint: true, backgroundColor: null, logging: false });
      var blob = await new Promise(function(r) { canvas.toBlob(r, "image/png"); });
      if (blob) imgFolder.file("slide-" + String(i + 1).padStart(2, "0") + ".png", blob);
    } catch (err) { console.error("Failed slide " + (i + 1), err); }
  }
  setExportStatus("Creating ZIP...");
  try {
    var content = await zip.generateAsync({ type: "blob" });
    var blobUrl = URL.createObjectURL(content);
    var a = document.createElement("a");
    a.href = blobUrl;
    a.download = "LOATHR-" + category.toUpperCase() + "-carousel.zip";
    a.click();
    URL.revokeObjectURL(blobUrl);
    setExportStatus("Downloaded!");
  } catch (e) { setExportStatus("ZIP creation failed"); }
  setTimeout(function() { setExportStatus(null); }, 2000);
};

// --- DIFFERENTIATED PROMPTS ---
function buildPrompt(catLabel, topic, optionType) {
  var base = "You are a senior content strategist for LOATHR, an editorial Instagram brand.\nCategory: \"" + catLabel + "\"\nTopic: \"" + topic + "\"\n\n";

  if (optionType === "deep") {
    return base + "Create a DEEP DIVE carousel (6-7 slides). Educational and detailed.\n\nSLIDE STRUCTURE:\n- Slide 0 (cover): title, subtitle, heading\n- Slides 1-4 (content): heading, body (3-4 sentences, KEY TERMS IN CAPS), highlight, specs (technical detail)\n- Slide 5 (stat): heading, stat, statLabel, body\n- Last slide: hashtags string\n\nInclude at least one slide with a quote field and source field.\n\nRespond ONLY with valid JSON, no markdown:\n{\"angle\":\"Deep Dive\",\"slides\":[{...}]}";
  }

  if (optionType === "hot") {
    return base + "Create a HOT TAKE carousel (5-6 slides). Punchy, provocative, shareable.\n\nSLIDE STRUCTURE:\n- Slide 0 (cover): title (provocative), subtitle (one-line hook), heading\n- Slides 1-2 (content): heading, body (2 SHORT sentences, KEY TERMS IN CAPS), highlight\n- Slide 3 (stat): heading, stat, statLabel, stat2, stat2Label, body\n- Slide 4 (quote): quote (bold quote), source (person name)\n- Last slide: hashtags string\n\nRespond ONLY with valid JSON, no markdown:\n{\"angle\":\"Hot Take\",\"slides\":[{...}]}";
  }

  return base + "Create a TIMELINE carousel (6-7 slides). Chronological journey.\n\nSLIDE STRUCTURE:\n- Slide 0 (cover): title (implies historical arc), subtitle, heading\n- Slides 1-4 (content): heading (era name), year (REQUIRED, e.g. \"1973\"), body (2-3 sentences, KEY TERMS IN CAPS), highlight\n- Slide 5 (stat): heading, stat, statLabel, year, body\n- Last slide: hashtags string\n\nRespond ONLY with valid JSON, no markdown:\n{\"angle\":\"Timeline\",\"slides\":[{...}]}";
}

// --- SETTINGS PANEL ---
function Settings({ apiKeys, setApiKeys, show, setShow, apiStatus, onTest }) {
  return (
    <div style={{ marginBottom: 16, textAlign: "center" }}>
      <button onClick={function() { setShow(!show); }} style={{ background: "none", border: "0.5px solid var(--color-border-tertiary)", padding: "8px 14px", cursor: "pointer", fontSize: 11, ...CP, letterSpacing: "0.05em", color: "var(--color-text-secondary)", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Hash size={12} />{show ? "Hide" : "API"} Settings
        {(apiStatus.unsplash && apiStatus.unsplash.ok) || (apiStatus.pexels && apiStatus.pexels.ok) ? <CheckCircle size={12} style={{ color: "var(--color-text-success)" }} /> : null}
      </button>
      {show && (
        <div style={{ marginTop: 10, padding: 16, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", textAlign: "left" }}>
          <div style={{ ...CP, fontSize: 10, letterSpacing: "0.1em", color: "var(--color-text-tertiary)", marginBottom: 10, textTransform: "uppercase" }}>Image APIs (optional)</div>
          {[{ key: "unsplash", label: "Unsplash Access Key", hint: "unsplash.com/developers" },
            { key: "pexels", label: "Pexels API Key", hint: "pexels.com/api" }].map(function(item) {
            return (
              <div key={item.key} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>{item.label}
                  {apiStatus[item.key] && <span style={{ fontSize: 9, color: apiStatus[item.key].ok ? "var(--color-text-success)" : "var(--color-text-warning)", display: "inline-flex", alignItems: "center", gap: 3 }}>
                    {apiStatus[item.key].ok ? <CheckCircle size={9} /> : <AlertTriangle size={9} />}{apiStatus[item.key].msg}
                  </span>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input type="password" value={apiKeys[item.key]} onChange={function(e) { setApiKeys(function(prev) { var n = {}; for (var k in prev) n[k] = prev[k]; n[item.key] = e.target.value; return n; }); }}
                    placeholder={item.hint} style={{ flex: 1, padding: "6px 10px", border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 11, ...CP }} />
                  <button onClick={function() { onTest(item.key); }} disabled={!apiKeys[item.key]}
                    style={{ padding: "6px 12px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: apiKeys[item.key] ? "pointer" : "default", ...CP, fontSize: 9, color: "var(--color-text-secondary)", opacity: apiKeys[item.key] ? 1 : 0.4 }}>Test</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function LoathrMediaGenerator() {
  var _s = useState, _cb = useCallback, _ef = useEffect, _ref = useRef;
  var cs = _s(null), category = cs[0], setCategory = cs[1];
  var ts = _s(""), topic = ts[0], setTopic = ts[1];
  var os = _s(null), options = os[0], setOptions = os[1];
  var ss = _s(0), selectedOption = ss[0], setSelectedOption = ss[1];
  var cls = _s(0), currentSlide = cls[0], setCurrentSlide = cls[1];
  var gs = _s(false), isGenerating = gs[0], setIsGenerating = gs[1];
  var es = _s(null), error = es[0], setError = es[1];
  var aks = _s({ unsplash: process.env.NEXT_PUBLIC_UNSPLASH_KEY || "", pexels: process.env.NEXT_PUBLIC_PEXELS_KEY || "" }), apiKeys = aks[0], setApiKeys = aks[1];
  var shs = _s(false), showSettings = shs[0], setShowSettings = shs[1];
  var ims = _s({}), images = ims[0], setImages = ims[1];
  var aps = _s({}), apiStatus = aps[0], setApiStatus = aps[1];
  var iss = _s(null), imgStatus = iss[0], setImgStatus = iss[1];
  var trs = _s([]), trending = trs[0], setTrending = trs[1];
  var fts = _s(false), isFetchingTrending = fts[0], setIsFetchingTrending = fts[1];
  var scs = _s(null), subcat = scs[0], setSubcat = scs[1];
  var sks = _s(0), shuffleKey = sks[0], setShuffleKey = sks[1];
  var ras = _s([]), refinedAngles = ras[0], setRefinedAngles = ras[1];
  var irs = _s(false), isRefining = irs[0], setIsRefining = irs[1];
  var exs = _s(null), exportStatus = exs[0], setExportStatus = exs[1];
  var slideRef = _ref(null);

  _ef(function() { var l = document.createElement("link"); l.href = FONT_URL; l.rel = "stylesheet"; document.head.appendChild(l); }, []);

  var cat = CATEGORIES.find(function(c) { return c.id === category; });
  var pal = category ? PALETTES[category] : null;
  var cur = options ? options[selectedOption] : null;
  var total = cur && cur.slides ? cur.slides.length : 0;

  var getVisibleTopics = _cb(function() {
    if (!category) return [];
    var subs = SUBCATEGORIES[category];
    if (!subs) return [];
    var pool = subcat && subs[subcat] ? subs[subcat] : Object.values(subs).flat();
    var shuffled = pool.slice();
    var s = shuffleKey + 1;
    for (var i = shuffled.length - 1; i > 0; i--) { s = (s * 16807) % 2147483647; var j = s % (i + 1); var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp; }
    return shuffled.slice(0, 6);
  }, [category, subcat, shuffleKey]);

  var surpriseMe = _cb(function() {
    if (!category) return;
    var all = Object.values(SUBCATEGORIES[category]).flat();
    var a = all[Math.floor(Math.random() * all.length)];
    var b = all[Math.floor(Math.random() * all.length)];
    while (b === a) b = all[Math.floor(Math.random() * all.length)];
    setTopic(a.split(" ").slice(0, 3).join(" ") + " meets " + b.split(" ").slice(-3).join(" "));
    setRefinedAngles([]);
  }, [category]);

  var refineTopic = _cb(async function() {
    if (!topic.trim() || !category) return;
    setIsRefining(true); setRefinedAngles([]);
    try {
      var r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, messages: [{ role: "user",
          content: "You're a content strategist. Generate 3 sharper angles on \"" + topic + "\" for \"" + cat.label + "\" Instagram carousels. Respond ONLY with JSON: [{\"angle\":\"title\",\"hook\":\"one sentence\"}]" }] }) });
      var d = await r.json();
      var text = (d.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text; }).join("");
      var parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (Array.isArray(parsed)) setRefinedAngles(parsed);
    } catch (err) { console.error(err); }
    finally { setIsRefining(false); }
  }, [topic, category, cat]);

  var fetchTrending = _cb(async function() {
    if (!category) return;
    setIsFetchingTrending(true); setTrending([]);
    var catContext = { film: "film, TV, cinema, streaming, directing", photo: "photography, cameras, visual storytelling", sports: "sports with music, fashion, art, culture", trivia: "surprising facts, science discoveries, cultural oddities", art: "music, visual arts, album releases, art history" };
    try {
      var r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: "Search for trending topics in: " + catContext[category] + ". Find 6 specific timely topics for Instagram carousels. Respond ONLY with JSON: [{\"topic\":\"title\",\"hook\":\"why trending now\"}]" }] }) });
      var d = await r.json();
      var text = (d.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text; }).join("");
      var parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (Array.isArray(parsed)) setTrending(parsed);
    } catch (err) { console.error(err); }
    finally { setIsFetchingTrending(false); }
  }, [category]);

  var handleTest = _cb(async function(service) {
    setApiStatus(function(p) { var n = {}; for (var k in p) n[k] = p[k]; n[service] = { ok: false, msg: "Testing..." }; return n; });
    var result = await testApiConnection(service, apiKeys[service]);
    setApiStatus(function(p) { var n = {}; for (var k in p) n[k] = p[k]; n[service] = result; return n; });
  }, [apiKeys]);

  var generate = _cb(async function() {
    if (!topic.trim() || !category) return;
    setIsGenerating(true); setError(null); setOptions(null); setImages({});
    setSelectedOption(0); setCurrentSlide(0); setImgStatus(null);
    var catInfo = CATEGORIES.find(function(c) { return c.id === category; });
    try {
      var results = [];
      var types = ["deep", "hot", "timeline"];
      for (var t = 0; t < 3; t++) {
        var prompt = buildPrompt(catInfo.label, topic, types[t]);
        var r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, messages: [{ role: "user", content: prompt }] }) });
        var d = await r.json();
        if (d.error) throw new Error(d.error.message || d.error);
        var text = (d.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text; }).join("");
        var parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        if (parsed && parsed.slides) results.push(parsed);
        else if (Array.isArray(parsed) && parsed[0]) results.push(parsed[0]);
      }
      if (results.length === 0) throw new Error("No valid options generated");
      setOptions(results);
      var imgKey = apiKeys.unsplash || apiKeys.pexels;
      if (imgKey) {
        setImgStatus("Searching for images...");
        try {
          var searchFn = apiKeys.unsplash ? searchUnsplash : searchPexels;
          var key = apiKeys.unsplash || apiKeys.pexels;
          var imgs = await searchFn(catInfo.label + " " + topic, key);
          if (imgs.length > 0) {
            var imgMap = {};
            imgs.forEach(function(img, i) { imgMap[i] = img; });
            setImages(imgMap);
            setImgStatus(imgs.length + " images loaded");
          } else { setImgStatus("No images found"); }
        } catch (e) { setImgStatus("Image search failed: " + e.message); }
      }
    } catch (err) { setError(err.message || "Generation failed"); }
    finally { setIsGenerating(false); }
  }, [topic, category, apiKeys]);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}"}</style>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ ...CP, fontSize: 14, letterSpacing: "0.4em", color: "var(--color-text-primary)", fontWeight: 700 }}>L O A T H R</div>
        <div style={{ width: 40, height: 1, background: "var(--color-border-tertiary)", margin: "8px auto" }} />
        <div style={{ ...CP, fontSize: 8, letterSpacing: "0.2em", color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>Media Generator</div>
      </div>

      <Settings apiKeys={apiKeys} setApiKeys={setApiKeys} show={showSettings} setShow={setShowSettings} apiStatus={apiStatus} onTest={handleTest} />

      <div style={{ display: "flex", gap: 6, marginBottom: 16, justifyContent: "center", flexWrap: "wrap" }}>
        {CATEGORIES.map(function(c) {
          var p = PALETTES[c.id]; var sel = category === c.id; var Icon = c.icon;
          return (
            <button key={c.id} onClick={function() { setCategory(c.id); setOptions(null); setTrending([]); setSubcat(null); setShuffleKey(0); setRefinedAngles([]); }}
              style={{ padding: "8px 12px", cursor: "pointer", border: sel ? "2px solid " + p.accent : "1px solid var(--color-border-tertiary)", background: sel ? p.accent + "12" : "transparent", display: "flex", alignItems: "center", gap: 5, fontSize: 10, ...CP, color: sel ? p.accent : "var(--color-text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              <Icon size={12} />{c.label}
            </button>);
        })}
      </div>

      {category && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <input value={topic} onChange={function(e) { setTopic(e.target.value); setRefinedAngles([]); }}
              placeholder={"Topic for " + cat.label + "..."}
              style={{ flex: 1, padding: "10px 14px", border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 12, ...CP }} />
            <button onClick={generate} disabled={!topic.trim() || isGenerating}
              style={{ padding: "10px 18px", background: pal.accent, color: "#ffffff", border: "none", cursor: topic.trim() && !isGenerating ? "pointer" : "default", ...CP, fontSize: 10, letterSpacing: "0.1em", fontWeight: 700, opacity: topic.trim() && !isGenerating ? 1 : 0.4 }}>
              {isGenerating ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : "GENERATE"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10 }}>
            <button onClick={fetchTrending} disabled={isFetchingTrending} style={{ padding: "6px 10px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, ...CP, fontSize: 9, color: "var(--color-text-tertiary)" }}><Flame size={11} />{isFetchingTrending ? "..." : "Trending"}</button>
            <button onClick={function() { setShuffleKey(function(k) { return k + 1; }); }} style={{ padding: "6px 10px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, ...CP, fontSize: 9, color: "var(--color-text-tertiary)" }}><Shuffle size={11} />Shuffle</button>
            <button onClick={surpriseMe} style={{ padding: "6px 10px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, ...CP, fontSize: 9, color: "var(--color-text-tertiary)" }}><Zap size={11} />Surprise</button>
            {topic.trim() && <button onClick={refineTopic} disabled={isRefining} style={{ padding: "6px 10px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, ...CP, fontSize: 9, color: "var(--color-text-tertiary)" }}><Sparkles size={11} />{isRefining ? "..." : "Refine"}</button>}
          </div>
          {refinedAngles.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            {refinedAngles.map(function(r, i) { return (
              <button key={i} onClick={function() { setTopic(r.angle); setRefinedAngles([]); }}
                style={{ padding: "8px 12px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                <ChevronRight size={12} style={{ color: pal.accent, flexShrink: 0 }} />
                <div><div style={{ fontSize: 11, color: "var(--color-text-primary)", ...CP }}>{r.angle}</div>
                <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", marginTop: 2 }}>{r.hook}</div></div>
              </button>); })}
          </div>}
          {trending.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 10 }}>
            {trending.map(function(t, i) { return (
              <button key={i} onClick={function() { setTopic(t.topic); setRefinedAngles([]); }}
                style={{ padding: "6px 12px", border: "1px solid " + pal.accent + "44", background: pal.accent + "08", cursor: "pointer", ...CP, fontSize: 10, color: pal.accent }} title={t.hook}>
                <Flame size={9} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />{t.topic}
              </button>); })}
          </div>}
          {trending.length === 0 && SUBCATEGORIES[category] && <div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginBottom: 8 }}>
              <button onClick={function() { setSubcat(null); }} style={{ padding: "4px 10px", cursor: "pointer", ...CP, fontSize: 9, letterSpacing: "0.05em", border: "0.5px solid " + (!subcat ? pal.accent : "var(--color-border-tertiary)"), background: !subcat ? pal.accent + "15" : "transparent", color: !subcat ? pal.accent : "var(--color-text-tertiary)", textTransform: "uppercase" }}>All</button>
              {Object.keys(SUBCATEGORIES[category]).map(function(s) { return (
                <button key={s} onClick={function() { setSubcat(s); }} style={{ padding: "4px 10px", cursor: "pointer", ...CP, fontSize: 9, letterSpacing: "0.05em", border: "0.5px solid " + (subcat === s ? pal.accent : "var(--color-border-tertiary)"), background: subcat === s ? pal.accent + "15" : "transparent", color: subcat === s ? pal.accent : "var(--color-text-tertiary)", textTransform: "uppercase" }}>{s}</button>); })}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {getVisibleTopics().map(function(t) { return (
                <button key={t + "-" + shuffleKey} onClick={function() { setTopic(t); setRefinedAngles([]); }}
                  style={{ padding: "6px 12px", cursor: "pointer", fontSize: 10, border: "0.5px solid var(--color-border-tertiary)", background: topic === t ? pal.accent + "12" : "transparent", color: topic === t ? pal.accent : "var(--color-text-tertiary)", ...CP }}>{t}</button>); })}
            </div>
          </div>}
        </div>
      )}

      {isGenerating && <div style={{ textAlign: "center", padding: "50px 0" }}><div style={{ ...CP, fontSize: 11, color: "var(--color-text-tertiary)", letterSpacing: "0.1em", animation: "pulse 1.5s ease-in-out infinite" }}>Crafting your carousel...</div></div>}
      {error && <div style={{ padding: "14px 18px", background: "var(--color-background-danger)", border: "1px solid var(--color-border-danger)", color: "var(--color-text-danger)", fontSize: 12, marginBottom: 16 }}>{error}</div>}
      {imgStatus && options && <div style={{ textAlign: "center", marginBottom: 12, ...CP, fontSize: 10, color: imgStatus.indexOf("loaded") >= 0 ? "var(--color-text-success)" : "var(--color-text-warning)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>{imgStatus.indexOf("loaded") >= 0 ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}{imgStatus}</div>}

      {options && <div style={{ marginBottom: 14, textAlign: "center" }}>
        <div style={{ ...CP, fontSize: 10, letterSpacing: "0.15em", color: "var(--color-text-tertiary)", marginBottom: 10, textTransform: "uppercase" }}>Choose an angle</div>
        <div style={{ display: "flex", gap: 8 }}>
          {options.map(function(opt, i) { var info = OPTION_TYPES[i]; var InfoIcon = info ? info.icon : BookOpen; return (
            <button key={i} onClick={function() { setSelectedOption(i); setCurrentSlide(0); }}
              style={{ flex: 1, padding: "12px 10px", cursor: "pointer", border: "1px solid " + (selectedOption === i ? pal.accent : "var(--color-border-tertiary)"), background: selectedOption === i ? "var(--color-background-secondary)" : "transparent", textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)", ...CP }}><InfoIcon size={12} />{info ? info.label : (opt.angle || "Option " + (i + 1))}</div>
              <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2 }}>{info ? info.desc : ""}</div>
              <div style={{ ...CP, fontSize: 9, color: "var(--color-text-tertiary)", marginTop: 3 }}>{opt.slides ? opt.slides.length : 0} slides</div>
            </button>); })}
        </div>
      </div>}

      {cur && <div style={{ marginBottom: 18, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ ...CP, fontSize: 10, letterSpacing: "0.15em", color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>Slide {currentSlide + 1} / {total}</div>
          <button onClick={function() { exportSlides(cur.slides, category, slideRef, setCurrentSlide, setExportStatus); }} disabled={!!exportStatus}
            style={{ padding: "6px 12px", border: "1px solid " + pal.accent, background: "transparent", cursor: exportStatus ? "default" : "pointer", display: "flex", alignItems: "center", gap: 5, ...CP, fontSize: 9, color: pal.accent, letterSpacing: "0.08em", opacity: exportStatus ? 0.5 : 1 }}>
            <Archive size={11} />{exportStatus || "EXPORT PNG ZIP"}
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div ref={slideRef} style={{ width: 340, height: 425, overflow: "hidden", border: "4px solid #ffffff", outline: "1.5px solid #000000", boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)" }}>
            <SlideRenderer category={category} slideData={cur.slides[currentSlide]} slideIndex={currentSlide} totalSlides={total} images={images} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 14 }}>
          <button onClick={function() { setCurrentSlide(Math.max(0, currentSlide - 1)); }} disabled={currentSlide === 0}
            style={{ width: 34, height: 34, cursor: currentSlide === 0 ? "default" : "pointer", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", color: "var(--color-text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", opacity: currentSlide === 0 ? 0.3 : 1 }}>{"\u2039"}</button>
          <div style={{ display: "flex", gap: 5 }}>
            {cur.slides.map(function(_, i) { return <button key={i} onClick={function() { setCurrentSlide(i); }} style={{ width: i === currentSlide ? 18 : 6, height: 6, cursor: "pointer", border: "none", background: i === currentSlide ? pal.accent : "var(--color-border-tertiary)", transition: "all 0.2s" }} />; })}
          </div>
          <button onClick={function() { setCurrentSlide(Math.min(total - 1, currentSlide + 1)); }} disabled={currentSlide === total - 1}
            style={{ width: 34, height: 34, cursor: currentSlide === total - 1 ? "default" : "pointer", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", color: "var(--color-text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", opacity: currentSlide === total - 1 ? 0.3 : 1 }}>{"\u203A"}</button>
        </div>
        <div style={{ marginTop: 18 }}>
          <div style={{ ...CP, fontSize: 10, letterSpacing: "0.15em", color: "var(--color-text-tertiary)", marginBottom: 8, textTransform: "uppercase" }}>All Slides</div>
          <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 8, justifyContent: "center" }}>
            {cur.slides.map(function(slide, i) { return (
              <div key={i} onClick={function() { setCurrentSlide(i); }} style={{ width: 68, height: 85, overflow: "hidden", cursor: "pointer", flexShrink: 0, border: "2px solid " + (i === currentSlide ? pal.accent : "transparent"), opacity: i === currentSlide ? 1 : 0.6, transition: "all 0.2s" }}>
                <div style={{ width: 340, height: 425, transform: "scale(0.2)", transformOrigin: "top left", pointerEvents: "none" }}>
                  <SlideRenderer category={category} slideData={slide} slideIndex={i} totalSlides={total} images={images} />
                </div>
              </div>); })}
          </div>
        </div>
      </div>}

      <div style={{ textAlign: "center", padding: "18px 0 12px", borderTop: "0.5px solid var(--color-border-tertiary)", marginTop: 16 }}>
        <div style={{ ...CP, fontSize: 8, letterSpacing: "0.3em", color: "var(--color-text-tertiary)", opacity: 0.4 }}>L O A T H R  MEDIA GENERATOR</div>
      </div>
    </div>
  );
}

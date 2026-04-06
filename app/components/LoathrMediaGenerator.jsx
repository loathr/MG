"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { Camera, Film, Music, Trophy, Lightbulb, TrendingUp, Hash, Eye, Mic, Palette, Zap, Star, BookOpen, CircleDot, Clapperboard, Aperture, Users, CheckCircle, AlertTriangle, Loader, Flame, Shuffle, Sparkles, ChevronRight, Archive, Scissors, UtensilsCrossed, Wine } from "lucide-react";

var FONT_URL = "https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap";
// Margins from inside the accent border frame
var M_TOP = 20;
var M_BOT = 30;
var M_SIDE = 16;
var M_PAGE = 12; // page number offset from accent frame
var HD = { fontFamily: "'Maheni',Georgia,serif", fontStyle: "normal" };
var FN = { fontFamily: "'Foun',Georgia,serif" };
var WS = { fontFamily: "'Wenssep',Georgia,serif" };
var CP = { fontFamily: "'Courier Prime',monospace" };

// --- MAGAZINE EDITION SYSTEM ---
var PERSONAS = [
  { id: "historian", voice: "You are The Historian. Uncover forgotten details and lost context. Use phrases like 'what is rarely discussed', 'the record shows', 'buried in the archives'. Tone: revelatory, authoritative, like uncovering a secret." },
  { id: "critic", voice: "You are The Critic. Give sharp cultural commentary with strong opinions. Use phrases like 'the uncomfortable truth is', 'what nobody admits', 'the real story'. Tone: provocative, confident, contrarian." },
  { id: "insider", voice: "You are The Insider with behind-the-scenes access. Use phrases like 'what most people miss', 'behind closed doors', 'the industry secret'. Tone: conspiratorial, intimate, exclusive." },
  { id: "storyteller", voice: "You are The Storyteller. Open with a vivid scene or moment. Use phrases like 'picture this', 'it started when', 'the turning point came'. Tone: cinematic, immersive, narrative." },
  { id: "researcher", voice: "You are The Researcher. Lead with surprising data and evidence. Use phrases like 'the data reveals', 'studies show', 'the numbers tell a different story'. Tone: precise, eye-opening, analytical." },
];

var FRESHNESS_SEEDS = [
  "Approach through economics and money: who profits, who pays, what is the hidden financial story.",
  "Frame around human psychology: why do people behave this way, what emotional need does it serve.",
  "Focus on technology disruption: what innovation changed everything, what is being displaced.",
  "Explore cultural clash: whose traditions collide, what identity tensions exist.",
  "Tell the untold backstory: the person, moment, or decision that started it all but nobody discusses.",
  "Make a bold prediction: where is this heading in 5 years, what is the inevitable conclusion.",
  "Frame as a failure story: what went wrong, who miscalculated, what lesson was learned.",
  "Find a surprising parallel: connect this to something completely unrelated in another field.",
];

var WRITING_STYLES = [
  "heading, body (3-4 sentences with KEY TERMS IN CAPS), highlight (key insight)",
  "heading (posed as a question), body (conversational answer style, KEY TERMS IN CAPS), highlight (quotable one-liner)",
  "heading (bold declaration), body (supporting evidence, KEY TERMS IN CAPS), highlight (challenge to the reader)",
  "heading (scene-setting), body (first-person observation style, KEY TERMS IN CAPS), highlight (the lesson)",
  "heading (then vs now framing), body (compare two eras or perspectives, KEY TERMS IN CAPS), highlight (what shifted)",
];

var IMG_FILTERS = [
  "saturate(0.85) brightness(0.75)",
  "grayscale(0.4) contrast(1.1) brightness(0.8)",
  "sepia(0.25) brightness(0.85)",
  "saturate(1.2) brightness(0.7) contrast(1.05)",
  "grayscale(1) brightness(0.85) contrast(1.1)",
];

var COVER_STYLES = ["classic", "split", "typeOnly", "fullBleed"];

// --- EDITION UTILITIES ---
function pickPersona(seed) { return PERSONAS[Math.abs(seed) % PERSONAS.length]; }
function pickFreshness(seed) { return FRESHNESS_SEEDS[Math.abs(seed) % FRESHNESS_SEEDS.length]; }
function pickWritingStyle(seed) { return WRITING_STYLES[Math.abs(seed) % WRITING_STYLES.length]; }
function pickCoverStyle(seed) { return COVER_STYLES[Math.abs(seed) % COVER_STYLES.length]; }
function getImgFilter(index, seed) { return IMG_FILTERS[(index + seed) % IMG_FILTERS.length]; }

function getEditionId(topic, category) {
  var hash = 0;
  var str = topic + category;
  for (var i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash = hash & hash; }
  var issueNum = Math.abs(hash % 900) + 100;
  var months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  var d = new Date();
  return { num: issueNum, label: "ISSUE " + issueNum + " \u2014 " + months[d.getMonth()] + " " + d.getFullYear(), seed: Math.abs(hash) };
}

function getSlideImageQuery(slide, categoryLabel, topic) {
  var heading = slide.heading || slide.title || slide.name || slide.headline || "";
  var caps = (slide.body || "").split(" ").filter(function(w) { return w.length > 4 && w === w.toUpperCase(); }).slice(0, 2).join(" ");
  if (heading && heading.length > 3) return categoryLabel + " " + heading;
  if (caps) return categoryLabel + " " + caps;
  return categoryLabel + " " + topic;
}

var PALETTES = {
  film:   { bg: "#1a1a2e", accent: "#e6a817", accent2: "#c8a050", text: "#f5f0e4" },
  photo:  { bg: "#0a0a0a", accent: "#ffffff", accent2: "#888888", text: "#ffffff" },
  sports: { bg: "#111111", accent: "#e63946", accent2: "#f2e307", text: "#ffffff" },
  trivia: { bg: "#0d1f2d", accent: "#1abc9c", accent2: "#8e44ad", text: "#ffffff" },
  art:    { bg: "#1a0a3e", accent: "#ff2d55", accent2: "#0984e3", text: "#f8f0ff" },
  fashion: { bg: "#141420", accent: "#00d2d3", accent2: "#ff9ff3", text: "#f5f5f0" },
  food: { bg: "#1a0f0a", accent: "#e67e22", accent2: "#27ae60", text: "#fff5eb" },
  nightlife: { bg: "#0a0a1a", accent: "#9b59b6", accent2: "#f1c40f", text: "#f0e6ff" },
};

var CAT_LABELS = { film: "FILM & TV", photo: "PHOTOGRAPHY", sports: "SPORTS \u00d7 CULTURE", trivia: "DID YOU KNOW?", art: "ART & MUSIC", fashion: "FASHION", food: "FOOD & DRINK", nightlife: "NIGHTLIFE" };
var CLOSER_TAGS = { film: "FOLLOW FOR MORE", photo: "FOLLOW FOR MORE", sports: "GAME. CULTURE. REPEAT.", trivia: "NOW YOU KNOW", art: "SEE. HEAR. FEEL.", fashion: "DRESS. EXPRESS. REPEAT.", food: "TASTE. SAVOR. SHARE.", nightlife: "AFTER DARK." };

var CATEGORIES = [
  { id: "film", label: "Film & TV", icon: Clapperboard },
  { id: "photo", label: "Photography", icon: Aperture },
  { id: "sports", label: "Sports \u00d7 Culture", icon: Trophy },
  { id: "trivia", label: "Did You Know?", icon: Lightbulb },
  { id: "art", label: "Art & Music", icon: Palette },
  { id: "fashion", label: "Fashion", icon: Scissors },
  { id: "food", label: "Food & Drink", icon: UtensilsCrossed },
  { id: "nightlife", label: "Nightlife", icon: Wine },
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
  fashion: {
    "Luxury": ["The rise of quiet luxury", "How Bottega Veneta killed the logo", "Old money vs new money aesthetics", "The death of fast fashion logos", "Why vintage luxury is outperforming new"],
    "Streetwear": ["Streetwear's luxury takeover", "The Supreme resale economy", "How skate culture shaped high fashion", "Gorpcore and the outdoor aesthetic", "The sneaker bubble burst"],
    "Designers": ["Virgil Abloh's lasting impact", "The Demna effect at Balenciaga", "Phoebe Philo's quiet revolution", "Rick Owens and anti-fashion", "How Pharrell changed Louis Vuitton"],
    "Culture": ["Fashion week is dead debate", "The influencer vs editor power shift", "Sustainability as marketing tool", "Gender-fluid fashion going mainstream", "The return of maximalism"],
    "History": ["How Coco Chanel freed women", "The punk fashion revolution", "Hip-hop's impact on luxury brands", "The supermodel era vs now", "How the little black dress became iconic"],
    "Trends": ["Dopamine dressing explained", "The coastal grandmother aesthetic", "Mob wife fashion decoded", "Corporate sleaze and office siren", "The archive fashion obsession"],
  },
  food: {
    "Fine Dining": ["The death of white tablecloth dining", "Omakase culture outside Japan", "Why tasting menus are shrinking", "The chef's table phenomenon", "Michelin's relevance debate"],
    "Street Food": ["Street food going gourmet", "Night markets reshaping cities", "The taco truck revolution", "Hawker culture under threat", "Food trucks vs brick and mortar"],
    "Culture": ["Food as identity politics", "The rise of solo dining", "Why everyone is a food critic now", "Mukbang and eating as content", "The brunch industrial complex"],
    "Drinks": ["Natural wine explained", "The craft cocktail backlash", "Coffee's third wave evolution", "Mezcal replacing tequila", "Non-alcoholic spirits boom"],
    "Trends": ["Fermentation obsession decoded", "Ultra-processed food awakening", "The plant-based plateau", "AI-generated recipes", "Ghost kitchens reshaping delivery"],
    "History": ["How spice routes shaped empires", "The invention of the restaurant", "Prohibition's cocktail legacy", "Fast food's cultural conquest", "The origins of brunch"],
  },
  nightlife: {
    "Clubs": ["The death and rebirth of clubbing", "Berlin techno's UNESCO status", "How Ibiza lost its edge", "Warehouse raves making a comeback", "The sober rave movement"],
    "DJs & Music": ["The DJ as cultural architect", "Vinyl sets vs digital mixing", "How Afrobeats conquered the dancefloor", "The rise of the resident DJ", "Festival culture vs club culture"],
    "Culture": ["Nightlife as political resistance", "The door policy debate", "How phones killed the dancefloor", "Queer nightlife shaping mainstream", "The economics of a night out"],
    "Bars": ["The speakeasy revival", "Dive bars as cultural landmarks", "Hotel bars and lobby culture", "The death of the sports bar", "Wine bars replacing cocktail lounges"],
    "Cities": ["Tokyo's golden gai mystique", "Lagos nightlife explosion", "New York vs London after dark", "The rise of Mexico City nightlife", "How cities are zoning out nightlife"],
    "Trends": ["Daylight parties replacing clubs", "Immersive nightlife experiences", "The membership model takeover", "AI DJs and algorithmic dancefloors", "Wellness meets nightlife"],
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

function EditorialFill({ pal, category }) {
  var label = CAT_LABELS[category] || "";
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, " + pal.bg + ", " + pal.accent + "15 30%, " + pal.bg + " 50%, " + (pal.accent2 || pal.accent) + "10 70%, " + pal.bg + ")", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "15%", left: "-5%", fontSize: 80, fontWeight: 900, letterSpacing: "0.15em", color: pal.accent + "08", whiteSpace: "nowrap", transform: "rotate(-8deg)" }}>{label}</div>
      <div style={{ position: "absolute", bottom: "20%", right: "-5%", fontSize: 60, fontWeight: 900, letterSpacing: "0.2em", color: (pal.accent2 || pal.accent) + "06", whiteSpace: "nowrap", transform: "rotate(-8deg)" }}>{label}</div>
      <div style={{ position: "absolute", top: 0, left: "30%", width: 1, height: "100%", background: pal.accent + "08", transform: "rotate(15deg)" }} />
      <div style={{ position: "absolute", top: 0, left: "65%", width: 1, height: "100%", background: (pal.accent2 || pal.accent) + "06", transform: "rotate(-10deg)" }} />
    </div>
  );
}

function ImgBg({ url, pal, children, darken, category, imgFilter, slideIndex }) {
  var filt = imgFilter || IMG_FILTERS[(slideIndex || 0) % IMG_FILTERS.length];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: pal.bg }}>
      {url && <img src={url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: filt }} onError={function(e) { e.target.style.display = "none"; }} />}
      {!url && <EditorialFill pal={pal} category={category} />}
      {darken && <div style={{ position: "absolute", inset: 0, background: darken }} />}
      {children}
    </div>
  );
}

// Highlight KEY TERMS IN CAPS with accent color
function styleBody(text, accentColor, accent2Color) {
  if (!text) return "";
  var colors = [accentColor, accent2Color || accentColor];
  var hitCount = 0;
  var parts = text.split(/(\b[A-Z][A-Z\s]{2,}[A-Z]\b)/g);
  return parts.map(function(part, i) {
    if (/^[A-Z\s]+$/.test(part) && part.trim().length > 2) {
      var c = colors[hitCount % colors.length];
      hitCount++;
      return <span key={i} style={{ color: "#000000", fontWeight: 700, background: c, padding: "1px 4px", margin: "0 1px", display: "inline", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>{part}</span>;
    }
    return part;
  });
}

// Margin-aware auto-fit: shrinks text if it overflows its container
function AutoFit({ children, style, maxShrink }) {
  var ref = useRef(null);
  var _s2 = useState(1), scale = _s2[0], setScale = _s2[1];
  useEffect(function() {
    var el = ref.current;
    if (!el) return;
    var shrink = maxShrink || 0.7;
    if (el.scrollHeight > el.clientHeight) {
      var ratio = el.clientHeight / el.scrollHeight;
      setScale(Math.max(shrink, ratio));
    } else {
      setScale(1);
    }
  });
  return <div ref={ref} style={Object.assign({}, style || {}, { fontSize: scale < 1 ? "calc(" + (style && style.fontSize ? style.fontSize : "inherit") + " * " + scale + ")" : undefined, overflow: "hidden" })}>{children}</div>;
}

// Comic bubble categories
var BUBBLE_CATS = { trivia: true, art: true, food: true };
var STICKY_CATS = { fashion: true };
var FORMAL_CATS = { film: true, photo: true, sports: true, nightlife: true };

// Formal frame styles for editorial categories
function FormalFrame({ children, style, accent, accent2, seed }) {
  var variant = seed % 5;
  var bg = "rgba(0,0,0,0.8)";
  var maxH = { maxHeight: 200, overflow: "hidden" };

  if (variant === 0) {
    // L-bracket frame — corner brackets only
    var sz = 10, lw = 1.5;
    return (
      <div style={Object.assign({}, { position: "relative", background: bg, padding: "10px 12px" }, maxH, style || {})}>
        <div style={{ position: "absolute", top: -1, left: -1, width: sz, height: lw, background: accent }} />
        <div style={{ position: "absolute", top: -1, left: -1, width: lw, height: sz, background: accent }} />
        <div style={{ position: "absolute", top: -1, right: -1, width: sz, height: lw, background: accent }} />
        <div style={{ position: "absolute", top: -1, right: -1, width: lw, height: sz, background: accent }} />
        <div style={{ position: "absolute", bottom: -1, left: -1, width: sz, height: lw, background: accent2 || accent }} />
        <div style={{ position: "absolute", bottom: -1, left: -1, width: lw, height: sz, background: accent2 || accent }} />
        <div style={{ position: "absolute", bottom: -1, right: -1, width: sz, height: lw, background: accent2 || accent }} />
        <div style={{ position: "absolute", bottom: -1, right: -1, width: lw, height: sz, background: accent2 || accent }} />
        {children}
      </div>
    );
  }

  if (variant === 1) {
    // Notch frame — accent squares at corners with thin border
    return (
      <div style={Object.assign({}, { position: "relative", background: bg, padding: "10px 12px", border: "1px solid " + accent + "44" }, style || {})}>
        <div style={{ position: "absolute", top: -3, left: -3, width: 6, height: 6, background: accent }} />
        <div style={{ position: "absolute", top: -3, right: -3, width: 6, height: 6, background: accent2 || accent }} />
        <div style={{ position: "absolute", bottom: -3, left: -3, width: 6, height: 6, background: accent2 || accent }} />
        <div style={{ position: "absolute", bottom: -3, right: -3, width: 6, height: 6, background: accent }} />
        {children}
      </div>
    );
  }

  if (variant === 2) {
    // Side rail — vertical accent bar
    var side = seed % 2 === 0 ? "left" : "right";
    var railStyle = {};
    railStyle["border" + (side === "left" ? "Left" : "Right")] = "3px solid " + accent;
    railStyle["padding" + (side === "left" ? "Left" : "Right")] = "10px";
    return (
      <div style={Object.assign({}, { position: "relative", background: bg, padding: "10px 12px" }, railStyle, style || {})}>
        {children}
      </div>
    );
  }

  if (variant === 3) {
    // Double rule — accent line above + accent2 line below
    return (
      <div style={Object.assign({}, { position: "relative", background: bg, padding: "10px 12px" }, style || {})}>
        <div style={{ position: "absolute", top: -2, left: 0, right: 0, height: 2, background: accent }} />
        <div style={{ position: "absolute", bottom: -2, left: 0, right: 0, height: 2, background: accent2 || accent }} />
        {children}
      </div>
    );
  }

  // Inset mat — outer border + inner gap
  return (
    <div style={Object.assign({}, { position: "relative", border: "1px solid " + accent + "33", padding: 3 }, style || {})}>
      <div style={{ background: bg, padding: "8px 10px", border: "1px solid " + (accent2 || accent) + "22" }}>
        {children}
      </div>
    </div>
  );
}

// Randomized frame position based on topic + slideIndex
function getFramePosition(seed, slideIndex) {
  var positions = [
    { bottom: M_BOT, left: M_SIDE, right: M_SIDE },          // bottom full
    { bottom: M_BOT, left: M_SIDE, right: "50%" },            // bottom-left
    { bottom: M_BOT, left: "40%", right: M_SIDE },            // bottom-right
    { top: "45%", left: M_SIDE, right: "45%" },               // center-left
    { top: "45%", left: "45%", right: M_SIDE },               // center-right
  ];
  var pick = (seed + slideIndex * 7) % positions.length;
  return positions[pick];
}

// 7 bubble styles — enough for no repeats in any carousel
function BubbleBox({ children, style, accent, accent2, seed }) {
  var variant = seed % 7;
  var tailSide = seed % 2 === 0 ? "left" : "right";
  var rotation = (seed % 5 - 2) * 0.5;
  var maxH = { maxHeight: 200, overflow: "hidden" };

  if (variant === 0) {
    // Speech bubble — rounded with triangle tail
    return (
      <div style={Object.assign({}, { position: "relative", background: "rgba(0,0,0,0.85)", border: "1.5px solid " + accent, borderRadius: 10, padding: "10px 12px", transform: "rotate(" + rotation + "deg)" }, maxH, style || {})}>
        {children}
        <div style={{ position: "absolute", bottom: -8, width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid " + accent, ...(tailSide === "left" ? { left: 20 } : { right: 20 }) }} />
        <div style={{ position: "absolute", bottom: -6, width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "6px solid rgba(0,0,0,0.85)", ...(tailSide === "left" ? { left: 21 } : { right: 21 }) }} />
      </div>
    );
  }

  if (variant === 1) {
    // Thought bubble — rounded with dot trail
    return (
      <div style={{ position: "relative" }}>
        <div style={Object.assign({}, { background: "rgba(0,0,0,0.85)", border: "1.5px solid " + accent2, borderRadius: 14, padding: "10px 12px", transform: "rotate(" + rotation + "deg)" }, style || {})}>
          {children}
        </div>
        <div style={{ position: "absolute", bottom: -6, display: "flex", gap: 3, ...(tailSide === "left" ? { left: 16 } : { right: 16 }) }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: accent2 }} />
          <div style={{ width: 3, height: 3, borderRadius: "50%", background: accent2, marginTop: 3 }} />
        </div>
      </div>
    );
  }

  if (variant === 2) {
    // Caption box — side bar
    var barSide2 = tailSide === "left" ? "borderLeft" : "borderRight";
    var barStyle2 = {};
    barStyle2[barSide2] = "3px solid " + accent;
    return (
      <div style={Object.assign({}, { background: "rgba(0,0,0,0.88)", borderRadius: 4, padding: "10px 12px", transform: "rotate(" + rotation + "deg)" }, barStyle2, style || {})}>
      {children}
    </div>
    );
  }

  if (variant === 3) {
    // Exclamation bubble — thick accent border, no radius, bold frame
    return (
      <div style={Object.assign({}, { position: "relative", background: "rgba(0,0,0,0.85)", border: "2px solid " + accent, padding: "10px 12px", transform: "rotate(" + (rotation * -1) + "deg)" }, style || {})}>
        <div style={{ position: "absolute", top: -4, left: tailSide === "left" ? 12 : "auto", right: tailSide === "right" ? 12 : "auto", width: 8, height: 8, background: accent2 || accent, transform: "rotate(45deg)" }} />
        {children}
      </div>
    );
  }

  if (variant === 4) {
    // Cloud bubble — double rounded border, softer feel
    return (
      <div style={Object.assign({}, { position: "relative", background: "rgba(0,0,0,0.82)", border: "1px solid " + accent2 + "66", borderRadius: 18, padding: "12px 14px", boxShadow: "0 0 0 3px " + accent + "15", transform: "rotate(" + rotation + "deg)" }, style || {})}>
        {children}
      </div>
    );
  }

  if (variant === 5) {
    // Arrow panel — accent arrow pointer on side
    var arrowSide = tailSide === "left" ? "right" : "left";
    return (
      <div style={{ position: "relative" }}>
        <div style={Object.assign({}, { background: "rgba(0,0,0,0.85)", borderTop: "2px solid " + accent, borderBottom: "2px solid " + accent2, padding: "10px 12px", transform: "rotate(" + rotation + "deg)" }, style || {})}>
          {children}
        </div>
        <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", ...(arrowSide === "left" ? { left: -8, borderRight: "8px solid " + accent } : { right: -8, borderLeft: "8px solid " + accent }) }} />
      </div>
    );
  }

  // Variant 6: Stamp frame — dashed border with accent corners
  return (
    <div style={Object.assign({}, { position: "relative", background: "rgba(0,0,0,0.85)", border: "1.5px dashed " + accent + "88", borderRadius: 6, padding: "10px 12px", transform: "rotate(" + rotation + "deg)" }, style || {})}>
      <div style={{ position: "absolute", top: -2, left: -2, width: 5, height: 5, background: accent }} />
      <div style={{ position: "absolute", bottom: -2, right: -2, width: 5, height: 5, background: accent2 || accent }} />
      {children}
    </div>
  );
}

// Fashion sticky note styles
function StickyNote({ children, style, accent, accent2, seed }) {
  var variant = seed % 7;
  var rotation = (seed % 7 - 3) * 0.6; // -1.8 to 1.8 deg
  var isLight = seed % 3 === 0;
  var bg = isLight ? "#f5f0e8" : "#1a1a1a";
  var textCol = isLight ? "#1a1a1a" : "#ffffffe6";

  if (variant === 0) {
    // Classic Post-it with folded corner
    return (
      <div style={Object.assign({}, { position: "relative", background: bg, padding: "12px 12px 12px 12px", transform: "rotate(" + rotation + "deg)", boxShadow: "3px 3px 8px rgba(0,0,0,0.4)" }, style || {})}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 0, height: 0, borderStyle: "solid", borderWidth: "0 16px 16px 0", borderColor: "transparent #0a0a0a transparent transparent" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: 0, height: 0, borderStyle: "solid", borderWidth: "0 14px 14px 0", borderColor: "transparent " + accent + "33 transparent transparent" }} />
        <div style={{ color: textCol }}>{children}</div>
      </div>
    );
  }

  if (variant === 1) {
    // Taped note — tape strip across top
    return (
      <div style={Object.assign({}, { position: "relative", transform: "rotate(" + rotation + "deg)" }, style || {})}>
        <div style={{ position: "relative", zIndex: 2, height: 8, background: accent + "55", margin: "0 20%", borderRadius: 1 }} />
        <div style={{ background: bg, padding: "10px 12px", boxShadow: "2px 3px 6px rgba(0,0,0,0.3)" }}>
          <div style={{ color: textCol }}>{children}</div>
        </div>
      </div>
    );
  }

  if (variant === 2) {
    // Pinned card with pin dot
    return (
      <div style={Object.assign({}, { position: "relative", transform: "rotate(" + rotation + "deg)" }, style || {})}>
        <div style={{ position: "absolute", top: -5, left: "50%", transform: "translateX(-50%)", width: 10, height: 10, borderRadius: "50%", background: accent2, boxShadow: "0 2px 4px rgba(0,0,0,0.5)", zIndex: 3 }} />
        <div style={{ background: bg, padding: "14px 12px 10px", border: "1px solid " + accent + "22", boxShadow: "2px 4px 8px rgba(0,0,0,0.35)" }}>
          <div style={{ color: textCol }}>{children}</div>
        </div>
      </div>
    );
  }

  if (variant === 3) {
    // Torn edge note
    return (
      <div style={Object.assign({}, { position: "relative", transform: "rotate(" + rotation + "deg)" }, style || {})}>
        <div style={{ background: bg, padding: "10px 12px 14px", boxShadow: "2px 3px 6px rgba(0,0,0,0.3)" }}>
          <div style={{ color: textCol }}>{children}</div>
        </div>
        <div style={{ height: 6, background: "repeating-linear-gradient(90deg, " + bg + " 0px, " + bg + " 4px, transparent 4px, transparent 6px, " + bg + " 6px, " + bg + " 8px, transparent 8px, transparent 11px)", opacity: 0.9 }} />
      </div>
    );
  }

  if (variant === 4) {
    // Fabric swatch tag with hole punch
    return (
      <div style={Object.assign({}, { position: "relative", display: "flex", transform: "rotate(" + rotation + "deg)", boxShadow: "2px 3px 6px rgba(0,0,0,0.3)" }, style || {})}>
        <div style={{ width: 20, background: accent + "33", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid " + accent }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", border: "1px solid " + accent, background: "transparent" }} />
        </div>
        <div style={{ flex: 1, background: bg, padding: "10px 12px" }}>
          <div style={{ color: textCol }}>{children}</div>
        </div>
      </div>
    );
  }

  if (variant === 5) {
    // Washi tape note — colored tape strips top and bottom
    return (
      <div style={Object.assign({}, { position: "relative", transform: "rotate(" + rotation + "deg)" }, style || {})}>
        <div style={{ height: 6, background: accent + "44", borderRadius: 1 }} />
        <div style={{ background: bg, padding: "10px 12px", boxShadow: "1px 2px 5px rgba(0,0,0,0.3)" }}>
          <div style={{ color: textCol }}>{children}</div>
        </div>
        <div style={{ height: 6, background: accent2 + "44", borderRadius: 1 }} />
      </div>
    );
  }

  // Variant 6: Clip note — paper clip accent at top corner
  return (
    <div style={Object.assign({}, { position: "relative", transform: "rotate(" + rotation + "deg)" }, style || {})}>
      <div style={{ position: "absolute", top: -6, width: 10, height: 18, border: "2px solid " + accent, borderRadius: "5px 5px 0 0", background: "transparent", zIndex: 2, ...(seed % 2 === 0 ? { right: 14 } : { left: 14 }) }} />
      <div style={{ background: bg, padding: "10px 12px", boxShadow: "2px 3px 6px rgba(0,0,0,0.3)", border: "1px solid " + accent + "22" }}>
        <div style={{ color: textCol }}>{children}</div>
      </div>
    </div>
  );
}

// Micro-citation for sources
function MicroCite({ sources, accent }) {
  if (!sources) return null;
  return <div style={{ ...CP, fontSize: 7, color: accent ? accent + "88" : "#ffffff77", marginTop: 6, textAlign: "right", fontStyle: "italic" }}>{sources}</div>;
}

function getImg(images, idx) {
  if (!images) return null;
  var keys = Object.keys(images);
  if (keys.length === 0) return null;
  // Direct match first
  if (images[idx] && images[idx].url) return images[idx].url;
  // Cycle through available images so every slide gets one
  var cycled = keys[idx % keys.length];
  return images[cycled] && images[cycled].url ? images[cycled].url : null;
}

// --- S1 COVER (Vibe / The Source) ---
function S1Cover({ slide, category, images, edition }) {
  var p = PALETTES[category];
  var url = getImg(images, 0);
  var edLabel = edition ? edition.label : "";
  return (
    <ImgBg url={url} pal={p} category={category} slideIndex={index || 0} darken="linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.9))">
        <div style={{ position: "absolute", top: M_TOP, left: 0, right: 0, textAlign: "center", zIndex: 2 }}>
          <div style={{ ...CP, fontSize: 18, letterSpacing: "0.5em", color: p.accent + "6B", fontWeight: 700, textDecoration: "line-through", textDecorationColor: p.accent + "6B", textDecorationThickness: 1 }}>LOATHR</div>
          {edLabel && <div style={{ ...CP, fontSize: 5, letterSpacing: "0.15em", color: p.accent + "44", marginTop: 3 }}>{edLabel}</div>}
        </div>
        <div style={{ position: "absolute", bottom: M_BOT, left: M_SIDE, right: M_SIDE, zIndex: 3 }}>
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
            {slide.subtitle && <div style={{ ...HD, fontSize: 10.5, marginTop: 8, background: "linear-gradient(to right, " + p.accent + " 0%, " + p.accent + "cc 25%, " + (p.accent2 || p.accent) + "88 50%, " + (p.accent2 || p.accent) + "cc 75%, " + (p.accent2 || p.accent) + " 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{slide.subtitle}</div>}
          </div>
        </div>
      </ImgBg>
  );
}

// --- S2 CONTENT (Arena Homme+) ---
function S2Arena({ slide, index, category, images }) {
  var p = PALETTES[category];
  var url = getImg(images, index);
  var useBubble = BUBBLE_CATS[category];
  var useSticky = STICKY_CATS[category];
  var useFormal = FORMAL_CATS[category];
  var styled = useBubble || useSticky || useFormal;
  var textContent = <div>
    <div style={{ ...FN, fontSize: 13, color: useSticky ? "inherit" : "#ffffff", marginBottom: 10, letterSpacing: "0.03em", textTransform: "uppercase", textAlign: "right" }}>{slide.heading || "Part " + index}</div>
    <div style={{ ...HD, fontSize: 9.5, color: useSticky ? "inherit" : "#ffffffe6", lineHeight: 1.5, textAlign: "left" }}>{styleBody(slide.body, p.accent, p.accent2)}</div>
    {slide.specs && <div style={{ marginTop: 8, border: "1px solid " + p.accent + "44", padding: "4px 6px", background: "rgba(255,255,255,0.03)" }}><div style={{ ...WS, fontSize: 5.3, color: useSticky ? "inherit" : "#ffffffaa", textAlign: "left" }}>{slide.specs}</div></div>}
    <MicroCite sources={slide.sources} />
  </div>;
  var wrappedText = useBubble ? <BubbleBox accent={p.accent} accent2={p.accent2} seed={index}>{textContent}</BubbleBox>
    : useSticky ? <StickyNote accent={p.accent} accent2={p.accent2} seed={index}>{textContent}</StickyNote>
    : useFormal ? <FormalFrame accent={p.accent} accent2={p.accent2} seed={index}>{textContent}</FormalFrame>
    : textContent;
  var contentSeed = (slide.body || "").length + (slide.heading || "").length;
  var fpos = getFramePosition(contentSeed, index);
  return (
    <ImgBg url={url} pal={p} category={category} slideIndex={index || 0}>
      <div style={Object.assign({}, { position: "absolute", zIndex: 3 }, fpos)}>
        {wrappedText}
      </div>
      <div style={{ position: "absolute", bottom: M_PAGE, right: M_SIDE, zIndex: 4 }}>
        <div style={{ ...CP, fontSize: 7, color: "#ffffff66" }}>{String(index).padStart(2, "0")}</div>
      </div>
    </ImgBg>
  );
}

// --- S3 CONTENT (Ray Gun / 90s crash) ---
function S3RayGun({ slide, index, category, images }) {
  var p = PALETTES[category];
  var url = getImg(images, index);
  var flipped = index % 2 === 0;
  var useBubble = BUBBLE_CATS[category];
  var useSticky = STICKY_CATS[category];
  var useFormal = FORMAL_CATS[category];
  var styled = useBubble || useSticky || useFormal;

  if (flipped) {
    // Text left, image right (carousel position 5)
    var flippedText = <div>
      <div style={{ ...FN, fontSize: 12, color: useSticky ? "inherit" : "#ffffff", marginBottom: 8, letterSpacing: "0.03em", textTransform: "uppercase", textAlign: "left" }}>{slide.heading || "Part " + index}</div>
      <div style={{ ...HD, fontSize: 8.5, color: useSticky ? "inherit" : "#ffffffe6", lineHeight: 1.45, textAlign: "right", overflow: "hidden" }}>{styleBody(slide.body, p.accent2, p.accent)}</div>
      {slide.highlight && <div style={{ marginTop: 6, display: "flex", alignItems: "stretch", justifyContent: "flex-end", gap: 0 }}>
        <div style={{ ...WS, fontSize: 5.3, fontStyle: "italic", fontWeight: 700, color: "#1a1a1a", background: "#ffffff", padding: "3px 8px", boxShadow: "2px 2px 0px " + p.accent2 }}>{slide.highlight}</div>
        <div style={{ width: 3, background: p.accent2, flexShrink: 0 }} />
      </div>}
      <MicroCite sources={slide.sources} />
    </div>;
    var flippedWrapped = useBubble ? <BubbleBox accent={p.accent} accent2={p.accent2} seed={index + 1}>{flippedText}</BubbleBox>
      : useSticky ? <StickyNote accent={p.accent} accent2={p.accent2} seed={index + 1}>{flippedText}</StickyNote>
      : useFormal ? <FormalFrame accent={p.accent} accent2={p.accent2} seed={index + 1}>{flippedText}</FormalFrame>
      : flippedText;
    var fposFlip = getFramePosition((slide.body || "").length, index);
    return (
      <ImgBg url={url} pal={p} category={category} slideIndex={index || 0}>
        <div style={Object.assign({}, { position: "absolute", zIndex: 3 }, fposFlip)}>
          {flippedWrapped}
        </div>
      </ImgBg>
    );
  }

  // Image top, text bottom (carousel position 2)
  var normalText = <div>
    <div style={{ ...FN, fontSize: 12, color: useSticky ? "inherit" : "#ffffff", marginBottom: 8, letterSpacing: "0.03em", textTransform: "uppercase", textAlign: "right" }}>{slide.heading || "Part " + index}</div>
    <div style={{ ...HD, fontSize: 8.5, color: useSticky ? "inherit" : "#ffffffe6", lineHeight: 1.45, textAlign: "left", overflow: "hidden" }}>{styleBody(slide.body, p.accent, p.accent2)}</div>
    {slide.highlight && <div style={{ marginTop: 6, display: "flex", alignItems: "stretch", justifyContent: "flex-start", gap: 0 }}>
      <div style={{ width: 3, background: p.accent, flexShrink: 0 }} />
      <div style={{ ...WS, fontSize: 5.3, fontStyle: "italic", fontWeight: 700, color: "#1a1a1a", background: "#ffffff", padding: "3px 8px", boxShadow: "2px 2px 0px " + p.accent }}>{slide.highlight}</div>
    </div>}
    <MicroCite sources={slide.sources} />
  </div>;
  var normalWrapped = useBubble ? <BubbleBox accent={p.accent} accent2={p.accent2} seed={index}>{normalText}</BubbleBox>
    : useSticky ? <StickyNote accent={p.accent} accent2={p.accent2} seed={index}>{normalText}</StickyNote>
    : useFormal ? <FormalFrame accent={p.accent} accent2={p.accent2} seed={index}>{normalText}</FormalFrame>
    : normalText;
  var fposNorm = getFramePosition((slide.heading || "").length, index);
  if (styled) {
    return (
      <ImgBg url={url} pal={p} category={category} slideIndex={index || 0}>
        <div style={Object.assign({}, { position: "absolute", zIndex: 3 }, fposNorm)}>
          {normalWrapped}
        </div>
      </ImgBg>
    );
  }
  // Fallback — also uses full image
  return (
    <ImgBg url={url} pal={p} category={category} slideIndex={index || 0}>
      <div style={Object.assign({}, { position: "absolute", zIndex: 3 }, fposNorm)}>
        <FormalFrame accent={p.accent} accent2={p.accent2} seed={index}>{normalText}</FormalFrame>
      </div>
    </ImgBg>
  );
}

// Randomized stat display formats
function formatStat(value) {
  if (!value) return value;
  var str = String(value).trim();
  // If already has %, fraction, ratio etc — keep as is
  if (/[%/:×x]/.test(str)) return str;
  // Try to parse as number for formatting options
  var num = parseFloat(str.replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return str;
  var seed = Math.abs(num * 7 + str.length) % 5;
  if (seed === 0 && num > 1 && num < 100) return num + "%";
  if (seed === 1 && num > 1 && num === Math.floor(num)) return num + ":1";
  if (seed === 2 && num > 1000) return (num / 1000).toFixed(1) + "K";
  if (seed === 3 && num > 0 && num < 1) return Math.round(num * 100) + "%";
  if (seed === 4 && num > 1 && num < 20) return num + "/" + (num + Math.floor(num / 2));
  return str;
}

// Randomized stat placement layouts
var STAT_LAYOUTS = [
  // 0: stat top-left, stat2 bottom-right
  { s1: { top: "20%", left: M_SIDE, textAlign: "left" }, s2: { top: "50%", right: M_SIDE, textAlign: "right" } },
  // 1: stat top-right, stat2 center-left
  { s1: { top: "18%", right: M_SIDE, textAlign: "right" }, s2: { top: "48%", left: M_SIDE, textAlign: "left" } },
  // 2: stat center, stat2 top-right
  { s1: { top: "35%", left: "50%", transform: "translateX(-50%)", textAlign: "center" }, s2: { top: "15%", right: M_SIDE, textAlign: "right" } },
  // 3: stat bottom-left (above body), stat2 top-right
  { s1: { top: "42%", left: M_SIDE, textAlign: "left" }, s2: { top: "18%", right: M_SIDE, textAlign: "right" } },
  // 4: stat top-center, stat2 below it
  { s1: { top: "18%", left: "50%", transform: "translateX(-50%)", textAlign: "center" }, s2: { top: "42%", left: "50%", transform: "translateX(-50%)", textAlign: "center" } },
];

// --- S4 STAT (5 formats: comparison, killer, story, versus, timeline) ---
function S4Emigre({ slide, index, category, images }) {
  var p = PALETTES[category];
  var url = getImg(images, index);
  var fmt = slide.statFormat || (slide.stat2 ? "comparison" : "killer");

  // Format A: Comparison (before → after)
  if (fmt === "comparison") {
    var beforeVal = slide.before || slide.stat || "";
    var afterVal = slide.after || slide.stat2 || "";
    var beforeLbl = slide.beforeLabel || slide.statLabel || "";
    var afterLbl = slide.afterLabel || slide.stat2Label || "";
    // Dynamic font size based on longest number string
    var maxLen = Math.max(String(beforeVal).length, String(afterVal).length);
    var numSize = maxLen > 7 ? 28 : maxLen > 5 ? 34 : 42;
    return (
      <ImgBg url={url} pal={p} category={category} slideIndex={index || 0} darken="rgba(0,0,0,0.65)">
        <div style={{ position: "absolute", top: "28%", left: M_SIDE, right: M_SIDE, zIndex: 3, display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ ...WS, fontSize: numSize, color: p.accent2 || "#ffffff88", lineHeight: 0.85 }}>{beforeVal}</div>
            <div style={{ ...HD, fontSize: 7, color: "#ffffffcc", marginTop: 6, letterSpacing: "0.08em" }}>{beforeLbl}</div>
          </div>
          <div style={{ ...FN, fontSize: 28, color: p.accent, flexShrink: 0 }}>→</div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ ...WS, fontSize: numSize, color: p.accent, lineHeight: 0.85 }}>{afterVal}</div>
            <div style={{ ...HD, fontSize: 7, color: "#ffffffcc", marginTop: 6, letterSpacing: "0.08em" }}>{afterLbl}</div>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: M_BOT, left: M_SIDE, right: M_SIDE, zIndex: 3, textAlign: "center" }}>
          <FormalFrame accent={p.accent} accent2={p.accent2} seed={index + 5}>
            <div style={{ ...HD, fontSize: 8, color: "#ffffffcc", fontStyle: "italic" }}>{slide.shift || slide.body}</div>
          </FormalFrame>
          <MicroCite sources={slide.sources} />
        </div>
      </ImgBg>
    );
  }

  // Format B: Killer Number (one massive stat)
  if (fmt === "killer") {
    var killerVal = String(slide.stat || "");
    var killerSize = killerVal.length > 8 ? 36 : killerVal.length > 5 ? 48 : 64;
    return (
      <ImgBg url={url} pal={p} category={category} slideIndex={index || 0} darken="rgba(0,0,0,0.6)">
        <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 3, textAlign: "center", width: "85%" }}>
          <div style={{ ...WS, fontSize: killerSize, color: p.accent, lineHeight: 0.85, letterSpacing: -2 }}>{slide.stat}</div>
          <div style={{ ...HD, fontSize: 9, color: "#ffffffcc", marginTop: 12, lineHeight: 1.5 }}>{slide.caption || slide.statLabel || slide.body}</div>
        </div>
        <div style={{ position: "absolute", bottom: M_BOT, right: M_SIDE, zIndex: 3 }}>
          <MicroCite sources={slide.sources} />
        </div>
      </ImgBg>
    );
  }

  // Format C: Data Story (3 connected numbers)
  if (fmt === "story") {
    var stats = slide.stats || [{ num: slide.stat, label: slide.statLabel }, { num: slide.stat2, label: slide.stat2Label }, { num: "—", label: "—" }];
    return (
      <ImgBg url={url} pal={p} category={category} slideIndex={index || 0} darken="rgba(0,0,0,0.7)">
        <div style={{ position: "absolute", top: "18%", left: M_SIDE, right: M_SIDE, zIndex: 3 }}>
          {stats.slice(0, 3).map(function(s, i) {
            var c = i % 2 === 0 ? p.accent : p.accent2;
            return <div key={i} style={{ marginBottom: 14, display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={{ ...CP, fontSize: 7, color: "#ffffff44" }}>{String(i + 1).padStart(2, "0")}</div>
              <div>
                <div style={{ ...WS, fontSize: 28, color: c, lineHeight: 0.9 }}>{s.num}</div>
                <div style={{ ...HD, fontSize: 6, color: "#ffffffaa", marginTop: 2, letterSpacing: "0.08em" }}>{s.label}</div>
              </div>
            </div>;
          })}
        </div>
        <div style={{ position: "absolute", bottom: M_BOT, left: M_SIDE, right: M_SIDE, zIndex: 3 }}>
          <FormalFrame accent={p.accent} accent2={p.accent2} seed={index}>
            <div style={{ ...HD, fontSize: 8, color: "#ffffffcc", fontStyle: "italic" }}>{slide.narrative || slide.body}</div>
          </FormalFrame>
          <MicroCite sources={slide.sources} />
        </div>
      </ImgBg>
    );
  }

  // Format D: Versus (side by side comparison)
  if (fmt === "versus") {
    var lStat = slide.leftStat || slide.stat || "";
    var rStat = slide.rightStat || slide.stat2 || "";
    var vsMaxLen = Math.max(String(lStat).length, String(rStat).length);
    var vsSize = vsMaxLen > 7 ? 24 : vsMaxLen > 5 ? 30 : 36;
    return (
      <ImgBg url={url} pal={p} category={category} slideIndex={index || 0} darken="rgba(0,0,0,0.65)">
        <div style={{ position: "absolute", top: "20%", left: M_SIDE, right: M_SIDE, zIndex: 3, display: "flex" }}>
          <div style={{ flex: 1, textAlign: "center", borderRight: "1px solid " + p.accent + "44", paddingRight: 8 }}>
            <div style={{ ...FN, fontSize: 10, color: "#ffffffcc", textTransform: "uppercase", marginBottom: 6 }}>{slide.left || "A"}</div>
            <div style={{ ...WS, fontSize: vsSize, color: p.accent, lineHeight: 0.85 }}>{lStat}</div>
            <div style={{ ...HD, fontSize: 7, color: "#ffffffcc", marginTop: 6 }}>{slide.leftLabel || slide.statLabel}</div>
          </div>
          <div style={{ flex: 1, textAlign: "center", paddingLeft: 8 }}>
            <div style={{ ...FN, fontSize: 10, color: "#ffffffcc", textTransform: "uppercase", marginBottom: 6 }}>{slide.right || "B"}</div>
            <div style={{ ...WS, fontSize: vsSize, color: p.accent2 || p.accent, lineHeight: 0.85 }}>{rStat}</div>
            <div style={{ ...HD, fontSize: 7, color: "#ffffffcc", marginTop: 6 }}>{slide.rightLabel || slide.stat2Label}</div>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: M_BOT, left: M_SIDE, right: M_SIDE, zIndex: 3, textAlign: "center" }}>
          <FormalFrame accent={p.accent} accent2={p.accent2} seed={index + 6}>
            <div style={{ ...HD, fontSize: 9, color: p.accent, fontWeight: 700 }}>{slide.verdict || slide.body}</div>
          </FormalFrame>
          <MicroCite sources={slide.sources} />
        </div>
      </ImgBg>
    );
  }

  // Format E: Timeline Number (year-anchored stat)
  return (
    <ImgBg url={url} pal={p} category={category} slideIndex={index || 0} darken="rgba(0,0,0,0.6)">
      <div style={{ position: "absolute", top: "22%", left: "50%", transform: "translateX(-50%)", zIndex: 3, textAlign: "center" }}>
        <div style={{ ...CP, fontSize: 10, color: "#ffffff44", letterSpacing: "0.3em" }}>{slide.year || ""}</div>
      </div>
      <div style={{ position: "absolute", top: "38%", left: "50%", transform: "translateX(-50%)", zIndex: 3, textAlign: "center", width: "80%" }}>
        <div style={{ ...WS, fontSize: 52, color: p.accent, lineHeight: 0.85 }}>{slide.stat}</div>
        <div style={{ ...HD, fontSize: 7, color: "#ffffffaa", marginTop: 6, letterSpacing: "0.1em" }}>{slide.statLabel}</div>
      </div>
      <div style={{ position: "absolute", bottom: M_BOT, left: M_SIDE, right: M_SIDE, zIndex: 3 }}>
        <FormalFrame accent={p.accent} accent2={p.accent2} seed={index + 3}>
          <div style={{ ...HD, fontSize: 8, color: "#ffffffcc", textAlign: "center" }}>{slide.context || slide.body}</div>
        </FormalFrame>
        <MicroCite sources={slide.sources} />
      </div>
    </ImgBg>
  );
}

// --- S5 CONTENT (i-D / The Face / 80s grid) ---
function S5Face({ slide, index, category, images }) {
  var p = PALETTES[category];
  var url = getImg(images, index);
  var useBubble = BUBBLE_CATS[category];
  var useSticky = STICKY_CATS[category];
  var useFormal = FORMAL_CATS[category];
  var styled = useBubble || useSticky || useFormal;
  var s5Text = <div style={{ overflow: "hidden" }}>
    <div style={{ ...HD, fontSize: 8.5, color: useSticky ? "inherit" : "#ffffffe6", lineHeight: 1.45, textAlign: "right" }}>{styleBody(slide.body, p.accent, p.accent2)}</div>
    {!styled && <div style={{ width: "100%", height: 1, background: p.accent + "33", margin: "6px 0" }} />}
    {slide.highlight && <div style={{ marginTop: 6, display: "flex", alignItems: "stretch", justifyContent: "flex-end", gap: 0 }}>
      <div style={{ ...WS, fontSize: 5.3, fontStyle: "italic", fontWeight: 700, color: "#1a1a1a", background: "#ffffff", padding: "3px 8px", boxShadow: "2px 2px 0px " + p.accent2 }}>{slide.highlight}</div>
      <div style={{ width: 3, background: p.accent2, flexShrink: 0 }} />
    </div>}
  </div>;
  var s5Wrapped = useBubble ? <BubbleBox accent={p.accent} accent2={p.accent2} seed={index + 2}>{s5Text}</BubbleBox>
    : useSticky ? <StickyNote accent={p.accent} accent2={p.accent2} seed={index + 2}>{s5Text}</StickyNote>
    : useFormal ? <FormalFrame accent={p.accent} accent2={p.accent2} seed={index + 2}>{s5Text}</FormalFrame>
    : s5Text;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#0a0a0a" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: M_TOP + 5, background: p.accent, display: "flex", alignItems: "center", padding: "0 " + M_SIDE + "px", zIndex: 4 }}>
        <span style={{ ...FN, fontSize: 8, color: "#000000", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>{slide.heading || "Section"}</span>
        <span style={{ flex: 1 }} />
        {slide.year && <span style={{ ...CP, fontSize: 7, color: "#000000", fontWeight: 700 }}>{slide.year}</span>}
      </div>
      {styled ? (
        <div style={{ position: "absolute", top: M_TOP + 5, left: 0, right: 0, bottom: 0 }}>
          {url && <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) brightness(0.75)" }} onError={function(e) { e.target.style.display = "none"; }} />}
          {!url && <div style={{ width: "100%", height: "100%", position: "relative" }}><EditorialFill pal={p} category={category} /></div>}
          <div style={{ position: "absolute", bottom: M_BOT, right: M_SIDE, left: "50%", zIndex: 3 }}>
            {s5Wrapped}
          </div>
        </div>
      ) : (
        <div style={{ position: "absolute", top: M_TOP + 5, left: 0, right: 0, bottom: 0 }}>
          {url && <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) brightness(0.75)" }} onError={function(e) { e.target.style.display = "none"; }} />}
          {!url && <div style={{ width: "100%", height: "100%", position: "relative" }}><EditorialFill pal={p} category={category} /></div>}
          <div style={{ position: "absolute", bottom: M_BOT, right: M_SIDE, left: "50%", zIndex: 3 }}>
            <FormalFrame accent={p.accent} accent2={p.accent2} seed={index + 2}>{s5Text}</FormalFrame>
          </div>
        </div>
      )}
      <div style={{ position: "absolute", bottom: M_PAGE, right: M_SIDE, zIndex: 5 }}>
        <div style={{ ...CP, fontSize: 7, color: "#ffffff66" }}>{String(index).padStart(2, "0")}</div>
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
    <ImgBg url={url} pal={p} category={category} slideIndex={index || 0}>
      <div style={Object.assign({}, { position: "absolute", zIndex: 3 }, getFramePosition(quoteText.length, index))}>
        <FormalFrame accent={p.accent} accent2={p.accent2} seed={index + 4}>
          <div style={{ ...HD, fontSize: 11.5, fontStyle: "italic", color: "#ffffffdd", lineHeight: 1.5, textAlign: "left" }}>{quoteText.charAt(0) === '"' ? quoteText : '"' + quoteText + '"'}</div>
          <div style={{ width: 12, height: 1, background: p.accent + "66", margin: "8px 0 8px auto" }} />
          {slide.source && <div style={{ ...WS, fontSize: 5, color: p.accent + "99", letterSpacing: "0.08em", textAlign: "right" }}>{"— " + slide.source}</div>}
        </FormalFrame>
      </div>
    </ImgBg>
  );
}

// --- S7 CLOSER (Blitz geometric fade) ---
function S7Blitz({ category, hashtags, images }) {
  var p = PALETTES[category];
  var keys = images ? Object.keys(images) : [];
  var url = getImg(images, keys.length > 1 ? keys.length - 1 : 0);
  return (
    <ImgBg url={url} pal={p} category={category} slideIndex={index || 0} darken="rgba(0,0,0,0.75)">
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", zIndex: 3 }}>
        <div style={{ ...CP, fontSize: 7, letterSpacing: "0.25em", color: p.accent + "99" }}>{CLOSER_TAGS[category]}</div>
        <div style={{ position: "relative", display: "inline-block", marginTop: 10 }}>
          <div style={{ ...CP, fontSize: 10, letterSpacing: "0.35em", color: "#ffffffbb", fontWeight: 700 }}>
            <span>LO</span><span style={{ position: "relative" }}>A<span style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, display: "block", background: p.accent }} /></span><span style={{ position: "relative" }}>T<span style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, display: "block", background: p.accent2 }} /></span><span>HR</span>
          </div>
        </div>
      </div>
    </ImgBg>
  );
}

// --- REC SLIDES (LOATHR Recommends) ---

// Rec Slide 1: Destination Card
function RecDestination({ slide, category, images }) {
  var p = PALETTES[category];
  var url = getImg(images, 0);
  return (
    <ImgBg url={url} pal={p} category={category} slideIndex={index || 0} darken="linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.9))">
      <div style={{ position: "absolute", top: M_TOP, left: M_SIDE, zIndex: 3 }}>
        <div style={{ ...CP, fontSize: 6, letterSpacing: "0.2em", color: p.accent + "99" }}>LOATHR RECOMMENDS</div>
      </div>
      <div style={{ position: "absolute", bottom: M_BOT, left: M_SIDE, right: M_SIDE, zIndex: 3 }}>
        <div style={{ ...FN, fontSize: 24, color: "#ffffff", lineHeight: 1.05, textTransform: "uppercase" }}>{slide.title}</div>
        <div style={{ ...HD, fontSize: 9, color: "#ffffffcc", marginTop: 6, lineHeight: 1.5 }}>{slide.subtitle}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <div style={{ ...CP, fontSize: 6, color: "#000", background: p.accent, padding: "2px 6px" }}>{slide.mood || category}</div>
          {slide.city && <div style={{ ...CP, fontSize: 6, color: "#000", background: p.accent2, padding: "2px 6px" }}>{slide.city}</div>}
        </div>
      </div>
    </ImgBg>
  );
}

// Rec Slide 2: Hidden Gem
function RecHiddenGem({ slide, category, images }) {
  var p = PALETTES[category];
  var url = getImg(images, 1);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#000000" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "55%", borderBottom: "2px solid " + p.accent }}>
        {url && <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) brightness(0.75)" }} onError={function(e) { e.target.style.display = "none"; }} />}
        {!url && <div style={{ width: "100%", height: "100%", position: "relative" }}><EditorialFill pal={p} category={category} /></div>}
        <div style={{ position: "absolute", top: 8, left: M_SIDE, zIndex: 2 }}>
          <div style={{ ...CP, fontSize: 6, color: "#000", background: p.accent, padding: "2px 6px", display: "inline-block" }}>HIDDEN GEM</div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "#000000", padding: M_TOP + "px " + M_SIDE + "px " + M_BOT + "px", overflow: "hidden" }}>
        <div style={{ ...FN, fontSize: 13, color: "#ffffff", textTransform: "uppercase" }}>{slide.name}</div>
        <div style={{ ...WS, fontSize: 5.3, color: p.accent + "cc", marginTop: 2 }}>{slide.neighborhood}</div>
        <div style={{ ...HD, fontSize: 8, color: "#ffffffdd", marginTop: 6, fontStyle: "italic", lineHeight: 1.5, borderLeft: "3px solid " + p.accent, paddingLeft: 6 }}>{slide.hook}</div>
        <div style={{ ...HD, fontSize: 8, color: "#ffffffbb", marginTop: 6, lineHeight: 1.4 }}>{slide.body}</div>
        {slide.detail && <div style={{ marginTop: 6, border: "1px solid " + p.accent + "44", padding: "3px 6px", background: "rgba(255,255,255,0.03)", display: "inline-block" }}><div style={{ ...WS, fontSize: 5, color: "#ffffffaa" }}>{slide.established} · {slide.detail}{slide.priceRange ? " · " + slide.priceRange : ""}</div></div>}
      </div>
    </div>
  );
}

// Rec Slide 3: New Opening
function RecNewOpening({ slide, category, images }) {
  var p = PALETTES[category];
  var url = getImg(images, 2);
  return (
    <ImgBg url={url} pal={p} category={category} slideIndex={index || 0} darken="linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.92))">
      <div style={{ position: "absolute", top: M_TOP, right: M_SIDE, zIndex: 3 }}>
        <div style={{ ...CP, fontSize: 6, color: "#000", background: p.accent2, padding: "2px 6px", display: "inline-block" }}>JUST OPENED</div>
      </div>
      <div style={{ position: "absolute", bottom: M_BOT, left: M_SIDE, right: M_SIDE, zIndex: 3 }}>
        <div style={{ ...FN, fontSize: 14, color: "#ffffff", textTransform: "uppercase", textAlign: "right" }}>{slide.name}</div>
        <div style={{ ...WS, fontSize: 5.3, color: p.accent2 + "cc", textAlign: "right", marginTop: 2 }}>{slide.neighborhood}</div>
        <div style={{ ...HD, fontSize: 8, color: "#ffffffcc", marginTop: 8, lineHeight: 1.4, textAlign: "left" }}>{slide.body}</div>
        {slide.quote && <div style={{ ...HD, fontSize: 8, fontStyle: "italic", color: "#ffffffdd", marginTop: 6, borderRight: "3px solid " + p.accent2, paddingRight: 6, textAlign: "right", lineHeight: 1.5 }}>"{slide.quote}"</div>}
        {slide.source && <div style={{ ...WS, fontSize: 5, color: p.accent2 + "99", textAlign: "right", marginTop: 2 }}>{"— " + slide.source}</div>}
        {slide.detail && <div style={{ marginTop: 6, border: "1px solid " + p.accent2 + "44", padding: "3px 6px", background: "rgba(255,255,255,0.03)", display: "inline-block" }}><div style={{ ...WS, fontSize: 5, color: "#ffffffaa" }}>{slide.opened} · {slide.style}{slide.detail ? " · " + slide.detail : ""}</div></div>}
      </div>
    </ImgBg>
  );
}

// Rec Slide 4: Culture Read
function RecCulture({ slide, category, images }) {
  var p = PALETTES[category];
  var url = getImg(images, 3);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden", background: "#000000" }}>
      <div style={{ width: "45%", position: "relative", borderRight: "2px solid " + p.accent }}>
        {url && <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) brightness(0.75)" }} onError={function(e) { e.target.style.display = "none"; }} />}
        {!url && <div style={{ width: "100%", height: "100%", position: "relative" }}><EditorialFill pal={p} category={category} /></div>}
        <div style={{ position: "absolute", bottom: 8, left: 8, zIndex: 2 }}>
          <div style={{ ...CP, fontSize: 6, color: "#000", background: p.accent, padding: "2px 6px" }}>CULTURE</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: M_TOP + "px " + M_SIDE + "px " + M_BOT + "px", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ ...FN, fontSize: 12, color: "#ffffff", textTransform: "uppercase", lineHeight: 1.1, marginBottom: 8 }}>{slide.headline}</div>
        <div style={{ ...HD, fontSize: 8, color: "#ffffffcc", lineHeight: 1.45, textAlign: "right" }}>{slide.body}</div>
        {slide.stat && <div style={{ marginTop: 8, borderTop: "1px solid " + p.accent + "33", paddingTop: 6 }}>
          <div style={{ ...WS, fontSize: 20, color: p.accent, fontWeight: 700 }}>{slide.stat}</div>
          <div style={{ ...HD, fontSize: 5.3, color: "#ffffffaa", marginTop: 2 }}>{slide.statLabel}</div>
        </div>}
      </div>
    </div>
  );
}

// Rec Slide 5: The Shortlist + Closer
function RecShortlist({ slide, category, images }) {
  var p = PALETTES[category];
  var url = getImg(images, 4);
  var items = slide.shortlist || [];
  return (
    <ImgBg url={url} pal={p} category={category} slideIndex={index || 0} darken="rgba(0,0,0,0.82)">
      <div style={{ position: "absolute", top: M_TOP, left: M_SIDE, right: M_SIDE, zIndex: 3 }}>
        <div style={{ ...FN, fontSize: 14, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.05em" }}>The Shortlist</div>
        <div style={{ width: "20%", height: 2, background: p.accent, marginTop: 6 }} />
      </div>
      <div style={{ position: "absolute", top: "22%", left: M_SIDE, right: M_SIDE, zIndex: 3 }}>
        {items.map(function(item, i) {
          var c = i % 2 === 0 ? p.accent : p.accent2;
          return <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <div style={{ ...WS, fontSize: 18, color: c, fontWeight: 700, lineHeight: 1 }}>{String(i + 1).padStart(2, "0")}</div>
              <div>
                <div style={{ ...FN, fontSize: 10, color: "#ffffff", textTransform: "uppercase" }}>{item.name}</div>
                <div style={{ ...WS, fontSize: 5.3, color: "#ffffffaa" }}>{item.neighborhood} · {item.type}</div>
              </div>
            </div>
          </div>;
        })}
      </div>
      <div style={{ position: "absolute", bottom: M_BOT, left: M_SIDE, right: M_SIDE, zIndex: 3, textAlign: "center" }}>
        <div style={{ width: "40%", height: 1, background: p.accent + "33", margin: "0 auto 8px" }} />
        <div style={{ ...CP, fontSize: 6, letterSpacing: "0.2em", color: p.accent + "88" }}>LOATHR RECOMMENDS</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 4 }}>
          <div style={{ width: 5, height: 5, background: p.accent }} />
          <div style={{ width: 5, height: 5, background: p.accent2 }} />
        </div>
        {slide.tags && <div style={{ ...CP, fontSize: 5, color: "#ffffff44", marginTop: 4 }}>{slide.tags}</div>}
      </div>
    </ImgBg>
  );
}

// Rec Slide Renderer
function RecSlideRenderer({ category, slideData, slideIndex, totalSlides, images }) {
  var p = PALETTES[category];
  var borderColor = slideIndex % 2 === 0 ? p.accent : p.accent2;
  var slide;
  if (slideIndex === 0) slide = <RecDestination slide={slideData} category={category} images={images} />;
  else if (slideIndex === 1) slide = <RecHiddenGem slide={slideData} category={category} images={images} />;
  else if (slideIndex === 2) slide = <RecNewOpening slide={slideData} category={category} images={images} />;
  else if (slideIndex === 3) slide = <RecCulture slide={slideData} category={category} images={images} />;
  else slide = <RecShortlist slide={slideData} category={category} images={images} />;
  return (
    <div style={{ width: "100%", height: "100%", border: "2px solid " + borderColor, overflow: "hidden" }}>
      {slide}
    </div>
  );
}

// --- SLIDE RENDERER ---
function SlideRenderer({ category, slideData, slideIndex, totalSlides, images, edition }) {
  var p = PALETTES[category];
  var lastIdx = totalSlides - 1;
  var borderColor = slideIndex % 2 === 0 ? p.accent : p.accent2;
  // 10-slide layout: Cover, Origin, Turning Point, Hot Take, Human, Evidence, Voice, Ripple, Now, Closer
  var slide;
  if (slideIndex === lastIdx) slide = <S7Blitz category={category} hashtags={slideData.hashtags || ""} images={images} />;
  else if (slideIndex === 0) slide = <S1Cover slide={slideData} category={category} images={images} edition={edition} />;
  else if (slideData.statFormat || slideData.stat) slide = <S4Emigre slide={slideData} index={slideIndex} category={category} images={images} />;
  else if (slideData.quote) slide = <S6Purple slide={slideData} index={slideIndex} category={category} images={images} />;
  else {
    // Rotate visual layouts across content slides
    var layouts = [S3RayGun, S5Face, S2Arena];
    var pick = (slideIndex - 1) % layouts.length;
    var Component = layouts[pick];
    slide = <Component slide={slideData} index={slideIndex} category={category} images={images} />;
  }
  return (
    <div style={{ width: "100%", height: "100%", border: "2px solid " + borderColor, overflow: "hidden" }}>
      {slide}
    </div>
  );
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

// --- VINTAGE/PUBLIC DOMAIN IMAGE APIs (all free, no keys) ---

var fetchWithTimeout = function(url, ms) {
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, ms || 5000);
  return fetch(url, { signal: controller.signal }).then(function(r) { clearTimeout(timer); return r; }).catch(function(e) { clearTimeout(timer); throw e; });
};

var searchMetMuseum = async function(query) {
  try {
    var r = await fetchWithTimeout("https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=" + encodeURIComponent(query), 5000);
    if (!r.ok) return [];
    var d = await r.json();
    var ids = (d.objectIDs || []).slice(0, 4);
    var results = [];
    for (var i = 0; i < ids.length; i++) {
      try {
        var obj = await fetchWithTimeout("https://collectionapi.metmuseum.org/public/collection/v1/objects/" + ids[i], 3000);
        var item = await obj.json();
        if (item.primaryImage) results.push({ url: item.primaryImage, thumb: item.primaryImageSmall || item.primaryImage, alt: item.title || query, credit: item.artistDisplayName || "Met Museum", source: "Met Museum" });
      } catch (e) { /* skip */ }
      if (results.length >= 3) break;
    }
    return results;
  } catch (e) { return []; }
};

var searchArtChicago = async function(query) {
  try {
    var r = await fetchWithTimeout("https://api.artic.edu/api/v1/artworks/search?q=" + encodeURIComponent(query) + "&limit=6&fields=id,title,image_id,artist_title");
    if (!r.ok) return [];
    var d = await r.json();
    return (d.data || []).filter(function(item) { return item.image_id; }).slice(0, 4).map(function(item) {
      return { url: "https://www.artic.edu/iiif/2/" + item.image_id + "/full/843,/0/default.jpg", thumb: "https://www.artic.edu/iiif/2/" + item.image_id + "/full/200,/0/default.jpg", alt: item.title || query, credit: item.artist_title || "Art Institute Chicago", source: "AIC" };
    });
  } catch (e) { return []; }
};

var searchLibCongress = async function(query) {
  try {
    var r = await fetchWithTimeout("https://www.loc.gov/search/?q=" + encodeURIComponent(query) + "&fo=json&fa=online-format:image&c=6");
    if (!r.ok) return [];
    var d = await r.json();
    return (d.results || []).filter(function(item) { return item.image_url && item.image_url.length > 0; }).slice(0, 4).map(function(item) {
      var img = item.image_url[item.image_url.length - 1];
      return { url: img, thumb: item.image_url[0] || img, alt: item.title || query, credit: "Library of Congress", source: "LOC" };
    });
  } catch (e) { return []; }
};

var searchNASA = async function(query) {
  try {
    var r = await fetchWithTimeout("https://images-api.nasa.gov/search?q=" + encodeURIComponent(query) + "&media_type=image");
    if (!r.ok) return [];
    var d = await r.json();
    return (d.collection && d.collection.items || []).slice(0, 4).map(function(item) {
      var link = item.links && item.links[0] ? item.links[0].href : null;
      var data = item.data && item.data[0] ? item.data[0] : {};
      return { url: link, thumb: link, alt: data.title || query, credit: data.photographer || "NASA", source: "NASA" };
    }).filter(function(img) { return img.url; });
  } catch (e) { return []; }
};

var searchEuropeana = async function(query) {
  try {
    var r = await fetchWithTimeout("https://api.europeana.eu/record/v2/search.json?query=" + encodeURIComponent(query) + "&rows=6&media=true&thumbnail=true&wskey=apidemo");
    if (!r.ok) return [];
    var d = await r.json();
    return (d.items || []).filter(function(item) { return item.edmIsShownBy && item.edmIsShownBy[0]; }).slice(0, 4).map(function(item) {
      return { url: item.edmIsShownBy[0], thumb: item.edmPreview ? item.edmPreview[0] : item.edmIsShownBy[0], alt: item.title ? item.title[0] : query, credit: item.dataProvider ? item.dataProvider[0] : "Europeana", source: "Europeana" };
    });
  } catch (e) { return []; }
};

// Category-to-vintage-API mapping
var VINTAGE_APIS = {
  film: [searchLibCongress, searchMetMuseum],
  photo: [searchMetMuseum, searchArtChicago],
  sports: [searchLibCongress, searchEuropeana],
  trivia: [searchLibCongress, searchNASA],
  art: [searchMetMuseum, searchArtChicago],
  fashion: [searchMetMuseum, searchEuropeana],
  food: [searchEuropeana, searchLibCongress],
  nightlife: [searchLibCongress, searchEuropeana],
};

// Search vintage APIs for a category
// Broader search terms for vintage APIs (specific topics fail on archival databases)
var VINTAGE_TERMS = {
  film: ["cinema", "movie poster", "film noir", "theater"],
  photo: ["photography", "camera", "portrait", "landscape"],
  sports: ["athletics", "stadium", "competition", "sports"],
  trivia: ["science", "discovery", "map", "invention"],
  art: ["painting", "sculpture", "music", "art"],
  fashion: ["fashion", "costume", "textile", "dress"],
  food: ["food", "kitchen", "restaurant", "dining"],
  nightlife: ["dance", "jazz", "nightclub", "poster"],
};

var searchVintage = async function(category, query) {
  var apis = VINTAGE_APIS[category] || [searchMetMuseum, searchLibCongress];
  var terms = VINTAGE_TERMS[category] || ["art"];
  var results = [];
  for (var i = 0; i < apis.length; i++) {
    if (results.length >= 6) break;
    // Use broad category terms instead of specific topic
    var searchTerm = terms[i % terms.length] + " " + query.split(" ").slice(0, 2).join(" ");
    try {
      var imgs = await apis[i](searchTerm);
      results = results.concat(imgs);
    } catch (e) {
      // Fallback: try with just the category term
      try {
        var fallback = await apis[i](terms[i % terms.length]);
        results = results.concat(fallback);
      } catch (e2) { /* continue */ }
    }
  }
  return results.slice(0, 8);
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
function buildPrompt(catLabel, topic, editionSeed, picks) {
  var p = picks || { persona: -1, angle: -1, style: -1, emphasis: "balanced" };
  var persona = p.persona >= 0 ? PERSONAS[p.persona] : pickPersona(editionSeed || 0);
  var freshness = p.angle >= 0 ? FRESHNESS_SEEDS[p.angle] : pickFreshness(editionSeed || 0);
  var style = p.style >= 0 ? WRITING_STYLES[p.style] : pickWritingStyle(editionSeed || 0);
  var emph = p.emphasis || "balanced";
  var emphasisInstr = "";
  if (emph === "deep") emphasisInstr = "\nEMPHASIS: Lean heavily into educational depth. More research, more detail, more context on every slide. The Origin and Human Story slides should be especially thorough.";
  else if (emph === "hot") emphasisInstr = "\nEMPHASIS: Lean heavily into provocative, shareable opinions. Every slide should have an edge. The Hot Take and The Now slides should be especially bold and confrontational.";
  else if (emph === "timeline") emphasisInstr = "\nEMPHASIS: Lean heavily into chronological narrative. Include specific years on as many slides as possible. Frame each slide as a distinct era or moment in time.";
  else if (emph === "narrative") emphasisInstr = "\nEMPHASIS: Lean heavily into storytelling. Every slide should read like a chapter. Use scene-setting, character, conflict, and resolution across the carousel.";
  else if (emph === "data") emphasisInstr = "\nEMPHASIS: Lean heavily into data and evidence. Include specific numbers, percentages, or statistics on every slide possible. Let the data drive the narrative.";

  return persona.voice + "\n\nYou are writing for LOATHR, an editorial Instagram brand.\nCategory: \"" + catLabel + "\"\nTopic: \"" + topic + "\"\n\nEDITORIAL ANGLE: " + freshness + "\nWRITING STYLE for content slides: " + style + emphasisInstr + "\n\nCreate a 10-SLIDE editorial carousel. This is a magazine issue — each slide has a SPECIFIC editorial role. NEVER repeat information between slides.\n\nSLIDE STRUCTURE:\n- Slide 0 \"COVER\": title (compelling, not generic), subtitle (one evocative sentence), heading (sub-topic tag)\n- Slide 1 \"THE ORIGIN\": The backstory nobody knows. heading, body, highlight, sources. Deep Dive tone.\n- Slide 2 \"THE TURNING POINT\": The single moment that changed everything. heading, year (REQUIRED like \"1973\"), body, highlight, sources. Timeline tone.\n- Slide 3 \"THE HOT TAKE\": A provocative opinion or uncomfortable truth. heading, body (SHORT, punchy, 2 sentences max), highlight, sources. Hot Take tone.\n- Slide 4 \"THE HUMAN STORY\": A specific person, decision, or conflict at the center. heading, body, highlight, sources. Deep Dive tone.\n- Slide 5 \"THE EVIDENCE\": Choose the BEST stat format for this topic:\n  FORMAT A (Comparison): statFormat \"comparison\", before, beforeLabel, after, afterLabel, shift (one sentence explaining what changed)\n  FORMAT B (Killer Number): statFormat \"killer\", stat (one massive number), caption (two-line caption that makes the reader stop)\n  FORMAT C (Data Story): statFormat \"story\", stats (array of 3 objects: [{num, label}]), narrative (one sentence connecting all three)\n  FORMAT D (Versus): statFormat \"versus\", left, leftLabel, leftStat, right, rightLabel, rightStat, verdict (one bold sentence)\n  FORMAT E (Timeline Number): statFormat \"timeline\", year, stat, statLabel, context (one sentence anchoring the number to the moment)\n  Pick whichever format makes the data most impactful. Include sources.\n- Slide 6 \"THE VOICE\": A powerful quote from someone who lived it. quote, source (person name), sources.\n- Slide 7 \"THE RIPPLE EFFECT\": An unexpected consequence — how this impacted culture, money, or identity. heading, body, highlight, sources. Deep Dive tone.\n- Slide 8 \"THE NOW\": Where this stands today + a prediction or challenge. heading, body (provocative), highlight, sources. Hot Take tone.\n- Slide 9 \"CLOSER\": hashtags string\n\nIMPORTANT: Include a 'sources' field on each content slide with 1-2 brief real citations like 'MIT, 2023' or 'via The Guardian'.\n\nRespond ONLY with valid JSON, no markdown:\n{\"angle\":\"Edition\",\"slides\":[{...10 slides...}]}";
}

function buildRecPrompt(catLabel, topic) {
  return "You are a senior editorial content strategist for LOATHR, an Instagram lifestyle brand.\nCategory: \"" + catLabel + "\"\nCity/Topic: \"" + topic + "\"\n\nCreate a LOATHR RECOMMENDS editorial guide — a 5-slide carousel about food, drink, and nightlife in this location or topic.\n\nUse web search if available to find REAL venues, real openings, real cultural context. Do NOT hallucinate venue names.\n\nReturn ONLY valid JSON with this exact structure:\n{\n  \"destination\": { \"title\": \"City/Scene Name\", \"subtitle\": \"One evocative sentence about the destination\", \"mood\": \"food or nightlife\", \"city\": \"City\" },\n  \"hiddenGem\": { \"name\": \"Venue Name\", \"neighborhood\": \"Area, City\", \"hook\": \"One evocative sentence (what makes it special)\", \"body\": \"2-3 sentences cultural context\", \"established\": \"Est. 2019\", \"detail\": \"Walk-in only\", \"priceRange\": \"$$$\" },\n  \"newOpening\": { \"name\": \"Venue Name\", \"neighborhood\": \"Area, City\", \"body\": \"2-3 sentences about the venue and chef/owner\", \"quote\": \"A quote from a review or the chef\", \"source\": \"Person Name\", \"opened\": \"Opened 2025\", \"style\": \"Modern Japanese\", \"detail\": \"Reservations required\" },\n  \"culture\": { \"headline\": \"Why City Owns This Scene\", \"body\": \"3-4 sentences on history, immigration, economics shaping the scene\", \"stat\": \"3,200\", \"statLabel\": \"izakayas in Tokyo alone\" },\n  \"shortlist\": [\n    { \"name\": \"Venue 1\", \"neighborhood\": \"Area\", \"type\": \"Cuisine/Type\" },\n    { \"name\": \"Venue 2\", \"neighborhood\": \"Area\", \"type\": \"Cuisine/Type\" },\n    { \"name\": \"Venue 3\", \"neighborhood\": \"Area\", \"type\": \"Cuisine/Type\" }\n  ],\n  \"tags\": \"#hashtags #relevant #to #topic\"\n}\n\nRespond ONLY with valid JSON, no markdown.";
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
  var rms = _s(false), isRecMode = rms[0], setIsRecMode = rms[1];
  var eds = _s(null), editionData = eds[0], setEditionData = eds[1];
  var eps = _s({ persona: -1, angle: -1, style: -1, emphasis: "balanced" }), editionPicks = eps[0], setEditionPicks = eps[1];
  var ess = _s(false), showEditionSettings = ess[0], setShowEditionSettings = ess[1];
  var slideRef = _ref(null);
  var abortRef = _ref(null);

  _ef(function() {
    var l = document.createElement("link"); l.href = FONT_URL; l.rel = "stylesheet"; document.head.appendChild(l);
    // Preload custom fonts for immediate availability
    var fonts = ["/Fonts/Foun/OpenType-TT/Foun.ttf", "/Fonts/Wenssep/Wenssep.ttf", "/Fonts/Maheni/Maheni-Regular.ttf"];
    fonts.forEach(function(f) {
      var p = document.createElement("link"); p.rel = "preload"; p.href = f; p.as = "font"; p.type = "font/ttf"; p.crossOrigin = "anonymous"; document.head.appendChild(p);
    });
  }, []);

  var cat = CATEGORIES.find(function(c) { return c.id === category; });
  var pal = category ? PALETTES[category] : null;
  // UI-safe accent color (grey for photo since white/black disappear on UI)
  var uiAccent = category === "photo" ? "#888888" : (pal ? pal.accent : "#888888");
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
    var catContext = { film: "film, TV, cinema, streaming, directing", photo: "photography, cameras, visual storytelling", sports: "sports with music, fashion, art, culture", trivia: "surprising facts, science discoveries, cultural oddities", art: "music, visual arts, album releases, art history", fashion: "fashion, luxury brands, streetwear, designers, runway, style trends", food: "food, restaurants, chefs, cocktails, dining culture, culinary trends", nightlife: "nightlife, clubs, DJs, bars, parties, after-dark culture" };
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

  var cancelGenerate = _cb(function() {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setIsGenerating(false); setError("Generation cancelled");
  }, []);

  var generate = _cb(async function() {
    if (!topic.trim() || !category) return;
    if (abortRef.current) abortRef.current.abort();
    var controller = new AbortController();
    abortRef.current = controller;
    setIsGenerating(true); setError(null); setOptions(null); setImages({});
    setSelectedOption(0); setCurrentSlide(0); setImgStatus(null);
    var catInfo = CATEGORIES.find(function(c) { return c.id === category; });
    var edition = getEditionId(topic, category);
    setEditionData(edition);
    try {
      if (controller.signal.aborted) throw new Error("Generation cancelled");
      var prompt = buildPrompt(catInfo.label, topic, edition.seed, editionPicks);
      var r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 6000, messages: [{ role: "user", content: prompt }] }) });
      var d = await r.json();
      if (d.error) throw new Error(d.error.message || d.error);
      var text = (d.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text; }).join("");
      var cleaned = text.replace(/```json|```/g, "").trim();
      cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
      // Extract JSON if Claude adds preamble
      var jsonStart = cleaned.indexOf("{");
      var jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart >= 0 && jsonEnd > jsonStart) cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
      // If JSON was truncated (no closing ]), try to close it
      if (cleaned.indexOf('"slides"') !== -1 && !cleaned.endsWith("}")) {
        var lastBrace = cleaned.lastIndexOf("}");
        if (lastBrace > 0) cleaned = cleaned.slice(0, lastBrace + 1) + "]}";
      }
      var parsed;
      try { parsed = JSON.parse(cleaned); } catch (je) {
        // Try aggressive cleanup
        try {
          cleaned = cleaned.replace(/,\s*$/, "");
          if (!cleaned.endsWith("]}")) cleaned += "]}";
          parsed = JSON.parse(cleaned);
        } catch (je2) {
          throw new Error("Failed to parse carousel JSON. Try generating again.");
        }
      }
      var results = [];
      if (parsed && parsed.slides) results.push(parsed);
      else if (Array.isArray(parsed) && parsed[0]) results.push(parsed[0]);
      if (results.length === 0) throw new Error("No valid carousel generated");
      setOptions(results);
      var unsplashKey = apiKeys.unsplash || process.env.NEXT_PUBLIC_UNSPLASH_KEY || "";
      var pexelsKey = apiKeys.pexels || process.env.NEXT_PUBLIC_PEXELS_KEY || "";
      var imgKey = unsplashKey || pexelsKey;
      if (imgKey) {
        setImgStatus("Searching for images...");
        try {
          var searchFn = unsplashKey ? searchUnsplash : searchPexels;
          var key = unsplashKey || pexelsKey;
          // Shorter, cleaner search query
          var shortTopic = topic.split(" ").slice(0, 3).join(" ");
          var stockImgs = await searchFn(catInfo.label + " " + shortTopic, key);
          // Vintage images in parallel
          setImgStatus("Adding vintage media...");
          var vintageImgs = [];
          try { vintageImgs = await searchVintage(category, shortTopic); } catch (ve) {}
          // INTERLEAVE stock and vintage for visual variety
          var imgs = [];
          var si = 0, vi = 0;
          for (var mix = 0; mix < 15; mix++) {
            if (mix % 3 === 2 && vi < vintageImgs.length) { imgs.push(vintageImgs[vi++]); }
            else if (si < stockImgs.length) { imgs.push(stockImgs[si++]); }
            else if (vi < vintageImgs.length) { imgs.push(vintageImgs[vi++]); }
          }
          if (imgs.length > 0) {
            var imgMap = {};
            imgs.forEach(function(img, i) { imgMap[i] = img; });
            setImages(imgMap);
            var stockCount = Math.min(si, stockImgs.length);
            var vintCount = Math.min(vi, vintageImgs.length);
            setImgStatus(stockCount + " stock + " + vintCount + " vintage loaded");
          } else { setImgStatus("No images found"); }
        } catch (e) { setImgStatus("Image search failed: " + e.message); }
      } else {
        // No stock API keys — vintage APIs only
        setImgStatus("Searching vintage archives...");
        try {
          var vintageOnly = await searchVintage(category, topic);
          // Per-slide vintage search
          if (results[0] && results[0].slides && vintageOnly.length < 8) {
            var apis = VINTAGE_APIS[category] || [searchMetMuseum, searchLibCongress];
            var vsSlides = results[0].slides.slice(1, 5);
            for (var vs = 0; vs < vsSlides.length && vintageOnly.length < 10; vs++) {
              try {
                var vsq = getSlideImageQuery(vsSlides[vs], catInfo.label, topic);
                var vExtra = await apis[vs % apis.length](vsq);
                if (vExtra.length > 0) vintageOnly.push(vExtra[0]);
              } catch (vpe) { /* continue */ }
            }
          }
          if (vintageOnly.length > 0) {
            var vMap = {};
            vintageOnly.forEach(function(img, i) { vMap[i] = img; });
            setImages(vMap);
            setImgStatus(vintageOnly.length + " vintage images loaded");
          } else { setImgStatus("No images found"); }
        } catch (ve) { setImgStatus("Vintage search failed"); }
      }
    } catch (err) { if (err.name !== "AbortError") setError(err.message || "Generation failed"); }
    finally { setIsGenerating(false); }
  }, [topic, category, apiKeys, editionPicks]);

  var generateRec = _cb(async function() {
    if (!topic.trim() || !category) return;
    if (abortRef.current) abortRef.current.abort();
    var controller = new AbortController();
    abortRef.current = controller;
    setIsGenerating(true); setError(null); setOptions(null); setImages({});
    setSelectedOption(0); setCurrentSlide(0); setImgStatus(null); setIsRecMode(true);
    var catInfo = CATEGORIES.find(function(c) { return c.id === category; });
    try {
      var prompt = buildRecPrompt(catInfo.label, topic);
      var msgs = [{ role: "user", content: prompt }];
      var tools = [{ type: "web_search_20250305", name: "web_search" }];
      var r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 3000, messages: msgs, tools: tools }) });
      var d = await r.json();
      if (d.error) throw new Error(d.error.message || d.error);
      var text = (d.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text; }).join("");
      if (!text.trim()) throw new Error("No text in response");
      var cleaned = text.replace(/```json|```/g, "").trim();
      // Extract JSON — find the object containing "destination" key
      var parsed = null;
      var jsonStart = cleaned.indexOf("{");
      while (jsonStart !== -1 && !parsed) {
        var jsonEnd = cleaned.lastIndexOf("}");
        if (jsonEnd <= jsonStart) break;
        var attempt = cleaned.slice(jsonStart, jsonEnd + 1);
        attempt = attempt.replace(/,\s*([}\]])/g, "$1");
        try {
          var obj = JSON.parse(attempt);
          if (obj.destination || obj.hiddenGem || obj.culture) { parsed = obj; break; }
        } catch (e) { /* try next { */ }
        jsonStart = cleaned.indexOf("{", jsonStart + 1);
      }
      if (!parsed) throw new Error("Could not parse recommendation JSON");
      // Convert rec JSON into slides array format
      var slides = [
        parsed.destination || { title: topic, subtitle: "" },
        parsed.hiddenGem || { name: "Hidden Gem", body: "" },
        parsed.newOpening || { name: "New Opening", body: "" },
        parsed.culture || { headline: "Culture", body: "" },
        Object.assign({ shortlist: parsed.shortlist || [], tags: parsed.tags || "" }, parsed.destination || {})
      ];
      setOptions([{ angle: "Recommends", slides: slides }]);
      // Image search
      var unsplashKey = apiKeys.unsplash || process.env.NEXT_PUBLIC_UNSPLASH_KEY || "";
      var pexelsKey = apiKeys.pexels || process.env.NEXT_PUBLIC_PEXELS_KEY || "";
      var imgKey = unsplashKey || pexelsKey;
      if (imgKey) {
        setImgStatus("Searching for images...");
        try {
          var searchFn = unsplashKey ? searchUnsplash : searchPexels;
          var key = unsplashKey || pexelsKey;
          var imgs = await searchFn(catInfo.label + " " + topic, key);
          if (imgs.length < 10) {
            try { var vi = await searchVintage(category, topic); imgs = imgs.concat(vi); } catch (ve) {}
          }
          if (imgs.length > 0) {
            var imgMap = {};
            imgs.forEach(function(img, i) { imgMap[i] = img; });
            setImages(imgMap);
            setImgStatus(imgs.length + " images loaded");
          } else { setImgStatus("No images found"); }
        } catch (e) { setImgStatus("Image search failed: " + e.message); }
      } else {
        setImgStatus("Searching vintage archives...");
        try {
          var vi2 = await searchVintage(category, topic);
          if (vi2.length > 0) { var vm = {}; vi2.forEach(function(img, i) { vm[i] = img; }); setImages(vm); setImgStatus(vi2.length + " vintage images loaded"); }
          else { setImgStatus("No images found"); }
        } catch (ve) { setImgStatus("Vintage search failed"); }
      }
    } catch (err) { if (err.name !== "AbortError") setError(err.message || "Recommendation failed"); }
    finally { setIsGenerating(false); }
  }, [topic, category, apiKeys]);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>
      <style>{"@font-face{font-family:'Foun';src:url('/Fonts/Foun/OpenType-PS/Foun.otf') format('opentype'),url('/Fonts/Foun/OpenType-TT/Foun.ttf') format('truetype');font-weight:400;font-style:normal;font-display:block}@font-face{font-family:'Wenssep';src:url('/Fonts/Wenssep/Wenssep.otf') format('opentype'),url('/Fonts/Wenssep/Wenssep.ttf') format('truetype');font-weight:400;font-style:normal;font-display:block}@font-face{font-family:'Maheni';src:url('/Fonts/Maheni/Maheni-Regular.otf') format('opentype'),url('/Fonts/Maheni/Maheni-Regular.ttf') format('truetype');font-weight:400;font-style:normal;font-display:block}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}@keyframes walk{0%,100%{transform:translateX(0)}50%{transform:translateX(8px)}}@keyframes hammer{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-45deg)}}@keyframes sweep{0%,100%{transform:rotate(-15deg)}50%{transform:rotate(15deg)}}@keyframes paint{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes carry{0%,100%{transform:translateY(0) rotate(0deg)}25%{transform:translateY(-3px) rotate(-2deg)}75%{transform:translateY(-3px) rotate(2deg)}}@keyframes figfade{0%{opacity:1}45%{opacity:1}50%{opacity:0}95%{opacity:0}100%{opacity:1}}"}</style>

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
              style={{ padding: "8px 12px", cursor: "pointer", border: sel ? "2px solid " + (c.id === "photo" ? "#888888" : p.accent) : "1px solid var(--color-border-tertiary)", background: sel ? (c.id === "photo" ? "#88888822" : p.accent + "12") : "transparent", display: "flex", alignItems: "center", gap: 5, fontSize: 10, ...CP, color: sel ? (c.id === "photo" ? "#888888" : p.accent) : "var(--color-text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              <Icon size={12} />{c.label}
            </button>);
        })}
      </div>

      {category && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input value={topic} onChange={function(e) { setTopic(e.target.value); setRefinedAngles([]); }}
              placeholder={"Topic for " + cat.label + "..."}
              style={{ flex: 1, padding: "10px 14px", border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 12, ...CP }} />
            {!isGenerating ? (
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={function() { setIsRecMode(false); generate(); }} disabled={!topic.trim()}
                  style={{ padding: "10px 14px", background: uiAccent, color: "#ffffff", border: "none", cursor: topic.trim() ? "pointer" : "default", ...CP, fontSize: 9, letterSpacing: "0.1em", fontWeight: 700, opacity: topic.trim() ? 1 : 0.4 }}>
                  GENERATE
                </button>
              </div>
            ) : (
              <button onClick={cancelGenerate}
                style={{ padding: "10px 18px", background: "#e63946", color: "#ffffff", border: "none", cursor: "pointer", ...CP, fontSize: 10, letterSpacing: "0.1em", fontWeight: 700 }}>
                CANCEL
              </button>
            )}
          </div>
          {/* Edition Settings */}
          <div style={{ marginBottom: 6, textAlign: "center" }}>
            <button onClick={function() { setShowEditionSettings(!showEditionSettings); }}
              style={{ background: "none", border: "none", cursor: "pointer", ...CP, fontSize: 8, color: "var(--color-text-tertiary)", letterSpacing: "0.1em", opacity: 0.6 }}>
              {showEditionSettings ? "\u25B2 HIDE EDITION SETTINGS" : "\u25BC EDITION SETTINGS"}
            </button>
          </div>
          {showEditionSettings && <div style={{ marginBottom: 10, padding: 10, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ ...CP, fontSize: 7, color: "var(--color-text-tertiary)", letterSpacing: "0.1em", marginBottom: 4 }}>VOICE</div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <button onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { persona: -1 }); }); }}
                  style={{ padding: "3px 8px", border: "0.5px solid var(--color-border-tertiary)", background: editionPicks.persona === -1 ? uiAccent + "22" : "transparent", color: editionPicks.persona === -1 ? uiAccent : "var(--color-text-tertiary)", cursor: "pointer", ...CP, fontSize: 7 }}>Random</button>
                {PERSONAS.map(function(per, i) { return (
                  <button key={per.id} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { persona: i }); }); }}
                    style={{ padding: "3px 8px", border: "0.5px solid var(--color-border-tertiary)", background: editionPicks.persona === i ? uiAccent + "22" : "transparent", color: editionPicks.persona === i ? uiAccent : "var(--color-text-tertiary)", cursor: "pointer", ...CP, fontSize: 7, textTransform: "capitalize" }}>{per.id}</button>
                ); })}
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ ...CP, fontSize: 7, color: "var(--color-text-tertiary)", letterSpacing: "0.1em", marginBottom: 4 }}>ANGLE</div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <button onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { angle: -1 }); }); }}
                  style={{ padding: "3px 8px", border: "0.5px solid var(--color-border-tertiary)", background: editionPicks.angle === -1 ? uiAccent + "22" : "transparent", color: editionPicks.angle === -1 ? uiAccent : "var(--color-text-tertiary)", cursor: "pointer", ...CP, fontSize: 7 }}>Random</button>
                {["Economics", "Psychology", "Technology", "Cultural", "Backstory", "Prediction", "Failure", "Parallel"].map(function(label, i) { return (
                  <button key={label} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { angle: i }); }); }}
                    style={{ padding: "3px 8px", border: "0.5px solid var(--color-border-tertiary)", background: editionPicks.angle === i ? uiAccent + "22" : "transparent", color: editionPicks.angle === i ? uiAccent : "var(--color-text-tertiary)", cursor: "pointer", ...CP, fontSize: 7 }}>{label}</button>
                ); })}
              </div>
            </div>
            <div>
              <div style={{ ...CP, fontSize: 7, color: "var(--color-text-tertiary)", letterSpacing: "0.1em", marginBottom: 4 }}>STYLE</div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <button onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { style: -1 }); }); }}
                  style={{ padding: "3px 8px", border: "0.5px solid var(--color-border-tertiary)", background: editionPicks.style === -1 ? uiAccent + "22" : "transparent", color: editionPicks.style === -1 ? uiAccent : "var(--color-text-tertiary)", cursor: "pointer", ...CP, fontSize: 7 }}>Random</button>
                {["Classic", "Interview", "Manifesto", "Observation", "Contrast"].map(function(label, i) { return (
                  <button key={label} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { style: i }); }); }}
                    style={{ padding: "3px 8px", border: "0.5px solid var(--color-border-tertiary)", background: editionPicks.style === i ? uiAccent + "22" : "transparent", color: editionPicks.style === i ? uiAccent : "var(--color-text-tertiary)", cursor: "pointer", ...CP, fontSize: 7 }}>{label}</button>
                ); })}
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ ...CP, fontSize: 7, color: "var(--color-text-tertiary)", letterSpacing: "0.1em", marginBottom: 4 }}>EMPHASIS</div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {[{ id: "balanced", label: "Balanced" }, { id: "deep", label: "Deep Dive" }, { id: "hot", label: "Hot Take" }, { id: "timeline", label: "Timeline" }, { id: "narrative", label: "Narrative" }, { id: "data", label: "Data-Driven" }].map(function(item) { return (
                  <button key={item.id} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { emphasis: item.id }); }); }}
                    style={{ padding: "3px 8px", border: "0.5px solid var(--color-border-tertiary)", background: editionPicks.emphasis === item.id ? uiAccent + "22" : "transparent", color: editionPicks.emphasis === item.id ? uiAccent : "var(--color-text-tertiary)", cursor: "pointer", ...CP, fontSize: 7 }}>{item.label}</button>
                ); })}
              </div>
            </div>
          </div>}

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
                <ChevronRight size={12} style={{ color: uiAccent, flexShrink: 0 }} />
                <div><div style={{ fontSize: 11, color: "var(--color-text-primary)", ...CP }}>{r.angle}</div>
                <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", marginTop: 2 }}>{r.hook}</div></div>
              </button>); })}
          </div>}
          {trending.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 10 }}>
            {trending.map(function(t, i) { return (
              <button key={i} onClick={function() { setTopic(t.topic); setRefinedAngles([]); }}
                style={{ padding: "6px 12px", border: "1px solid " + uiAccent + "44", background: uiAccent + "08", cursor: "pointer", ...CP, fontSize: 10, color: uiAccent }} title={t.hook}>
                <Flame size={9} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />{t.topic}
              </button>); })}
          </div>}
          {trending.length === 0 && SUBCATEGORIES[category] && <div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginBottom: 8 }}>
              <button onClick={function() { setSubcat(null); }} style={{ padding: "4px 10px", cursor: "pointer", ...CP, fontSize: 9, letterSpacing: "0.05em", border: "0.5px solid " + (!subcat ? uiAccent : "var(--color-border-tertiary)"), background: !subcat ? uiAccent + "15" : "transparent", color: !subcat ? uiAccent : "var(--color-text-tertiary)", textTransform: "uppercase" }}>All</button>
              {Object.keys(SUBCATEGORIES[category]).map(function(s) { return (
                <button key={s} onClick={function() { setSubcat(s); }} style={{ padding: "4px 10px", cursor: "pointer", ...CP, fontSize: 9, letterSpacing: "0.05em", border: "0.5px solid " + (subcat === s ? uiAccent : "var(--color-border-tertiary)"), background: subcat === s ? uiAccent + "15" : "transparent", color: subcat === s ? uiAccent : "var(--color-text-tertiary)", textTransform: "uppercase" }}>{s}</button>); })}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {getVisibleTopics().map(function(t) { return (
                <button key={t + "-" + shuffleKey} onClick={function() { setTopic(t); setRefinedAngles([]); }}
                  style={{ padding: "6px 12px", cursor: "pointer", fontSize: 10, border: "0.5px solid var(--color-border-tertiary)", background: topic === t ? uiAccent + "12" : "transparent", color: topic === t ? uiAccent : "var(--color-text-tertiary)", ...CP }}>{t}</button>); })}
            </div>
          </div>}
        </div>
      )}

      {isGenerating && <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 40, height: 50, position: "relative" }}>
              <div style={{ position: "absolute", top: 2, left: 14, width: 12, height: 12, borderRadius: "50%", border: "2px solid #888" }} />
              <div style={{ position: "absolute", top: 14, left: 19, width: 2, height: 16, background: "#888" }} />
              <div style={{ position: "absolute", top: 30, left: 12, width: 2, height: 16, background: "#888", transform: "rotate(20deg)" }} />
              <div style={{ position: "absolute", top: 30, left: 26, width: 2, height: 16, background: "#888", transform: "rotate(-20deg)" }} />
              <div style={{ position: "absolute", top: 18, left: 8, width: 12, height: 2, background: "#888", transform: "rotate(30deg)" }} />
              <div style={{ position: "absolute", top: 14, left: 2, width: 8, height: 5, background: "#888", borderRadius: 2, opacity: 0.5, animation: "hammer 0.6s ease-in-out infinite", transformOrigin: "right center" }} />
            </div>
            <div style={{ ...CP, fontSize: 6, color: "#888", marginTop: 2 }}>building</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 40, height: 50, position: "relative" }}>
              <div style={{ position: "absolute", top: 2, left: 14, width: 12, height: 12, borderRadius: "50%", border: "2px solid #888" }} />
              <div style={{ position: "absolute", top: 14, left: 19, width: 2, height: 16, background: "#888" }} />
              <div style={{ position: "absolute", top: 30, left: 13, width: 2, height: 16, background: "#888", transform: "rotate(15deg)" }} />
              <div style={{ position: "absolute", top: 30, left: 25, width: 2, height: 16, background: "#888", transform: "rotate(-15deg)" }} />
              <div style={{ position: "absolute", top: 18, left: 8, width: 12, height: 2, background: "#888", transform: "rotate(20deg)" }} />
              <div style={{ position: "absolute", top: 12, left: 24, width: 14, height: 2, background: "#888", animation: "paint 0.8s ease-in-out infinite", transformOrigin: "left center", transform: "rotate(-20deg)" }} />
            </div>
            <div style={{ ...CP, fontSize: 6, color: "#888", marginTop: 2 }}>painting</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 40, height: 50, position: "relative" }}>
              <div style={{ position: "absolute", top: 2, left: 14, width: 12, height: 12, borderRadius: "50%", border: "2px solid #888" }} />
              <div style={{ position: "absolute", top: 14, left: 19, width: 2, height: 16, background: "#888" }} />
              <div style={{ position: "absolute", top: 30, left: 14, width: 2, height: 16, background: "#888", transform: "rotate(12deg)" }} />
              <div style={{ position: "absolute", top: 30, left: 24, width: 2, height: 16, background: "#888", transform: "rotate(-12deg)" }} />
              <div style={{ position: "absolute", top: 16, left: 22, width: 2, height: 28, background: "#888", animation: "sweep 0.7s ease-in-out infinite", transformOrigin: "top center" }} />
              <div style={{ position: "absolute", bottom: 2, left: 20, width: 10, height: 3, background: "#888", borderRadius: 1, animation: "sweep 0.7s ease-in-out infinite", transformOrigin: "left center" }} />
            </div>
            <div style={{ ...CP, fontSize: 6, color: "#888", marginTop: 2 }}>tidying</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 40, height: 50, position: "relative" }}>
              <div style={{ position: "absolute", top: 2, left: 14, width: 12, height: 12, borderRadius: "50%", border: "2px solid #888" }} />
              <div style={{ position: "absolute", top: 14, left: 19, width: 2, height: 16, background: "#888" }} />
              <div style={{ position: "absolute", top: 30, left: 12, width: 2, height: 16, background: "#888", animation: "walk 0.5s ease-in-out infinite" }} />
              <div style={{ position: "absolute", top: 30, left: 26, width: 2, height: 16, background: "#888", animation: "walk 0.5s ease-in-out infinite 0.25s" }} />
              <div style={{ position: "absolute", top: 6, left: 8, width: 24, height: 8, border: "2px solid #888", borderRadius: 2, opacity: 0.6, animation: "carry 0.5s ease-in-out infinite" }} />
            </div>
            <div style={{ ...CP, fontSize: 6, color: "#888", marginTop: 2 }}>loading</div>
          </div>
        </div>
        <div style={{ ...CP, fontSize: 8, color: "#888888", letterSpacing: "0.15em", opacity: 0.8, animation: "pulse 1.5s ease-in-out infinite" }}>WORKING ON YOUR CAROUSEL</div>
      </div>}
      {error && <div style={{ padding: "14px 18px", background: "var(--color-background-danger)", border: "1px solid var(--color-border-danger)", color: "var(--color-text-danger)", fontSize: 12, marginBottom: 16 }}>{error}</div>}
      {imgStatus && options && <div style={{ textAlign: "center", marginBottom: 12, ...CP, fontSize: 10, color: imgStatus.indexOf("loaded") >= 0 ? "var(--color-text-success)" : "var(--color-text-warning)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>{imgStatus.indexOf("loaded") >= 0 ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}{imgStatus}</div>}

      {false && options && !isRecMode && <div style={{ marginBottom: 14, textAlign: "center" }}>
        <div style={{ ...CP, fontSize: 10, letterSpacing: "0.15em", color: "var(--color-text-tertiary)", marginBottom: 10, textTransform: "uppercase" }}>Choose an angle</div>
        <div style={{ display: "flex", gap: 8 }}>
          {options.map(function(opt, i) { var info = OPTION_TYPES[i]; var InfoIcon = info ? info.icon : BookOpen; return (
            <button key={i} onClick={function() { setSelectedOption(i); setCurrentSlide(0); }}
              style={{ flex: 1, padding: "12px 10px", cursor: "pointer", border: "1px solid " + (selectedOption === i ? uiAccent : "var(--color-border-tertiary)"), background: selectedOption === i ? "var(--color-background-secondary)" : "transparent", textAlign: "left" }}>
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
            style={{ padding: "6px 12px", border: "1px solid " + uiAccent, background: "transparent", cursor: exportStatus ? "default" : "pointer", display: "flex", alignItems: "center", gap: 5, ...CP, fontSize: 9, color: uiAccent, letterSpacing: "0.08em", opacity: exportStatus ? 0.5 : 1 }}>
            <Archive size={11} />{exportStatus || "EXPORT PNG ZIP"}
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div ref={slideRef} style={{ width: 340, height: 425, overflow: "hidden", border: "4px solid #ffffff", outline: "1.5px solid #000000", boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)" }}>
            {isRecMode ? <RecSlideRenderer category={category} slideData={(cur.slides[currentSlide] || {})} slideIndex={currentSlide} totalSlides={total} images={images} /> : <SlideRenderer category={category} slideData={(cur.slides[currentSlide] || {})} slideIndex={currentSlide} totalSlides={total} images={images} edition={editionData} />}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 14 }}>
          <button onClick={function() { setCurrentSlide(Math.max(0, currentSlide - 1)); }} disabled={currentSlide === 0}
            style={{ width: 34, height: 34, cursor: currentSlide === 0 ? "default" : "pointer", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", color: "var(--color-text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", opacity: currentSlide === 0 ? 0.3 : 1 }}>{"\u2039"}</button>
          <div style={{ display: "flex", gap: 5 }}>
            {cur.slides.map(function(_, i) { return <button key={i} onClick={function() { setCurrentSlide(i); }} style={{ width: i === currentSlide ? 18 : 6, height: 6, cursor: "pointer", border: "none", background: i === currentSlide ? uiAccent : "var(--color-border-tertiary)", transition: "all 0.2s" }} />; })}
          </div>
          <button onClick={function() { setCurrentSlide(Math.min(total - 1, currentSlide + 1)); }} disabled={currentSlide === total - 1}
            style={{ width: 34, height: 34, cursor: currentSlide === total - 1 ? "default" : "pointer", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", color: "var(--color-text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", opacity: currentSlide === total - 1 ? 0.3 : 1 }}>{"\u203A"}</button>
        </div>
        <div style={{ marginTop: 18 }}>
          <div style={{ ...CP, fontSize: 10, letterSpacing: "0.15em", color: "var(--color-text-tertiary)", marginBottom: 8, textTransform: "uppercase" }}>All Slides</div>
          <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 8, paddingLeft: 2, paddingRight: 2 }}>
            {cur.slides.map(function(slide, i) { if (!slide) return null; return (
              <div key={i} onClick={function() { setCurrentSlide(i); }} style={{ width: 68, height: 85, overflow: "hidden", cursor: "pointer", flexShrink: 0, border: "2px solid " + (i === currentSlide ? uiAccent : "transparent"), opacity: i === currentSlide ? 1 : 0.6, transition: "all 0.2s" }}>
                <div style={{ width: 340, height: 425, transform: "scale(0.2)", transformOrigin: "top left", pointerEvents: "none" }}>
                  {isRecMode ? <RecSlideRenderer category={category} slideData={slide} slideIndex={i} totalSlides={total} images={images} /> : <SlideRenderer category={category} slideData={slide} slideIndex={i} totalSlides={total} images={images} edition={editionData} />}
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

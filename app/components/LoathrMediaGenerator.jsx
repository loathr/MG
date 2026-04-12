"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { Camera, Film, Music, Trophy, Lightbulb, TrendingUp, Hash, Eye, Mic, Palette, Zap, Star, BookOpen, CircleDot, Clapperboard, Aperture, Users, CheckCircle, AlertTriangle, Loader, Flame, Shuffle, Sparkles, ChevronRight, Archive, Scissors, UtensilsCrossed, Wine, MessageCircle, Briefcase, Newspaper } from "lucide-react";
import { ENTERPRISE_FORCES, ENTERPRISE_SECTORS, ENTERPRISE_TOPICS, ENTERPRISE_GENERAL_TOPICS, ENTERPRISE_PALETTE, ENTERPRISE_THEME, ENTERPRISE_DESIGN, ENTERPRISE_DEPTHS, ENTERPRISE_TONES, ENTERPRISE_FOCUS, ENTERPRISE_MODES, buildEnterprisePrompt, buildEnterpriseNewsPrompt, buildEnterpriseTipsPrompt, ENTERPRISE_CLOSERS } from "./segments/enterprise.config";
import { EnterpriseCover, EnterpriseContent, EnterpriseCloser, EnterprisePlaybook, ENTERPRISE_LAYOUT_COUNT, ENTERPRISE_LAYOUT_LABELS, ENTERPRISE_COVER_LABELS, styledHighlight, HIGHLIGHT_STYLES, ENTERPRISE_IMG_FILTERS, setGlobalImgFilter } from "./segments/EnterpriseSlides";
import { NEWSDESK_FILTERS, NEWSDESK_URGENCY, NEWSDESK_DESKS, NEWSDESK_REGIONS, NEWSDESK_TIMEFRAMES, NEWSDESK_PALETTE, NEWSDESK_THEME, NEWSDESK_ANGLES, NEWSDESK_EMPHASIS, buildNewsDeskPrompt } from "./segments/newsdesk.config";
import { NewsFrontPage, NewsStory, NewsReaction, NewsSourcesCloser, NEWS_COVER_LABELS, NEWS_LAYOUT_LABELS, NEWS_COVER_COUNT, NEWS_LAYOUT_COUNT } from "./segments/NewsDeskSlides";

var FONT_URL = "https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap";
// Margins from inside the accent border frame
var M_TOP = 20;
var M_BOT = 30;
var M_SIDE = 16;
var M_PAGE = 12; // page number offset from accent frame
var HD = { fontFamily: "'Maheni',Georgia,serif", fontStyle: "normal" };
var FN = { fontFamily: "'Foun',Georgia,serif" };
var WS = { fontFamily: "'Wenssep',Georgia,serif", textTransform: "uppercase" };
var CP = { fontFamily: "'Courier Prime',monospace" };
var OT = { fontFamily: "'Otilito','Foun',sans-serif" };
var QG = { fontFamily: "'Qogee','Maheni',serif", fontStyle: "normal" };
var MT = { fontFamily: "'Matina','Maheni',serif", fontStyle: "normal" };
var QZ = { fontFamily: "'QuickZip','Otilito',sans-serif", textTransform: "uppercase" };
var GH = { fontFamily: "'GrandHalva','Foun',serif" };
var CT = { fontFamily: "'CarbonText','Maheni',sans-serif", fontStyle: "normal" };
var MH = { fontFamily: "'Medhorn','Foun',serif" };
var ER = { fontFamily: "'Eroded','Medhorn',serif" };
var VT = { fontFamily: "'VintageTypist','CarbonText',serif", fontWeight: 700 };
var BR = { fontFamily: "'Bramos','QuickZip',sans-serif" };
var CL = { fontFamily: "'Cheelaved','GrandHalva',serif" };
var RS = { fontFamily: "'RealityStone','Medhorn',serif" };
var CH = { fontFamily: "'CrownHeritage','Cheelaved',serif" };
var FONT_MAP = { maheni: HD, foun: FN, courier: CP, wenssep: WS, otilito: OT, qogee: QG, matina: MT, quickzip: QZ, grandhalva: GH, carbon: CT, medhorn: MH, eroded: ER, vintage: VT, bramos: BR, cheelaved: CL, realitystone: RS, crownheritage: CH };
var ALL_FONTS = [
  { id: "crownheritage", label: "Crown Heritage" },
  { id: "cheelaved", label: "Cheelaved" },
  { id: "realitystone", label: "Reality Stone" },
  { id: "eroded", label: "Eroded" },
  { id: "vintage", label: "Vintage" },
  { id: "bramos", label: "Bramos" },
  { id: "otilito", label: "Otilito" },
  { id: "qogee", label: "Qogee" },
  { id: "matina", label: "Matina" },
  { id: "medhorn", label: "Medhorn" },
  { id: "grandhalva", label: "Grand Halva" },
  { id: "carbon", label: "Carbon" },
  { id: "quickzip", label: "Quick Zip" },
  { id: "maheni", label: "Maheni" },
  { id: "foun", label: "Foun" },
  { id: "courier", label: "Courier" },
  { id: "wenssep", label: "Wenssep" },
];
function bodyFont(slide) { return FONT_MAP[slide && slide.bodyFont] || HD; }
function headFont(slide) { return FONT_MAP[slide && slide.headingFont] || FN; }
function hlFont(slide) { return FONT_MAP[slide && slide.highlightFont] || WS; }

var TEXT_COLORS = {
  enterprise: [
    { id: null, label: "Auto", color: null },
    { id: "#ffffff", label: "White", color: "#ffffff" },
    { id: "#ffffffcc", label: "Soft", color: "#ffffffcc" },
    { id: "#ffffff88", label: "Muted", color: "#ffffff88" },
    { id: "#ffffff55", label: "Faint", color: "#ffffff55" },
    { id: "#e2e2e2", label: "Silver", color: "#e2e2e2" },
    { id: "#c41e1e", label: "Red", color: "#c41e1e" },
    { id: "#f5c518", label: "Gold", color: "#f5c518" },
    { id: "#00b4d8", label: "Cyan", color: "#00b4d8" },
  ],
  newsdesk: [
    { id: null, label: "Auto", color: null },
    { id: "#1a1a1a", label: "Black", color: "#1a1a1a" },
    { id: "#1a1a1acc", label: "Soft", color: "#1a1a1acc" },
    { id: "#1a1a1a88", label: "Muted", color: "#1a1a1a88" },
    { id: "#c41e1e", label: "Red", color: "#c41e1e" },
    { id: "#2d5f2d", label: "Green", color: "#2d5f2d" },
    { id: "#1a4480", label: "Navy", color: "#1a4480" },
  ],
  editorial: [
    { id: null, label: "Auto", color: null },
    { id: "#ffffff", label: "White", color: "#ffffff" },
    { id: "#ffffffe6", label: "Soft", color: "#ffffffe6" },
    { id: "#ffffffaa", label: "Muted", color: "#ffffffaa" },
    { id: "#1a1a1a", label: "Black", color: "#1a1a1a" },
    { id: "#e63946", label: "Red", color: "#e63946" },
    { id: "#f5c518", label: "Gold", color: "#f5c518" },
    { id: "#00b4d8", label: "Cyan", color: "#00b4d8" },
  ],
};

// --- MAGAZINE EDITION SYSTEM ---
var PERSONAS = [
  // Original 5
  { id: "historian", label: "Historian", desc: "\"Buried in the archives...\"", voice: "You are The Historian. Uncover forgotten details and lost context. Use phrases like 'what is rarely discussed', 'the record shows', 'buried in the archives'. Tone: revelatory, authoritative, like uncovering a secret." },
  { id: "critic", label: "Critic", desc: "\"The uncomfortable truth is...\"", voice: "You are The Critic. Give sharp cultural commentary with strong opinions. Use phrases like 'the uncomfortable truth is', 'what nobody admits', 'the real story'. Tone: provocative, confident, contrarian." },
  { id: "insider", label: "Insider", desc: "\"Behind closed doors...\"", voice: "You are The Insider with behind-the-scenes access. Use phrases like 'what most people miss', 'behind closed doors', 'the industry secret'. Tone: conspiratorial, intimate, exclusive." },
  { id: "storyteller", label: "Storyteller", desc: "\"Picture this...\"", voice: "You are The Storyteller. Open with a vivid scene or moment. Use phrases like 'picture this', 'it started when', 'the turning point came'. Tone: cinematic, immersive, narrative." },
  { id: "researcher", label: "Researcher", desc: "\"The data reveals...\"", voice: "You are The Researcher. Lead with surprising data and evidence. Use phrases like 'the data reveals', 'studies show', 'the numbers tell a different story'. Tone: precise, eye-opening, analytical." },
  // Cultural voices
  { id: "gossipgirl", label: "Gossip Girl", desc: "\"Spotted...\"", voice: "You are Gossip Girl. Narrate like you're exposing the elite. Use phrases like 'spotted', 'word on the street', 'you know you love me', 'XOXO'. Tone: knowing, playful, dripping with innuendo. Address the reader as part of the inner circle. Every slide is a scandalous revelation disguised as casual gossip." },
  { id: "streetculture", label: "Street", desc: "\"Real talk...\"", voice: "You are The Street Culture Voice. Write like a respected hip-hop journalist or culture commentator. Use phrases like 'real talk', 'the culture spoke', 'they weren't ready'. Tone: authentic, direct, zero pretension, deeply connected to Black and urban culture. Reference the block, the studio, the come-up." },
  { id: "fashioneditor", label: "Fashion Ed", desc: "\"Darling, this changes everything...\"", voice: "You are The Fashion Editor. Write like Anna Wintour meets street style. Use phrases like 'the moment that shifted everything', 'what the front row missed', 'this is the new uniform'. Tone: sharp, opinionated, effortlessly superior. Every observation is a verdict." },
  { id: "sportscomm", label: "Commentator", desc: "\"And the crowd goes...\"", voice: "You are The Sports Commentator. Write with the energy of a live broadcast. Use phrases like 'and the crowd goes silent', 'nobody saw this coming', 'a once-in-a-generation moment'. Tone: electric, dramatic, building tension then releasing it. Every slide should feel like a highlight reel." },
  { id: "techvisionary", label: "Tech Oracle", desc: "\"The future is already here...\"", voice: "You are The Tech Visionary. Write like a keynote speaker who sees around corners. Use phrases like 'the future is already here', 'this changes the entire game', 'while everyone was watching X, the real disruption was Y'. Tone: confident, forward-looking, connecting dots nobody else sees." },
];

var FRESHNESS_SEEDS = [
  { id: "money", label: "Follow the Money", desc: "Who profits? Who pays?", prompt: "Approach through economics and money: who profits, who pays, what is the hidden financial story." },
  { id: "psych", label: "Why We Care", desc: "The psychology behind it", prompt: "Frame around human psychology: why do people behave this way, what emotional need does it serve." },
  { id: "tech", label: "Tech Disruption", desc: "What innovation changed everything", prompt: "Focus on technology disruption: what innovation changed everything, what is being displaced." },
  { id: "clash", label: "Culture Clash", desc: "Whose traditions collide", prompt: "Explore cultural clash: whose traditions collide, what identity tensions exist." },
  { id: "origin", label: "Untold Origin", desc: "The backstory nobody knows", prompt: "Tell the untold backstory: the person, moment, or decision that started it all but nobody discusses." },
  { id: "future", label: "Bold Prediction", desc: "Where is this heading?", prompt: "Make a bold prediction: where is this heading in 5 years, what is the inevitable conclusion." },
  { id: "failure", label: "What Went Wrong", desc: "The miscalculation that changed everything", prompt: "Frame as a failure story: what went wrong, who miscalculated, what lesson was learned." },
  { id: "parallel", label: "Unlikely Parallel", desc: "Connect to something unrelated", prompt: "Find a surprising parallel: connect this to something completely unrelated in another field." },
];

var WRITING_STYLES = [
  { id: "classic", label: "Classic", desc: "Heading + body + key insight", prompt: "heading, body (3-4 sentences with KEY TERMS IN CAPS), highlight (key insight)" },
  { id: "interview", label: "Interview", desc: "Question → answer → quotable", prompt: "heading (posed as a question), body (conversational answer style, KEY TERMS IN CAPS), highlight (quotable one-liner)" },
  { id: "manifesto", label: "Manifesto", desc: "Declaration + evidence + challenge", prompt: "heading (bold declaration), body (supporting evidence, KEY TERMS IN CAPS), highlight (challenge to the reader)" },
  { id: "observation", label: "Observation", desc: "Scene-setting + first-person", prompt: "heading (scene-setting), body (first-person observation style, KEY TERMS IN CAPS), highlight (the lesson)" },
  { id: "contrast", label: "Contrast", desc: "Then vs now comparison", prompt: "heading (then vs now framing), body (compare two eras or perspectives, KEY TERMS IN CAPS), highlight (what shifted)" },
];

// Tone presets — controls energy level
var TONES = [
  { id: "editorial", label: "Editorial", desc: "Magazine-quality serious", prompt: "Write in a measured, editorial tone. Authoritative but accessible." },
  { id: "casual", label: "Casual", desc: "Instagram-native relaxed", prompt: "Write casually, like talking to a friend who's interested. Use contractions, short sentences, occasional slang. Still smart, just not stiff." },
  { id: "hype", label: "Hype", desc: "High energy, shareable", prompt: "Write with maximum energy. Every line should make someone want to share. Use exclamation-worthy phrasing, dramatic pauses, and bold claims." },
  { id: "dark", label: "Dark/Moody", desc: "Atmospheric, brooding", prompt: "Write with a dark, atmospheric tone. Moody, reflective, slightly ominous. Let tension build. Shadows and undertones." },
  { id: "academic", label: "Academic", desc: "Thesis-grade depth", prompt: "Write with academic rigor but magazine readability. Cite frameworks, reference scholarship, but never bore. Think: New Yorker meets peer review." },
  { id: "playful", label: "Playful", desc: "Witty, irreverent", prompt: "Write with wit and irreverence. Pop culture references, wordplay, unexpected analogies. Smart humor that rewards attention." },
];

// Curated presets — auto-set voice + angle + style + tone
var EDITION_PRESETS = [
  { id: "viral", label: "Viral Thread", desc: "Insider + Bold Prediction + Hype", settings: { persona: 2, angle: 5, style: 2, tone: "hype" } },
  { id: "deepfeature", label: "Deep Feature", desc: "Historian + Untold Origin + Editorial", settings: { persona: 0, angle: 4, style: 0, tone: "editorial" } },
  { id: "culturewars", label: "Culture Wars", desc: "Critic + Culture Clash + Manifesto", settings: { persona: 1, angle: 3, style: 2, tone: "dark" } },
  { id: "tea", label: "Spill the Tea", desc: "Gossip Girl + Follow the Money + Playful", settings: { persona: 5, angle: 0, style: 1, tone: "playful" } },
  { id: "breakdown", label: "Data Breakdown", desc: "Researcher + Tech Disruption + Classic", settings: { persona: 4, angle: 2, style: 0, tone: "academic" } },
  { id: "streetstory", label: "Street Story", desc: "Street + Untold Origin + Observation", settings: { persona: 6, angle: 4, style: 3, tone: "casual" } },
  { id: "frontrow", label: "Front Row", desc: "Fashion Editor + Follow the Money + Contrast", settings: { persona: 7, angle: 0, style: 4, tone: "editorial" } },
  { id: "gameday", label: "Game Day", desc: "Commentator + What Went Wrong + Interview", settings: { persona: 8, angle: 6, style: 1, tone: "hype" } },
];

var IMG_FILTERS = [
  "saturate(0.85) brightness(0.75)",
  "grayscale(0.4) contrast(1.1) brightness(0.8)",
  "sepia(0.25) brightness(0.85)",
  "saturate(1.2) brightness(0.7) contrast(1.05)",
  "grayscale(1) brightness(0.85) contrast(1.1)",
];

var COVER_STYLES = ["classic", "split", "typeOnly", "fullBleed"];

var IMAGE_STYLE_PRESETS = {
  mixed: { label: "Mixed", filters: null },
  bw: { label: "Editorial B&W", filters: ["grayscale(1) brightness(0.85) contrast(1.1)"] },
  vivid: { label: "Vivid", filters: ["saturate(1.3) brightness(0.9) contrast(1.1)"] },
  vintage: { label: "Vintage", filters: ["sepia(0.35) brightness(0.8) contrast(1.05)"] },
  documentary: { label: "Documentary", filters: ["grayscale(0.4) contrast(1.1) brightness(0.8)"] },
};

// --- TOPIC INTELLIGENCE ---

var SEASONAL_TOPICS = {
  film: { 0: "Awards season snubs", 1: "Oscar winner predictions", 2: "SXSW film discoveries", 3: "Spring indie releases", 4: "Cannes lineup preview", 5: "Summer blockbuster predictions", 6: "Midyear box office report", 7: "Late summer sleeper hits", 8: "Fall festival circuit", 9: "Horror season deep dive", 10: "Holiday film releases", 11: "Year in film review" },
  photo: { 0: "New year visual trends", 1: "Portrait photography trends", 2: "Street photography revival", 3: "Spring light techniques", 4: "Photo award winners", 5: "Summer photography projects", 6: "Travel photography guide", 7: "Back to analog movement", 8: "Fall color photography", 9: "Low light techniques", 10: "Holiday photo culture", 11: "Best photos of the year" },
  sports: { 0: "Super Bowl culture impact", 1: "NBA All-Star weekend", 2: "March Madness narratives", 3: "Draft season drama", 4: "Playoff culture decoded", 5: "Summer Olympics preview", 6: "Free agency madness", 7: "Preseason predictions", 8: "New season storylines", 9: "Midseason surprises", 10: "Rivalry week culture", 11: "Year in sports moments" },
  trivia: { 0: "New year discoveries", 1: "Valentine origin myths", 2: "Daylight saving history", 3: "April Fools greatest hoaxes", 4: "Space discoveries this year", 5: "Summer solstice facts", 6: "Independence day myths", 7: "Back to school inventions", 8: "Autumn equinox science", 9: "Halloween origin story", 10: "Thanksgiving myths debunked", 11: "End of year breakthroughs" },
  art: { 0: "Grammy snubs analysis", 1: "New album releases", 2: "SXSW music discoveries", 3: "Spring gallery openings", 4: "Met Gala art analysis", 5: "Summer festival guide", 6: "Midyear album rankings", 7: "Late summer releases", 8: "Fall art exhibitions", 9: "Album art renaissance", 10: "Art Basel preview", 11: "Album of the year debate" },
  fashion: { 0: "Resort collection reviews", 1: "Fashion week highlights", 2: "Spring trend forecast", 3: "Transitional dressing", 4: "Met Gala fashion decoded", 5: "Summer style evolution", 6: "Haute couture week", 7: "Back to school fashion", 8: "Fall fashion forecast", 9: "Fashion month preview", 10: "Holiday party style", 11: "Fashion year in review" },
  food: { 0: "Dry January dining", 1: "Valentine dinner culture", 2: "Spring menu trends", 3: "Restaurant opening season", 4: "Food festival preview", 5: "Summer cocktail trends", 6: "Outdoor dining culture", 7: "Harvest season cooking", 8: "Fall comfort food return", 9: "Halloween food culture", 10: "Thanksgiving food politics", 11: "Holiday dining guide" },
  nightlife: { 0: "New year party aftermath", 1: "Winter club season", 2: "Spring festival lineup", 3: "Rooftop season opens", 4: "Ibiza season preview", 5: "Summer festival guide", 6: "Day party culture", 7: "Late summer raves", 8: "Back to the club season", 9: "Halloween party culture", 10: "Holiday party circuit", 11: "New Year Eve decoded" },
  gossip: { 0: "Awards show drama", 1: "Valentine couple watch", 2: "Spring breakup season", 3: "Festival sighting season", 4: "Met Gala drama decoded", 5: "Summer scandal season", 6: "Celebrity vacation watch", 7: "Back to drama season", 8: "Emmy night gossip", 9: "Halloween costume wars", 10: "Holiday party sightings", 11: "Year end revelations" },
};


function searchAllCategories(query, currentCat) {
  if (!query || query.length < 2) return [];
  var results = [];
  var q = query.toLowerCase();
  Object.keys(SUBCATEGORIES).forEach(function(catId) {
    if (catId === currentCat) return;
    var subs = SUBCATEGORIES[catId];
    Object.values(subs).forEach(function(topics) {
      topics.forEach(function(t) {
        if (t.toLowerCase().indexOf(q) !== -1) {
          results.push({ topic: t, category: catId });
        }
      });
    });
  });
  return results.slice(0, 3);
}

function filterSuggestions(query, category) {
  if (!query || query.length < 2 || !category) return [];
  var q = query.toLowerCase();
  var subs = SUBCATEGORIES[category];
  if (!subs) return [];
  var matches = [];
  Object.values(subs).forEach(function(topics) {
    topics.forEach(function(t) {
      if (t.toLowerCase().indexOf(q) !== -1) matches.push(t);
    });
  });
  return matches.slice(0, 5);
}

function getRelatedTopics(slides, category) {
  if (!slides || !category) return [];
  var subs = SUBCATEGORIES[category];
  if (!subs) return [];
  var allTopics = Object.values(subs).flat();
  var headings = slides.slice(1, 5).map(function(s) { return (s.heading || "").toLowerCase(); }).filter(Boolean);
  var related = [];
  allTopics.forEach(function(t) {
    var tl = t.toLowerCase();
    headings.forEach(function(h) {
      if (h.length > 3 && tl.indexOf(h.split(" ")[0]) !== -1 && related.indexOf(t) === -1) related.push(t);
    });
  });
  if (related.length < 3) {
    var shuffled = allTopics.slice().sort(function() { return Math.random() - 0.5; });
    for (var i = 0; i < shuffled.length && related.length < 3; i++) {
      if (related.indexOf(shuffled[i]) === -1) related.push(shuffled[i]);
    }
  }
  return related.slice(0, 3);
}

function getCrossCategoryRelated(slides, currentCategory) {
  if (!slides) return [];
  // Extract keywords from slide headings and body
  var keywords = [];
  slides.slice(1, 6).forEach(function(s) {
    if (!s) return;
    var h = (s.heading || "").toLowerCase().split(" ");
    h.forEach(function(w) { if (w.length > 4 && keywords.indexOf(w) === -1) keywords.push(w); });
  });
  // Search other categories with these keywords
  var results = [];
  var seen = {};
  keywords.forEach(function(kw) {
    Object.keys(SUBCATEGORIES).forEach(function(catId) {
      if (catId === currentCategory) return;
      Object.values(SUBCATEGORIES[catId]).forEach(function(topics) {
        topics.forEach(function(t) {
          if (t.toLowerCase().indexOf(kw) !== -1 && !seen[t]) {
            seen[t] = true;
            results.push({ topic: t, category: catId });
          }
        });
      });
    });
  });
  return results.slice(0, 4);
}

// --- EDITION UTILITIES ---
function pickPersona(seed) { return PERSONAS[Math.abs(seed) % PERSONAS.length]; }
function pickFreshness(seed) { return FRESHNESS_SEEDS[Math.abs(seed) % FRESHNESS_SEEDS.length]; }
function pickWritingStyle(seed) { return WRITING_STYLES[Math.abs(seed) % WRITING_STYLES.length]; }
function pickCoverStyle(seed) { return COVER_STYLES[Math.abs(seed) % COVER_STYLES.length]; }
function getImgFilter(index, seed) { return IMG_FILTERS[(index + seed) % IMG_FILTERS.length]; }

function getEditionId(topic, category, genNum, picks) {
  var hash = 0;
  var str = topic + category;
  for (var i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash = hash & hash; }
  // Mix in generation counter so each regeneration gets different editorial choices
  var varied = Math.abs(hash) + (genNum || 0) * 7919; // large prime to spread choices
  var issueNum = Math.abs(hash % 900) + 100; // issue number stays tied to topic
  var months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  var d = new Date();
  var seed = Math.abs(varied);
  var p = picks || { persona: -1, angle: -1, style: -1 };
  var resolvedVoice = p.persona >= 0 && PERSONAS[p.persona] ? PERSONAS[p.persona].label : PERSONAS[seed % PERSONAS.length].label;
  var resolvedAngle = p.angle >= 0 && FRESHNESS_SEEDS[p.angle] ? FRESHNESS_SEEDS[p.angle].label : FRESHNESS_SEEDS[seed % FRESHNESS_SEEDS.length].label;
  var resolvedStyle = p.style >= 0 && WRITING_STYLES[p.style] ? WRITING_STYLES[p.style].label : WRITING_STYLES[seed % WRITING_STYLES.length].label;
  return { num: issueNum, label: months[d.getMonth()] + " " + d.getFullYear(), seed: seed, voice: resolvedVoice, angle: resolvedAngle, style: resolvedStyle };
}

// Extract 2-4 meaningful keywords from text for image search
var STOP_WORDS = { the:1, a:1, an:1, and:1, or:1, but:1, in:1, on:1, at:1, to:1, for:1, of:1, with:1, by:1, from:1, is:1, are:1, was:1, were:1, be:1, been:1, being:1, have:1, has:1, had:1, do:1, does:1, did:1, will:1, would:1, could:1, should:1, may:1, might:1, shall:1, can:1, it:1, its:1, this:1, that:1, these:1, those:1, how:1, what:1, when:1, where:1, why:1, who:1, which:1, not:1, no:1, so:1, if:1, then:1, than:1, too:1, very:1, just:1, about:1, into:1, over:1, after:1, before:1, between:1, through:1, during:1, above:1, below:1, up:1, down:1, out:1, off:1, all:1, each:1, every:1, both:1, few:1, more:1, most:1, other:1, some:1, such:1, only:1, own:1, same:1, also:1, back:1, still:1, ever:1, never:1, always:1, once:1, here:1, there:1, as:1, your:1, their:1, his:1, her:1, my:1, our:1, they:1, them:1, we:1, us:1, you:1, he:1, she:1, me:1, him:1, changed:1, made:1, really:1, actually:1, things:1 };
function extractKeywords(text, max) {
  if (!text) return "";
  return text.replace(/[^\w\s'-]/g, "").split(/\s+/).filter(function(w) { return w.length > 2 && !STOP_WORDS[w.toLowerCase()]; }).slice(0, max || 3).join(" ");
}

function getSlideImageQuery(slide, categoryLabel, topic) {
  // Person field gets priority — search for their name directly
  if (slide.person) return slide.person;
  var heading = slide.heading || slide.title || slide.name || slide.headline || "";
  var body = slide.body || slide.leadParagraph || "";
  // Extract meaningful keywords from heading + body, NOT category label (which gives generic results)
  var headKw = heading.length > 3 ? extractKeywords(heading, 3) : "";
  var bodyKw = body.length > 10 ? extractKeywords(body, 2) : "";
  var combined = (headKw + " " + bodyKw).trim();
  if (combined.length > 5) return topic + " " + combined;
  return topic + " " + extractKeywords(heading || categoryLabel, 3);
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
  gossip: { bg: "#1a0a14", accent: "#ff4081", accent2: "#ffab40", text: "#fff0f5" },
  enterprise: { bg: "#0a0a0a", accent: "#ffffff", accent2: "#888888", text: "#ffffff" },
  newsdesk: { bg: "#f5f0e4", accent: "#c41e1e", accent2: "#1a1a1a", text: "#1a1a1a" },
};

var CAT_LABELS = { film: "FILM & TV", photo: "PHOTOGRAPHY", sports: "SPORTS \u00d7 CULTURE", trivia: "DID YOU KNOW?", art: "ART & MUSIC", fashion: "FASHION", food: "FOOD & DRINK", nightlife: "NIGHTLIFE", gossip: "THE TEA", enterprise: "ENTERPRISE", newsdesk: "NEWS DESK" };
var CLOSER_TAGS = { film: "FOLLOW FOR MORE", photo: "FOLLOW FOR MORE", sports: "GAME. CULTURE. REPEAT.", trivia: "NOW YOU KNOW", art: "SEE. HEAR. FEEL.", fashion: "DRESS. EXPRESS. REPEAT.", food: "TASTE. SAVOR. SHARE.", nightlife: "AFTER DARK.", gossip: "SPILL. SIP. SCROLL.", enterprise: "ANALYZE. ADAPT. WIN.", newsdesk: "REPORTING. CONTEXT. PERSPECTIVE." };

var CATEGORIES = [
  { id: "film", label: "Film & TV", icon: Clapperboard },
  { id: "photo", label: "Photography", icon: Aperture },
  { id: "sports", label: "Sports \u00d7 Culture", icon: Trophy },
  { id: "trivia", label: "Did You Know?", icon: Lightbulb },
  { id: "art", label: "Art & Music", icon: Palette },
  { id: "fashion", label: "Fashion", icon: Scissors },
  { id: "food", label: "Food & Drink", icon: UtensilsCrossed },
  { id: "nightlife", label: "Nightlife", icon: Wine },
  { id: "gossip", label: "Gossip", icon: MessageCircle },
  { id: "enterprise", label: "Enterprise", icon: Briefcase, segment: "enterprise" },
  { id: "newsdesk", label: "News Desk", icon: Newspaper, segment: "newsdesk" },
];

var EDITORIAL_CATS = CATEGORIES.filter(function(c) { return !c.segment; });

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
  gossip: {
    "Celebrity": ["Hollywood's worst-kept secrets", "Celebrity couples nobody saw coming", "The PR relationship industrial complex", "Stars who disappeared from the spotlight", "Celebrity feuds that shaped pop culture"],
    "Industry": ["Record labels silencing artists", "The real cost of fame contracts", "Ghostwriters behind hit songs", "Award show politics exposed", "Studio executives who changed careers overnight"],
    "Scandal": ["Cover-ups that eventually broke", "The publicist's playbook for damage control", "Scandals that were actually distractions", "When brands dropped celebrities too late", "The apology video formula decoded"],
    "Social Media": ["Influencer drama that broke the internet", "Fake followers and bought engagement", "Cancel culture's biggest reversals", "The finsta phenomenon", "Parasocial relationships gone wrong"],
    "Money": ["Celebrity net worth myths debunked", "The divorce settlement that shocked everyone", "Hidden business empires of celebrities", "How fame is monetized behind the scenes", "The real economics of celebrity endorsements"],
    "Rumors": ["Conspiracy theories that turned out true", "The rumor mill's greatest hits", "Blind items that were eventually confirmed", "Industry whispers that changed everything", "The gossip columnist's lost art"],
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

// Cover-only: highlight Claude's chosen word/phrase in accent color
function formatCoverTitle(title, accentColor, highlightWord) {
  if (!title) return "";
  if (highlightWord && title.indexOf(highlightWord) !== -1) {
    var idx = title.indexOf(highlightWord);
    var before = title.slice(0, idx);
    var after = title.slice(idx + highlightWord.length);
    return <>{before}<span style={{ color: accentColor, whiteSpace: "nowrap" }}>{highlightWord}</span>{after}</>;
  }
  // Fallback: highlight last 1-2 words if Claude didn't specify
  var words = title.split(" ");
  if (words.length <= 2) return <span style={{ color: accentColor }}>{title}</span>;
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

// Module-level image style — set by generate(), read by ImgBg
var _activeImageStyle = "mixed";
var _activeSegment = null; // "enterprise"|null — forces B&W when enterprise
var _mosaicSlides = {}; // { slideIndex: [url1, url2, ...] } — set by generate(), read by ImgBg
var _allImages = {}; // full images map for mosaic to pull from

// Mosaic layouts — CSS grid templates for collage backgrounds
var MOSAIC_LAYOUTS = [
  // 2-panel layouts
  { id: "2v5050", cols: "1fr 1fr", rows: "1fr", areas: '"a b"', count: 2, label: "2V 50/50" },
  { id: "2v7030", cols: "7fr 3fr", rows: "1fr", areas: '"a b"', count: 2, label: "2V 70/30" },
  { id: "2v3070", cols: "3fr 7fr", rows: "1fr", areas: '"a b"', count: 2, label: "2V 30/70" },
  { id: "2h5050", cols: "1fr", rows: "1fr 1fr", areas: '"a" "b"', count: 2, label: "2H 50/50" },
  { id: "2h7030", cols: "1fr", rows: "7fr 3fr", areas: '"a" "b"', count: 2, label: "2H 70/30" },
  { id: "2h3070", cols: "1fr", rows: "3fr 7fr", areas: '"a" "b"', count: 2, label: "2H 30/70" },
  // 3-panel layouts
  { id: "3l", cols: "3fr 2fr", rows: "1fr 1fr", areas: '"a b" "a c"', count: 3, label: "3 L-Shape" },
  { id: "3linv", cols: "2fr 3fr", rows: "1fr 1fr", areas: '"a c" "b c"', count: 3, label: "3 Inv-L" },
  { id: "3top", cols: "1fr 1fr", rows: "3fr 2fr", areas: '"a a" "b c"', count: 3, label: "3 Top" },
  { id: "3bot", cols: "1fr 1fr", rows: "2fr 3fr", areas: '"a b" "c c"', count: 3, label: "3 Bottom" },
  // 4-panel layouts
  { id: "4grid", cols: "1fr 1fr", rows: "1fr 1fr", areas: '"a b" "c d"', count: 4, label: "4 Grid" },
  { id: "4wide", cols: "2fr 1fr", rows: "1fr 1fr", areas: '"a b" "c d"', count: 4, label: "4 Wide L" },
];

function MosaicBg({ urls, pal, children, category, slideIndex, darken }) {
  if (!urls || urls.length < 2) return null;
  var preset = _activeImageStyle && IMAGE_STYLE_PRESETS[_activeImageStyle] ? IMAGE_STYLE_PRESETS[_activeImageStyle] : null;
  // Pick layout — manual override via _layoutIdx, or auto based on image count
  var availCount = Math.min(urls.length, 4);
  var manualIdx = urls._layoutIdx;
  var layout;
  if (typeof manualIdx === "number" && MOSAIC_LAYOUTS[manualIdx]) {
    layout = MOSAIC_LAYOUTS[manualIdx];
  } else {
    var candidates = MOSAIC_LAYOUTS.filter(function(l) { return l.count <= availCount; });
    layout = candidates[(slideIndex || 0) % candidates.length] || MOSAIC_LAYOUTS[0];
  }
  var areaNames = ["a", "b", "c", "d"];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: pal.bg }}>
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: layout.cols, gridTemplateRows: layout.rows, gridTemplateAreas: layout.areas, gap: 2, background: "#ffffff" }}>
        {areaNames.slice(0, layout.count).map(function(area, ai) {
          var imgUrl = urls[ai] || null;
          var urlSeed = 0;
          if (imgUrl) { for (var ci = 0; ci < Math.min(imgUrl.length, 50); ci++) urlSeed += imgUrl.charCodeAt(ci); }
          var filt = preset && preset.filters ? preset.filters[0] : IMG_FILTERS[(slideIndex + ai + urlSeed) % IMG_FILTERS.length];
          return <div key={area} style={{ gridArea: area, overflow: "hidden", position: "relative" }}>
            {imgUrl ? <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: filt }} onError={function(e) { e.target.style.display = "none"; }} />
              : <div style={{ width: "100%", height: "100%", background: pal.bg }} />}
          </div>;
        })}
      </div>
      {darken && <div style={{ position: "absolute", inset: 0, background: darken }} />}
      {children}
      <div style={{ position: "absolute", bottom: 6, left: 8, zIndex: 10, ...CP, fontSize: 4, letterSpacing: "0.15em", color: "#ffffff", fontWeight: 700 }}>LOATHR</div>
    </div>
  );
}

// Get multiple image URLs for mosaic from the images map
// _mosaicExtraImages: extra images fetched specifically for mosaic panels
var _mosaicExtraImages = [];

function getMosaicImgs(images, idx, totalSlides) {
  if (!images) return [];
  var urls = [];
  var used = {};
  // Track ALL URLs already assigned to any single-image slide
  var allUsed = {};
  Object.keys(images).forEach(function(k) {
    if (images[k] && images[k].url) { allUsed[images[k].url] = true; allUsed[normalizeImgUrl(images[k].url)] = true; }
  });
  // Also track URLs already used by other mosaic slides
  Object.keys(_mosaicSlides).forEach(function(k) {
    if (parseInt(k) !== idx && _mosaicSlides[k]) {
      _mosaicSlides[k].forEach(function(u) { if (typeof u === "string") { allUsed[u] = true; allUsed[normalizeImgUrl(u)] = true; } });
    }
  });
  // Primary image for this slide
  if (images[idx] && images[idx].url) { urls.push(images[idx].url); used[images[idx].url] = true; }
  // First: pull from extra mosaic images (dedicated, never used by single-image slides)
  for (var e = 0; e < _mosaicExtraImages.length && urls.length < 4; e++) {
    var eUrl = _mosaicExtraImages[e];
    if (eUrl && !used[eUrl] && !allUsed[eUrl] && !allUsed[normalizeImgUrl(eUrl)]) {
      urls.push(eUrl); used[eUrl] = true; allUsed[eUrl] = true;
    }
  }
  // Second: non-adjacent images as fallback (2+ slides away)
  if (urls.length < 4) {
    var keys = Object.keys(images);
    for (var k = 0; k < keys.length && urls.length < 4; k++) {
      var img = images[keys[k]];
      var ki = parseInt(keys[k]);
      if (img && img.url && !used[img.url] && !used[normalizeImgUrl(img.url)] && Math.abs(ki - idx) > 2) {
        urls.push(img.url); used[img.url] = true;
      }
    }
  }
  return urls;
}

function ImgBg({ url, pal, children, darken, category, imgFilter, slideIndex }) {
  // Auto-mosaic: if this slide is flagged for mosaic, render collage layout
  var mosaicUrls = _mosaicSlides[slideIndex];
  if (mosaicUrls && mosaicUrls.length >= 2) {
    return <MosaicBg urls={mosaicUrls} pal={pal} category={category} slideIndex={slideIndex} darken={darken}>{children}</MosaicBg>;
  }
  // Image style preset overrides rotation when set
  var preset = _activeImageStyle && IMAGE_STYLE_PRESETS[_activeImageStyle] ? IMAGE_STYLE_PRESETS[_activeImageStyle] : null;
  var filt;
  if (imgFilter) { filt = imgFilter; }
  else if (preset && preset.filters) { filt = preset.filters[0]; }
  else { var urlSeed = 0; if (url) { for (var ci = 0; ci < Math.min(url.length, 50); ci++) urlSeed += url.charCodeAt(ci); } filt = IMG_FILTERS[(slideIndex + urlSeed) % IMG_FILTERS.length]; }
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: pal.bg }}>
      {url && <img src={url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: filt }} onError={function(e) { e.target.style.display = "none"; }} />}
      {!url && <EditorialFill pal={pal} category={category} />}
      {darken && <div style={{ position: "absolute", inset: 0, background: darken }} />}
      {children}
      {/* LOATHR watermark — bottom left, minimal */}
      <div style={{ position: "absolute", bottom: 6, left: 8, zIndex: 10, ...CP, fontSize: 4, letterSpacing: "0.15em", color: "#ffffff", fontWeight: 700 }}>LOATHR</div>
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
    if (/^[A-Z\s]+$/.test(part) && part.trim().length > 2 && hitCount < 2) {
      var c = colors[hitCount % colors.length];
      hitCount++;
      // Wrap each word individually for cleaner line breaks
      var words = part.trim().split(/\s+/);
      return words.map(function(word, wi) {
        return <span key={i + "-" + wi} style={{ color: "#000000", fontWeight: 700, background: c, padding: "1px 4px", margin: "0 2px 2px 0", display: "inline-block", lineHeight: 1.6 }}>{word}</span>;
      });
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
var BUBBLE_CATS = { trivia: true, art: true, food: true, gossip: true };
var STICKY_CATS = { fashion: true };
var FORMAL_CATS = { film: true, photo: true, sports: true, nightlife: true, enterprise: true, newsdesk: true };

// Formal frame styles for editorial categories
function FormalFrame({ children, style, accent, accent2, seed, bg: bgProp }) {
  var variant = seed % 5;
  var bg = bgProp || "rgba(0,0,0,0.8)";
  var maxH = { maxHeight: 260, overflow: "hidden" };

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
function getFramePosition(seed, slideIndex, textPosition) {
  // If textPosition is explicitly set (bottom-left or bottom-right), respect it
  if (textPosition === "bottom-left") return { bottom: M_BOT, left: M_SIDE, right: "40%" };
  if (textPosition === "bottom-right") return { bottom: M_BOT, left: "40%", right: M_SIDE };
  // Otherwise use seed-based rotation
  var positions = [
    { bottom: M_BOT, left: M_SIDE, right: M_SIDE },
    { bottom: M_BOT, left: M_SIDE, right: "45%" },
    { bottom: M_BOT, left: "40%", right: M_SIDE },
    { bottom: M_BOT + 10, left: M_SIDE, right: "35%" },
    { bottom: M_BOT + 10, left: "30%", right: M_SIDE },
  ];
  var pick = (seed + slideIndex * 7) % positions.length;
  return positions[pick];
}

// 7 bubble styles — enough for no repeats in any carousel
function BubbleBox({ children, style, accent, accent2, seed, bg: bgProp }) {
  var variant = seed % 7;
  var tailSide = seed % 2 === 0 ? "left" : "right";
  var rotation = (seed % 5 - 2) * 0.5;
  var _bg = bgProp || null; // if set, overrides hardcoded backgrounds
  var maxH = { maxHeight: 260, overflow: "hidden" };

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

// Glass box — frosted glass blur effect
function GlassBox({ children, style, accent, accent2, seed }) {
  var rotation = ((seed || 0) % 3) - 1;
  return (
    <div style={Object.assign({}, { position: "relative", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "10px 12px", transform: "rotate(" + rotation + "deg)" }, style || {})}>
      {children}
    </div>
  );
}

// Tape strip — text on diagonal masking tape
function TapeStrip({ children, style, accent, accent2, seed }) {
  var rotation = ((seed || 0) % 5) - 2;
  var bg = accent ? accent + "cc" : "#e8d5a3cc";
  return (
    <div style={Object.assign({}, { position: "relative", background: bg, padding: "8px 14px", transform: "rotate(" + rotation + "deg)", boxShadow: "2px 2px 6px rgba(0,0,0,0.3)" }, style || {})}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "rgba(0,0,0,0.1)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(0,0,0,0.1)" }} />
      {children}
    </div>
  );
}

// Cutout box — torn paper edge effect
function CutoutBox({ children, style, accent, accent2, seed }) {
  var rotation = ((seed || 0) % 3) - 1;
  return (
    <div style={Object.assign({}, { position: "relative", background: "rgba(0,0,0,0.85)", padding: "10px 12px", transform: "rotate(" + rotation + "deg)", boxShadow: "3px 3px 8px rgba(0,0,0,0.4)", borderLeft: "3px solid " + (accent || "#fff") }, style || {})}>
      <div style={{ position: "absolute", top: -2, right: 0, width: "30%", height: 2, background: accent || "#fff", transform: "rotate(1deg)", opacity: 0.5 }} />
      <div style={{ position: "absolute", bottom: -2, left: "20%", width: "40%", height: 2, background: accent2 || accent || "#fff", transform: "rotate(-1deg)", opacity: 0.5 }} />
      {children}
    </div>
  );
}

// Minimal box — thin bottom border only
function MinimalBox({ children, style, accent, accent2, seed }) {
  return (
    <div style={Object.assign({}, { position: "relative", background: "rgba(0,0,0,0.6)", padding: "10px 12px", borderBottom: "2px solid " + (accent || "#ffffff") }, style || {})}>
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
  var textCol = isLight ? "#1a1a1a" : "#f5f0e8";
  // All StickyNote variants need explicit color since text inherits "inherit" from parent
  var baseStyle = { color: textCol };

  if (variant === 0) {
    // Classic Post-it with folded corner
    return (
      <div style={Object.assign({}, { position: "relative", background: bg, color: textCol, padding: "12px 12px 12px 12px", transform: "rotate(" + rotation + "deg)", boxShadow: "3px 3px 8px rgba(0,0,0,0.4)" }, style || {})}>
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
  return <div style={{ ...CP, fontSize: 5, color: accent ? accent + "88" : "#ffffff77", marginTop: 6, textAlign: "right", fontStyle: "italic" }}>{sources}</div>;
}

// Split text into positioned boxes that avoid the image focal point
function SplitTextBox({ slide, position, accent, accent2, category, seed, styleBody }) {
  var pos = position || "bottom-left";
  var useBubble = BUBBLE_CATS[category];
  var useSticky = STICKY_CATS[category];
  var useFormal = FORMAL_CATS[category];

  var SPLIT_CONTAINER_MAP = { bubble: BubbleBox, sticky: StickyNote, formal: FormalFrame, glass: GlassBox, tape: TapeStrip, cutout: CutoutBox, minimal: MinimalBox, none: null };
  var splitSeed = typeof slide.containerVariant === "number" ? slide.containerVariant : seed;
  var splitBg = slide.containerBg || null;
  var splitOpacity = typeof slide.containerOpacity === "number" ? slide.containerOpacity : null;
  var splitStyle = splitBg || splitOpacity !== null ? { background: splitBg || undefined, opacity: splitOpacity !== null ? splitOpacity : undefined } : undefined;

  function wrapFrame(content, s) {
    // User override via slide.containerStyle
    if (slide.containerStyle && SPLIT_CONTAINER_MAP.hasOwnProperty(slide.containerStyle)) {
      var CC = SPLIT_CONTAINER_MAP[slide.containerStyle];
      if (!CC) return content; // "none"
      return <CC accent={accent} accent2={accent2} seed={splitSeed + s} style={splitStyle}>{content}</CC>;
    }
    // Category default
    if (useBubble) return <BubbleBox accent={accent} accent2={accent2} seed={splitSeed + s} style={splitStyle}>{content}</BubbleBox>;
    if (useSticky) return <StickyNote accent={accent} accent2={accent2} seed={splitSeed + s} style={splitStyle}>{content}</StickyNote>;
    if (useFormal) return <FormalFrame accent={accent} accent2={accent2} seed={splitSeed + s} style={splitStyle}>{content}</FormalFrame>;
    return <FormalFrame accent={accent} accent2={accent2} seed={splitSeed + s} style={splitStyle}>{content}</FormalFrame>;
  }

  var headingEl = <div style={Object.assign({}, { ...headFont(slide), fontSize: 12 + (slide.headingSize || 0), color: slide.headingColor || (useSticky ? "inherit" : "#ffffff"), textTransform: "uppercase", letterSpacing: "0.03em" }, slide.headingAlign ? { textAlign: slide.headingAlign } : {})}>{slide.heading || ""}</div>;
  var bodyEl = <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8.5 + (slide.bodySize || 0), color: slide.bodyColor || (useSticky ? "inherit" : "#ffffffe6"), lineHeight: 1.45 }, slide.bodyAlign ? { textAlign: slide.bodyAlign } : {})}>{styleBody ? styleBody(slide.body || "", accent, accent2) : (slide.body || "")}</div>;
  var highlightEl = styledHighlight(slide.highlight, slide, { fg: useSticky ? "inherit" : "#1a1a1a", accent: "#ffffff", pillText: "#1a1a1a", bg: "transparent", defaultStyle: "pill" });
  var citeEl = <MicroCite sources={slide.sources} accent={accent} />;

  // Per-element position offsets from customPosition
  var cp = slide.customPosition && typeof slide.customPosition === "object" ? slide.customPosition : {};
  var headingOffset = cp.heading || { top: 0, left: 0 };
  var bodyOffset = cp.body || { top: 0, left: 0 };
  var highlightOffset = cp.highlight || { top: 0, left: 0 };
  function applyOffset(baseStyle, offset) {
    if (!offset.top && !offset.left) return baseStyle;
    return Object.assign({}, baseStyle, { top: (parseInt(baseStyle.top) || 0) + offset.top, left: (parseInt(baseStyle.left) || 0) + offset.left, bottom: "auto", right: "auto" });
  }

  // Split-corners: heading top-left, body bottom-right
  if (pos === "split-corners") {
    var hHasOffset = headingOffset.top || headingOffset.left;
    var hStyle = hHasOffset
      ? { position: "absolute", top: M_TOP + headingOffset.top, left: M_SIDE + headingOffset.left, maxWidth: "55%", zIndex: 3 }
      : { position: "absolute", top: M_TOP, left: M_SIDE, right: "50%", zIndex: 3 };
    var bHasOffset = bodyOffset.top || bodyOffset.left;
    var bStyle = bHasOffset
      ? { position: "absolute", top: 280 + bodyOffset.top, left: 120 + bodyOffset.left, maxWidth: "60%", zIndex: 3 }
      : { position: "absolute", bottom: M_BOT, left: "35%", right: M_SIDE, zIndex: 3 };
    return <>
      <div style={hStyle}>
        {wrapFrame(<div>{headingEl}{citeEl}</div>, seed)}
      </div>
      <div style={bStyle}>
        {wrapFrame(<div>{bodyEl}{highlightEl}</div>, seed + 1)}
      </div>
    </>;
  }

  // Side-left: heading and body stacked on left, right stays open
  // Helper: apply nudge offset as CSS transform
  function nudge(el, offset) { return (offset.top || offset.left) ? { transform: "translate(" + (offset.left || 0) + "px," + (offset.top || 0) + "px)" } : {}; }

  if (pos === "side-left") {
    return <div style={Object.assign({}, { position: "absolute", top: M_TOP + 10, bottom: M_BOT, left: M_SIDE, width: "42%", zIndex: 3, display: "flex", flexDirection: "column", gap: 6 })}>
      <div style={nudge(null, headingOffset)}>{wrapFrame(<div>{headingEl}</div>, seed)}</div>
      <div style={nudge(null, bodyOffset)}>{wrapFrame(<div>{bodyEl}{highlightEl}{citeEl}</div>, seed + 1)}</div>
    </div>;
  }

  if (pos === "side-right") {
    return <div style={Object.assign({}, { position: "absolute", top: M_TOP + 10, bottom: M_BOT, right: M_SIDE, width: "42%", zIndex: 3, display: "flex", flexDirection: "column", gap: 6 })}>
      <div style={nudge(null, headingOffset)}>{wrapFrame(<div>{headingEl}</div>, seed)}</div>
      <div style={nudge(null, bodyOffset)}>{wrapFrame(<div>{bodyEl}{highlightEl}{citeEl}</div>, seed + 1)}</div>
    </div>;
  }

  if (pos === "top-left") {
    var tlHasOffset = headingOffset.top || headingOffset.left;
    return <div style={Object.assign({}, { position: "absolute", top: M_TOP, left: M_SIDE, zIndex: 3 }, tlHasOffset ? { maxWidth: "55%", transform: "translate(" + (headingOffset.left || 0) + "px," + (headingOffset.top || 0) + "px)" } : { right: "45%" })}>
      {wrapFrame(<div>{headingEl}<div style={{ marginTop: 6 }}>{bodyEl}</div>{highlightEl}{citeEl}</div>, seed)}
    </div>;
  }

  if (pos === "top-right") {
    var trHasOffset = headingOffset.top || headingOffset.left;
    return <div style={Object.assign({}, { position: "absolute", top: M_TOP, zIndex: 3 }, trHasOffset ? { left: "45%", maxWidth: "55%", transform: "translate(" + (headingOffset.left || 0) + "px," + (headingOffset.top || 0) + "px)" } : { left: "45%", right: M_SIDE })}>
      {wrapFrame(<div>{headingEl}<div style={{ marginTop: 6 }}>{bodyEl}</div>{highlightEl}{citeEl}</div>, seed)}
    </div>;
  }

  if (pos === "l-shape") {
    return <>
      <div style={Object.assign({}, { position: "absolute", top: M_TOP, left: M_SIDE, right: "50%", zIndex: 3 }, nudge(null, headingOffset))}>
        {wrapFrame(<div>{headingEl}</div>, seed)}
      </div>
      <div style={Object.assign({}, { position: "absolute", bottom: M_BOT, left: M_SIDE, right: "40%", zIndex: 3 }, nudge(null, bodyOffset))}>
        {wrapFrame(<div>{bodyEl}{citeEl}</div>, seed + 1)}
      </div>
      {highlightEl && <div style={Object.assign({}, { position: "absolute", bottom: M_BOT, right: M_SIDE, left: "65%", zIndex: 3 }, nudge(null, highlightOffset))}>
        {wrapFrame(<div>{highlightEl}</div>, seed + 2)}
      </div>}
    </>;
  }

  // Default: bottom-left or bottom-right
  var fpos = pos === "bottom-right" ? { bottom: M_BOT, left: "35%", right: M_SIDE } : { bottom: M_BOT, left: M_SIDE, right: "40%" };
  var allOffset = cp.all || cp.heading || { top: 0, left: 0 };
  return <div style={Object.assign({}, { position: "absolute", zIndex: 3 }, fpos, nudge(null, allOffset))}>
    {wrapFrame(<div>{headingEl}<div style={{ marginTop: 6 }}>{bodyEl}</div>{highlightEl}{citeEl}</div>, seed)}
  </div>;
}

// Normalize URL for cross-source dedup — strips size params, CDN prefixes
function normalizeImgUrl(url) {
  if (!url) return "";
  // Strip common resize/quality params
  var u = url.split("?")[0].split("#")[0];
  // Normalize upload.wikimedia.org thumb paths → base filename
  var wikiThumb = u.match(/\/thumb\/(.+?)\/\d+px-/);
  if (wikiThumb) return wikiThumb[1];
  // Normalize Unsplash photo IDs
  var unsplashId = u.match(/unsplash\.com\/photos?\/([\w-]+)/);
  if (unsplashId) return "unsplash:" + unsplashId[1];
  // Normalize Pexels photo IDs
  var pexelsId = u.match(/pexels\.com\/photo[s]?\/(?:.*?[-/])(\d+)/);
  if (pexelsId) return "pexels:" + pexelsId[1];
  return u;
}

// Deduplicate image results across sources
function dedupeImages(results) {
  var seen = {};
  return results.filter(function(r) {
    if (!r || !r.url) return false;
    var norm = normalizeImgUrl(r.url);
    var normThumb = r.thumb ? normalizeImgUrl(r.thumb) : "";
    if (seen[r.url] || seen[norm] || (normThumb && seen[normThumb])) return false;
    seen[r.url] = true;
    seen[norm] = true;
    if (r.thumb) seen[r.thumb] = true;
    if (normThumb) seen[normThumb] = true;
    return true;
  });
}

function getImg(images, idx) {
  if (!images) return null;
  // Direct match — always preferred
  if (images[idx] && images[idx].url) return images[idx].url;
  // Fallback: find an image not used by ANY other slide
  var keys = Object.keys(images);
  if (keys.length === 0) return null;
  var usedUrls = {};
  keys.forEach(function(k) { if (parseInt(k) !== idx && images[k] && images[k].url) usedUrls[images[k].url] = true; });
  // Try to find a unique image: prioritize images far from this slide index
  var sorted = keys.slice().sort(function(a, b) { return Math.abs(parseInt(b) - idx) - Math.abs(parseInt(a) - idx); });
  for (var ki = 0; ki < sorted.length; ki++) {
    var img = images[sorted[ki]];
    if (img && img.url && !usedUrls[img.url]) return img.url;
  }
  // Last resort: any image
  var first = images[keys[0]];
  return first && first.url ? first.url : null;
}

// --- S1 COVER (Vibe / The Source) ---
function S1Cover({ slide, category, images, edition, index }) {
  var p = PALETTES[category];
  var url = getImg(images, 0);
  var edLabel = edition ? edition.label : "";
  return (
    <ImgBg url={url} pal={p} category={category} slideIndex={index || 0} darken="linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.9))">
        <div style={{ position: "absolute", top: M_TOP, left: M_SIDE, right: M_SIDE, textAlign: "right", zIndex: 2 }}>
          <div style={{ ...CP, fontSize: 18, letterSpacing: "0.5em", color: "#ffffffbb", fontWeight: 700, textDecoration: "line-through", textDecorationColor: p.accent, textDecorationThickness: 1 }}>LOATHR</div>
          {edLabel && <div style={{ ...CP, fontSize: 5, letterSpacing: "0.15em", color: "#ffffffcc", marginTop: 3, marginRight: 9 }}>{edLabel}</div>}
        </div>
        <div style={{ position: "absolute", bottom: M_BOT, left: M_SIDE, right: M_SIDE, zIndex: 3 }}>
          <div style={Object.assign({}, { textAlign: "left" }, slide.headingAlign ? { textAlign: slide.headingAlign } : {})}>
            <div style={Object.assign({}, { ...headFont(slide), fontSize: (slide.title && slide.title.length > 35 ? 24 : 30) + (slide.headingSize || 0), color: slide.headingColor || p.text, lineHeight: 1.1, textShadow: "0 3px 20px rgba(0,0,0,0.9)" }, slide.headingAlign ? { textAlign: slide.headingAlign } : {})}>
              {formatCoverTitle(slide.title, p.accent, slide.titleHighlight)}
            </div>
            <div style={{ height: 3, background: "linear-gradient(to right, " + p.accent + ", transparent)", margin: "10px 0", width: "50%" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <div style={{ width: 8, height: 8, background: p.accent }} />
              <div style={{ ...CP, fontSize: 9, color: "#ffffffcc", letterSpacing: "0.1em", fontWeight: 700 }}>{CAT_LABELS[category]}</div>
              <div style={{ width: 8, height: 8, background: p.accent2 || p.accent }} />
            </div>
            {slide.subtitle && <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8.5 + (slide.bodySize || 0), marginTop: 8, color: slide.bodyColor || "#ffffffcc", textTransform: "uppercase", letterSpacing: "0.05em" }, slide.bodyAlign ? { textAlign: slide.bodyAlign } : {})}>{slide.subtitle}</div>}
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
  // Per-element offsets for independent movement
  var cp = slide.customPosition && typeof slide.customPosition === "object" ? slide.customPosition : {};
  var hOff = cp.heading || { top: 0, left: 0 };
  var bOff = cp.body || { top: 0, left: 0 };
  var hlOff = cp.highlight || { top: 0, left: 0 };
  var hTransform = (hOff.top || hOff.left) ? { transform: "translate(" + (hOff.left || 0) + "px," + (hOff.top || 0) + "px)" } : {};
  var bTransform = (bOff.top || bOff.left) ? { transform: "translate(" + (bOff.left || 0) + "px," + (bOff.top || 0) + "px)" } : {};
  var hlTransform = (hlOff.top || hlOff.left) ? { transform: "translate(" + (hlOff.left || 0) + "px," + (hlOff.top || 0) + "px)" } : {};
  var textContent = <div>
    <div style={Object.assign({}, { ...headFont(slide), fontSize: 13 + (slide.headingSize || 0), color: slide.headingColor || (useSticky ? "inherit" : "#ffffff"), marginBottom: 10, letterSpacing: "0.03em", textTransform: "uppercase", textAlign: slide.headingAlign || "right" }, hTransform)}>{slide.heading || "Part " + index}</div>
    <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 9.5 + (slide.bodySize || 0), color: slide.bodyColor || (useSticky ? "inherit" : "#ffffffe6"), lineHeight: 1.5, textAlign: slide.bodyAlign || "left" }, bTransform)}>{styleBody(slide.body, p.accent, p.accent2)}</div>
    {styledHighlight(slide.highlight, slide, { fg: useSticky ? "inherit" : "#1a1a1a", accent: "#ffffff", pillText: "#1a1a1a", defaultStyle: "pill" })}
    {slide.specs && <div style={{ marginTop: 8, border: "1px solid " + p.accent + "44", padding: "4px 6px", background: "rgba(255,255,255,0.03)" }}><div style={{ ...WS, fontSize: 5.3, color: useSticky ? "inherit" : "#ffffffaa", textAlign: "left" }}>{slide.specs}</div></div>}
    <MicroCite sources={slide.sources} />
  </div>;
  // Container style — user override via slide.containerStyle, or category default
  var CONTAINER_MAP = { bubble: BubbleBox, sticky: StickyNote, formal: FormalFrame, glass: GlassBox, tape: TapeStrip, cutout: CutoutBox, minimal: MinimalBox, none: null };
  var containerOverride = slide.containerStyle && CONTAINER_MAP.hasOwnProperty(slide.containerStyle) ? slide.containerStyle : null;
  var ContainerComp = containerOverride ? CONTAINER_MAP[containerOverride] : (useBubble ? BubbleBox : useSticky ? StickyNote : useFormal ? FormalFrame : null);
  var containerSeed = typeof slide.containerVariant === "number" ? slide.containerVariant : index;
  var containerBg = slide.containerBg || null;
  var containerOpacity = typeof slide.containerOpacity === "number" ? slide.containerOpacity : null;
  var containerStyle = containerBg || containerOpacity !== null ? { background: containerBg || undefined, opacity: containerOpacity !== null ? containerOpacity : undefined } : undefined;
  var wrappedText = ContainerComp ? <ContainerComp accent={p.accent} accent2={p.accent2} seed={containerSeed} style={containerStyle}>{textContent}</ContainerComp> : textContent;
  var hasSplitPos = slide.textPosition && ["split-corners", "side-left", "side-right", "top-left", "top-right", "l-shape"].indexOf(slide.textPosition) !== -1;
  if (hasSplitPos) {
    return (
      <ImgBg url={url} pal={p} category={category} slideIndex={index || 0}>
        <SplitTextBox slide={slide} position={slide.textPosition} accent={p.accent} accent2={p.accent2} category={category} seed={index} styleBody={styleBody} />
      </ImgBg>
    );
  }
  var contentSeed = (slide.body || "").length + (slide.heading || "").length;
  var fpos = slide.customPosition && (slide.customPosition.all || slide.customPosition.heading) ? (function() { var o = slide.customPosition.all || slide.customPosition.heading; return { top: o.top, left: o.left, maxWidth: "65%", right: "auto", bottom: "auto" }; })() : getFramePosition(contentSeed, index, slide.textPosition);
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
  var cp3 = slide.customPosition && typeof slide.customPosition === "object" ? slide.customPosition : {};
  var h3 = cp3.heading || { top: 0, left: 0 }; var b3 = cp3.body || { top: 0, left: 0 }; var hl3 = cp3.highlight || { top: 0, left: 0 };
  var h3t = (h3.top || h3.left) ? { transform: "translate(" + (h3.left||0) + "px," + (h3.top||0) + "px)" } : {};
  var b3t = (b3.top || b3.left) ? { transform: "translate(" + (b3.left||0) + "px," + (b3.top||0) + "px)" } : {};
  var hl3t = (hl3.top || hl3.left) ? { transform: "translate(" + (hl3.left||0) + "px," + (hl3.top||0) + "px)" } : {};

  if (flipped) {
    var flippedText = <div>
      <div style={Object.assign({}, { ...headFont(slide), fontSize: 12 + (slide.headingSize || 0), color: slide.headingColor || (useSticky ? "inherit" : "#ffffff"), marginBottom: 8, letterSpacing: "0.03em", textTransform: "uppercase", textAlign: slide.headingAlign || "left" }, h3t)}>{slide.heading || "Part " + index}</div>
      <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8.5 + (slide.bodySize || 0), color: slide.bodyColor || (useSticky ? "inherit" : "#ffffffe6"), lineHeight: 1.45, textAlign: slide.bodyAlign || "right", overflow: "hidden" }, b3t)}>{styleBody(slide.body, p.accent2, p.accent)}</div>
      {styledHighlight(slide.highlight, slide, { fg: "#1a1a1a", accent: "#ffffff", pillText: "#1a1a1a", defaultStyle: "pill" })}
      <MicroCite sources={slide.sources} />
    </div>;
    var flippedWrapped = useBubble ? <BubbleBox accent={p.accent} accent2={p.accent2} seed={index + 1}>{flippedText}</BubbleBox>
      : useSticky ? <StickyNote accent={p.accent} accent2={p.accent2} seed={index + 1}>{flippedText}</StickyNote>
      : useFormal ? <FormalFrame accent={p.accent} accent2={p.accent2} seed={index + 1}>{flippedText}</FormalFrame>
      : flippedText;
    var hasSplitFlip = slide.textPosition && ["split-corners", "side-left", "side-right", "top-left", "top-right", "l-shape"].indexOf(slide.textPosition) !== -1;
    if (hasSplitFlip) {
      return (
        <ImgBg url={url} pal={p} category={category} slideIndex={index || 0}>
          <SplitTextBox slide={slide} position={slide.textPosition} accent={p.accent} accent2={p.accent2} category={category} seed={index + 1} styleBody={styleBody} />
        </ImgBg>
      );
    }
    var fposFlip = slide.customPosition && (slide.customPosition.all || slide.customPosition.heading) ? (function() { var o = slide.customPosition.all || slide.customPosition.heading; return { top: o.top, left: o.left, maxWidth: "65%", right: "auto", bottom: "auto" }; })() : getFramePosition((slide.body || "").length, index, slide.textPosition);
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
    <div style={Object.assign({}, { ...headFont(slide), fontSize: 12 + (slide.headingSize || 0), color: slide.headingColor || (useSticky ? "inherit" : "#ffffff"), marginBottom: 8, letterSpacing: "0.03em", textTransform: "uppercase", textAlign: slide.headingAlign || "right" }, h3t)}>{slide.heading || "Part " + index}</div>
    <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8.5 + (slide.bodySize || 0), color: slide.bodyColor || (useSticky ? "inherit" : "#ffffffe6"), lineHeight: 1.45, textAlign: slide.bodyAlign || "left", overflow: "hidden" }, b3t)}>{styleBody(slide.body, p.accent, p.accent2)}</div>
    {styledHighlight(slide.highlight, slide, { fg: "#1a1a1a", accent: "#ffffff", pillText: "#1a1a1a", defaultStyle: "pill" })}
    <MicroCite sources={slide.sources} />
  </div>;
  var normalWrapped = useBubble ? <BubbleBox accent={p.accent} accent2={p.accent2} seed={index}>{normalText}</BubbleBox>
    : useSticky ? <StickyNote accent={p.accent} accent2={p.accent2} seed={index}>{normalText}</StickyNote>
    : useFormal ? <FormalFrame accent={p.accent} accent2={p.accent2} seed={index}>{normalText}</FormalFrame>
    : normalText;
  var hasSplitNorm = slide.textPosition && ["split-corners", "side-left", "side-right", "top-left", "top-right", "l-shape"].indexOf(slide.textPosition) !== -1;
  if (hasSplitNorm) {
    return (
      <ImgBg url={url} pal={p} category={category} slideIndex={index || 0}>
        <SplitTextBox slide={slide} position={slide.textPosition} accent={p.accent} accent2={p.accent2} category={category} seed={index} styleBody={styleBody} />
      </ImgBg>
    );
  }
  var fposNorm = slide.customPosition && (slide.customPosition.all || slide.customPosition.heading) ? (function() { var o = slide.customPosition.all || slide.customPosition.heading; return { top: o.top, left: o.left, maxWidth: "65%", right: "auto", bottom: "auto" }; })() : getFramePosition((slide.heading || "").length, index, slide.textPosition);
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
  if (!slide) return <div style={{ width: "100%", height: "100%", background: "#0a0a0a" }} />;
  var p = PALETTES[category];
  var url = getImg(images, index);
  // Normalize Claude's varied field names to expected fields
  var s = Object.assign({}, slide);
  if (!s.stat && s.content) { var parts = String(s.content).match(/[\d,.%$]+/); if (parts) s.stat = parts[0]; }
  if (!s.body && s.content) s.body = s.content;
  if (!s.body && s.subhead) s.body = s.subhead;
  if (!s.caption && s.body) s.caption = s.body;
  if (!s.shift && s.body) s.shift = s.body;
  if (!s.verdict && s.body) s.verdict = s.body;
  if (!s.context && s.body) s.context = s.body;
  if (!s.narrative && s.body) s.narrative = s.body;
  if (!s.left && s.headline) s.left = s.headline;
  if (!s.statLabel && s.subhead) s.statLabel = s.subhead;
  var fmt = s.statFormat || (s.before ? "comparison" : s.stats ? "story" : s.left ? "versus" : s.year && !s.heading ? "timeline" : s.stat2 ? "comparison" : "killer");
  slide = s;

  // Format A: Comparison — vertical divider (layout 0) or horizontal rule (layout 1)
  if (fmt === "comparison") {
    var beforeVal = slide.before || slide.stat || "";
    var afterVal = slide.after || slide.stat2 || "";
    var beforeLbl = slide.beforeLabel || slide.statLabel || "";
    var afterLbl = slide.afterLabel || slide.stat2Label || "";
    var maxLen = Math.max(String(beforeVal).length, String(afterVal).length);
    var numSize = maxLen > 7 ? 28 : maxLen > 5 ? 34 : 42;
    var compLayout = index % 2;
    return (
      <ImgBg url={url} pal={p} category={category} slideIndex={index || 0} darken="rgba(0,0,0,0.65)">
        {compLayout === 0 ? (
          <div style={{ position: "absolute", top: "25%", left: M_SIDE, right: M_SIDE, zIndex: 3, display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ ...WS, fontSize: numSize, color: p.accent2 || "#ffffff88", lineHeight: 0.85 }}>{beforeVal}</div>
              <div style={{ ...HD, fontSize: 7, color: "#ffffffcc", marginTop: 6 }}>{beforeLbl}</div>
            </div>
            <div style={{ width: 2, height: 60, background: p.accent, flexShrink: 0, margin: "0 8px" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ ...WS, fontSize: numSize, color: p.accent, lineHeight: 0.85 }}>{afterVal}</div>
              <div style={{ ...HD, fontSize: 7, color: "#ffffffcc", marginTop: 6 }}>{afterLbl}</div>
            </div>
          </div>
        ) : (
          <div style={{ position: "absolute", top: "20%", left: M_SIDE, right: M_SIDE, zIndex: 3, textAlign: "center" }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ ...WS, fontSize: numSize, color: p.accent2 || "#ffffff88", lineHeight: 0.85 }}>{beforeVal}</div>
              <div style={{ ...HD, fontSize: 7, color: "#ffffffcc", marginTop: 4 }}>{beforeLbl}</div>
            </div>
            <div style={{ width: "40%", height: 2, background: "linear-gradient(to right, " + (p.accent2 || p.accent) + ", " + p.accent + ")", margin: "6px auto" }} />
            <div>
              <div style={{ ...WS, fontSize: numSize + 10, color: p.accent, lineHeight: 0.85 }}>{afterVal}</div>
              <div style={{ ...HD, fontSize: 7, color: "#ffffffcc", marginTop: 4 }}>{afterLbl}</div>
            </div>
          </div>
        )}
        <div style={{ position: "absolute", bottom: M_BOT, left: M_SIDE, right: M_SIDE, zIndex: 3, textAlign: "center" }}>
          <FormalFrame accent={p.accent} accent2={p.accent2} seed={index + 5}>
            <div style={{ ...HD, fontSize: 8, color: "#ffffffcc", fontStyle: "italic" }}>{slide.shift || slide.body}</div>
          </FormalFrame>
          <MicroCite sources={slide.sources} />
        </div>
      </ImgBg>
    );
  }

  // Format B: Killer Number — centered or left-anchored variation
  if (fmt === "killer") {
    var killerVal = String(slide.stat || "");
    var killerSize = killerVal.length > 8 ? 36 : killerVal.length > 5 ? 48 : 64;
    var killerLayout = index % 2;
    return (
      <ImgBg url={url} pal={p} category={category} slideIndex={index || 0} darken="rgba(0,0,0,0.6)">
        {killerLayout === 0 ? (
          <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 3, textAlign: "center", width: "85%" }}>
            <div style={{ ...WS, fontSize: killerSize, color: p.accent, lineHeight: 0.85, letterSpacing: -2 }}>{slide.stat}</div>
            <div style={{ ...HD, fontSize: 9, color: "#ffffffcc", marginTop: 12, lineHeight: 1.5 }}>{slide.caption || slide.statLabel || slide.body}</div>
          </div>
        ) : (
          <div style={{ position: "absolute", top: "30%", left: M_SIDE, zIndex: 3, width: "70%" }}>
            <div style={{ ...WS, fontSize: killerSize, color: p.accent, lineHeight: 0.85, letterSpacing: -2 }}>{slide.stat}</div>
            <div style={{ width: "30%", height: 2, background: p.accent, margin: "10px 0" }} />
            <div style={{ ...HD, fontSize: 9, color: "#ffffffcc", lineHeight: 1.5 }}>{slide.caption || slide.statLabel || slide.body}</div>
          </div>
        )}
        <div style={{ position: "absolute", bottom: M_BOT, right: M_SIDE, zIndex: 3 }}>
          <MicroCite sources={slide.sources} />
        </div>
      </ImgBg>
    );
  }

  // Format C: Data Story — vertical list or horizontal row
  if (fmt === "story") {
    var stats = slide.stats || [{ num: slide.stat, label: slide.statLabel }, { num: slide.stat2, label: slide.stat2Label }, { num: "—", label: "—" }];
    var storyLayout = index % 2;
    return (
      <ImgBg url={url} pal={p} category={category} slideIndex={index || 0} darken="rgba(0,0,0,0.7)">
        {storyLayout === 0 ? (
          <div style={{ position: "absolute", top: "18%", left: M_SIDE, right: M_SIDE, zIndex: 3 }}>
            {stats.slice(0, 3).map(function(s, i) {
              var c = i % 2 === 0 ? p.accent : p.accent2;
              return <div key={i} style={{ marginBottom: 14, display: "flex", alignItems: "baseline", gap: 8 }}>
                <div style={{ ...CP, fontSize: 7, color: "#ffffff55" }}>{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <div style={{ ...WS, fontSize: 28, color: c, lineHeight: 0.9 }}>{s.num}</div>
                  <div style={{ ...HD, fontSize: 6, color: "#ffffffcc", marginTop: 2 }}>{s.label}</div>
                </div>
              </div>;
            })}
          </div>
        ) : (
          <div style={{ position: "absolute", top: "22%", left: M_SIDE, right: M_SIDE, zIndex: 3, display: "flex", gap: 4 }}>
            {stats.slice(0, 3).map(function(s, i) {
              var c = i % 2 === 0 ? p.accent : p.accent2;
              return <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid " + p.accent + "33" : "none", paddingRight: i < 2 ? 4 : 0 }}>
                <div style={{ ...WS, fontSize: 22, color: c, lineHeight: 0.9 }}>{s.num}</div>
                <div style={{ ...HD, fontSize: 5, color: "#ffffffcc", marginTop: 3 }}>{s.label}</div>
              </div>;
            })}
          </div>
        )}
        <div style={{ position: "absolute", bottom: M_BOT, left: M_SIDE, right: M_SIDE, zIndex: 3 }}>
          <FormalFrame accent={p.accent} accent2={p.accent2} seed={index}>
            <div style={{ ...HD, fontSize: 8, color: "#ffffffcc", fontStyle: "italic" }}>{slide.narrative || slide.body}</div>
          </FormalFrame>
          <MicroCite sources={slide.sources} />
        </div>
      </ImgBg>
    );
  }

  // Format D: Versus — thick divider + accent verdict strip
  if (fmt === "versus") {
    var lStat = slide.leftStat || slide.stat || "";
    var rStat = slide.rightStat || slide.stat2 || "";
    var vsMaxLen = Math.max(String(lStat).length, String(rStat).length);
    var vsSize = vsMaxLen > 7 ? 24 : vsMaxLen > 5 ? 30 : 36;
    return (
      <ImgBg url={url} pal={p} category={category} slideIndex={index || 0} darken="rgba(0,0,0,0.65)">
        <div style={{ position: "absolute", top: "20%", left: M_SIDE, right: M_SIDE, zIndex: 3, display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ ...FN, fontSize: 10, color: "#ffffffcc", textTransform: "uppercase", marginBottom: 6 }}>{slide.left || "A"}</div>
            <div style={{ ...WS, fontSize: vsSize, color: p.accent, lineHeight: 0.85 }}>{lStat}</div>
            <div style={{ ...HD, fontSize: 7, color: "#ffffffcc", marginTop: 6 }}>{slide.leftLabel || slide.statLabel}</div>
          </div>
          <div style={{ width: 2, height: 70, background: p.accent, flexShrink: 0, margin: "0 6px" }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ ...FN, fontSize: 10, color: "#ffffffcc", textTransform: "uppercase", marginBottom: 6 }}>{slide.right || "B"}</div>
            <div style={{ ...WS, fontSize: vsSize, color: p.accent2 || p.accent, lineHeight: 0.85 }}>{rStat}</div>
            <div style={{ ...HD, fontSize: 7, color: "#ffffffcc", marginTop: 6 }}>{slide.rightLabel || slide.stat2Label}</div>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: M_BOT, left: M_SIDE, right: M_SIDE, zIndex: 3, textAlign: "center" }}>
          <div style={{ display: "inline-block" }}><span style={{ ...HD, fontSize: 9, color: "#ffffff", fontWeight: 700, background: p.accent + "cc", padding: "3px 8px" }}>{slide.verdict || slide.body}</span></div>
          <MicroCite sources={slide.sources} />
        </div>
      </ImgBg>
    );
  }

  // Format E: Timeline Number — brighter year with accent markers
  return (
    <ImgBg url={url} pal={p} category={category} slideIndex={index || 0} darken="rgba(0,0,0,0.6)">
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", zIndex: 3, textAlign: "center", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 6, height: 6, background: p.accent }} />
        <div style={{ ...CP, fontSize: 12, color: "#ffffffcc", letterSpacing: "0.3em" }}>{slide.year || ""}</div>
        <div style={{ width: 6, height: 6, background: p.accent2 || p.accent }} />
      </div>
      <div style={{ position: "absolute", top: "36%", left: "50%", transform: "translateX(-50%)", zIndex: 3, textAlign: "center", width: "80%" }}>
        <div style={{ ...WS, fontSize: 52, color: p.accent, lineHeight: 0.85 }}>{slide.stat}</div>
        <div style={{ ...HD, fontSize: 7, color: "#ffffffcc", marginTop: 6, letterSpacing: "0.1em" }}>{slide.statLabel}</div>
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
  var cp5 = slide.customPosition && typeof slide.customPosition === "object" ? slide.customPosition : {};
  var b5t = (cp5.body && (cp5.body.top || cp5.body.left)) ? { transform: "translate(" + (cp5.body.left||0) + "px," + (cp5.body.top||0) + "px)" } : {};
  var hl5t = (cp5.highlight && (cp5.highlight.top || cp5.highlight.left)) ? { transform: "translate(" + (cp5.highlight.left||0) + "px," + (cp5.highlight.top||0) + "px)" } : {};
  var s5Text = <div style={{ overflow: "hidden" }}>
    <div style={Object.assign({}, { ...bodyFont(slide), fontSize: 8.5 + (slide.bodySize || 0), color: slide.bodyColor || (useSticky ? "inherit" : "#ffffffe6"), lineHeight: 1.45, textAlign: slide.bodyAlign || "right" }, b5t)}>{styleBody(slide.body, p.accent, p.accent2)}</div>
    {!styled && <div style={{ width: "100%", height: 1, background: p.accent + "33", margin: "6px 0" }} />}
    {styledHighlight(slide.highlight, slide, { fg: "#1a1a1a", accent: "#ffffff", pillText: "#1a1a1a", defaultStyle: "pill" })}
  </div>;
  var CONTAINER_MAP5 = { bubble: BubbleBox, sticky: StickyNote, formal: FormalFrame, glass: GlassBox, tape: TapeStrip, cutout: CutoutBox, minimal: MinimalBox, none: null };
  var co5 = slide.containerStyle && CONTAINER_MAP5.hasOwnProperty(slide.containerStyle) ? slide.containerStyle : null;
  var CC5 = co5 ? CONTAINER_MAP5[co5] : (useBubble ? BubbleBox : useSticky ? StickyNote : useFormal ? FormalFrame : null);
  var s5Seed = typeof slide.containerVariant === "number" ? slide.containerVariant : index + 2;
  var s5Bg = slide.containerBg || null;
  var s5Op = typeof slide.containerOpacity === "number" ? slide.containerOpacity : null;
  var s5Style = s5Bg || s5Op !== null ? { background: s5Bg || undefined, opacity: s5Op !== null ? s5Op : undefined } : undefined;
  var s5Wrapped = CC5 ? <CC5 accent={p.accent} accent2={p.accent2} seed={s5Seed} style={s5Style}>{s5Text}</CC5> : s5Text;
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
          <div style={slide.customPosition && (slide.customPosition.all || slide.customPosition.heading) ? (function() { var o = slide.customPosition.all || slide.customPosition.heading; return { position: "absolute", top: o.top, left: o.left, maxWidth: "65%", zIndex: 3 }; })() : { position: "absolute", bottom: M_BOT, right: M_SIDE, left: "50%", zIndex: 3 }}>
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
          <div style={{ ...HD, fontSize: 11.5, fontStyle: "italic", color: "#ffffff", lineHeight: 1.8, textAlign: "left" }}><span style={{ background: p.accent + "cc", padding: "2px 5px", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>{quoteText.charAt(0) === '"' ? quoteText : '"' + quoteText + '"'}</span></div>
          <div style={{ width: 12, height: 1, background: p.accent + "66", margin: "8px 0 8px auto" }} />
          {slide.source && <div style={{ textAlign: "right", marginTop: 4 }}><span style={{ ...WS, fontSize: 7, color: "#1a1a1a", background: "#ffffff", padding: "2px 6px", letterSpacing: "0.08em" }}>{"— " + slide.source}</span></div>}
        </FormalFrame>
      </div>
    </ImgBg>
  );
}

// --- S7 CLOSER (Blitz geometric fade) ---
function S7Blitz({ category, hashtags, images, index }) {
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
function RecDestination({ slide, category, images, index }) {
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
function RecNewOpening({ slide, category, images, index }) {
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
function RecShortlist({ slide, category, images, index }) {
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
  if (!slideData || !category) return <div style={{ width: "100%", height: "100%", background: "#0a0a0a" }} />;
  var p = PALETTES[category];
  var borderColor = slideIndex % 2 === 0 ? p.accent : p.accent2;
  var slide;
  if (slideIndex === 0) slide = <RecDestination slide={slideData} category={category} images={images} index={slideIndex} />;
  else if (slideIndex === 1) slide = <RecHiddenGem slide={slideData} category={category} images={images} />;
  else if (slideIndex === 2) slide = <RecNewOpening slide={slideData} category={category} images={images} index={slideIndex} />;
  else if (slideIndex === 3) slide = <RecCulture slide={slideData} category={category} images={images} />;
  else slide = <RecShortlist slide={slideData} category={category} images={images} index={slideIndex} />;
  return (
    <div style={{ width: "100%", height: "100%", border: "2px solid " + borderColor, overflow: "hidden" }}>
      {slide}
    </div>
  );
}

// --- SLIDE RENDERER ---
function SlideRenderer({ category, slideData, slideIndex, totalSlides, images, edition }) {
  if (!slideData || !category) return <div style={{ width: "100%", height: "100%", background: "#0a0a0a" }} />;
  // Resolve cross-category lens — use lens palette for border, primary for cover/closer
  var effectiveCat = category;
  if (slideData.categoryLens && slideIndex > 0 && slideIndex < totalSlides - 1) {
    var lensMatch = CATEGORIES.find(function(c) { return c.label === slideData.categoryLens || c.id === slideData.categoryLens.toLowerCase(); });
    if (lensMatch && PALETTES[lensMatch.id]) effectiveCat = lensMatch.id;
  }
  var p = PALETTES[category];
  var lp = PALETTES[effectiveCat] || p;
  if (!p) return <div style={{ width: "100%", height: "100%", background: "#0a0a0a" }} />;
  var lastIdx = totalSlides - 1;
  var borderColor = category === "enterprise" ? "#ffffff" : category === "newsdesk" ? "#1a1a1a" : (effectiveCat !== category ? lp.accent : (slideIndex % 2 === 0 ? p.accent : p.accent2));
  var slide;
  // Enterprise segment — use B&W slide components
  if (category === "enterprise") {
    if (slideIndex === 0) slide = <EnterpriseCover slide={slideData} images={images} index={slideIndex} />;
    else if (slideIndex === lastIdx) slide = <EnterpriseCloser slide={slideData} images={images} index={slideIndex} category={category} />;
    else if (slideData.heading && slideData.heading.toUpperCase().indexOf("PLAYBOOK") > -1) slide = <EnterprisePlaybook slide={slideData} images={images} index={slideIndex} />;
    else {
      // Detect enterprise slide role from position or content
      var eRoles = ["THE LANDSCAPE", "THE FORCE", "THE IMPACT", "THE WINNERS", "THE LOSERS", "THE DATA", "THE PLAYBOOK", "THE FORECAST"];
      var eRole = slideData.role || eRoles[(slideIndex - 1) % eRoles.length] || "";
      // For stat slides (THE DATA), merge stat into body if no body text
      var eSlideData = Object.assign({}, slideData, { role: eRole });
      if ((slideData.statFormat || slideData.stat) && !slideData.body) {
        eSlideData.body = (slideData.stat || "") + (slideData.caption ? " — " + slideData.caption : slideData.statLabel ? " — " + slideData.statLabel : "");
        if (!eSlideData.heading) eSlideData.heading = "THE DATA";
      }
      var eMosaic = _mosaicSlides[slideIndex];
      var eMosaicLayout = eMosaic && typeof eMosaic._layoutIdx === "number" ? MOSAIC_LAYOUTS[eMosaic._layoutIdx] : null;
      slide = <EnterpriseContent slide={eSlideData} images={images} index={slideIndex} mosaicUrls={eMosaic} mosaicLayout={eMosaicLayout} />;
    }
  } else if (category === "newsdesk") {
    if (slideIndex === 0) slide = <NewsFrontPage slide={slideData} images={images} index={slideIndex} />;
    else if (slideIndex === lastIdx || slideData.fullSources) slide = <NewsSourcesCloser slide={slideData} />;
    else if ((slideData.quote || (slideData.heading && slideData.heading.toUpperCase().indexOf("REACTION") > -1)) && typeof slideData.newsLayout !== "number") slide = <NewsReaction slide={slideData} images={images} index={slideIndex} />;
    else {
      // News Desk: all content goes through NewsStory — stats rendered inline, not via S4Emigre
      var nSlideData = Object.assign({}, slideData, { role: slideData.role || slideData.heading || "" });
      // Merge stat into body if it's a stat-only slide
      if ((slideData.statFormat || slideData.stat) && !slideData.body) {
        nSlideData.body = (slideData.stat || "") + (slideData.caption || slideData.statLabel ? " \u2014 " + (slideData.caption || slideData.statLabel) : "");
        if (!nSlideData.heading) nSlideData.heading = "THE NUMBERS";
      }
      slide = <NewsStory slide={nSlideData} images={images} index={slideIndex} />;
    }
  } else {
    if (slideIndex === lastIdx) slide = <S7Blitz category={category} hashtags={slideData.hashtags || ""} images={images} index={slideIndex} />;
    else if (slideIndex === 0) slide = <S1Cover slide={slideData} category={category} images={images} edition={edition} index={slideIndex} />;
    else if (slideData.statFormat || slideData.stat || slideData.stats || slideData.before || slideData.leftStat) slide = <S4Emigre slide={slideData} index={slideIndex} category={effectiveCat} images={images} />;
    else if (slideData.quote) slide = <S6Purple slide={slideData} index={slideIndex} category={effectiveCat} images={images} />;
    else {
      var layouts = [S3RayGun, S5Face, S2Arena];
      var pick = (slideIndex - 1) % layouts.length;
      var Component = layouts[pick];
      slide = <Component slide={slideData} index={slideIndex} category={effectiveCat} images={images} />;
    }
  }
  // Cross-category slides get a subtle lens indicator
  var lensTag = effectiveCat !== category ? (CATEGORIES.find(function(c) { return c.id === effectiveCat; }) || {}).label : null;
  return (
    <div style={{ width: "100%", height: "100%", border: "2px solid " + borderColor, overflow: "hidden", position: "relative" }}>
      {slide}
      {lensTag && <div style={{ position: "absolute", top: 4, right: 4, zIndex: 12, ...CP, fontSize: 4, letterSpacing: "0.1em", color: lp.accent, background: "rgba(0,0,0,0.6)", padding: "1px 4px", borderRadius: 2 }}>{lensTag.toUpperCase()}</div>}
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
    var euroKey = (typeof process !== "undefined" && process.env ? process.env.NEXT_PUBLIC_EUROPEANA_KEY : "") || "apidemo";
    var r = await fetchWithTimeout("https://api.europeana.eu/record/v2/search.json?query=" + encodeURIComponent(query) + "&rows=8&media=true&thumbnail=true&wskey=" + euroKey);
    if (!r.ok) return [];
    var d = await r.json();
    return (d.items || []).filter(function(item) { return item.edmIsShownBy && item.edmIsShownBy[0]; }).slice(0, 5).map(function(item) {
      return { url: item.edmIsShownBy[0], thumb: item.edmPreview ? item.edmPreview[0] : item.edmIsShownBy[0], alt: item.title ? item.title[0] : query, credit: item.dataProvider ? item.dataProvider[0] : "Europeana", source: "Europeana" };
    });
  } catch (e) { return []; }
};

// Wikimedia Commons — for famous people portraits
// Wikipedia REST API — best source for celebrity photos (high-res, 100% hit rate)
var searchWikiRest = async function(personName) {
  if (!personName || personName.length < 2) return [];
  try {
    var title = personName.trim().split(" ").map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join("_");
    var r = await fetchWithTimeout("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title), 5000);
    if (r.ok) {
      var d = await r.json();
      if (d.thumbnail && d.thumbnail.source) {
        var origUrl = d.originalimage && d.originalimage.source ? d.originalimage.source : d.thumbnail.source;
        return [{ url: origUrl, thumb: d.thumbnail.source, alt: d.title || personName, credit: "Wikipedia", source: "Wikipedia" }];
      }
    }
    // If exact title failed, search for it first then get summary
    var sr = await fetchWithTimeout("https://en.wikipedia.org/w/api.php?action=opensearch&search=" + encodeURIComponent(personName) + "&limit=1&format=json&origin=*", 5000);
    if (sr.ok) {
      var sd = await sr.json();
      if (sd[1] && sd[1][0]) {
        var foundTitle = sd[1][0].replace(/ /g, "_");
        var r2 = await fetchWithTimeout("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(foundTitle), 5000);
        if (r2.ok) {
          var d2 = await r2.json();
          if (d2.thumbnail && d2.thumbnail.source) {
            var origUrl2 = d2.originalimage && d2.originalimage.source ? d2.originalimage.source : d2.thumbnail.source;
            return [{ url: origUrl2, thumb: d2.thumbnail.source, alt: d2.title || personName, credit: "Wikipedia", source: "Wikipedia" }];
          }
        }
      }
    }
    return [];
  } catch (e) { console.error("Wiki REST error for " + personName + ":", e); return []; }
};

// Wikipedia pageimages API — backup source with size control
var searchWikimedia = async function(personName) {
  if (!personName || personName.length < 2) return [];
  try {
    var sr = await fetchWithTimeout("https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=" + encodeURIComponent(personName) + "&gsrlimit=5&prop=pageimages&format=json&pithumbsize=1200&origin=*", 5000);
    if (!sr.ok) return [];
    var sd = await sr.json();
    var sp = sd.query && sd.query.pages ? sd.query.pages : {};
    var results = [];
    Object.values(sp).forEach(function(page) {
      if (page.thumbnail && page.thumbnail.source) {
        results.push({ url: page.thumbnail.source, thumb: page.thumbnail.source, alt: page.title || personName, credit: "Wikipedia", source: "Wiki Search" });
      }
    });
    return results;
  } catch (e) { return []; }
};

// Wikimedia Commons — massive free image library
var searchWikiCommons = async function(query) {
  try {
    var r = await fetchWithTimeout("https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=" + encodeURIComponent(query) + "&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1000&format=json&origin=*", 6000);
    if (!r.ok) return [];
    var d = await r.json();
    var pages = d.query && d.query.pages ? d.query.pages : {};
    var results = [];
    Object.values(pages).forEach(function(page) {
      var info = page.imageinfo && page.imageinfo[0];
      if (info && info.thumburl && /\.(jpg|jpeg|png|webp)/i.test(info.thumburl)) {
        var meta = info.extmetadata || {};
        results.push({ url: info.thumburl, thumb: info.thumburl, alt: meta.ObjectName ? meta.ObjectName.value : query, credit: meta.Artist ? meta.Artist.value.replace(/<[^>]*>/g, "").slice(0, 40) : "Wikimedia Commons", source: "Commons" });
      }
    });
    return results.slice(0, 5);
  } catch (e) { return []; }
};

// Pixabay — free high-quality stock photos
var searchPixabay = async function(query) {
  try {
    var pixKey = (typeof process !== "undefined" && process.env ? process.env.NEXT_PUBLIC_PIXABAY_KEY : "") || "";
    if (!pixKey) return [];
    var r = await fetchWithTimeout("https://pixabay.com/api/?key=" + pixKey + "&q=" + encodeURIComponent(query) + "&image_type=photo&orientation=vertical&per_page=8&safesearch=true", 5000);
    if (!r.ok) return [];
    var d = await r.json();
    return (d.hits || []).slice(0, 5).map(function(img) {
      return { url: img.largeImageURL || img.webformatURL, thumb: img.previewURL || img.webformatURL, alt: img.tags || query, credit: img.user || "Pixabay", source: "Pixabay" };
    });
  } catch (e) { return []; }
};

// TMDb (The Movie Database) — great for actors, directors, TV personalities
var searchTMDb = async function(personName) {
  try {
    var tmdbKey = (typeof process !== "undefined" && process.env ? process.env.NEXT_PUBLIC_TMDB_KEY : "") || "";
    if (!tmdbKey) return [];
    var r = await fetchWithTimeout("https://api.themoviedb.org/3/search/person?query=" + encodeURIComponent(personName) + "&include_adult=false&language=en-US&page=1&api_key=" + tmdbKey, 5000);
    if (!r.ok) return [];
    var d = await r.json();
    return (d.results || []).slice(0, 3).filter(function(p) { return p.profile_path; }).map(function(p) {
      return { url: "https://image.tmdb.org/t/p/w780" + p.profile_path, thumb: "https://image.tmdb.org/t/p/w185" + p.profile_path, alt: p.name || personName, credit: "TMDb", source: "TMDb" };
    });
  } catch (e) { return []; }
};

// iTunes/Apple Music — for musicians, returns album/artist art
var searchITunes = async function(personName) {
  try {
    var r = await fetchWithTimeout("https://itunes.apple.com/search?term=" + encodeURIComponent(personName) + "&entity=musicArtist&limit=3", 5000);
    if (!r.ok) return [];
    var d = await r.json();
    return (d.results || []).filter(function(a) { return a.artworkUrl100; }).slice(0, 2).map(function(a) {
      var hiRes = a.artworkUrl100.replace("100x100", "600x600");
      return { url: hiRes, thumb: a.artworkUrl100, alt: a.artistName || personName, credit: "Apple Music", source: "iTunes" };
    });
  } catch (e) { return []; }
};

// Search multiple sources for a person — returns best options
var searchPersonImages = async function(personName) {
  if (!personName || personName.length < 2) return [];
  var results = [];
  // 1. Wikipedia REST API — best quality, handles nicknames via opensearch
  try { var wr = await searchWikiRest(personName); results = results.concat(wr); } catch (e) {}
  // 2. Wikipedia pageimages search — multiple results for variety
  try { var wp = await searchWikimedia(personName); results = results.concat(wp); } catch (e) {}
  // 3. TMDb — actors, directors, TV personalities
  if (results.length < 3) { try { var tm = await searchTMDb(personName); results = results.concat(tm); } catch (e) {} }
  // 4. iTunes — musicians, artists
  if (results.length < 3) { try { var it = await searchITunes(personName); results = results.concat(it); } catch (e) {} }
  // 5. Wikimedia Commons — high-quality portraits
  if (results.length < 4) { try { var wc = await searchWikiCommons(personName + " portrait"); results = results.concat(wc.slice(0, 3)); } catch (e) {} }
  // 6. Pexels — editorial portraits
  if (results.length < 3) {
    var pexelsKey = typeof process !== "undefined" && process.env ? process.env.NEXT_PUBLIC_PEXELS_KEY : "";
    if (pexelsKey) { try { var px = await searchPexels(personName + " portrait", pexelsKey); results = results.concat(px.slice(0, 2)); } catch (e) {} }
  }
  // 7. Unsplash — last resort
  if (results.length < 3) {
    var unsplashKey = typeof process !== "undefined" && process.env ? process.env.NEXT_PUBLIC_UNSPLASH_KEY : "";
    if (unsplashKey) { try { var us = await searchUnsplash(personName + " portrait", unsplashKey); results = results.concat(us.slice(0, 2)); } catch (e) {} }
  }
  // Deduplicate across sources
  results = dedupeImages(results);
  return results.slice(0, 6);
};

// --- WIKIDATA ENRICHMENT ---
// Shared Wikidata entity fetcher
var fetchWikidataEntity = async function(topic) {
  try {
    var sr = await fetchWithTimeout("https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" + encodeURIComponent(topic) + "&language=en&limit=1&format=json&origin=*", 5000);
    if (!sr.ok) return null;
    var sd = await sr.json();
    if (!sd.search || sd.search.length === 0) return null;
    var qid = sd.search[0].id;
    var label = sd.search[0].label;
    var description = sd.search[0].description || "";
    var er = await fetchWithTimeout("https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" + qid + "&props=claims|labels|descriptions&languages=en&format=json&origin=*", 8000);
    if (!er.ok) return null;
    var ed = await er.json();
    var entity = ed.entities && ed.entities[qid] ? ed.entities[qid] : null;
    if (!entity) return null;
    // Also fetch Wikipedia extract for richer context
    var extract = "";
    try {
      var wr = await fetchWithTimeout("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(label.replace(/ /g, "_")), 4000);
      if (wr.ok) { var wd = await wr.json(); extract = wd.extract || ""; }
    } catch (e) {}
    return { qid: qid, label: label, description: description, extract: extract, claims: entity.claims || {} };
  } catch (e) { console.error("Wikidata fetch error:", e); return null; }
};



var extractWikidataStats = async function(entity) {
  if (!entity || !entity.claims) return {};
  var stats = {};
  var claims = entity.claims;
  // 1. Numbers — format large values with units
  var unitQids = [];
  var unitMap = {}; // prop → unit QID
  Object.keys(WD_NUMBERS).forEach(function(prop) {
    if (!claims[prop]) return;
    var claim = claims[prop][0];
    if (!claim || !claim.mainsnak || !claim.mainsnak.datavalue || claim.mainsnak.datavalue.type !== "quantity") return;
    var raw = claim.mainsnak.datavalue.value.amount.replace("+", "");
    var unit = claim.mainsnak.datavalue.value.unit || "";
    var unitQid = unit.match(/Q\d+/);
    stats[WD_NUMBERS[prop]] = formatBigNum(raw);
    if (unitQid) { unitQids.push(unitQid[0]); unitMap[prop] = unitQid[0]; }
  });
  // Resolve unit QIDs to symbols
  var UNIT_SHORTCUTS = { Q4917: "$", Q11573: "m", Q828224: "km", Q712226: "km²", Q25343: "mi²", Q199: "1", Q174728: "cm", Q11579: "°C", Q199462: "min", Q3311194: "people" };
  if (unitQids.length > 0) {
    var resolvedUnits = {};
    // Use shortcuts first, resolve remainder via API
    var needResolve = [];
    unitQids.forEach(function(qid) { if (UNIT_SHORTCUTS[qid]) resolvedUnits[qid] = UNIT_SHORTCUTS[qid]; else needResolve.push(qid); });
    if (needResolve.length > 0) {
      var unitLabels = await resolveQids(needResolve);
      Object.keys(unitLabels).forEach(function(qid) { resolvedUnits[qid] = unitLabels[qid]; });
    }
    // Append units to stat values
    Object.keys(unitMap).forEach(function(prop) {
      var label = WD_NUMBERS[prop];
      var unitStr = resolvedUnits[unitMap[prop]];
      if (unitStr && stats[label]) {
        if (unitStr === "$") stats[label] = "$" + stats[label];
        else if (unitStr.length <= 4) stats[label] = stats[label] + " " + unitStr;
      }
    });
  }
  // 2. Dates — extract full date not just year
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  Object.keys(WD_DATES).forEach(function(prop) {
    if (!claims[prop]) return;
    var claim = claims[prop][0];
    if (!claim || !claim.mainsnak || !claim.mainsnak.datavalue || claim.mainsnak.datavalue.type !== "time") return;
    var t = claim.mainsnak.datavalue.value.time;
    var match = t.match(/\+?(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      var yr = match[1]; var mo = parseInt(match[2]); var dy = parseInt(match[3]);
      stats[WD_DATES[prop]] = (mo > 0 && mo <= 12 ? months[mo - 1] + " " : "") + (dy > 0 ? dy + ", " : "") + yr;
    }
  });
  // 3. Entity references — collect QIDs to resolve in batch
  var qidsToResolve = [];
  var qidMap = {}; // prop → [qids]
  Object.keys(WD_ENTITIES).forEach(function(prop) {
    if (!claims[prop]) return;
    qidMap[prop] = [];
    claims[prop].slice(0, 3).forEach(function(claim) {
      if (claim.mainsnak && claim.mainsnak.datavalue && claim.mainsnak.datavalue.type === "wikibase-entityid") {
        var qid = claim.mainsnak.datavalue.value.id;
        qidsToResolve.push(qid);
        qidMap[prop].push(qid);
      }
    });
  });
  // Batch resolve all entity references to readable labels
  if (qidsToResolve.length > 0) {
    var labels = await resolveQids(qidsToResolve.slice(0, 20));
    Object.keys(qidMap).forEach(function(prop) {
      var resolved = qidMap[prop].map(function(qid) { return labels[qid] || null; }).filter(Boolean);
      if (resolved.length > 0) stats[WD_ENTITIES[prop]] = resolved.join(", ");
    });
  }
  // 4. Counts — how many awards, nominations, notable works
  Object.keys(WD_COUNTS).forEach(function(prop) {
    if (claims[prop] && claims[prop].length > 0) stats[WD_COUNTS[prop]] = claims[prop].length.toString();
  });
  // 5. Active years (P2031/P2032)
  if (claims.P2031) {
    var startClaim = claims.P2031[0];
    if (startClaim && startClaim.mainsnak && startClaim.mainsnak.datavalue && startClaim.mainsnak.datavalue.type === "time") {
      var syr = startClaim.mainsnak.datavalue.value.time.match(/\+?(\d{4})/);
      if (syr) {
        var endYr = "present";
        if (claims.P2032 && claims.P2032[0] && claims.P2032[0].mainsnak && claims.P2032[0].mainsnak.datavalue) {
          var eyr = claims.P2032[0].mainsnak.datavalue.value.time.match(/\+?(\d{4})/);
          if (eyr) endYr = eyr[1];
        }
        stats["Active"] = syr[1] + "–" + endYr;
      }
    }
  }
  return stats;
};

// Extract rich timeline events from Wikidata claims
var extractWikidataTimeline = async function(entity) {
  if (!entity || !entity.claims) return [];
  var events = [];
  var claims = entity.claims;
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  // Core life/org events
  var timeProps = { P569: "Born", P570: "Died", P571: "Founded", P576: "Dissolved", P580: "Started", P582: "Ended" };
  Object.keys(timeProps).forEach(function(prop) {
    if (!claims[prop]) return;
    claims[prop].forEach(function(claim) {
      if (!claim.mainsnak || !claim.mainsnak.datavalue || claim.mainsnak.datavalue.type !== "time") return;
      var t = claim.mainsnak.datavalue.value.time;
      var match = t.match(/\+?(\d{4})-(\d{2})/);
      if (match) {
        var yr = match[1]; var mo = parseInt(match[2]);
        var dateStr = (mo > 0 && mo <= 12 ? months[mo - 1] + " " : "") + yr;
        events.push({ year: yr, date: dateStr, event: timeProps[prop], detail: "" });
      }
    });
  });
  // Awards with dates and names
  var awardQids = [];
  if (claims.P166) {
    claims.P166.slice(0, 8).forEach(function(claim) {
      var yr = null; var awardQid = null;
      if (claim.mainsnak && claim.mainsnak.datavalue && claim.mainsnak.datavalue.type === "wikibase-entityid") {
        awardQid = claim.mainsnak.datavalue.value.id;
        awardQids.push(awardQid);
      }
      if (claim.qualifiers && claim.qualifiers.P585) {
        var q = claim.qualifiers.P585[0];
        if (q.datavalue && q.datavalue.type === "time") {
          var m = q.datavalue.value.time.match(/\+?(\d{4})/);
          if (m) yr = m[1];
        }
      }
      if (yr) events.push({ year: yr, date: yr, event: "Award", detail: "", _awardQid: awardQid });
    });
  }
  // Resolve award names
  if (awardQids.length > 0) {
    var awardLabels = await resolveQids(awardQids.slice(0, 10));
    events.forEach(function(ev) {
      if (ev._awardQid && awardLabels[ev._awardQid]) ev.detail = awardLabels[ev._awardQid];
      delete ev._awardQid;
    });
  }
  // Significant events (P793)
  if (claims.P793) {
    var sigQids = [];
    claims.P793.slice(0, 5).forEach(function(claim) {
      if (claim.mainsnak && claim.mainsnak.datavalue && claim.mainsnak.datavalue.type === "wikibase-entityid") {
        sigQids.push(claim.mainsnak.datavalue.value.id);
      }
      var yr = null;
      if (claim.qualifiers && claim.qualifiers.P585) {
        var q = claim.qualifiers.P585[0];
        if (q.datavalue && q.datavalue.type === "time") {
          var m = q.datavalue.value.time.match(/\+?(\d{4})/);
          if (m) yr = m[1];
        }
      }
      if (yr) events.push({ year: yr, date: yr, event: "Event", detail: "", _sigQid: claim.mainsnak.datavalue.value.id });
    });
    if (sigQids.length > 0) {
      var sigLabels = await resolveQids(sigQids);
      events.forEach(function(ev) {
        if (ev._sigQid && sigLabels[ev._sigQid]) { ev.event = sigLabels[ev._sigQid]; }
        delete ev._sigQid;
      });
    }
  }
  events.sort(function(a, b) { return parseInt(a.year) - parseInt(b.year); });
  // Deduplicate by year+event
  var seen = {};
  events = events.filter(function(e) { var key = e.year + e.event; if (seen[key]) return false; seen[key] = true; return true; });
  return events;
};

// Fetch related people from Wikidata (person network)
var fetchPersonNetwork = async function(personName) {
  var entity = await fetchWikidataEntity(personName);
  if (!entity) return [];
  var relProps = {
    P26: "Spouse", P40: "Child", P22: "Father", P25: "Mother",
    P3373: "Sibling", P1327: "Partner", P451: "Partner",
    P112: "Co-founder", P161: "Cast member", P175: "Performer",
    P86: "Composer", P57: "Director", P162: "Producer",
  };
  var related = [];
  var claims = entity.claims;
  var seen = {};
  Object.keys(relProps).forEach(function(prop) {
    if (!claims[prop]) return;
    claims[prop].slice(0, 3).forEach(function(claim) {
      if (!claim.mainsnak || !claim.mainsnak.datavalue || claim.mainsnak.datavalue.type !== "wikibase-entityid") return;
      var relQid = claim.mainsnak.datavalue.value.id;
      if (seen[relQid]) return;
      seen[relQid] = true;
      related.push({ qid: relQid, relation: relProps[prop] });
    });
  });
  // Resolve names and images for related entities (batch up to 8)
  if (related.length > 0) {
    var qids = related.slice(0, 8).map(function(r) { return r.qid; }).join("|");
    try {
      var lr = await fetchWithTimeout("https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" + qids + "&props=labels&languages=en&format=json&origin=*", 5000);
      if (lr.ok) {
        var ld = await lr.json();
        related.forEach(function(r) {
          var ent = ld.entities && ld.entities[r.qid] ? ld.entities[r.qid] : null;
          r.name = ent && ent.labels && ent.labels.en ? ent.labels.en.value : r.qid;
        });
      }
    } catch (e) {}
    // Fetch Wikipedia portraits in parallel
    await Promise.all(related.slice(0, 6).map(async function(r) {
      if (!r.name || r.name === r.qid) return;
      try {
        var imgs = await searchWikiRest(r.name);
        r.img = imgs.length > 0 ? imgs[0] : null;
      } catch (e) { r.img = null; }
    }));
  }
  return related.filter(function(r) { return r.name && r.name !== r.qid; }).slice(0, 6);
};

// Search for location/landmark images
var searchLocationImages = async function(placeName) {
  if (!placeName || placeName.length < 2) return [];
  var results = [];
  try { var wr = await searchWikiRest(placeName); results = results.concat(wr); } catch (e) {}
  if (results.length < 2) {
    var unsplashKey = typeof process !== "undefined" && process.env ? process.env.NEXT_PUBLIC_UNSPLASH_KEY : "";
    if (unsplashKey) {
      try { var us = await searchUnsplash(placeName + " landmark", unsplashKey); results = results.concat(us.slice(0, 2)); } catch (e) {}
    }
  }
  var seen = {};
  return results.filter(function(r) { if (!r.url || seen[r.url]) return false; seen[r.url] = true; return true; }).slice(0, 3);
};

// Category-to-vintage-API mapping
var VINTAGE_APIS = {
  film: [searchWikiCommons, searchLibCongress, searchMetMuseum],
  photo: [searchWikiCommons, searchMetMuseum, searchArtChicago],
  sports: [searchWikiCommons, searchLibCongress, searchEuropeana],
  trivia: [searchWikiCommons, searchLibCongress, searchNASA],
  art: [searchWikiCommons, searchMetMuseum, searchArtChicago],
  fashion: [searchWikiCommons, searchMetMuseum, searchEuropeana],
  food: [searchWikiCommons, searchEuropeana, searchLibCongress],
  nightlife: [searchWikiCommons, searchLibCongress, searchEuropeana],
  gossip: [searchWikiCommons, searchLibCongress, searchMetMuseum],
  enterprise: [searchWikiCommons, searchLibCongress, searchMetMuseum],
  newsdesk: [searchWikiCommons, searchLibCongress, searchMetMuseum],
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
  gossip: ["celebrity", "scandal", "newspaper", "tabloid"],
  enterprise: ["business", "office", "corporate", "industry"],
  newsdesk: ["newspaper", "press", "politics", "news"],
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

// Render a single slide to canvas
var renderSlideToCanvas = async function(slideRef, slideIndex, setCurrentSlide) {
  setCurrentSlide(slideIndex);
  await new Promise(function(r) { setTimeout(r, 800); });
  var el = slideRef.current;
  if (!el) return null;
  // Export the full framed slide exactly as seen on screen — all borders included
  var exportTarget = el;
  var ew = exportTarget.offsetWidth;
  var eh = exportTarget.offsetHeight;
  // Scale to 1080px width (3.176x) — sharp on iPhone retina (3x)
  return window.html2canvas(exportTarget, {
    width: ew,
    height: eh,
    scale: 1080 / ew,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#000000",
    logging: false,
    onclone: function(clonedDoc, clonedEl) {
      // Fix objectFit:cover — convert to background-image
      var imgs = clonedEl.querySelectorAll("img[style*='object-fit']");
      imgs.forEach(function(img) {
        var parent = img.parentElement;
        if (parent && img.src && img.style.objectFit === "cover") {
          parent.style.backgroundImage = "url(" + img.src + ")";
          parent.style.backgroundSize = "cover";
          parent.style.backgroundPosition = "center";
          img.style.opacity = "0";
        }
      });
      // Fix text container expansion at export scale
      // Lock the outermost slide container to prevent any overflow
      clonedEl.style.overflow = "hidden";
      var innerDivs = clonedEl.querySelectorAll("div");
      innerDivs.forEach(function(div) {
        // Lock absolutely positioned text containers — freeze both width AND height
        // Skip centered elements (translate -50%) — locking their width clips the centered content
        var isCentered = div.style.transform && div.style.transform.indexOf("-50%") > -1;
        if (div.style.position === "absolute" && div.style.zIndex && !isCentered) {
          var w = div.offsetWidth;
          var h = div.offsetHeight;
          if (w > 0 && w < 400) { div.style.maxWidth = w + "px"; div.style.width = w + "px"; }
          if (h > 0 && h < 450) { div.style.maxHeight = h + "px"; }
          div.style.overflow = "hidden";
        }
        // Remove backdrop-filter (html2canvas can't render it)
        if (div.style.backdropFilter || div.style.webkitBackdropFilter) {
          div.style.backdropFilter = "none";
          div.style.webkitBackdropFilter = "none";
          div.style.background = "rgba(0,0,0,0.7)";
        }
      });
      // Also lock the slide content wrapper to clip any overflow
      var contentWrapper = clonedEl.querySelector("[data-export-target]");
      if (contentWrapper) { contentWrapper.style.overflow = "hidden"; }
    },
  });
};

var exportSlides = async function(slides, category, slideRef, setCurrentSlide, setExportStatus, format) {
  var useJpeg = format === "jpeg";
  var mimeType = useJpeg ? "image/jpeg" : "image/png";
  var ext = useJpeg ? ".jpg" : ".png";
  var quality = useJpeg ? 0.92 : 1.0;
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
    setExportStatus("Rendering " + (i + 1) + "/" + slides.length + "...");
    try {
      var canvas = await renderSlideToCanvas(slideRef, i, setCurrentSlide);
      if (!canvas) continue;
      var blob = await new Promise(function(r) { canvas.toBlob(r, mimeType, quality); });
      if (blob) imgFolder.file("slide-" + String(i + 1).padStart(2, "0") + ext, blob);
    } catch (err) { console.error("Failed slide " + (i + 1), err); }
  }
  setExportStatus("Creating ZIP...");
  try {
    var content = await zip.generateAsync({ type: "blob" });
    var blobUrl = URL.createObjectURL(content);
    var a = document.createElement("a");
    a.href = blobUrl;
    a.download = "LOATHR-" + category.toUpperCase() + "-carousel" + (useJpeg ? "-optimized" : "") + ".zip";
    a.click();
    URL.revokeObjectURL(blobUrl);
    setExportStatus("Downloaded!");
  } catch (e) { setExportStatus("ZIP creation failed"); }
  setTimeout(function() { setExportStatus(null); }, 2000);
};

// --- DIFFERENTIATED PROMPTS ---
function buildPrompt(catLabel, topic, editionSeed, picks, hasPersonImage, secondaryCatLabel, tertiaryCatLabel, secCount, terCount) {
  var p = picks || { persona: -1, angle: -1, style: -1, tone: "editorial" };
  var persona = p.persona >= 0 && PERSONAS[p.persona] ? PERSONAS[p.persona] : pickPersona(editionSeed || 0);
  var freshSeed = p.angle >= 0 && FRESHNESS_SEEDS[p.angle] ? FRESHNESS_SEEDS[p.angle] : pickFreshness(editionSeed || 0);
  var freshness = typeof freshSeed === "string" ? freshSeed : freshSeed.prompt;
  var styleSeed = p.style >= 0 && WRITING_STYLES[p.style] ? WRITING_STYLES[p.style] : pickWritingStyle(editionSeed || 0);
  var style = typeof styleSeed === "string" ? styleSeed : styleSeed.prompt;
  // Tone instruction
  var toneId = p.tone || "editorial";
  var toneObj = TONES.find(function(t) { return t.id === toneId; });
  var toneInstr = toneObj ? "\nTONE: " + toneObj.prompt : "";
  // Custom voice override
  var customVoiceInstr = p.customVoice ? "\nCUSTOM VOICE INSTRUCTION: " + p.customVoice : "";


  // Force a specific stat format per edition to guarantee variety
  var statFormats = [
    "You MUST use FORMAT A (Comparison): statFormat \"comparison\", before (the old number), beforeLabel, after (the new number), afterLabel, shift (one sentence explaining what changed). Show a clear before/after transformation.",
    "You MUST use FORMAT B (Killer Number): statFormat \"killer\", stat (one massive shocking number), caption (a two-line caption that makes the reader stop scrolling). ONE number only, make it enormous and impactful.",
    "You MUST use FORMAT C (Data Story): statFormat \"story\", stats (array of exactly 3 objects: [{\"num\":\"value\",\"label\":\"description\"}]), narrative (one sentence connecting all three numbers into a story).",
    "You MUST use FORMAT D (Versus): statFormat \"versus\", left (first thing name), leftStat (its number), leftLabel (description), right (second thing name), rightStat (its number), rightLabel (description), verdict (one bold sentence declaring a winner).",
    "You MUST use FORMAT E (Timeline Number): statFormat \"timeline\", year (a specific year), stat (the number from that year), statLabel (what it measures), context (one sentence anchoring the number to that moment in history).",
  ];
  var forcedStat = statFormats[(editionSeed || 0) % statFormats.length];

  // Slide count instruction
  var sc = p.slideCount || 0;
  var slideCountInstr;
  if (sc >= 4 && sc <= 12) {
    slideCountInstr = "SLIDE COUNT: Generate EXACTLY " + sc + " slides (including Cover and Closer)." + (sc <= 5 ? "\nWith " + sc + " slides, include only: Cover, 2 essential content slides, " + (sc >= 5 ? "1 stat OR 1 quote, " : "") + "Closer. Every slide must be high-impact — no filler." : sc <= 8 ? "\nWith " + sc + " slides, include: Cover, 3-4 content slides, 1 stat, 1 quote, Closer. Prioritize the strongest angles." : "\nWith " + sc + " slides, use the full editorial structure. Include all optional roles.");
  } else {
    slideCountInstr = "DYNAMIC SLIDE COUNT: Decide the optimal number of slides (4-12) based on topic depth.\n- A narrow topic (one event, one person, one moment) \u2192 4-6 slides\n- A standard topic \u2192 7-9 slides\n- A broad topic (history of an era, cultural movement, complex system) \u2192 10-12 slides";
  }

  // Cross-category lens instructions with editorial direction per category
  var LENS_DIRECTIONS = {
    "Film & TV": "How has this been documented, dramatized, or portrayed on screen? What documentary, film, or series exists about it? What would the Netflix pitch be? Think: streaming viewership, cultural representation, cinematic moments, director/creator angles.",
    "Photography": "What is the visual story? How has this been captured or framed by photographers? Think: iconic images, visual culture, the gaze, documentation vs aesthetics, photo essays.",
    "Sports × Culture": "What is the competitive or physical dimension? How does this connect to athletic performance, team dynamics, fan culture, or the business of sports? Think: stats, rivalries, endorsement deals, stadium culture, body/performance.",
    "Did You Know?": "What are the most surprising, counterintuitive, or little-known facts? What stat would make someone stop scrolling? Think: unexpected numbers, myth-busting, hidden history, cognitive biases, trivia that reframes everything.",
    "Art & Music": "How does this connect to artistic expression, sound, or creative movements? Think: album references, gallery shows, protest art, genre-defining moments, creative process, cultural movements, sampling/remixing.",
    "Fashion": "How does this intersect with aesthetics, identity, and commerce? Think: brand collaborations, runway references, streetwear influence, uniforms-as-culture, merch economy, visual identity, what people wore and why it mattered.",
    "Food & Drink": "What is the culinary or consumption angle? Think: recipes that went viral, restaurant economics, food as cultural identity, supply chains, specific dishes that tell a story, the business of taste.",
    "Nightlife": "What happens after dark? Think: club culture, DJ sets, underground scenes, venue economics, the social dynamics of night spaces, music + space + crowd, after-parties that changed things.",
    "The Tea": "What is the drama, controversy, or human mess? Think: feuds, receipts, public fallouts, social media moments, the story behind the headline, who said what to whom.",
  };

  var crossCatInstr = "";
  var secN = secCount || 2;
  var terN = terCount || 1;
  if (secondaryCatLabel) {
    var secDir = LENS_DIRECTIONS[secondaryCatLabel] || "Explore this topic from the perspective of " + secondaryCatLabel + ".";
    crossCatInstr += "\n\nCROSS-CATEGORY LENS — SECONDARY: \"" + secondaryCatLabel + "\" (EXACTLY " + secN + " slide" + (secN > 1 ? "s" : "") + ")\n" + secDir + "\nOn these slides, add \"categoryLens\": \"" + secondaryCatLabel + "\". Best roles for this lens: THE RIPPLE EFFECT, THE EVIDENCE, or THE HOT TAKE. The content must be SPECIFIC — name real brands, real events, real numbers from the " + secondaryCatLabel + " world.";
  }
  if (tertiaryCatLabel) {
    var terDir = LENS_DIRECTIONS[tertiaryCatLabel] || "Explore this topic from the perspective of " + tertiaryCatLabel + ".";
    crossCatInstr += "\n\nCROSS-CATEGORY LENS — TERTIARY: \"" + tertiaryCatLabel + "\" (EXACTLY " + terN + " slide" + (terN > 1 ? "s" : "") + ")\n" + terDir + "\nOn these slides, add \"categoryLens\": \"" + tertiaryCatLabel + "\". Best roles: THE DEEP CUT or THE COUNTER. Must be SPECIFIC and surprising.";
  }

  return persona.voice + "\n\nYou are writing for LOATHR, an editorial Instagram brand.\nCategory: \"" + catLabel + "\"\nTopic: \"" + topic + "\"" + crossCatInstr + "\n\nEDITORIAL ANGLE: " + freshness + "\nWRITING STYLE for content slides: " + style + toneInstr + customVoiceInstr + "\n\n" + slideCountInstr + "\nYou MUST include at minimum: Cover, 1 content slide, Closer.\n\nThis is a magazine issue — each slide has a SPECIFIC editorial role. Keep body text to 2-3 sentences MAX per slide. Be concise and impactful.\n\nWRITING RULES:\n- NEVER use the word 'algorithm' or 'algorithmic' — it's overused and lazy. Find a more specific way to describe what you mean.\n- Avoid cliché tech/media phrases: 'broke the internet', 'went viral', 'changed the game', 'disrupted'. Use fresh language.\n\nUNIQUENESS RULES:\n- NO two slides may share the same core fact, statistic, or argument\n- Each slide must pass the 'so what?' test — if a reader skipped every other slide, each one should teach something new\n- Slide 3 must CONTRADICT or CHALLENGE something from slides 1-2\n- Slide 7+ must connect the topic to a DIFFERENT field or unexpected consequence\n- If you mention a person's full name on any slide, add a 'person' field with their name for image matching\n\nSLIDE ROLES (use as many as the topic warrants, minimum 7):\n- FIRST SLIDE: \"COVER\" — title, titleHighlight (exact substring of title to emphasize), subtitle, heading\n- \"THE ORIGIN\" — backstory nobody knows. heading, body, highlight, sources. Deep Dive tone.\n- \"THE TURNING POINT\" — the single moment that changed everything. heading, year (REQUIRED), body, highlight, sources. Timeline tone.\n- \"THE HOT TAKE\" — a provocative opinion. heading, body (SHORT, 2 sentences max), highlight, sources. Hot Take tone.\n- \"THE HUMAN STORY\" — a specific person at the center. heading, body, highlight, person (full name), sources. Deep Dive tone.\n- \"THE EVIDENCE\" — " + forcedStat + " Include sources.\n- \"THE VOICE\" — a powerful quote. quote, source (person name), person (full name), sources.\n- \"THE RIPPLE EFFECT\" — unexpected consequence in a DIFFERENT field. heading, body, highlight, sources. Deep Dive tone.\n- \"THE COUNTER\" (optional) — the opposing argument or what critics say. heading, body, highlight, sources. Hot Take tone.\n- \"THE DEEP CUT\" (optional) — a niche detail only insiders know. heading, body, highlight, sources. Deep Dive tone.\n- \"THE NOW\" — where this stands today + prediction. heading, body, highlight, sources. Hot Take tone.\n- LAST SLIDE: \"CLOSER\" — hashtags string\n\nIMPORTANT: Include a 'sources' field on each content slide with 1-2 brief real citations.\n\nTEXT PLACEMENT: On each content slide, include a 'textPosition' field. Options: 'bottom-left', 'bottom-right', 'top-left', 'top-right', 'split-corners', 'side-left', 'side-right', 'l-shape'. If the slide has a 'person' field, use split-corners or side positions to avoid covering the face.\n\nMOSAIC LAYOUT: Add '\"mosaic\": true' on approximately 40% of content slides to create magazine-style photo collage backgrounds. This is a key visual feature — use it generously. Good on: THE ORIGIN, THE RIPPLE EFFECT, THE DEEP CUT, THE HUMAN STORY, THE COUNTER, THE NOW. Do NOT use mosaic on Cover, Closer, stat slides (THE EVIDENCE), or quote slides (THE VOICE).\n\nRespond ONLY with valid JSON, no markdown:\n{\"angle\":\"Edition\"," + (hasPersonImage ? "\"personImageSlide\":NUMBER_OF_BEST_SLIDE_FOR_PORTRAIT," : "") + "\"slides\":[{...slides...}]}\n" + (hasPersonImage ? "\nPERSON IMAGE: The user has selected a portrait image. Add a 'personImageSlide' field (number 0-8) indicating which slide this portrait should appear on. Consider: cover (0) for biographical topics, THE HUMAN STORY slide for part-of-a-larger-story, THE VOICE slide if they are quoted." : "");
}

function buildRecPrompt(catLabel, topic) {
  return "You are a senior editorial content strategist for LOATHR, an Instagram lifestyle brand.\nCategory: \"" + catLabel + "\"\nCity/Topic: \"" + topic + "\"\n\nCreate a LOATHR RECOMMENDS editorial guide — a 5-slide carousel about food, drink, and nightlife in this location or topic.\n\nUse web search if available to find REAL venues, real openings, real cultural context. Do NOT hallucinate venue names.\n\nReturn ONLY valid JSON with this exact structure:\n{\n  \"destination\": { \"title\": \"City/Scene Name\", \"subtitle\": \"One evocative sentence about the destination\", \"mood\": \"food or nightlife\", \"city\": \"City\" },\n  \"hiddenGem\": { \"name\": \"Venue Name\", \"neighborhood\": \"Area, City\", \"hook\": \"One evocative sentence (what makes it special)\", \"body\": \"2-3 sentences cultural context\", \"established\": \"Est. 2019\", \"detail\": \"Walk-in only\", \"priceRange\": \"$$$\" },\n  \"newOpening\": { \"name\": \"Venue Name\", \"neighborhood\": \"Area, City\", \"body\": \"2-3 sentences about the venue and chef/owner\", \"quote\": \"A quote from a review or the chef\", \"source\": \"Person Name\", \"opened\": \"Opened 2025\", \"style\": \"Modern Japanese\", \"detail\": \"Reservations required\" },\n  \"culture\": { \"headline\": \"Why City Owns This Scene\", \"body\": \"3-4 sentences on history, immigration, economics shaping the scene\", \"stat\": \"3,200\", \"statLabel\": \"izakayas in Tokyo alone\" },\n  \"shortlist\": [\n    { \"name\": \"Venue 1\", \"neighborhood\": \"Area\", \"type\": \"Cuisine/Type\" },\n    { \"name\": \"Venue 2\", \"neighborhood\": \"Area\", \"type\": \"Cuisine/Type\" },\n    { \"name\": \"Venue 3\", \"neighborhood\": \"Area\", \"type\": \"Cuisine/Type\" }\n  ],\n  \"tags\": \"#hashtags #relevant #to #topic\"\n}\n\nRespond ONLY with valid JSON, no markdown.";
}

// --- SETTINGS PANEL ---

// --- MAIN COMPONENT ---
export default function LoathrMediaGenerator() {
  var _s = useState, _cb = useCallback, _ef = useEffect, _ref = useRef;
  var seg = _s("editorial"), activeSegment = seg[0], setActiveSegment = seg[1]; // "editorial"|"enterprise"|"newsdesk"
  var cs = _s(null), category = cs[0], setCategory = cs[1];
  var sc2 = _s(null), secondaryCategory = sc2[0], setSecondaryCategory = sc2[1];
  var scc = _s(2), secondaryCount = scc[0], setSecondaryCount = scc[1];
  var sc3 = _s(null), tertiaryCategory = sc3[0], setTertiaryCategory = sc3[1];
  var tcc = _s(1), tertiaryCount = tcc[0], setTertiaryCount = tcc[1];
  var ts = _s(""), topic = ts[0], setTopic = ts[1];
  var os = _s(null), options = os[0], setOptions = os[1];
  var ss = _s(0), selectedOption = ss[0], setSelectedOption = ss[1];
  var selectedOptionRef = _ref(0);
  var cls = _s(0), currentSlide = cls[0], setCurrentSlide = cls[1];
  var gs = _s(false), isGenerating = gs[0], setIsGenerating = gs[1];
  var gc = _s(0), genCount = gc[0], setGenCount = gc[1];
  var es = _s(null), error = es[0], setError = es[1];
  var aks = _s({ unsplash: process.env.NEXT_PUBLIC_UNSPLASH_KEY || "", pexels: process.env.NEXT_PUBLIC_PEXELS_KEY || "" }), apiKeys = aks[0], setApiKeys = aks[1];
  var ims = _s({}), images = ims[0], setImages = ims[1];
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
  var eps = _s({ persona: -1, angle: -1, style: -1, tone: "editorial", imageStyle: "mixed", slideCount: 0, customVoice: "" }), editionPicks = eps[0], setEditionPicks = eps[1];
  var ess = _s(false), showEditionSettings = ess[0], setShowEditionSettings = ess[1];
  var sug = _s([]), suggestions = sug[0], setSuggestions = sug[1];
  var rtp = _s([]), relatedTopics = rtp[0], setRelatedTopics = rtp[1];
  var xcs = _s([]), crossCatSuggestions = xcs[0], setCrossCatSuggestions = xcs[1];
  var rcs = _s([]), recentTopics = rcs[0], setRecentTopics = rcs[1];
  var ths = _s([]), topicHistory = ths[0], setTopicHistory = ths[1];
  var sas = _s([]), smartAngles = sas[0], setSmartAngles = sas[1];
  var ccr = _s([]), crossCatRelated = ccr[0], setCrossCatRelated = ccr[1];
  var shp = _s(false), showPastGen = shp[0], setShowPastGen = shp[1];
  var pim = _s({}), personImages = pim[0], setPersonImages = pim[1]; // { "Name": [imgs] }
  var lpi = _s({}), lockedPersonImages = lpi[0], setLockedPersonImages = lpi[1]; // { "Name": img }
  var lockedRef = _ref({});
  var pdn = _s([]), personsDetected = pdn[0], setPersonsDetected = pdn[1]; // ["Name1", "Name2"]
  var clr = _s([]), claudeRelated = clr[0], setClaudeRelated = clr[1];
  var fvs = _s([]), favorites = fvs[0], setFavorites = fvs[1];
  var tch = _s([]), topicChain = tch[0], setTopicChain = tch[1];
  var shl = _s(null), shareLink = shl[0], setShareLink = shl[1];
  var shf = _s(false), showFavorites = shf[0], setShowFavorites = shf[1];
  var wrs = _s([]), webResults = wrs[0], setWebResults = wrs[1];
  var sld = _s(false), isSearching = sld[0], setIsSearching = sld[1];
  // --- Search bar image features ---
  var pvi = _s([]), previewImages = pvi[0], setPreviewImages = pvi[1];
  var pvl = _s(false), previewLoading = pvl[0], setPreviewLoading = pvl[1];
  var pvk = _s({}), previewLocked = pvk[0], setPreviewLocked = pvk[1]; // { "cover": img, "evidence": img }
  var ldi = _s([]), locationsDetected = ldi[0], setLocationsDetected = ldi[1];
  var lim = _s({}), locationImages = lim[0], setLocationImages = lim[1];
  var lli = _s({}), lockedLocationImages = lli[0], setLockedLocationImages = lli[1];
  var dim = _s(null), droppedImage = dim[0], setDroppedImage = dim[1];
  var rti = _s([]), reverseTopics = rti[0], setReverseTopics = rti[1];
  var rvl = _s(false), reverseLoading = rvl[0], setReverseLoading = rvl[1];
  // --- Wikidata enrichment (network only) ---
  var pnw = _s({}), personNetwork = pnw[0], setPersonNetwork = pnw[1]; // { "Name": [{ name, relation, img }] }
  var slideRef = _ref(null);
  // Post-generation image swap
  var swp = _s(null), swapSlide = swp[0], setSwapSlide = swp[1]; // slide index being swapped
  var swi = _s([]), swapImages = swi[0], setSwapImages = swi[1]; // candidate images for swap
  var swl = _s(false), swapLoading = swl[0], setSwapLoading = swl[1];
  var siq = _s(""), swapQuery = siq[0], setSwapQuery = siq[1]; // custom search query for swap
  // Image style hover preview
  var hov = _s(null), hoverStyle = hov[0], setHoverStyle = hov[1];
  // Progressive disclosure — user level based on generation count
  var ulv = _s(3), userLevel = ulv[0], setUserLevel = ulv[1]; // 1=new, 2=intermediate, 3=power
  // Fact-checker state
  var fcs = _s(null), factCheckResult = fcs[0], setFactCheckResult = fcs[1];
  var fcl = _s(false), factCheckLoading = fcl[0], setFactCheckLoading = fcl[1];
  // --- Custom Story mode ---
  var csm = _s(false), customStoryMode = csm[0], setCustomStoryMode = csm[1];
  var cfl = _s("editorial"), creativeFreedom = cfl[0], setCreativeFreedom = cfl[1];
  var csn = _s(""), customSubject = csn[0], setCustomSubject = csn[1];
  var csh = _s(""), customHook = csh[0], setCustomHook = csh[1];
  var csc = _s(""), customContext = csc[0], setCustomContext = csc[1];
  var csi = _s([]), customImages = csi[0], setCustomImages = csi[1]; // [{ preview, base64, mimeType, role }]
  // --- Post-generation editor ---
  var edm = _s(false), editMode = edm[0], setEditMode = edm[1];
  var edf = _s(null), editField = edf[0], setEditField = edf[1]; // { slide: idx, field: "heading"|"body"|etc }
  var edv = _s(""), editValue = edv[0], setEditValue = edv[1];
  var eds = _s("content"), editSection = eds[0], setEditSection = eds[1];
  var ngt = _s("all"), nudgeTarget = ngt[0], setNudgeTarget = ngt[1]; // "all"|"heading"|"body"|"highlight"
  // Enterprise state
  var efc = _s(null), enterpriseForce = efc[0], setEnterpriseForce = efc[1];
  var esc = _s(null), enterpriseSector = esc[0], setEnterpriseSector = esc[1];
  var emm = _s("analysis"), enterpriseMode = emm[0], setEnterpriseMode = emm[1]; // "analysis"|"news"|"tips"
  // News Desk state
  var ndf = _s(null), newsFilter = ndf[0], setNewsFilter = ndf[1];
  var ndu = _s(null), newsUrgency = ndu[0], setNewsUrgency = ndu[1];
  var ndd = _s(null), newsDesk = ndd[0], setNewsDesk = ndd[1];
  var ndr = _s("global"), newsRegion = ndr[0], setNewsRegion = ndr[1];
  var ndt = _s("today"), newsTimeframe = ndt[0], setNewsTimeframe = ndt[1];
  var ndc = _s(""), newsCountry = ndc[0], setNewsCountry = ndc[1];
  // Viral potential score from Claude
  var vps = _s(null), viralScore = vps[0], setViralScore = vps[1]; // { score: 1-10, reason: "", tips: "" }
  var vpl = _s(false), viralLoading = vpl[0], setViralLoading = vpl[1];
  var viralTimer = _ref(null);
  var searchTimer = _ref(null);
  var webTimer = _ref(null);
  var previewTimer = _ref(null);
  var abortRef = _ref(null);
  var trendingAbortRef = _ref(null);

  _ef(function() { selectedOptionRef.current = selectedOption; }, [selectedOption]);
  // When Enterprise force/sector/mode changes, clear trending so preset topics show instead
  // User must click Trending deliberately to fetch fresh ideas
  _ef(function() {
    if (category === "enterprise") { setTrending([]); }
  }, [enterpriseForce, enterpriseMode, enterpriseSector, category]);

  // Keep ref in sync so generate() always reads latest locked images
  _ef(function() { lockedRef.current = lockedPersonImages; }, [lockedPersonImages]);

  _ef(function() {
    var l = document.createElement("link"); l.href = FONT_URL; l.rel = "stylesheet"; document.head.appendChild(l);
    // Preload custom fonts for immediate availability
    var fonts = ["/Fonts/Foun/OpenType-TT/Foun.ttf", "/Fonts/Wenssep/Wenssep.ttf", "/Fonts/Maheni/Maheni-Regular.ttf"];
    fonts.forEach(function(f) {
      var p = document.createElement("link"); p.rel = "preload"; p.href = f; p.as = "font"; p.type = "font/ttf"; p.crossOrigin = "anonymous"; document.head.appendChild(p);
    });
  }, []);

  // Load recent topics and history from localStorage
  _ef(function() {
    try {
      var r = JSON.parse(localStorage.getItem("loathr_recent") || "[]");
      setRecentTopics(r.slice(0, 10));
      var h = JSON.parse(localStorage.getItem("loathr_history") || "[]");
      setTopicHistory(h);
      var f = JSON.parse(localStorage.getItem("loathr_favorites") || "[]");
      setFavorites(f);
      // User level from generation count
      var gc = parseInt(localStorage.getItem("loathr_gen_count") || "0");
      setUserLevel(gc === 0 ? 1 : gc < 5 ? 2 : 3);
    } catch (e) {}
    // Read shared link params
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.get("t")) setTopic(params.get("t"));
      if (params.get("c")) setCategory(params.get("c"));
    } catch (e) {}
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
      var text = (d.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, ""); }).join("");
      var parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (Array.isArray(parsed)) setRefinedAngles(parsed);
    } catch (err) { console.error(err); }
    finally { setIsRefining(false); }
  }, [topic, category, cat]);

  // Viral potential analysis — real Claude assessment
  var fetchViralScore = _cb(async function(query) {
    if (!query || query.length < 4 || !category) return;
    setViralLoading(true);
    try {
      var segmentCtx = activeSegment === "enterprise" ? "business/industry analysis Instagram carousel" : activeSegment === "newsdesk" ? "news media Instagram carousel" : "editorial Instagram carousel in " + (cat ? cat.label : category);
      var r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 200,
          messages: [{ role: "user",
            content: "Rate the viral potential of this topic for a " + segmentCtx + ":\n\"" + query + "\"\n\nScore 1-10 based on: timeliness, emotional hook, debate potential, visual appeal, shareability, audience size.\n\nRespond ONLY with JSON (no markdown):\n{\"score\":N,\"reason\":\"one sentence why\",\"tip\":\"one sentence to improve it\"}" }] }) });
      var d = await r.json();
      if (d.error) return;
      var text = (d.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, ""); }).join("");
      var cleaned = text.replace(/```json|```/g, "").trim();
      var js = cleaned.indexOf("{"); var je = cleaned.lastIndexOf("}");
      if (js >= 0 && je > js) cleaned = cleaned.slice(js, je + 1);
      var parsed = JSON.parse(cleaned);
      if (parsed.score) setViralScore(parsed);
    } catch (e) {}
    finally { setViralLoading(false); }
  }, [category, activeSegment, cat]);

  function cancelTrending() {
    if (trendingAbortRef.current) { trendingAbortRef.current.abort(); trendingAbortRef.current = null; }
    setIsFetchingTrending(false);
  }

  async function fetchTrending() {
    if (!category) return;
    if (trendingAbortRef.current) trendingAbortRef.current.abort();
    var controller = new AbortController();
    trendingAbortRef.current = controller;
    setIsFetchingTrending(true); setTrending([]);
    var catContext = { film: "film, TV, cinema, streaming, directing", photo: "photography, cameras, visual storytelling", sports: "sports with music, fashion, art, culture", trivia: "surprising facts, science discoveries, cultural oddities", art: "music, visual arts, album releases, art history", fashion: "fashion, luxury brands, streetwear, designers, runway, style trends", food: "food, restaurants, chefs, cocktails, dining culture, culinary trends", nightlife: "nightlife, clubs, DJs, bars, parties, after-dark culture", gossip: "celebrity gossip, entertainment news, scandals, Hollywood drama, influencer culture" };
    // Enterprise and News Desk get segment-specific trending prompts
    var promptText;
    if (category === "enterprise") {
      var forceCtx = enterpriseForce ? (ENTERPRISE_FORCES.find(function(f) { return f.id === enterpriseForce; }) || {}).label : null;
      var sectorCtx = enterpriseSector ? (ENTERPRISE_SECTORS.find(function(s) { return s.id === enterpriseSector; }) || {}).label : null;
      var forceDetail = { tech: "technology disruption, software, hardware, digital transformation", policy: "government regulation, compliance, legislation, trade policy, sanctions", ai: "artificial intelligence, machine learning, automation, robotics", markets: "stock market, commodities, real estate, cryptocurrency, interest rates", culture: "cultural shifts, workplace culture, consumer behavior, demographics", news: "breaking business news, mergers, acquisitions, layoffs, launches" };
      var searchCtx = "";
      if (forceCtx && sectorCtx) { searchCtx = forceCtx + " in " + sectorCtx; }
      else if (sectorCtx) { searchCtx = sectorCtx; }
      else if (forceCtx) { searchCtx = forceCtx + " (" + (forceDetail[enterpriseForce] || "") + ")"; }
      else { searchCtx = "business across ALL sectors — NOT just AI or tech. Cover finance, healthcare, retail, manufacturing, energy, real estate, food, fashion, media"; }
      if (enterpriseMode === "news") {
        promptText = "Search for the latest BREAKING business news related to: " + searchCtx + ". Find 6 DIVERSE stories. Include source. Respond ONLY with JSON: [{\"topic\":\"headline\",\"hook\":\"business impact\",\"source\":\"publication\"}]";
      } else if (enterpriseMode === "tips") {
        promptText = "Suggest 6 specific businesses or sub-industries needing tactical advice in: " + searchCtx + ". Be SPECIFIC to this sector. Respond ONLY with JSON: [{\"topic\":\"Industry: specific problem\",\"hook\":\"why they need help now\"}]";
      } else {
        promptText = "Search for trending business stories related to: " + searchCtx + ". Find 6 DIVERSE topics. Respond ONLY with JSON: [{\"topic\":\"title\",\"hook\":\"why this matters\"}]";
      }
    } else if (category === "newsdesk") {
      var regionCtx = newsRegion !== "global" ? " in " + (NEWSDESK_REGIONS.find(function(r) { return r.id === newsRegion; }) || {}).label : "";
      var countryCtx = newsCountry ? " specifically in " + newsCountry : "";
      var deskCtx = newsDesk ? (NEWSDESK_DESKS.find(function(d) { return d.id === newsDesk; }) || {}).label : null;
      var urgencyCtx = newsUrgency === "breaking" ? " BREAKING" : newsUrgency === "developing" ? " DEVELOPING" : "";
      var searchFocus = deskCtx ? " covering " + deskCtx : (newsFilter && !newsUrgency ? " focusing on " + (NEWSDESK_FILTERS.find(function(f) { return f.id === newsFilter; }) || {}).label + " news" : "");
      promptText = "Search for the top" + urgencyCtx + " news stories right now" + regionCtx + countryCtx + searchFocus + ". Find 6 specific current stories that are making headlines. Include the publication source for each. Respond ONLY with JSON: [{\"topic\":\"title\",\"hook\":\"why trending now\",\"source\":\"publication\"}]";
    } else {
      promptText = "Search for trending topics in: " + (catContext[category] || category) + ". Find 6 specific timely topics for Instagram carousels. Also add 2 deeper angles from your own knowledge that aren't trending yet but should be. Respond ONLY with JSON: [{\"topic\":\"title\",\"hook\":\"why trending now\"}]";
    }
    try {
      var r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: promptText }] }) });
      var d = await r.json();
      if (d.error) { console.error("Trending error:", d.error); return; }
      var text = (d.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, ""); }).join("");
      if (!text) { console.error("Trending: no text in response"); return; }
      var cleaned = text.replace(/```json|```/g, "").trim();
      var js = cleaned.indexOf("[{"); var je = cleaned.lastIndexOf("}]");
      if (js >= 0 && je > js) { cleaned = cleaned.slice(js, je + 2); }
      else { js = cleaned.indexOf("["); je = cleaned.lastIndexOf("]"); if (js >= 0 && je > js) cleaned = cleaned.slice(js, je + 1); }
      var parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) setTrending(parsed);
    } catch (err) { if (err.name !== "AbortError") console.error("Trending parse error:", err); }
    finally { setIsFetchingTrending(false); trendingAbortRef.current = null; }
  }

  // Smart search: Claude suggests angles after 800ms pause
  var fetchSmartAngles = _cb(async function(query) {
    if (!query || query.length < 2 || !category) return;
    setIsSearching(true);
    try {
      var r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 600, messages: [{ role: "user",
          content: "For the topic \"" + query + "\" in " + (cat ? cat.label : category) + ":\n1. Suggest 3 sharp carousel angles\n2. Identify ALL famous people connected to this topic. Resolve nicknames/stage names to full names (e.g. \"Ye\" = Kanye West, \"MJ\" = Michael Jordan, \"Bey\" = Beyoncé, \"Drake\" = Aubrey Drake Graham).\n3. ONLY if the topic explicitly mentions or is ABOUT a specific place, city, venue, or landmark, include it. Do NOT include birthplaces or loosely associated locations — only places that are the SUBJECT of the topic.\n\nRespond ONLY with JSON (no extra text):\n{\"angles\":[{\"topic\":\"title\",\"hook\":\"why\"}],\"persons\":[\"Full Name\"],\"locations\":[\"Place Name\"]}\nUse empty arrays if none: \"persons\":[],\"locations\":[]" }] }) });
      var d = await r.json();
      if (d.error) { console.error("Smart angles API error:", d.error); return; }
      var text = (d.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, ""); }).join("");
      var cleaned = text.replace(/```json|```/g, "").trim();
      var js = cleaned.indexOf("{"); var je = cleaned.lastIndexOf("}");
      if (js >= 0 && je > js) cleaned = cleaned.slice(js, je + 1);
      var parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) { setSmartAngles(parsed.slice(0, 3)); setPersonsDetected([]); setPersonImages({}); setLocationsDetected([]); return; }
      if (parsed.angles && Array.isArray(parsed.angles)) setSmartAngles(parsed.angles.slice(0, 3));
      // Person detection
      if (parsed.persons && Array.isArray(parsed.persons) && parsed.persons.length > 0) {
        var names = parsed.persons.slice(0, 3);
        setPersonsDetected(names);
        setPersonImages({});
        names.forEach(function(name) {
          searchPersonImages(name).then(function(imgs) {
            setPersonImages(function(prev) { var n = Object.assign({}, prev); n[name] = imgs; return n; });
          }).catch(function(err) { console.error("Person image fetch failed for " + name + ":", err); });
          // Fetch person network from Wikidata
          fetchPersonNetwork(name).then(function(network) {
            if (network.length > 0) setPersonNetwork(function(prev) { var n = Object.assign({}, prev); n[name] = network; return n; });
          }).catch(function() {});
        });
      } else { setPersonsDetected([]); setPersonImages({}); setPersonNetwork({}); }
      // Location detection
      if (parsed.locations && Array.isArray(parsed.locations) && parsed.locations.length > 0) {
        var places = parsed.locations.slice(0, 3);
        setLocationsDetected(places);
        setLocationImages({});
        places.forEach(function(place) {
          searchLocationImages(place).then(function(imgs) {
            setLocationImages(function(prev) { var n = Object.assign({}, prev); n[place] = imgs; return n; });
          }).catch(function() {});
        });
      } else { setLocationsDetected([]); setLocationImages({}); }
    } catch (e) { console.error("Smart angles error:", e); }
    finally { setIsSearching(false); }
  }, [category, cat]);

  // Web search: find trending context after 1500ms pause
  var fetchWebContext = _cb(async function(query) {
    if (!query || query.length < 4 || !category) return;
    try {
      var r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 400,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: "Search for recent news and trends about \"" + query + "\" in " + (cat ? cat.label : category) + ". Find 3 timely, specific angles. Respond ONLY with JSON: [{\"topic\":\"title\",\"hook\":\"why trending now\",\"source\":\"publication\"}]" }] }) });
      var d = await r.json();
      if (d.error) return;
      var text = (d.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, ""); }).join("");
      var cleaned = text.replace(/```json|```/g, "").trim();
      var js = cleaned.indexOf("["); var je = cleaned.lastIndexOf("]");
      if (js >= 0 && je > js) cleaned = cleaned.slice(js, je + 1);
      var parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) setWebResults(parsed.slice(0, 3));
    } catch (e) { /* silent */ }
  }, [category, cat]);

  // Debounced search trigger on topic input change
  // Fetch preview images for topic (debounced)
  var previewPage = _ref(1);
  var fetchPreviewImages = _cb(async function(query) {
    if (!query || query.length < 3 || !category) return;
    setPreviewLoading(true);
    var page = previewPage.current;
    previewPage.current = page + 1; // next call gets different page
    try {
      var unsplashKey = apiKeys.unsplash || process.env.NEXT_PUBLIC_UNSPLASH_KEY || "";
      var pexelsKey = apiKeys.pexels || process.env.NEXT_PUBLIC_PEXELS_KEY || "";
      var keywords = extractKeywords(query, 3);
      var catLabel = cat ? cat.label : category;
      var results = [];
      if (unsplashKey) {
        try {
          var ur = await fetch("https://api.unsplash.com/search/photos?query=" + encodeURIComponent(catLabel + " " + keywords) + "&per_page=6&page=" + page + "&orientation=portrait", { headers: { Authorization: "Client-ID " + unsplashKey } });
          if (ur.ok) { var ud = await ur.json(); results = results.concat((ud.results || []).map(function(img) { return { url: img.urls ? img.urls.regular : null, thumb: img.urls ? img.urls.small : null, alt: img.alt_description || query, credit: img.user ? img.user.name : "", source: "Unsplash" }; }).slice(0, 4)); }
        } catch (e) {}
      }
      if (pexelsKey && results.length < 4) {
        try {
          var pr = await fetch("https://api.pexels.com/v1/search?query=" + encodeURIComponent(catLabel + " " + keywords) + "&per_page=4&page=" + page + "&orientation=portrait", { headers: { Authorization: pexelsKey } });
          if (pr.ok) { var pd = await pr.json(); results = results.concat((pd.photos || []).map(function(img) { return { url: img.src ? img.src.large : null, thumb: img.src ? img.src.medium : null, alt: query, credit: img.photographer || "", source: "Pexels" }; }).slice(0, 4 - results.length)); }
        } catch (e) {}
      }
      try { var vi = await searchVintage(category, keywords); results = results.concat(vi.slice(0, 2)); } catch (e) {}
      var seen = {};
      results = results.filter(function(r) { if (!r.url || seen[r.url]) return false; seen[r.url] = true; return true; });
      setPreviewImages(results.slice(0, 6));
    } catch (e) { console.error("Preview images error:", e); }
    finally { setPreviewLoading(false); }
  }, [category, cat, apiKeys]);

  // Reverse image analysis
  var analyzeDroppedImage = _cb(async function(base64, mimeType) {
    setReverseLoading(true); setReverseTopics([]);
    try {
      var catLabel = cat ? cat.label : category || "general";
      var r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 400, messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: mimeType || "image/jpeg", data: base64 } },
          { type: "text", text: "Analyze this image. Suggest 5 editorial carousel topics for an Instagram brand in \"" + catLabel + "\". Each topic should be inspired by what you see but editorially interesting.\n\nRespond ONLY with JSON:\n[{\"topic\":\"title\",\"hook\":\"why this works\"}]" }
        ] }] }) });
      var d = await r.json();
      if (d.error) return;
      var text = (d.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, ""); }).join("");
      var cleaned = text.replace(/```json|```/g, "").trim();
      var js = cleaned.indexOf("["); var je = cleaned.lastIndexOf("]");
      if (js >= 0 && je > js) cleaned = cleaned.slice(js, je + 1);
      var parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) setReverseTopics(parsed.slice(0, 5));
    } catch (e) { console.error("Reverse image error:", e); }
    finally { setReverseLoading(false); }
  }, [category, cat]);

  var triggerSearch = _cb(function(query) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (webTimer.current) clearTimeout(webTimer.current);
    if (previewTimer.current) clearTimeout(previewTimer.current);
    setSmartAngles([]); setWebResults([]); setPreviewImages([]); setPersonNetwork({}); setViralScore(null);
    if (viralTimer.current) clearTimeout(viralTimer.current);
    previewPage.current = 1; // reset page counter for new topic
    // Clear person/location locks from previous topic
    setLockedPersonImages({}); setLockedLocationImages({});
    lockedRef.current = {};
    // Clear mood board locks but preserve uploaded image cover lock
    setPreviewLocked(function(prev) {
      if (prev.cover && prev.cover.source === "Upload") return { cover: prev.cover };
      return {};
    });
    setPersonsDetected([]); setPersonImages({}); setLocationsDetected([]); setLocationImages({});
    if (!query || query.length < 2) return;
    // Smart angles + person/location detection after 800ms
    searchTimer.current = setTimeout(function() { fetchSmartAngles(query); }, 800);
    // Web search after 1500ms
    webTimer.current = setTimeout(function() { fetchWebContext(query); }, 1500);
    // Viral score after 2s
    viralTimer.current = setTimeout(function() { fetchViralScore(query); }, 2000);
  }, [fetchSmartAngles, fetchWebContext, fetchPreviewImages, fetchViralScore]);

  // Person name detection + image fetch
  // detectPerson now handled by Claude in fetchSmartAngles

  // 1. Claude-generated related topics after generation
  var fetchClaudeRelated = _cb(async function(genTopic, genCategory, slides) {
    try {
      var headings = slides.slice(1, 6).map(function(s) { return s && s.heading ? s.heading : ""; }).filter(Boolean).join(", ");
      var r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 400, messages: [{ role: "user",
          content: "Based on a carousel about \"" + genTopic + "\" in " + genCategory + " covering: " + headings + ".\n\nSuggest 3 related but DIFFERENT topics the reader should explore next. Each should feel like a natural next chapter. Mix categories.\n\nRespond ONLY with JSON: [{\"topic\":\"title\",\"hook\":\"why this connects\",\"category\":\"" + genCategory + " or another category\"}]" }] }) });
      var d = await r.json();
      if (d.error) return;
      var text = (d.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, ""); }).join("");
      var cleaned = text.replace(/```json|```/g, "").trim();
      var js = cleaned.indexOf("["); var je = cleaned.lastIndexOf("]");
      if (js >= 0 && je > js) cleaned = cleaned.slice(js, je + 1);
      var parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) setClaudeRelated(parsed.slice(0, 3));
    } catch (e) { /* silent */ }
  }, []);

  // 2. Favorites management
  var toggleFavorite = _cb(function(t, c) {
    var newFavs = favorites.some(function(f) { return f.topic === t && f.category === c; })
      ? favorites.filter(function(f) { return !(f.topic === t && f.category === c); })
      : favorites.concat([{ topic: t, category: c, date: new Date().toLocaleDateString() }]);
    setFavorites(newFavs);
    try { localStorage.setItem("loathr_favorites", JSON.stringify(newFavs.slice(0, 50))); } catch (e) {}
  }, [favorites]);

  var isFavorited = _cb(function(t, c) {
    return favorites.some(function(f) { return f.topic === t && f.category === c; });
  }, [favorites]);

  // 3. Topic chain — track the journey
  var addToChain = _cb(function(t, c) {
    setTopicChain(function(prev) {
      var newChain = prev.concat([{ topic: t, category: c }]);
      return newChain.slice(-10); // keep last 10
    });
  }, []);

  // Image swap: fetch replacement candidates for a specific slide
  async function fetchSwapImages(slideIdx, query) {
    setSwapLoading(true); setSwapImages([]);
    try {
      var unsplashKey = apiKeys.unsplash || process.env.NEXT_PUBLIC_UNSPLASH_KEY || "";
      var pexelsKey = apiKeys.pexels || process.env.NEXT_PUBLIC_PEXELS_KEY || "";
      var catLabel = cat ? cat.label : category;
      var searchQ = query || (catLabel + " " + extractKeywords(topic, 3));
      var results = [];
      // Primary sources
      if (unsplashKey) { try { var us = await searchUnsplash(searchQ, unsplashKey); results = results.concat(us.slice(0, 6)); } catch (e) {} }
      if (pexelsKey) { try { var px = await searchPexels(searchQ, pexelsKey); results = results.concat(px.slice(0, 4)); } catch (e) {} }
      // Wikipedia + Wikimedia Commons
      try { var wr = await searchWikiRest(searchQ); results = results.concat(wr); } catch (e) {}
      try { var wm = await searchWikimedia(searchQ); results = results.concat(wm.slice(0, 3)); } catch (e) {}
      try { var wc = await searchWikiCommons(searchQ); results = results.concat(wc.slice(0, 4)); } catch (e) {}
      // Pixabay
      try { var pb = await searchPixabay(searchQ); results = results.concat(pb.slice(0, 4)); } catch (e) {}
      // Vintage / archival
      try { var vi = await searchVintage(category, extractKeywords(query || topic, 2)); results = results.concat(vi.slice(0, 3)); } catch (e) {}
      // Person-specific: TMDb + iTunes if query looks like a name
      var _so = selectedOptionRef.current;
      var cur = options ? options[_so] : null;
      var personName = cur && cur.slides && cur.slides[slideIdx] ? cur.slides[slideIdx].person : null;
      if (personName || (searchQ.split(" ").length <= 3 && /^[A-Z]/.test(searchQ))) {
        var pName = personName || searchQ;
        try { var tm = await searchTMDb(pName); results = results.concat(tm.slice(0, 3)); } catch (e) {}
        try { var it = await searchITunes(pName); results = results.concat(it.slice(0, 2)); } catch (e) {}
      }
      // Deduplicate across sources
      results = dedupeImages(results);
      // If too few results, retry with broader query
      if (results.length < 4 && query) {
        var broaderQ = catLabel + " " + extractKeywords(query, 2);
        if (unsplashKey) { try { var us2 = await searchUnsplash(broaderQ, unsplashKey); results = results.concat(us2.slice(0, 4)); } catch (e) {} }
        if (pexelsKey) { try { var px2 = await searchPexels(broaderQ, pexelsKey); results = results.concat(px2.slice(0, 3)); } catch (e) {} }
        results = dedupeImages(results);
      }
      setSwapImages(results.slice(0, 16));
    } catch (e) { console.error("Swap image search error:", e); }
    finally { setSwapLoading(false); }
  }

  var swpn = _s(-1), swapPanel = swpn[0], setSwapPanel = swpn[1]; // -1 = full slide, 0-3 = mosaic panel

  var applySwap = function(slideIdx, newImg, panelIdx) {
    if (panelIdx >= 0 && _mosaicSlides[slideIdx]) {
      // Swap a specific mosaic panel
      var updated = _mosaicSlides[slideIdx].slice();
      var layoutIdx = updated._layoutIdx;
      if (panelIdx < updated.length) { updated[panelIdx] = newImg.url || newImg.thumb; }
      else { updated.push(newImg.url || newImg.thumb); }
      _mosaicSlides[slideIdx] = updated;
      if (layoutIdx !== undefined) _mosaicSlides[slideIdx]._layoutIdx = layoutIdx;
      setImages(function(prev) { return Object.assign({}, prev); });
    } else {
      // Swap the full slide image — preserve mosaic layout if it exists
      var hadMosaic = _mosaicSlides[slideIdx];
      setImages(function(prev) {
        var n = Object.assign({}, prev);
        n[slideIdx] = newImg;
        return n;
      });
      // Update mosaic panel 0 with the new image too
      if (hadMosaic) {
        var mUpdated = hadMosaic.slice();
        var mLayoutIdx = mUpdated._layoutIdx;
        mUpdated[0] = newImg.url || newImg.thumb;
        _mosaicSlides[slideIdx] = mUpdated;
        if (mLayoutIdx !== undefined) _mosaicSlides[slideIdx]._layoutIdx = mLayoutIdx;
      }
    }
    setSwapSlide(null); setSwapImages([]); setSwapQuery(""); setSwapPanel(-1);
  };

  // Fact-checker — reviews generated content for accuracy
  // --- Editor functions ---
  var updateSlideField = function(slideIdx, field, value) {
    setOptions(function(prev) {
      var so = selectedOptionRef.current;
      if (!prev || !prev[so]) return prev;
      var newOpts = prev.slice();
      var opt = Object.assign({}, newOpts[so]);
      var slides = opt.slides.slice();
      slides[slideIdx] = Object.assign({}, slides[slideIdx]);
      slides[slideIdx][field] = value;
      opt.slides = slides;
      newOpts[so] = opt;
      return newOpts;
    });
  };

  var commitEdit = function() {
    if (editField) { updateSlideField(editField.slide, editField.field, editValue); }
    setEditField(null); setEditValue("");
  };

  var startEdit = function(slideIdx, field, currentValue) {
    setEditField({ slide: slideIdx, field: field });
    setEditValue(currentValue || "");
  };

  var deleteSlide = function(slideIdx) {
    setOptions(function(prev) {
      var _so = selectedOptionRef.current;
      if (!prev || !prev[_so]) return prev;
      var newOpts = prev.slice();
      var opt = Object.assign({}, newOpts[_so]);
      var slides = opt.slides.slice();
      slides.splice(slideIdx, 1);
      opt.slides = slides;
      newOpts[_so] = opt;
      return newOpts;
    });
    if (currentSlide >= slideIdx && currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  var duplicateSlide = function(slideIdx) {
    setOptions(function(prev) {
      var _so = selectedOptionRef.current;
      if (!prev || !prev[_so]) return prev;
      var newOpts = prev.slice();
      var opt = Object.assign({}, newOpts[_so]);
      var slides = opt.slides.slice();
      slides.splice(slideIdx + 1, 0, Object.assign({}, slides[slideIdx]));
      opt.slides = slides;
      newOpts[_so] = opt;
      return newOpts;
    });
  };

  var moveSlide = function(fromIdx, toIdx) {
    if (toIdx < 0) return;
    setOptions(function(prev) {
      var _so = selectedOptionRef.current;
      if (!prev || !prev[_so]) return prev;
      var newOpts = prev.slice();
      var opt = Object.assign({}, newOpts[_so]);
      var slides = opt.slides.slice();
      if (toIdx >= slides.length) return prev;
      var item = slides.splice(fromIdx, 1)[0];
      slides.splice(toIdx, 0, item);
      opt.slides = slides;
      newOpts[_so] = opt;
      return newOpts;
    });
    // Also swap images to follow the slide
    setImages(function(prev) {
      var n = Object.assign({}, prev);
      var fromImg = n[fromIdx];
      var toImg = n[toIdx];
      n[toIdx] = fromImg;
      n[fromIdx] = toImg;
      return n;
    });
    setCurrentSlide(toIdx);
  };

  var positions = ["bottom-left", "bottom-right", "top-left", "top-right", "split-corners", "side-left", "side-right", "l-shape"];
  var cycleTextPosition = function(slideIdx) {
    setOptions(function(prev) {
      var _so = selectedOptionRef.current;
      if (!prev || !prev[_so]) return prev;
      var newOpts = prev.slice();
      var opt = Object.assign({}, newOpts[_so]);
      var slides = opt.slides.slice();
      slides[slideIdx] = Object.assign({}, slides[slideIdx]);
      var curPos = slides[slideIdx].textPosition || "bottom-left";
      var curIdx = positions.indexOf(curPos);
      slides[slideIdx].textPosition = positions[(curIdx + 1) % positions.length];
      // Clear custom position when changing presets — preset takes priority
      slides[slideIdx].customPosition = null;
      opt.slides = slides;
      newOpts[_so] = opt;
      return newOpts;
    });
  };

  var CONTAINER_STYLES = [null, "bubble", "sticky", "formal", "glass", "tape", "cutout", "minimal", "none"];
  var CONTAINER_LABELS = { bubble: "Bubble", sticky: "Sticky", formal: "Formal", glass: "Glass", tape: "Tape", cutout: "Cutout", minimal: "Minimal", none: "None" };

  var cycleContainerStyle = function(slideIdx) {
    setOptions(function(prev) {
      var _so = selectedOptionRef.current;
      if (!prev || !prev[_so]) return prev;
      var newOpts = prev.slice();
      var opt = Object.assign({}, newOpts[_so]);
      var slides = opt.slides.slice();
      slides[slideIdx] = Object.assign({}, slides[slideIdx]);
      var cur = slides[slideIdx].containerStyle || null;
      var curIdx = CONTAINER_STYLES.indexOf(cur);
      if (curIdx === -1) curIdx = 0;
      slides[slideIdx].containerStyle = CONTAINER_STYLES[(curIdx + 1) % CONTAINER_STYLES.length];
      opt.slides = slides;
      newOpts[_so] = opt;
      return newOpts;
    });
  };

  // Nudge position — moves a specific element or all elements by 10px
  var NUDGE_STEP = 10;
  var nudgePosition = function(slideIdx, target, direction) {
    setOptions(function(prev) {
      var _so = selectedOptionRef.current;
      if (!prev || !prev[_so]) return prev;
      var newOpts = prev.slice();
      var opt = Object.assign({}, newOpts[_so]);
      var slides = opt.slides.slice();
      var s = Object.assign({}, slides[slideIdx]);
      // Get or create customPosition object with named sub-positions
      var cp = s.customPosition && typeof s.customPosition === "object" ? Object.assign({}, s.customPosition) : {};
      // Determine which sub-positions to nudge
      var targets = target === "all" ? ["heading", "body", "highlight", "sources", "quote", "stat"] : [target];
      targets.forEach(function(t) {
        var pos = cp[t] || { top: 0, left: 0 };
        if (direction === "up") pos = { top: (pos.top || 0) - NUDGE_STEP, left: pos.left || 0 };
        else if (direction === "down") pos = { top: (pos.top || 0) + NUDGE_STEP, left: pos.left || 0 };
        else if (direction === "left") pos = { top: pos.top || 0, left: (pos.left || 0) - NUDGE_STEP };
        else if (direction === "right") pos = { top: pos.top || 0, left: (pos.left || 0) + NUDGE_STEP };
        cp[t] = pos;
      });
      s.customPosition = cp;
      slides[slideIdx] = s;
      opt.slides = slides;
      newOpts[_so] = opt;
      return newOpts;
    });
  };

  var resetNudge = function(slideIdx, target) {
    setOptions(function(prev) {
      var _so = selectedOptionRef.current;
      if (!prev || !prev[_so]) return prev;
      var newOpts = prev.slice();
      var opt = Object.assign({}, newOpts[_so]);
      var slides = opt.slides.slice();
      var s = Object.assign({}, slides[slideIdx]);
      if (target === "all") { s.customPosition = null; }
      else if (s.customPosition) { var cp = Object.assign({}, s.customPosition); delete cp[target]; s.customPosition = Object.keys(cp).length > 0 ? cp : null; }
      slides[slideIdx] = s;
      opt.slides = slides;
      newOpts[_so] = opt;
      return newOpts;
    });
  };

  var adjustFontSize = function(slideIdx, field, delta) {
    setOptions(function(prev) {
      var _so = selectedOptionRef.current;
      if (!prev || !prev[_so]) return prev;
      var curVal = (prev[_so].slides[slideIdx] || {})[field + "Size"] || 0;
      var newOpts = prev.slice();
      var opt = Object.assign({}, newOpts[_so]);
      var slides = opt.slides.slice();
      slides[slideIdx] = Object.assign({}, slides[slideIdx]);
      slides[slideIdx][field + "Size"] = curVal + delta;
      opt.slides = slides;
      newOpts[_so] = opt;
      return newOpts;
    });
  };

  var factCheck = _cb(async function() {
    var cur = options ? options[selectedOption] : null;
    if (!cur || !cur.slides) return;
    setFactCheckLoading(true); setFactCheckResult(null);
    try {
      var slideTexts = cur.slides.map(function(s, i) {
        if (i === 0) return "COVER: " + (s.title || "");
        if (i === cur.slides.length - 1) return null;
        return "SLIDE " + (i + 1) + ": " + (s.heading || "") + " — " + (s.body || "") + (s.stat ? " [STAT: " + s.stat + "]" : "") + (s.quote ? " [QUOTE: " + s.quote + "]" : "");
      }).filter(Boolean).join("\n");
      var r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 600,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: "You are a fact-checker reviewing an Instagram carousel about \"" + topic + "\".\n\nHere is the content:\n" + slideTexts + "\n\nFor each slide, verify:\n1. Are the facts accurate? Flag anything wrong or unverifiable.\n2. Are statistics real? Flag made-up numbers.\n3. Are quotes attributed correctly?\n4. Is the overall narrative fair or misleading?\n\nRespond ONLY with JSON:\n{\"score\": 1-10, \"summary\": \"one sentence overall\", \"issues\": [{\"slide\": N, \"issue\": \"what's wrong\", \"fix\": \"suggested correction\"}]}\nIf everything checks out, return empty issues array." }] }) });
      var d = await r.json();
      if (d.error) { setFactCheckResult({ score: 0, summary: "Fact-check failed: " + (d.error.message || d.error), issues: [] }); return; }
      var text = (d.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, ""); }).join("");
      var cleaned = text.replace(/```json|```/g, "").trim();
      var js = cleaned.indexOf("{"); var je = cleaned.lastIndexOf("}");
      if (js >= 0 && je > js) cleaned = cleaned.slice(js, je + 1);
      var parsed = JSON.parse(cleaned);
      setFactCheckResult(parsed);
    } catch (e) { setFactCheckResult({ score: 0, summary: "Parse error: " + e.message, issues: [] }); }
    finally { setFactCheckLoading(false); }
  }, [options, selectedOption, topic]);

  // 4. Share link — encode carousel state as URL params
  var generateShareLink = _cb(function() {
    var params = new URLSearchParams();
    params.set("t", topic);
    params.set("c", category);
    var link = window.location.origin + window.location.pathname + "?" + params.toString();
    setShareLink(link);
    if (navigator.clipboard) { navigator.clipboard.writeText(link); }
  }, [topic, category]);

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
    var thisGen = genCount + 1;
    setGenCount(thisGen);
    try { var gtotal = parseInt(localStorage.getItem("loathr_gen_count") || "0") + 1; localStorage.setItem("loathr_gen_count", String(gtotal)); setUserLevel(gtotal < 5 ? 2 : 3); } catch (e) {}
    var catInfo = CATEGORIES.find(function(c) { return c.id === category; });
    var edition = getEditionId(topic, category, thisGen, editionPicks);
    setEditionData(edition);
    _activeImageStyle = category === "enterprise" ? "bw" : (editionPicks.imageStyle || "mixed");
    _activeSegment = category === "enterprise" ? "enterprise" : category === "newsdesk" ? "newsdesk" : null;
    if (category === "enterprise") setGlobalImgFilter(editionPicks.enterpriseImgFilter || "none");
    try {
      if (controller.signal.aborted) throw new Error("Generation cancelled");
      var secInfo = secondaryCategory ? CATEGORIES.find(function(c) { return c.id === secondaryCategory; }) : null;
      var terInfo = tertiaryCategory ? CATEGORIES.find(function(c) { return c.id === tertiaryCategory; }) : null;
      var prompt;
      if (category === "enterprise") {
        var force = enterpriseForce ? ENTERPRISE_FORCES.find(function(f) { return f.id === enterpriseForce; }) : null;
        var sectorObj = enterpriseSector ? ENTERPRISE_SECTORS.find(function(s) { return s.id === enterpriseSector; }) : null;
        if (enterpriseMode === "news") { prompt = buildEnterpriseNewsPrompt(topic, force, edition.seed, editionPicks, sectorObj); }
        else if (enterpriseMode === "tips") { prompt = buildEnterpriseTipsPrompt(topic, force, edition.seed, editionPicks, sectorObj); }
        else { prompt = buildEnterprisePrompt(topic, force, edition.seed, editionPicks, sectorObj); }
      } else if (category === "newsdesk") {
        var nfObj = newsFilter ? NEWSDESK_FILTERS.find(function(f) { return f.id === newsFilter; }) : null;
        var nrObj = NEWSDESK_REGIONS.find(function(r) { return r.id === newsRegion; }) || null;
        var ntObj = NEWSDESK_TIMEFRAMES.find(function(t) { return t.id === newsTimeframe; }) || null;
        prompt = buildNewsDeskPrompt(topic, nfObj, nrObj, ntObj, newsCountry, editionPicks);
      } else {
        prompt = buildPrompt(catInfo.label, topic, edition.seed, editionPicks, Object.keys(lockedRef.current || {}).length > 0, secInfo ? secInfo.label : null, terInfo ? terInfo.label : null, secondaryCount, tertiaryCount);
      }
      // Enterprise + News Desk use web search tool for current data
      var useWebSearch = category === "newsdesk" || category === "enterprise";
      var fetchBody = { model: "claude-sonnet-4-20250514", max_tokens: useWebSearch ? 16000 : 8000, messages: [{ role: "user", content: prompt }] };
      if (useWebSearch) { fetchBody.tools = [{ type: "web_search_20250305", name: "web_search" }]; }
      var r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(fetchBody) });
      var d = await r.json();
      if (d.error) throw new Error(d.error.message || d.error);
      // Extract text — try each text block individually for JSON (web search splits response)
      var textBlocks = (d.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, ""); });
      var text = textBlocks.join("");
      var cleaned = "";
      // First: try the concatenated text
      if (text) {
        cleaned = text.replace(/```json|```/g, "").trim();
        cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
      }
      // Find JSON — look for the slides array specifically
      var jsonStart = cleaned.indexOf('{"angle"');
      if (jsonStart < 0) jsonStart = cleaned.indexOf('{"slides"');
      if (jsonStart < 0) jsonStart = cleaned.indexOf("{");
      var jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
      } else {
        // Fallback: check each text block individually for JSON
        for (var bi = textBlocks.length - 1; bi >= 0; bi--) {
          var block = textBlocks[bi].replace(/```json|```/g, "").trim();
          var bs = block.indexOf("{"); var be = block.lastIndexOf("}");
          if (bs >= 0 && be > bs && block.indexOf("slides") > -1) { cleaned = block.slice(bs, be + 1); break; }
        }
      }
      if (!cleaned || cleaned.indexOf("slides") < 0) {
        // Last resort: retry without web search
        if (useWebSearch) {
          setImgStatus("Web search failed to produce JSON — retrying without search...");
          var retryBody = { model: "claude-sonnet-4-20250514", max_tokens: 8000, messages: [{ role: "user", content: prompt }] };
          var r2 = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify(retryBody) });
          var d2 = await r2.json();
          if (d2.error) throw new Error(d2.error.message || d2.error);
          text = (d2.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, ""); }).join("");
          cleaned = text.replace(/```json|```/g, "").trim().replace(/,\s*([}\]])/g, "$1");
          jsonStart = cleaned.indexOf("{"); jsonEnd = cleaned.lastIndexOf("}");
          if (jsonStart >= 0 && jsonEnd > jsonStart) cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
          else throw new Error("Failed to generate carousel content. Try a simpler topic.");
        } else {
          throw new Error("No carousel JSON found in response. Try again.");
        }
      }
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
          // Last attempt: retry without web search (truncation likely caused by search tokens)
          if (useWebSearch) {
            setImgStatus("JSON truncated — retrying without web search...");
            var retryBody3 = { model: "claude-sonnet-4-20250514", max_tokens: 8000, messages: [{ role: "user", content: prompt }] };
            var r3 = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify(retryBody3) });
            var d3 = await r3.json();
            if (d3.error) throw new Error(d3.error.message || d3.error);
            var t3 = (d3.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, ""); }).join("");
            var c3 = t3.replace(/```json|```/g, "").trim().replace(/,\s*([}\]])/g, "$1");
            var s3 = c3.indexOf("{"); var e3 = c3.lastIndexOf("}");
            if (s3 >= 0 && e3 > s3) c3 = c3.slice(s3, e3 + 1);
            parsed = JSON.parse(c3);
          } else {
            throw new Error("Failed to parse carousel JSON. Try generating again.");
          }
        }
      }
      var results = [];
      if (parsed && parsed.slides) results.push(parsed);
      else if (Array.isArray(parsed) && parsed[0]) results.push(parsed[0]);
      if (results.length === 0) throw new Error("No valid carousel generated");
      setOptions(results);
      // Save to recent and history
      try {
        var recent = JSON.parse(localStorage.getItem("loathr_recent") || "[]");
        recent = [{ topic: topic, category: category }].concat(recent.filter(function(r) { return r.topic !== topic; })).slice(0, 10);
        localStorage.setItem("loathr_recent", JSON.stringify(recent));
        setRecentTopics(recent);
        var hist = JSON.parse(localStorage.getItem("loathr_history") || "[]");
        var alreadyInHist = hist.some(function(h) { return typeof h === "string" ? h === topic : h.topic === topic && h.category === category; });
        var entry = { topic: topic, category: category, date: new Date().toLocaleDateString(), slides: results[0] ? results[0].slides : [], picks: Object.assign({}, editionPicks) };
        if (!alreadyInHist) { hist.unshift(entry); } else {
          // Update existing entry with new generation
          hist = hist.map(function(h) { return (typeof h !== "string" && h.topic === topic && h.category === category) ? entry : h; });
        }
        try { localStorage.setItem("loathr_history", JSON.stringify(hist.slice(0, 30))); } catch (e) { /* storage full — trim more */ try { localStorage.setItem("loathr_history", JSON.stringify(hist.slice(0, 15))); } catch (e2) {} }
        setTopicHistory(hist);
      } catch (e) {}
      // Generate related topics
      if (results[0] && results[0].slides) {
        setRelatedTopics(getRelatedTopics(results[0].slides, category));
        setCrossCatRelated(getCrossCategoryRelated(results[0].slides, category));
        fetchClaudeRelated(topic, catInfo.label, results[0].slides);
        addToChain(topic, category);
      }
      setSuggestions([]);
      var unsplashKey = apiKeys.unsplash || process.env.NEXT_PUBLIC_UNSPLASH_KEY || "";
      var pexelsKey = apiKeys.pexels || process.env.NEXT_PUBLIC_PEXELS_KEY || "";
      var imgKey = unsplashKey || pexelsKey;
      if (imgKey) {
        setImgStatus("Searching for images...");
        try {
          var primaryFn = unsplashKey ? searchUnsplash : searchPexels;
          var primaryKey = unsplashKey || pexelsKey;
          var secondaryFn = unsplashKey && pexelsKey ? searchPexels : null;
          var secondaryKey = pexelsKey || "";
          var shortTopic = extractKeywords(topic, 3);
          // Enterprise/News Desk: add context to image search for more relevant results
          if (category === "enterprise" && enterpriseForce) {
            var forceImgCtx = { tech: "technology innovation", policy: "government regulation", ai: "artificial intelligence robot", markets: "stock market finance", culture: "culture society", media: "media broadcast", education: "education university", stocks: "wall street trading", lifestyle: "consumer lifestyle", news: "breaking news press" };
            shortTopic = (forceImgCtx[enterpriseForce] || "business") + " " + shortTopic;
          }
          if (category === "newsdesk" && newsFilter) {
            var filterImgCtx = { breaking: "breaking news urgent", developing: "news press conference", trending: "viral social media", politics: "politics government capitol", sports: "sports athlete stadium", money: "finance economy money", people: "celebrity public figure", tech: "technology digital", culture: "culture arts society", world: "global world map" };
            shortTopic = (filterImgCtx[newsFilter] || "news") + " " + shortTopic;
          }
          var imgMap = {};
          var slides = results[0] && results[0].slides ? results[0].slides : [];
          var vintageSlots = [1, 2, 7];

          // 0. Place locked person images — read from ref for guaranteed freshness
          var currentLocked = lockedRef.current || {};
          var lockedNames = Object.keys(currentLocked);
          console.log("Locked person images:", lockedNames.length, JSON.stringify(currentLocked));
          if (lockedNames.length > 0 && results[0]) {
            var piSlide = results[0].personImageSlide;
            lockedNames.forEach(function(name, ni) {
              var locked = currentLocked[name];
              if (!locked || !locked.img) { console.log("Skipping " + name + ": no img"); return; }
              console.log("Placing " + name + " as " + locked.placement + " img:", locked.img.url);
              if (locked.placement === "cover") {
                imgMap[0] = locked.img;
              } else {
                // Claude picks — find slide with matching person field, or use personImageSlide
                var matched = false;
                (results[0].slides || []).forEach(function(s, si) {
                  if (s && s.person && s.person.toLowerCase().indexOf(name.split(" ")[0].toLowerCase()) !== -1 && !matched) {
                    imgMap[si] = locked.img; matched = true;
                  }
                });
                if (!matched) {
                  var fallbackSlot = typeof piSlide === "number" ? piSlide + ni : 4 + ni;
                  imgMap[Math.min(fallbackSlot, 8)] = locked.img;
                }
              }
            });
          }

          // 0b. Place locked location images
          var lockedLocNames = Object.keys(lockedLocationImages);
          lockedLocNames.forEach(function(place, li) {
            var locImg = lockedLocationImages[place];
            if (!locImg || !locImg.img) return;
            if (locImg.placement === "cover" && !imgMap[0]) { imgMap[0] = locImg.img; }
            else { var locSlot = 2 + li; if (!imgMap[locSlot]) imgMap[locSlot] = locImg.img; }
          });

          // 0c. Place preview-locked images (user picked from topic preview — highest priority)
          Object.keys(previewLocked).forEach(function(role) {
            var pvImg = previewLocked[role];
            if (!pvImg) return;
            if (role === "cover") imgMap[0] = pvImg; // always override — user explicitly chose this
            else if (role === "closer") { var cIdx = slides.length ? slides.length - 1 : 9; if (!imgMap[cIdx]) imgMap[cIdx] = pvImg; }
            else if (role === "evidence") { var eIdx = slides.findIndex(function(s) { return s && (s.statFormat || s.stat); }); if (eIdx > 0 && !imgMap[eIdx]) imgMap[eIdx] = pvImg; }
            else if (role === "origin" && !imgMap[1]) imgMap[1] = pvImg;
            else if (role === "hotTake" && !imgMap[3]) imgMap[3] = pvImg;
          });

          // 1. Main topic search for cover + closer
          var mainImgs = await primaryFn(catInfo.label + " " + shortTopic, primaryKey);
          // Retry with broader terms if main search returned nothing
          if (mainImgs.length === 0) {
            try { mainImgs = await primaryFn(catInfo.label, primaryKey); } catch (e) {}
          }
          if (mainImgs.length === 0 && secondaryFn) {
            try { mainImgs = await secondaryFn(catInfo.label + " " + shortTopic, secondaryKey); } catch (e) {}
          }
          if (mainImgs.length > 0 && !imgMap[0]) imgMap[0] = mainImgs[0]; // cover (skip if person image locked)
          // Closer gets a different image from main results (not index 1 which may be too similar to cover)
          var closerIdx = slides.length ? slides.length - 1 : 9;
          if (mainImgs.length > 2 && !imgMap[closerIdx]) imgMap[closerIdx] = mainImgs[2];
          else if (mainImgs.length > 1 && !imgMap[closerIdx]) imgMap[closerIdx] = mainImgs[1];

          // Track used image URLs to prevent duplicates (including locked person images)
          var usedUrls = {};
          function markUsed(img) {
            if (!img) return;
            if (img.url) { usedUrls[img.url] = true; usedUrls[normalizeImgUrl(img.url)] = true; }
            if (img.thumb) { usedUrls[img.thumb] = true; usedUrls[normalizeImgUrl(img.thumb)] = true; }
          }
          Object.values(imgMap).forEach(markUsed);
          function pickUnique(results) {
            for (var u = 0; u < results.length; u++) {
              var img = results[u];
              if (!img || !img.url) continue;
              var norm = normalizeImgUrl(img.url);
              var normThumb = img.thumb ? normalizeImgUrl(img.thumb) : "";
              if (usedUrls[img.url] || usedUrls[norm] || (img.thumb && usedUrls[img.thumb]) || (normThumb && usedUrls[normThumb])) continue;
              markUsed(img);
              return img;
            }
            return null;
          }

          // 2. Per-slide contextual search for content slides
          setImgStatus("Matching images to slides...");
          for (var ps = 1; ps < Math.min(slides.length - 1, 12); ps++) {
            if (imgMap[ps]) continue;
            var slideData = slides[ps] || {};
            // Use the slide's cross-category lens for search if present
            var slideCatLabel = catInfo.label;
            var slideCatId = category;
            if (slideData.categoryLens) {
              var lensMatch = CATEGORIES.find(function(c) { return c.label.toLowerCase() === slideData.categoryLens.toLowerCase() || c.id === slideData.categoryLens.toLowerCase(); });
              if (lensMatch) { slideCatLabel = lensMatch.label; slideCatId = lensMatch.id; }
            }
            var sq = getSlideImageQuery(slideData, slideCatLabel, topic);
            try {
              // Person field — search Wikipedia REST for portraits (skip if person already placed)
              if (slideData.person) {
                var alreadyPlaced = Object.values(imgMap).some(function(img) { return img && img.alt && img.alt.toLowerCase() === slideData.person.toLowerCase(); });
                if (!alreadyPlaced) {
                  var wikiImgs = await searchWikiRest(slideData.person);
                  var wPick = pickUnique(wikiImgs);
                  if (wPick) { imgMap[ps] = wPick; continue; }
                }
              }
              // Vintage slots use vintage APIs (respecting cross-category lens)
              if (vintageSlots.indexOf(ps) !== -1) {
                var vApis = VINTAGE_APIS[slideCatId] || VINTAGE_APIS[category] || [searchMetMuseum];
                var vr = await vApis[ps % vApis.length](sq.split(" ").slice(0, 2).join(" "));
                var vPick = pickUnique(vr);
                if (vPick) { imgMap[ps] = vPick; continue; }
              }
              // Alternate between primary and secondary stock API
              var useSec = secondaryFn && ps % 2 === 0;
              var fn = useSec ? secondaryFn : primaryFn;
              var k = useSec ? secondaryKey : primaryKey;
              var sr = await fn(sq, k);
              var sPick = pickUnique(sr);
              if (sPick) imgMap[ps] = sPick;
              else if (mainImgs.length > ps) { var mPick = pickUnique(mainImgs); if (mPick) imgMap[ps] = mPick; }
            } catch (pe) {
              // Fallback: try to pick a unique image from main results
              var catchPick = pickUnique(mainImgs);
              if (catchPick) imgMap[ps] = catchPick;
            }
          }

          // 3. Fill remaining gaps with unique images from main results (no repeats)
          var slideTotal = slides.length || 10;
          for (var fill = 0; fill < slideTotal; fill++) {
            if (!imgMap[fill]) {
              var fillPick = pickUnique(mainImgs);
              if (fillPick) imgMap[fill] = fillPick;
            }
          }

          var totalLoaded = Object.keys(imgMap).length;
          // Build mosaic map for slides Claude flagged as mosaic
          _mosaicSlides = {};
          _allImages = imgMap;
          _mosaicExtraImages = [];
          var mosaicFlagged = slides.filter(function(s) { return s && s.mosaic; }).length;
          console.log("Mosaic: " + mosaicFlagged + " slides flagged, " + totalLoaded + " images available");
          // Fetch extra images specifically for mosaic panels
          if (mosaicFlagged > 0 || totalLoaded >= 3) {
            var mosaicNeed = Math.max(mosaicFlagged, 2) * 3; // ~3 extra per mosaic slide
            var extraUsed = {};
            Object.values(imgMap).forEach(function(img) { if (img && img.url) { extraUsed[img.url] = true; extraUsed[normalizeImgUrl(img.url)] = true; } });
            try {
              var mosaicBase = shortTopic + " " + (catInfo ? catInfo.label : category);
              var mExtra = [];
              // Use varied queries to get diverse images
              if (primaryKey) { try { var me1 = await primaryFn(mosaicBase + " abstract editorial", primaryKey); mExtra = mExtra.concat(me1); } catch(e) {} }
              if (secondaryKey) { try { var me2 = await secondaryFn(shortTopic + " industry workplace", secondaryKey); mExtra = mExtra.concat(me2); } catch(e) {} }
              try { var me3 = await searchWikiCommons(shortTopic + " business"); mExtra = mExtra.concat(me3); } catch(e) {}
              try { var me4 = await searchPixabay(mosaicBase); mExtra = mExtra.concat(me4); } catch(e) {}
              // Additional variety pass with different terms
              if (mExtra.length < mosaicNeed) {
                if (primaryKey) { try { var me5 = await primaryFn(shortTopic + " technology modern", primaryKey); mExtra = mExtra.concat(me5); } catch(e) {} }
                try { var me6 = await searchWikiCommons(mosaicBase + " industry"); mExtra = mExtra.concat(me6); } catch(e) {}
              }
              mExtra.forEach(function(img) {
                if (img && img.url && !extraUsed[img.url] && !extraUsed[normalizeImgUrl(img.url)] && _mosaicExtraImages.length < mosaicNeed) {
                  _mosaicExtraImages.push(img.url); extraUsed[img.url] = true; extraUsed[normalizeImgUrl(img.url)] = true;
                }
              });
              console.log("Mosaic extra images fetched: " + _mosaicExtraImages.length);
            } catch(e) { console.error("Mosaic extra fetch error:", e); }
          }
          if (totalLoaded >= 3) {
            // Assign mosaic images sequentially so each mosaic knows what previous ones used
            var mosaicGlobalUsed = {};
            Object.values(imgMap).forEach(function(img) { if (img && img.url) { mosaicGlobalUsed[img.url] = true; mosaicGlobalUsed[normalizeImgUrl(img.url)] = true; } });
            slides.forEach(function(s, si) {
              if (s && s.mosaic && si > 0 && si < slides.length - 1) {
                var mUrls = [];
                var mUsed = Object.assign({}, mosaicGlobalUsed);
                // Primary image for this slide
                if (imgMap[si] && imgMap[si].url && !mUsed[imgMap[si].url]) { mUrls.push(imgMap[si].url); mUsed[imgMap[si].url] = true; }
                // Pull from extra pool first
                for (var me = 0; me < _mosaicExtraImages.length && mUrls.length < 4; me++) {
                  var eu = _mosaicExtraImages[me];
                  if (eu && !mUsed[eu] && !mUsed[normalizeImgUrl(eu)]) { mUrls.push(eu); mUsed[eu] = true; mUsed[normalizeImgUrl(eu)] = true; }
                }
                // Fallback: non-adjacent slides (3+ away)
                if (mUrls.length < 4) {
                  var keys = Object.keys(imgMap);
                  for (var mk = 0; mk < keys.length && mUrls.length < 4; mk++) {
                    var mimg = imgMap[keys[mk]];
                    if (mimg && mimg.url && !mUsed[mimg.url] && !mUsed[normalizeImgUrl(mimg.url)] && Math.abs(parseInt(keys[mk]) - si) > 2) {
                      mUrls.push(mimg.url); mUsed[mimg.url] = true;
                    }
                  }
                }
                console.log("Mosaic slide " + si + ": " + mUrls.length + " images found");
                if (mUrls.length >= 2) {
                  _mosaicSlides[si] = mUrls;
                  // Mark these as globally used so next mosaic won't reuse them
                  mUrls.forEach(function(u) { mosaicGlobalUsed[u] = true; mosaicGlobalUsed[normalizeImgUrl(u)] = true; });
                }
              }
            });
          }
          // Auto-assign mosaic — Enterprise only (B&W layouts benefit from collage variety)
          // Editorial and News Desk respect Claude's mosaic flags only
          if (category === "enterprise") {
            var contentSlideCount = Math.max(slides.length - 2, 1);
            var targetMosaic = Math.max(Math.round(contentSlideCount * 0.3), 1);
            var currentMosaic = Object.keys(_mosaicSlides).length;
            if (currentMosaic < targetMosaic && totalLoaded >= 3) {
              slides.forEach(function(s, si) {
                if (Object.keys(_mosaicSlides).length >= targetMosaic) return;
                if (si <= 0 || si >= slides.length - 1) return;
                if (_mosaicSlides[si]) return;
                if (s.statFormat || s.stat || s.stats || s.before || s.leftStat || s.quote) return;
                var mUrls = getMosaicImgs(imgMap, si, slides.length);
                if (mUrls.length >= 2) _mosaicSlides[si] = mUrls;
              });
            }
          }
          if (totalLoaded > 0) {
            setImages(imgMap);
            setImgStatus(totalLoaded + " contextual images loaded" + (Object.keys(_mosaicSlides).length > 0 ? " (" + Object.keys(_mosaicSlides).length + " mosaic)" : ""));
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
            // Preserve locked person images in vintage-only path
            var vCurrentLocked = lockedRef.current || {};
            var vLockedNames = Object.keys(vCurrentLocked);
            vLockedNames.forEach(function(name) {
              var vLocked = vCurrentLocked[name];
              if (vLocked && vLocked.img && vLocked.placement === "cover") vMap[0] = vLocked.img;
            });
            vintageOnly.forEach(function(img, i) { if (!vMap[i]) vMap[i] = img; });
            setImages(vMap);
            setImgStatus(vintageOnly.length + " vintage images loaded");
          } else { setImgStatus("No images found"); }
        } catch (ve) { setImgStatus("Vintage search failed"); }
      }
    } catch (err) { if (err.name !== "AbortError") setError(err.message || "Generation failed"); }
    finally { setIsGenerating(false); }
  }, [topic, category, secondaryCategory, secondaryCount, tertiaryCategory, tertiaryCount, apiKeys, editionPicks, lockedPersonImages, genCount, previewLocked, lockedLocationImages, enterpriseForce, enterpriseMode, enterpriseSector, newsFilter, newsRegion, newsTimeframe, newsCountry]);

  // --- Custom Story generator ---
  var generateCustomStory = _cb(async function() {
    if (!customSubject.trim() || !customContext.trim() || !category) return;
    if (customImages.length === 0) { setError("Upload at least 1 image for the cover"); return; }
    if (abortRef.current) abortRef.current.abort();
    var controller = new AbortController();
    abortRef.current = controller;
    setIsGenerating(true); setError(null); setOptions(null); setImages({});
    setSelectedOption(0); setCurrentSlide(0); setImgStatus(null);
    var thisGen = genCount + 1;
    setGenCount(thisGen);
    try { var gtotal = parseInt(localStorage.getItem("loathr_gen_count") || "0") + 1; localStorage.setItem("loathr_gen_count", String(gtotal)); setUserLevel(gtotal < 5 ? 2 : 3); } catch (e) {}
    var catInfo = CATEGORIES.find(function(c) { return c.id === category; });
    var edition = getEditionId(customSubject, category, thisGen, editionPicks);
    setEditionData(edition);
    _activeImageStyle = category === "enterprise" ? "bw" : (editionPicks.imageStyle || "mixed");
    _activeSegment = category === "enterprise" ? "enterprise" : category === "newsdesk" ? "newsdesk" : null;
    try {
      if (controller.signal.aborted) throw new Error("Generation cancelled");
      var sc = editionPicks.slideCount || 0;
      var slideCountInstr = sc >= 4 && sc <= 12 ? "Generate EXACTLY " + sc + " slides (including Cover and Closer)." + (sc <= 5 ? " With only " + sc + " slides: Cover, " + (sc - 2) + " content slide" + (sc > 3 ? "s" : "") + ", Closer. Every slide must be high-impact." : "") : "Generate 4-12 slides based on how much context is provided. Thin context = fewer slides, rich context = more.";
      var imgRoles = customImages.map(function(ci, i) { return "Image " + (i + 1) + ": assigned to \"" + ci.role + "\""; }).join("\n");
      // Creative freedom levels
      var freedomInstr = "";
      if (creativeFreedom === "strict") {
        freedomInstr = "CREATIVE FREEDOM: STRICT\n- Write ONLY from the context provided. Zero embellishment.\n- Do not add facts, dates, claims, or details not explicitly in the raw context.\n- If the context is thin, use fewer slides rather than inventing content.";
      } else if (creativeFreedom === "editorial") {
        freedomInstr = "CREATIVE FREEDOM: EDITORIAL\n- Reframe and dramatize what's in the context. Add editorial voice, vivid language, and metaphors.\n- Do NOT add new facts, but you may add emotional framing, rhetorical questions, and perspective.\n- Find the narrative arc, tension, and hook in the raw material.";
      } else if (creativeFreedom === "expanded") {
        freedomInstr = "CREATIVE FREEDOM: EXPANDED\n- Use the context as your foundation, but fill gaps with plausible editorial color.\n- You may add sensory details (what the scene looked/felt/sounded like), cultural context, and reasonable assumptions.\n- If context says 'opened a restaurant in Lagos' you can describe the neighborhood energy, the aroma, the crowd.\n- Stay directionally true — never contradict the context, but enrich it.";
      } else if (creativeFreedom === "creative") {
        freedomInstr = "CREATIVE FREEDOM: CREATIVE\n- Take the context as a starting point and build a full editorial narrative.\n- You may add invented details, scene-setting, dialogue-style moments, and speculative commentary.\n- Write as if you're a magazine journalist who visited, interviewed, and experienced the subject.\n- The context gives you the skeleton — you add the flesh, the voice, the world around it.\n- This is editorial storytelling, not journalism. Be vivid and cinematic.";
      }
      // Tone from edition settings
      var toneId = editionPicks.tone || "editorial";
      var toneObj = TONES.find(function(t) { return t.id === toneId; });
      var toneInstr = toneObj ? "\nTONE: " + toneObj.prompt : "";
      var customVoiceInstr = editionPicks.customVoice ? "\nCUSTOM VOICE: " + editionPicks.customVoice : "";
      var customPrompt = "You are writing for LOATHR, an editorial Instagram brand.\nCategory: \"" + catInfo.label + "\"\n\nCUSTOM STORY MODE — this is an ORIGINAL story not yet on the internet.\n\nSubject: \"" + customSubject + "\"\n" + (customHook ? "Hook: \"" + customHook + "\"\n" : "") + "\nRAW CONTEXT (from the user):\n" + customContext + "\n\n" + freedomInstr + toneInstr + customVoiceInstr + "\n\n" + slideCountInstr + "\n\nThe user has uploaded " + customImages.length + " image(s):\n" + imgRoles + "\n\nKeep body text to 2-3 sentences MAX per slide.\n\nSLIDE ROLES (adapt to fit the story):\n- COVER — title, titleHighlight, subtitle\n- Content slides — heading, body, highlight, textPosition\n- THE EVIDENCE — stat/number slide if any numbers exist in the context. Use statFormat \"killer\" with stat and caption.\n- THE VOICE — quote slide if any quotes exist. quote, source fields.\n- CLOSER — hashtags string\n- On 1 content slide where it fits, add \"mosaic\": true for a photo collage background.\n\nFor design: choose textPosition per slide from: bottom-left, bottom-right, top-left, top-right, split-corners, side-left, side-right, l-shape\n\nRespond ONLY with valid JSON:\n{\"angle\":\"Custom Story\",\"slides\":[{...slides...}]}";

      var r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 8000, messages: [{ role: "user", content: customPrompt }] }) });
      var d = await r.json();
      if (d.error) throw new Error(d.error.message || d.error);
      var text = (d.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, ""); }).join("");
      var cleaned = text.replace(/```json|```/g, "").trim();
      cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
      var jsonStart = cleaned.indexOf("{"); var jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart >= 0 && jsonEnd > jsonStart) cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
      var parsed;
      try { parsed = JSON.parse(cleaned); } catch (je) {
        try { cleaned = cleaned.replace(/,\s*$/, ""); if (!cleaned.endsWith("]}")) cleaned += "]}"; parsed = JSON.parse(cleaned); }
        catch (je2) { throw new Error("Failed to parse custom story JSON. Try again."); }
      }
      var results = [];
      if (parsed && parsed.slides) results.push(parsed);
      if (results.length === 0) throw new Error("No valid carousel generated");
      setOptions(results);
      setTopic(customSubject); // set topic for image search context

      // Place uploaded images by role
      var imgMap = {};
      var slides = results[0].slides || [];
      var ROLE_SLOTS = { cover: 0, closer: slides.length - 1, portrait: 1, context: 2, action: 3, detail: 4, background: 5 };
      customImages.forEach(function(ci) {
        var slot = ROLE_SLOTS[ci.role] !== undefined ? ROLE_SLOTS[ci.role] : null;
        if (slot !== null && !imgMap[slot]) {
          imgMap[slot] = { url: ci.preview, thumb: ci.preview, alt: customSubject, credit: "User", source: "Upload" };
        }
      });

      // Fill remaining slots with stock/vintage image search
      var unsplashKey = apiKeys.unsplash || process.env.NEXT_PUBLIC_UNSPLASH_KEY || "";
      var pexelsKey = apiKeys.pexels || process.env.NEXT_PUBLIC_PEXELS_KEY || "";
      if (unsplashKey || pexelsKey) {
        setImgStatus("Finding supporting images...");
        var searchFn = unsplashKey ? searchUnsplash : searchPexels;
        var searchKey = unsplashKey || pexelsKey;
        var keywords = extractKeywords(customSubject + " " + customHook, 3);
        var catLabel = catInfo.label;
        try {
          var stockImgs = await searchFn(catLabel + " " + keywords, searchKey);
          var usedUrls2 = {};
          Object.values(imgMap).forEach(function(img) { if (img && img.url) { usedUrls2[img.url] = true; usedUrls2[normalizeImgUrl(img.url)] = true; } });
          for (var fi = 0; fi < slides.length; fi++) {
            if (imgMap[fi]) continue;
            for (var si = 0; si < stockImgs.length; si++) {
              var simg = stockImgs[si];
              if (simg && simg.url && !usedUrls2[simg.url] && !usedUrls2[normalizeImgUrl(simg.url)]) {
                imgMap[fi] = simg; usedUrls2[simg.url] = true; usedUrls2[normalizeImgUrl(simg.url)] = true; break;
              }
            }
          }
        } catch (e) {}
        // Vintage for remaining gaps
        try {
          var vintImgs = await searchVintage(category, keywords);
          for (var vi = 0; vi < slides.length; vi++) {
            if (imgMap[vi]) continue;
            if (vintImgs.length > 0) { imgMap[vi] = vintImgs.shift(); }
          }
        } catch (e) {}
      }
      if (Object.keys(imgMap).length > 0) { setImages(imgMap); setImgStatus(Object.keys(imgMap).length + " images placed"); }
      else { setImgStatus("No supporting images found"); }
    } catch (err) { if (err.name !== "AbortError") setError(err.message || "Generation failed"); }
    finally { setIsGenerating(false); }
  }, [customSubject, customHook, customContext, customImages, category, apiKeys, editionPicks, genCount, creativeFreedom]);

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
      var text = (d.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, ""); }).join("");
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
          var imgs = await searchFn(catInfo.label + " " + extractKeywords(topic, 3), key);
          if (imgs.length < 10) {
            try { var vi = await searchVintage(category, extractKeywords(topic, 3)); imgs = imgs.concat(vi); } catch (ve) {}
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
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px", background: activeSegment === "enterprise" ? "#0a0a0a" : activeSegment === "newsdesk" ? "#f5f0e4" : undefined, color: activeSegment === "enterprise" ? "#eeeeee" : activeSegment === "newsdesk" ? "#1a1a1a" : undefined, minHeight: activeSegment !== "editorial" ? "100vh" : undefined, transition: "background 0.3s, color 0.3s" }}>
      <style>{"@font-face{font-family:'Foun';src:url('/Fonts/Foun/OpenType-PS/Foun.otf') format('opentype'),url('/Fonts/Foun/OpenType-TT/Foun.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:'Wenssep';src:url('/Fonts/Wenssep/Wenssep.otf') format('opentype'),url('/Fonts/Wenssep/Wenssep.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:'Maheni';src:url('/Fonts/Maheni/Maheni-Regular.otf') format('opentype'),url('/Fonts/Maheni/Maheni-Regular.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:'Otilito';src:url('/Fonts/otilito-sans-font-family-2026-04-07-06-24-36-utc/OTF/TBJOtilito-Regular.otf') format('opentype'),url('/Fonts/otilito-sans-font-family-2026-04-07-06-24-36-utc/TTF/TBJOtilito-Regular.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:'Otilito';src:url('/Fonts/otilito-sans-font-family-2026-04-07-06-24-36-utc/OTF/TBJOtilito-Bold.otf') format('opentype'),url('/Fonts/otilito-sans-font-family-2026-04-07-06-24-36-utc/TTF/TBJOtilito-Bold.ttf') format('truetype');font-weight:700;font-style:normal;font-display:swap}@font-face{font-family:'Qogee';src:url('/Fonts/qogee-font-2026-04-07-06-00-04-utc/Qogee.otf') format('opentype'),url('/Fonts/qogee-font-2026-04-07-06-00-04-utc/Qogee.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:'Matina';src:url('/Fonts/Matina/Font/Matina-Regular.woff2') format('woff2'),url('/Fonts/Matina/Font/Matina-Regular.woff') format('woff'),url('/Fonts/Matina/Font/Matina-Regular.otf') format('opentype');font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:'QuickZip';src:url('/Fonts/News%20Deck/FONT/QUICK-ZIP.woff') format('woff'),url('/Fonts/News%20Deck/FONT/QUICK-ZIP.otf') format('opentype');font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:'GrandHalva';src:url('/Fonts/News%20Deck/GRAND%20HALVA.otf') format('opentype');font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:'CarbonText';src:url('/Fonts/News%20Deck/carbon-modern-typeface-webfonts-2026-04-07-06-00-24-utc/fonts/CarbonText-Regular.woff2') format('woff2'),url('/Fonts/News%20Deck/carbon-modern-typeface-webfonts-2026-04-07-06-00-24-utc/fonts/CarbonText-Regular.woff') format('woff');font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:'Medhorn';src:url('/Fonts/News%20Deck/medhorn-modern-sport-display-bold-slab-serif-2026-04-07-05-58-49-utc/Web-PS/Medhorn.woff2') format('woff2'),url('/Fonts/News%20Deck/medhorn-modern-sport-display-bold-slab-serif-2026-04-07-05-58-49-utc/OpenType-PS/Medhorn.otf') format('opentype');font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:'Eroded';src:url('/Fonts/News%20Deck/eroded-personal-use/ERODED%20PERSONAL%20USE.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:'VintageTypist';src:url('/Fonts/News%20Deck/vintage-typist/VintageTypist.otf') format('opentype');font-weight:700;font-style:normal;font-display:swap}@font-face{font-family:'Bramos';src:url('/Fonts/News%20Deck/bramos/Bramos.otf') format('opentype');font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:'Cheelaved';src:url('/Fonts/News%20Deck/the-cheelaved/TheCheelaved-Regular.otf') format('opentype'),url('/Fonts/News%20Deck/the-cheelaved/TheCheelaved-Regular.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:'RealityStone';src:url('/Fonts/News%20Deck/reality-stone-personal-use/Reality%20Stone.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:'CrownHeritage';src:url('/Fonts/News%20Deck/crown-heritage/CrownHeritage.otf') format('opentype'),url('/Fonts/News%20Deck/crown-heritage/CrownHeritage.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}@keyframes walk{0%,100%{transform:translateX(0)}50%{transform:translateX(8px)}}@keyframes hammer{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-45deg)}}@keyframes sweep{0%,100%{transform:rotate(-15deg)}50%{transform:rotate(15deg)}}@keyframes paint{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes carry{0%,100%{transform:translateY(0) rotate(0deg)}25%{transform:translateY(-3px) rotate(-2deg)}75%{transform:translateY(-3px) rotate(2deg)}}@keyframes figfade{0%{opacity:1}45%{opacity:1}50%{opacity:0}95%{opacity:0}100%{opacity:1}}"}</style>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ ...CP, fontSize: 14, letterSpacing: "0.4em", color: "var(--color-text-primary)", fontWeight: 700, lineHeight: 1.1 }}>L O A T H R</div>
        <div style={{ width: 40, height: 1, background: "var(--color-border-tertiary)", margin: "9px auto" }} />
        <div style={{ ...CP, fontSize: 8, letterSpacing: "0.2em", color: activeSegment === "enterprise" ? "#888888" : activeSegment === "newsdesk" ? "#c41e1e" : "var(--color-text-tertiary)", textTransform: "uppercase", marginTop: 2 }}>Media Maker</div>
      </div>


      {/* Segment tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 12, justifyContent: "center" }}>
        {[
          { id: "editorial", label: "Editorial", color: null },
          { id: "enterprise", label: "Enterprise", color: "#ffffff" },
          { id: "newsdesk", label: "News Desk", color: "#c41e1e" },
        ].map(function(s) {
          var sel = activeSegment === s.id;
          return <button key={s.id} onClick={function() {
            setActiveSegment(s.id);
            if (s.id === "enterprise") { setCategory("enterprise"); }
            else if (s.id === "newsdesk") { setCategory("newsdesk"); }
            else { setCategory(null); }
            setOptions(null); setTrending([]); setSubcat(null); setShuffleKey(0); setRefinedAngles([]); setLockedPersonImages({}); setLockedLocationImages({}); setPreviewLocked({}); lockedRef.current = {}; setPersonsDetected([]); setPersonImages({}); setLocationsDetected([]); setLocationImages({}); setDroppedImage(null); setReverseTopics([]); setEnterpriseForce(null); setEnterpriseSector(null); setNewsFilter(null); setNewsUrgency(null); setNewsDesk(null); setSecondaryCategory(null); setTertiaryCategory(null);
          }}
            style={{ padding: "8px 16px", cursor: "pointer", border: "none", borderBottom: "2px solid " + (sel ? (s.color || uiAccent) : "transparent"), background: sel ? (activeSegment === "enterprise" ? "#ffffff08" : activeSegment === "newsdesk" ? "#c41e1e08" : "transparent") : "transparent", ...CP, fontSize: 9, letterSpacing: "0.12em", color: sel ? (s.color || (category ? (PALETTES[category] || {}).accent : "#666")) : (activeSegment === "enterprise" ? "#666" : "#999"), fontWeight: sel ? 700 : 400, textTransform: "uppercase" }}>{s.label}</button>;
        })}
      </div>

      {/* Editorial category pills — only when Editorial segment is active */}
      {activeSegment === "editorial" && <div style={{ display: "flex", gap: 6, marginBottom: 12, justifyContent: "center", flexWrap: "wrap" }}>
        {EDITORIAL_CATS.map(function(c) {
          var p = PALETTES[c.id]; var sel = category === c.id; var Icon = c.icon;
          return (
            <button key={c.id} onClick={function() { setCategory(c.id); setSecondaryCategory(null); setTertiaryCategory(null); setOptions(null); setTrending([]); setSubcat(null); setShuffleKey(0); setRefinedAngles([]); setLockedPersonImages({}); setLockedLocationImages({}); setPreviewLocked({}); lockedRef.current = {}; setPersonsDetected([]); setPersonImages({}); setLocationsDetected([]); setLocationImages({}); setDroppedImage(null); setReverseTopics([]); }}
              style={{ padding: "6px 10px", cursor: "pointer", border: sel ? "1.5px solid " + (c.id === "photo" ? "#888888" : p.accent) : "0.5px solid var(--color-border-tertiary)", background: sel ? (c.id === "photo" ? "#88888822" : p.accent + "12") : "transparent", display: "flex", alignItems: "center", gap: 4, fontSize: 9, ...CP, color: sel ? (c.id === "photo" ? "#888888" : p.accent) : "var(--color-text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              <Icon size={10} />{c.label}
            </button>);
        })}
      </div>}

      {/* Enterprise mode tabs */}
      {activeSegment === "enterprise" && <div style={{ display: "flex", gap: 0, marginBottom: 8, justifyContent: "center" }}>
        {ENTERPRISE_MODES.map(function(m) {
          var sel = enterpriseMode === m.id;
          return <button key={m.id} onClick={function() { setEnterpriseMode(m.id); setOptions(null); setTrending([]); if (m.id === "tips" && enterpriseForce === "news") setEnterpriseForce(null); }}
            style={{ padding: "5px 12px", border: "none", borderBottom: "1.5px solid " + (sel ? "#ffffff" : "transparent"), background: sel ? "#ffffff08" : "transparent", cursor: "pointer", ...CP, fontSize: 7, letterSpacing: "0.08em", color: sel ? "#ffffff" : "#666", fontWeight: sel ? 700 : 400 }}>{m.label}</button>;
        })}
      </div>}
      {/* Enterprise force + sector selector */}
      {activeSegment === "enterprise" && <div style={{ marginBottom: 10 }}>
        <div style={{ ...CP, fontSize: 5, color: "#666", letterSpacing: "0.12em", marginBottom: 3, textAlign: "center" }}>FORCE</div>
        <div style={{ display: "flex", gap: 3, marginBottom: 6, justifyContent: "center", flexWrap: "wrap" }}>
          {ENTERPRISE_FORCES.filter(function(f) { return enterpriseMode !== "tips" || f.id !== "news"; }).map(function(f) {
            var sel = enterpriseForce === f.id;
            return <button key={f.id} onClick={function() { setEnterpriseForce(sel ? null : f.id); }}
              style={{ padding: "3px 8px", cursor: "pointer", border: sel ? "1px solid #ffffff" : "0.5px solid #444", background: sel ? "#ffffff22" : "transparent", ...CP, fontSize: 7, color: sel ? "#ffffff" : "#888", letterSpacing: "0.03em" }}>{f.label}</button>;
          })}
        </div>
        <div style={{ ...CP, fontSize: 5, color: "#666", letterSpacing: "0.12em", marginBottom: 3, textAlign: "center" }}>SECTOR</div>
        <div style={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          {ENTERPRISE_SECTORS.map(function(s) {
            var sel = enterpriseSector === s.id;
            return <button key={s.id} onClick={function() { setEnterpriseSector(sel ? null : s.id); }}
              style={{ padding: "2px 6px", cursor: "pointer", border: sel ? "1px solid #ffffff" : "0.5px solid #333", background: sel ? "#ffffff15" : "transparent", ...CP, fontSize: 6, color: sel ? "#ffffff" : "#666", letterSpacing: "0.02em" }}>{s.label}</button>;
          })}
        </div>
      </div>}

      {/* News Desk — urgency + desk + region/time */}
      {activeSegment === "newsdesk" && <div style={{ marginBottom: 10 }}>
        {/* Urgency row */}
        <div style={{ display: "flex", gap: 3, marginBottom: 6, justifyContent: "center" }}>
          {NEWSDESK_URGENCY.map(function(u) {
            var sel = newsUrgency === u.id;
            return <button key={u.id} onClick={function() { setNewsUrgency(sel ? null : u.id); setNewsFilter(sel ? null : u.id); }}
              style={{ padding: "3px 10px", cursor: "pointer", border: sel ? "1px solid " + u.color : "0.5px solid #c8c0aa", background: sel ? u.color + "18" : "transparent", ...CP, fontSize: 8, color: sel ? u.color : "#8a8270", letterSpacing: "0.05em", fontWeight: sel ? 700 : 400 }}>{u.label}</button>;
          })}
        </div>
        {/* Desk row */}
        <div style={{ ...CP, fontSize: 5, color: "#8a8270", letterSpacing: "0.12em", marginBottom: 3, textAlign: "center" }}>DESK</div>
        <div style={{ display: "flex", gap: 2, marginBottom: 6, justifyContent: "center", flexWrap: "wrap" }}>
          {NEWSDESK_DESKS.map(function(d) {
            var sel = newsDesk === d.id;
            return <button key={d.id} onClick={function() { setNewsDesk(sel ? null : d.id); if (!sel) setNewsFilter(d.id); else if (!newsUrgency) setNewsFilter(null); }}
              style={{ padding: "2px 7px", cursor: "pointer", border: sel ? "1px solid #1a1a1a" : "0.5px solid #c8c0aa", background: sel ? "#1a1a1a0d" : "transparent", ...CP, fontSize: 6, color: sel ? "#1a1a1a" : "#8a8270", letterSpacing: "0.02em" }}>{d.label}</button>;
          })}
        </div>
        {/* Desk description */}
        {newsDesk && <div style={{ ...CP, fontSize: 5, color: "#8a8270", textAlign: "center", marginBottom: 6, fontStyle: "italic" }}>{(NEWSDESK_DESKS.find(function(d) { return d.id === newsDesk; }) || {}).desc || ""}</div>}
        {/* Region + Time — compact line */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            <select value={newsRegion} onChange={function(e) { setNewsRegion(e.target.value); setNewsCountry(""); }}
              style={{ padding: "2px 4px", border: "0.5px solid #c8c0aa", background: "#ffffff", ...CP, fontSize: 6, color: "#1a1a1a" }}>
              {NEWSDESK_REGIONS.map(function(r) { return <option key={r.id} value={r.id}>{r.label}</option>; })}
            </select>
          </div>
          {(function() { var reg = NEWSDESK_REGIONS.find(function(r) { return r.id === newsRegion; }); return reg && reg.countries && reg.countries.length > 0 ? (
            <select value={newsCountry} onChange={function(e) { setNewsCountry(e.target.value); }}
              style={{ padding: "2px 4px", border: "0.5px solid #c8c0aa", background: "#ffffff", ...CP, fontSize: 6, color: "#1a1a1a" }}>
              <option value="">All {reg.label}</option>
              {reg.countries.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
            </select>
          ) : null; })()}
          {NEWSDESK_TIMEFRAMES.map(function(t) {
            var sel = newsTimeframe === t.id;
            return <button key={t.id} onClick={function() { setNewsTimeframe(t.id); }}
              style={{ padding: "2px 6px", border: "0.5px solid " + (sel ? "#1a1a1a" : "#c8c0aa"), background: sel ? "#1a1a1a11" : "transparent", ...CP, fontSize: 6, color: sel ? "#1a1a1a" : "#8a8270", cursor: "pointer" }}>{t.label}</button>;
          })}
        </div>
      </div>}

      {/* Cross-category lens pickers — Level 3, editorial only */}
      {activeSegment === "editorial" && category && <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", alignItems: "center", marginBottom: secondaryCategory ? 6 : 0 }}>
          <div style={{ ...CP, fontSize: 6, color: "#999", letterSpacing: "0.05em" }}>+LENS</div>
          {CATEGORIES.filter(function(c) { return c.id !== category && c.id !== tertiaryCategory; }).map(function(c) {
            var p = PALETTES[c.id]; var sel = secondaryCategory === c.id;
            return <button key={c.id} onClick={function() { setSecondaryCategory(sel ? null : c.id); if (sel) { setTertiaryCategory(null); } }}
              style={{ padding: "2px 6px", cursor: "pointer", border: sel ? "1.5px solid " + p.accent : "0.5px solid #ddd", background: sel ? p.accent + "15" : "transparent", ...CP, fontSize: 6, color: sel ? p.accent : "#999", borderRadius: 2 }}>{c.label}</button>;
          })}
        </div>
        {secondaryCategory && <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{ ...CP, fontSize: 5, color: PALETTES[secondaryCategory] ? PALETTES[secondaryCategory].accent : "#999" }}>{(CATEGORIES.find(function(c) { return c.id === secondaryCategory; }) || {}).label} slides:</div>
            {[1,2,3,4].map(function(n) { return (
              <button key={n} onClick={function() { setSecondaryCount(n); }}
                style={{ width: 18, height: 18, border: "0.5px solid " + (secondaryCount === n ? (PALETTES[secondaryCategory] ? PALETTES[secondaryCategory].accent : uiAccent) : "#ddd"), background: secondaryCount === n ? (PALETTES[secondaryCategory] ? PALETTES[secondaryCategory].accent + "22" : uiAccent + "22") : "transparent", cursor: "pointer", ...CP, fontSize: 7, color: secondaryCount === n ? (PALETTES[secondaryCategory] ? PALETTES[secondaryCategory].accent : uiAccent) : "#999", borderRadius: 2, textAlign: "center", lineHeight: "18px" }}>{n}</button>
            ); })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ ...CP, fontSize: 6, color: "#999", letterSpacing: "0.05em" }}>+3RD</div>
            {CATEGORIES.filter(function(c) { return c.id !== category && c.id !== secondaryCategory; }).map(function(c) {
              var p = PALETTES[c.id]; var sel = tertiaryCategory === c.id;
              return <button key={c.id} onClick={function() { setTertiaryCategory(sel ? null : c.id); }}
                style={{ padding: "2px 6px", cursor: "pointer", border: sel ? "1.5px solid " + p.accent : "0.5px solid #ddd", background: sel ? p.accent + "15" : "transparent", ...CP, fontSize: 6, color: sel ? p.accent : "#999", borderRadius: 2 }}>{c.label}</button>;
            })}
          </div>
        </div>}
        {tertiaryCategory && <div style={{ display: "flex", gap: 3, justifyContent: "center", alignItems: "center", marginBottom: 4 }}>
          <div style={{ ...CP, fontSize: 5, color: PALETTES[tertiaryCategory] ? PALETTES[tertiaryCategory].accent : "#999" }}>{(CATEGORIES.find(function(c) { return c.id === tertiaryCategory; }) || {}).label} slides:</div>
          {[1,2].map(function(n) { return (
            <button key={n} onClick={function() { setTertiaryCount(n); }}
              style={{ width: 18, height: 18, border: "0.5px solid " + (tertiaryCount === n ? (PALETTES[tertiaryCategory] ? PALETTES[tertiaryCategory].accent : uiAccent) : "#ddd"), background: tertiaryCount === n ? (PALETTES[tertiaryCategory] ? PALETTES[tertiaryCategory].accent + "22" : uiAccent + "22") : "transparent", cursor: "pointer", ...CP, fontSize: 7, color: tertiaryCount === n ? (PALETTES[tertiaryCategory] ? PALETTES[tertiaryCategory].accent : uiAccent) : "#999", borderRadius: 2, textAlign: "center", lineHeight: "18px" }}>{n}</button>
          ); })}
        </div>}
        {secondaryCategory && <div style={{ ...CP, fontSize: 5, color: "#999", textAlign: "center" }}>
          {secondaryCount} {(CATEGORIES.find(function(c) { return c.id === secondaryCategory; }) || {}).label}{tertiaryCategory ? " + " + tertiaryCount + " " + (CATEGORIES.find(function(c) { return c.id === tertiaryCategory; }) || {}).label : ""} slide{(secondaryCount + (tertiaryCategory ? tertiaryCount : 0)) > 1 ? "s" : ""} from other lenses
        </div>}
      </div>}

      {/* Custom Story toggle — Level 2+, editorial only */}
      {activeSegment === "editorial" && category && <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <button onClick={function() { setCustomStoryMode(!customStoryMode); }}
          style={{ padding: "5px 12px", border: "0.5px solid " + (customStoryMode ? uiAccent : "#ccc"), background: customStoryMode ? uiAccent + "15" : "transparent", cursor: "pointer", ...CP, fontSize: 8, color: customStoryMode ? uiAccent : "#999", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 5 }}>
          <Users size={11} />{customStoryMode ? "BACK TO SEARCH" : "CREATE ORIGINAL STORY"}
        </button>
      </div>}

      {/* Custom Story panel */}
      {category && customStoryMode && <div style={{ marginBottom: 16, border: "0.5px solid " + uiAccent, background: "#f8f8f8", padding: 12 }}>
        <div style={{ ...CP, fontSize: 7, color: uiAccent, letterSpacing: "0.1em", marginBottom: 8 }}>ORIGINAL STORY</div>
        <input value={customSubject} onChange={function(e) { setCustomSubject(e.target.value); }}
          placeholder="Subject name (person, brand, event...)"
          style={{ width: "100%", padding: "8px 10px", border: "0.5px solid #ccc", marginBottom: 6, ...CP, fontSize: 10, color: "#333", background: "#fff" }} />
        <input value={customHook} onChange={function(e) { setCustomHook(e.target.value); }}
          placeholder="One-line hook (optional — what makes this story worth telling?)"
          style={{ width: "100%", padding: "8px 10px", border: "0.5px solid #ccc", marginBottom: 6, ...CP, fontSize: 10, color: "#333", background: "#fff" }} />
        <textarea value={customContext} onChange={function(e) { setCustomContext(e.target.value); }}
          placeholder="Paste the full story context here — everything Claude needs to know. Dates, facts, quotes, details. Claude will ONLY use what you write here, nothing from the internet."
          rows={5}
          style={{ width: "100%", padding: "8px 10px", border: "0.5px solid #ccc", marginBottom: 8, ...CP, fontSize: 9, color: "#333", lineHeight: 1.5, resize: "vertical", background: "#fff" }} />

        {/* Image uploads */}
        {/* Creative freedom level */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ ...CP, fontSize: 6, color: "#999", letterSpacing: "0.1em", marginBottom: 4 }}>CREATIVE FREEDOM</div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {[
              { id: "strict", label: "Strict", desc: "Only facts from your context" },
              { id: "editorial", label: "Editorial", desc: "Dramatize + reframe, no new facts" },
              { id: "expanded", label: "Expanded", desc: "Fill gaps with plausible details" },
              { id: "creative", label: "Creative", desc: "Full narrative from your starting point" },
            ].map(function(level) { return (
              <button key={level.id} onClick={function() { setCreativeFreedom(level.id); }}
                style={{ padding: "3px 8px", border: "0.5px solid " + (creativeFreedom === level.id ? uiAccent : "#ccc"), background: creativeFreedom === level.id ? uiAccent + "22" : "transparent", cursor: "pointer", ...CP, fontSize: 6, color: creativeFreedom === level.id ? uiAccent : "#999", borderRadius: 2 }}>{level.label}</button>
            ); })}
          </div>
          <div style={{ ...CP, fontSize: 5, color: "#999", marginTop: 2 }}>
            {creativeFreedom === "strict" ? "Claude uses only what you wrote. Nothing added." :
             creativeFreedom === "editorial" ? "Claude adds voice, metaphors, and framing. No invented facts." :
             creativeFreedom === "expanded" ? "Claude fills gaps with sensory details and cultural context." :
             "Claude builds a full story from your context. Editorial fiction."}
          </div>
        </div>

        {/* Custom voice for original story */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ ...CP, fontSize: 6, color: "#999", letterSpacing: "0.1em", marginBottom: 3 }}>CUSTOM VOICE <span style={{ fontSize: 5, color: "#bbb" }}>(optional)</span></div>
          <input value={editionPicks.customVoice || ""} onChange={function(e) { setEditionPicks(function(p) { return Object.assign({}, p, { customVoice: e.target.value }); }); }}
            placeholder='e.g. "Write like a Lagos food blogger" or "Sound like GQ travel editor"'
            style={{ width: "100%", padding: "4px 8px", border: "0.5px solid #ccc", ...CP, fontSize: 7, color: "#333", background: "#fff" }} />
        </div>

        <div style={{ ...CP, fontSize: 6, color: "#999", letterSpacing: "0.1em", marginBottom: 4 }}>IMAGES ({customImages.length} uploaded{customImages.length === 0 ? " — at least 1 required for cover" : ""})</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {customImages.map(function(ci, i) { return (
            <div key={i} style={{ textAlign: "center", position: "relative" }}>
              <img src={ci.preview} alt="" style={{ width: 60, height: 75, objectFit: "cover", borderRadius: 3, border: "1.5px solid " + uiAccent }} />
              <select value={ci.role} onChange={function(e) { setCustomImages(function(prev) { var n = prev.slice(); n[i] = Object.assign({}, n[i], { role: e.target.value }); return n; }); }}
                style={{ display: "block", width: 60, ...CP, fontSize: 5, color: "#666", border: "0.5px solid #ccc", marginTop: 2, background: "#fff" }}>
                <option value="cover">Cover</option>
                <option value="portrait">Portrait</option>
                <option value="context">Context</option>
                <option value="action">Action</option>
                <option value="detail">Detail</option>
                <option value="background">Background</option>
              </select>
              <button onClick={function() { setCustomImages(function(prev) { return prev.filter(function(_, j) { return j !== i; }); }); }}
                style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: "50%", background: "#e63946", color: "#fff", border: "none", cursor: "pointer", ...CP, fontSize: 8, lineHeight: "14px", textAlign: "center" }}>{"\u2715"}</button>
            </div>
          ); })}
          <label style={{ width: 60, height: 75, border: "1.5px dashed #ccc", borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
            <Camera size={16} style={{ color: "#ccc" }} />
            <div style={{ ...CP, fontSize: 5, color: "#999" }}>Add</div>
            <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={function(e) {
              var files = e.target.files;
              if (!files) return;
              Array.from(files).forEach(function(file) {
                var reader = new FileReader();
                reader.onload = function(ev) {
                  var base64 = ev.target.result.split(",")[1];
                  setCustomImages(function(prev) { return prev.concat([{ preview: ev.target.result, base64: base64, mimeType: file.type, role: prev.length === 0 ? "cover" : "context" }]); });
                };
                reader.readAsDataURL(file);
              });
            }} />
          </label>
        </div>

        {/* Slide count picker for custom story */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
          <div style={{ ...CP, fontSize: 6, color: "#999" }}>Slides:</div>
          <button onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { slideCount: 0 }); }); }}
            style={{ padding: "2px 6px", border: "0.5px solid " + (!editionPicks.slideCount ? uiAccent : "#ccc"), background: !editionPicks.slideCount ? uiAccent + "22" : "transparent", cursor: "pointer", ...CP, fontSize: 6, color: !editionPicks.slideCount ? uiAccent : "#999", borderRadius: 2 }}>Auto</button>
          {[4,5,6,7,8,9,10,11,12].map(function(n) { return (
            <button key={n} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { slideCount: n }); }); }}
              style={{ padding: "2px 5px", border: "0.5px solid " + (editionPicks.slideCount === n ? uiAccent : "#ccc"), background: editionPicks.slideCount === n ? uiAccent + "22" : "transparent", cursor: "pointer", ...CP, fontSize: 6, color: editionPicks.slideCount === n ? uiAccent : "#999", borderRadius: 2, minWidth: 18, textAlign: "center" }}>{n}</button>
          ); })}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={generateCustomStory} disabled={isGenerating || !customSubject.trim() || !customContext.trim() || customImages.length === 0}
            style={{ flex: 1, padding: "10px 14px", background: !customSubject.trim() || !customContext.trim() || customImages.length === 0 ? "#ccc" : uiAccent, color: "#ffffff", border: "none", cursor: !customSubject.trim() || !customContext.trim() || customImages.length === 0 ? "default" : "pointer", ...CP, fontSize: 10, letterSpacing: "0.1em", fontWeight: 700 }}>
            {isGenerating ? "GENERATING..." : "CREATE CAROUSEL"}
          </button>
          {isGenerating && <button onClick={cancelGenerate}
            style={{ padding: "10px 14px", background: "#e63946", color: "#ffffff", border: "none", cursor: "pointer", ...CP, fontSize: 10, letterSpacing: "0.1em", fontWeight: 700 }}>CANCEL</button>}
        </div>
        {customContext.length > 0 && <div style={{ ...CP, fontSize: 5, color: "#999", marginTop: 4 }}>{customContext.split(/\s+/).length} words {"\u00b7"} {editionPicks.slideCount ? editionPicks.slideCount + " slides" : "Auto (4-12 based on content depth)"}</div>}
      </div>}

      {category && !customStoryMode && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}
            onDragOver={function(e) { e.preventDefault(); e.stopPropagation(); }}
            onDrop={function(e) {
              e.preventDefault(); e.stopPropagation();
              var file = e.dataTransfer.files && e.dataTransfer.files[0];
              if (file && file.type.startsWith("image/")) {
                var reader = new FileReader();
                reader.onload = function(ev) {
                  var base64 = ev.target.result.split(",")[1];
                  var preview = ev.target.result;
                  setDroppedImage({ file: file, preview: preview, base64: base64, mimeType: file.type });
                  analyzeDroppedImage(base64, file.type);
                };
                reader.readAsDataURL(file);
              }
            }}>
            <input value={topic} onChange={function(e) { var v = e.target.value; setTopic(v); setRefinedAngles([]); setSuggestions(filterSuggestions(v, category)); setCrossCatSuggestions(searchAllCategories(v, category)); triggerSearch(v); }}
              placeholder={category === "newsdesk" ? "Search keywords: oil, election, LeBron..." : category === "enterprise" ? (function() { var sLabel = enterpriseSector ? (ENTERPRISE_SECTORS.find(function(s) { return s.id === enterpriseSector; }) || {}).label : null; if (enterpriseMode === "news") return sLabel ? "Search " + sLabel + " news..." : "Search business news: tariffs, IPO, merger..."; if (enterpriseMode === "tips") return sLabel ? "Advise " + sLabel + " businesses on..." : "Industry to advise: restaurants, SaaS, retail..."; if (sLabel) return "Topic in " + sLabel + "..."; var hints = { tech: "e.g. Healthcare, Retail, Banking...", policy: "e.g. Pharma, Energy, Cannabis...", ai: "e.g. Legal services, Call centers, Education...", markets: "e.g. Real estate, Crypto, Commodities...", culture: "e.g. Luxury brands, Fast food, Streaming..." }; return hints[enterpriseForce] || "Industry or topic to analyze..."; })() : "Topic for " + cat.label + "... (or drop an image)"}
              style={{ flex: 1, padding: "10px 14px", border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : activeSegment === "newsdesk" ? "#c8c0aa" : "var(--color-border-tertiary)"), background: activeSegment === "enterprise" ? "#1a1a1a" : activeSegment === "newsdesk" ? "#ffffff" : "var(--color-background-primary)", color: activeSegment === "enterprise" ? "#eeeeee" : activeSegment === "newsdesk" ? "#1a1a1a" : "var(--color-text-primary)", fontSize: 12, ...CP }} />
            {topic && <button onClick={function() { setTopic(""); setOptions(null); setSmartAngles([]); setWebResults([]); setViralScore(null); setTrending([]); setSuggestions([]); setCrossCatSuggestions([]); setRefinedAngles([]); }}
              style={{ padding: "10px 6px", border: "none", background: "transparent", cursor: "pointer", ...CP, fontSize: 12, color: activeSegment === "enterprise" ? "#666" : "#999", display: "flex", alignItems: "center" }}>{"\u2715"}</button>}
            <label style={{ padding: "10px 8px", border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : activeSegment === "newsdesk" ? "#c8c0aa" : "var(--color-border-tertiary)"), cursor: "pointer", display: "flex", alignItems: "center", background: "transparent" }}>
              <Camera size={14} style={{ color: "#999" }} />
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={function(e) {
                var file = e.target.files && e.target.files[0];
                if (file) {
                  var reader = new FileReader();
                  reader.onload = function(ev) {
                    var base64 = ev.target.result.split(",")[1];
                    setDroppedImage({ file: file, preview: ev.target.result, base64: base64, mimeType: file.type });
                    analyzeDroppedImage(base64, file.type);
                  };
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
            {!isGenerating ? (
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={function() { setIsRecMode(false); generate(); }} disabled={!topic.trim()}
                  style={{ padding: "10px 14px", background: uiAccent, color: "#ffffff", border: "none", cursor: topic.trim() ? "pointer" : "default", ...CP, fontSize: 9, letterSpacing: "0.1em", fontWeight: 700, opacity: topic.trim() ? 1 : 0.4 }}>
                  {category === "enterprise" ? (enterpriseMode === "news" ? "SEARCH" : enterpriseMode === "tips" ? "BUILD" : "ANALYZE") : category === "newsdesk" ? "SEARCH" : "GENERATE"}
                </button>
              </div>
            ) : (
              <button onClick={cancelGenerate}
                style={{ padding: "10px 18px", background: "#e63946", color: "#ffffff", border: "none", cursor: "pointer", ...CP, fontSize: 10, letterSpacing: "0.1em", fontWeight: 700 }}>
                CANCEL
              </button>
            )}
          </div>
          {/* Type-ahead suggestions */}
          {suggestions.length > 0 && <div style={{ marginBottom: 6, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", padding: 4 }}>
            {suggestions.map(function(s, i) { return (
              <div key={i} onClick={function() { setTopic(s); setSuggestions([]); setCrossCatSuggestions([]); }}
                style={{ padding: "4px 8px", cursor: "pointer", ...CP, fontSize: 9, color: "var(--color-text-secondary)", borderBottom: i < suggestions.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none" }}>{s}</div>
            ); })}
          </div>}

          {/* Cross-category suggestions */}
          {crossCatSuggestions.length > 0 && <div style={{ marginBottom: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
            <span style={{ ...CP, fontSize: 7, color: "var(--color-text-tertiary)" }}>Also in:</span>
            {crossCatSuggestions.map(function(x, i) { return (
              <button key={i} onClick={function() { setCategory(x.category); setTopic(x.topic); setSuggestions([]); setCrossCatSuggestions([]); }}
                style={{ padding: "2px 6px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: "var(--color-text-tertiary)" }}>{x.topic} <span style={{ color: uiAccent, fontSize: 6 }}>({x.category})</span></button>
            ); })}
          </div>}

          {/* Multi-person image picker — Level 3 */}
          {personsDetected.length > 0 && <div style={{ marginBottom: 6, border: "0.5px solid " + uiAccent, background: "#f8f8f8", padding: 8 }}>
            <div style={{ ...CP, fontSize: 6, color: uiAccent, letterSpacing: "0.1em", marginBottom: 4 }}>PEOPLE DETECTED</div>
            {personsDetected.map(function(name) {
              var imgs = personImages[name] || [];
              var locked = lockedPersonImages[name];
              var loading = !personImages.hasOwnProperty(name);
              return <div key={name} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  <div style={{ ...CP, fontSize: 7, color: uiAccent, letterSpacing: "0.1em", flex: 1 }}>{"\uD83D\uDC64"} {name.toUpperCase()}{locked ? " \u2713" : ""}{loading ? " ..." : imgs.length === 0 && !locked ? " (no images)" : ""}</div>
                  {!locked && <input placeholder="Search different name..." onKeyDown={function(e) { if (e.key === "Enter" && e.target.value.trim()) {
                    var altName = e.target.value.trim();
                    searchPersonImages(altName).then(function(altImgs) {
                      setPersonImages(function(prev) { var n = Object.assign({}, prev); n[name] = altImgs; return n; });
                    });
                    e.target.value = "";
                  }}} style={{ width: 120, padding: "2px 6px", border: "0.5px solid #ccc", ...CP, fontSize: 6, color: "#666" }} />}
                </div>
                {!locked && imgs.length > 0 && <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                  {imgs.map(function(img, i) { return (
                    <div key={i} style={{ textAlign: "center" }}>
                      <div onClick={function() { setLockedPersonImages(function(prev) { var n = Object.assign({}, prev); n[name] = { img: img, placement: "claude" }; return n; }); }}
                        style={{ width: 72, height: 90, overflow: "hidden", cursor: "pointer", border: "2px solid transparent", borderRadius: 4, transition: "border 0.2s" }}
                        onMouseEnter={function(e) { e.currentTarget.style.borderColor = uiAccent; }}
                        onMouseLeave={function(e) { e.currentTarget.style.borderColor = "transparent"; }}>
                        <img src={img.thumb || img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { e.target.style.display = "none"; }} />
                      </div>
                      <div style={{ ...CP, fontSize: 5, color: "#999" }}>{img.source}</div>
                    </div>
                  ); })}
                </div>}
                {locked && <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <img src={locked.img.thumb || locked.img.url} alt="" style={{ width: 36, height: 45, borderRadius: 3, objectFit: "cover", border: "1px solid " + uiAccent }} />
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    <button onClick={function() { setLockedPersonImages(function(prev) { var n = Object.assign({}, prev); n[name] = { img: locked.img, placement: "cover" }; return n; }); }}
                      style={{ padding: "3px 8px", border: "0.5px solid #ccc", background: locked.placement === "cover" ? uiAccent + "22" : "transparent", cursor: "pointer", ...CP, fontSize: 7, color: locked.placement === "cover" ? uiAccent : "#999", fontWeight: locked.placement === "cover" ? 700 : 400 }}>Cover</button>
                    <button onClick={function() { setLockedPersonImages(function(prev) { var n = Object.assign({}, prev); n[name] = { img: locked.img, placement: "claude" }; return n; }); }}
                      style={{ padding: "3px 8px", border: "0.5px solid #ccc", background: locked.placement === "claude" ? uiAccent + "22" : "transparent", cursor: "pointer", ...CP, fontSize: 7, color: locked.placement === "claude" ? uiAccent : "#999", fontWeight: locked.placement === "claude" ? 700 : 400 }}>Claude picks</button>
                    <button onClick={function() { setLockedPersonImages(function(prev) { var n = Object.assign({}, prev); delete n[name]; return n; }); }}
                      style={{ padding: "3px 8px", background: "none", border: "0.5px solid #eee", cursor: "pointer", ...CP, fontSize: 7, color: "#999" }}>Change</button>
                  </div>
                </div>}
              </div>;
            })}
            <button onClick={function() { setPersonsDetected([]); setPersonImages({}); setLockedPersonImages({}); }}
              style={{ width: "100%", background: "none", border: "0.5px solid #ccc", cursor: "pointer", ...CP, fontSize: 7, color: "#999", padding: "3px 0" }}>Skip all</button>
          </div>}

          {/* Person network — Level 3 */}
          {Object.keys(personNetwork).length > 0 && <div style={{ marginBottom: 6, border: "0.5px solid " + uiAccent + "44", background: "#f8f8f8", padding: 8 }}>
            <div style={{ ...CP, fontSize: 6, color: uiAccent, letterSpacing: "0.1em", marginBottom: 4 }}>CONNECTED PEOPLE</div>
            {Object.keys(personNetwork).map(function(sourceName) {
              var network = personNetwork[sourceName] || [];
              if (network.length === 0) return null;
              return <div key={sourceName} style={{ marginBottom: 4 }}>
                <div style={{ ...CP, fontSize: 6, color: "#999", marginBottom: 3 }}>via {sourceName}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {network.map(function(rel, ri) { return (
                    <div key={ri} style={{ textAlign: "center", cursor: "pointer" }} onClick={function() {
                      if (rel.img) {
                        setPersonsDetected(function(prev) { return prev.indexOf(rel.name) === -1 ? prev.concat([rel.name]) : prev; });
                        setPersonImages(function(prev) { var n = Object.assign({}, prev); n[rel.name] = [rel.img]; return n; });
                      } else { setTopic(rel.name); }
                    }}>
                      {rel.img ? <img src={rel.img.thumb || rel.img.url} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "1px solid " + uiAccent + "44" }} onError={function(e) { e.target.style.display = "none"; }} />
                        : <div style={{ width: 32, height: 32, borderRadius: "50%", background: uiAccent + "15", display: "flex", alignItems: "center", justifyContent: "center", ...CP, fontSize: 10, color: uiAccent }}>{rel.name.charAt(0)}</div>}
                      <div style={{ ...CP, fontSize: 5, color: "#666", maxWidth: 48, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rel.name.split(" ")[0]}</div>
                      <div style={{ ...CP, fontSize: 4, color: uiAccent + "88" }}>{rel.relation}</div>
                    </div>
                  ); })}
                </div>
              </div>;
            })}
          </div>}

          {/* Location image picker — Level 3 */}
          {locationsDetected.length > 0 && <div style={{ marginBottom: 6, border: "0.5px solid " + uiAccent + "66", background: "#f8f8f8", padding: 8 }}>
            <div style={{ ...CP, fontSize: 6, color: uiAccent, letterSpacing: "0.1em", marginBottom: 4 }}>LOCATIONS DETECTED</div>
            {locationsDetected.map(function(place) {
              var imgs = locationImages[place] || [];
              var locked = lockedLocationImages[place];
              var loading = !locationImages.hasOwnProperty(place);
              return <div key={place} style={{ marginBottom: 4 }}>
                <div style={{ ...CP, fontSize: 7, color: uiAccent, letterSpacing: "0.1em", marginBottom: 3 }}>{"\uD83D\uDCCD"} {place.toUpperCase()}{locked ? " \u2713" : ""}{loading ? " ..." : ""}</div>
                {!locked && imgs.length > 0 && <div style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                  {imgs.map(function(img, i) { return (
                    <div key={i} onClick={function() { setLockedLocationImages(function(prev) { var n = Object.assign({}, prev); n[place] = { img: img, placement: "auto" }; return n; }); }}
                      style={{ width: 56, height: 42, overflow: "hidden", cursor: "pointer", border: "2px solid transparent", borderRadius: 3 }}>
                      <img src={img.thumb || img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { e.target.style.display = "none"; }} />
                    </div>
                  ); })}
                </div>}
                {locked && <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <img src={locked.img.thumb || locked.img.url} alt="" style={{ width: 20, height: 15, borderRadius: 2, objectFit: "cover" }} />
                  <button onClick={function() { setLockedLocationImages(function(prev) { var n = Object.assign({}, prev); n[place] = { img: locked.img, placement: "cover" }; return n; }); }}
                    style={{ padding: "2px 5px", border: "0.5px solid #ccc", background: locked.placement === "cover" ? uiAccent + "22" : "transparent", cursor: "pointer", ...CP, fontSize: 6, color: locked.placement === "cover" ? uiAccent : "#999" }}>Cover</button>
                  <button onClick={function() { setLockedLocationImages(function(prev) { var n = Object.assign({}, prev); delete n[place]; return n; }); }}
                    style={{ background: "none", border: "none", cursor: "pointer", ...CP, fontSize: 7, color: "#999" }}>{"\u2715"}</button>
                </div>}
              </div>;
            })}
          </div>}

          {/* Topic preview images — only show after Smart Angles has context */}
          {topic.trim() && (smartAngles.length > 0 || personsDetected.length > 0 || locationsDetected.length > 0) && <div style={{ marginBottom: 6, textAlign: "center" }}>
            <button onClick={function() { if (previewImages.length > 0) { setPreviewImages([]); } else { fetchPreviewImages(topic); } }}
              disabled={previewLoading}
              style={{ padding: "4px 10px", border: "0.5px solid " + uiAccent + "44", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: uiAccent, letterSpacing: "0.05em" }}>
              <Eye size={9} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />{previewLoading ? "Loading..." : previewImages.length > 0 ? "Hide Preview" : "Preview Images"}
            </button>
          </div>}
          {previewImages.length > 0 && <div style={{ marginBottom: 6, border: "0.5px solid " + uiAccent + "33", background: "#f8f8f8", padding: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ ...CP, fontSize: 6, color: uiAccent, letterSpacing: "0.1em" }}>MOOD BOARD</div>
              <button onClick={function() { fetchPreviewImages(topic); }}
                style={{ background: "none", border: "none", cursor: "pointer", ...CP, fontSize: 6, color: "#999" }}>{"\u21BB"} Refresh</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
              {previewImages.map(function(img, i) {
                var roles = ["cover", "origin", "evidence", "hotTake", "closer"];
                var roleLabels = ["Cover", "Origin", "Stats", "Hot Take", "Closer"];
                var lockedRole = null;
                Object.keys(previewLocked).forEach(function(role) { if (previewLocked[role] && previewLocked[role].url === img.url) lockedRole = role; });
                // Apply hover style filter for live preview
                var previewFilter = hoverStyle && IMAGE_STYLE_PRESETS[hoverStyle] && IMAGE_STYLE_PRESETS[hoverStyle].filters ? IMAGE_STYLE_PRESETS[hoverStyle].filters[0] : "";
                return <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ width: "100%", aspectRatio: "4/5", overflow: "hidden", borderRadius: 3, border: lockedRole ? "2px solid " + uiAccent : "1px solid #ddd", position: "relative" }}>
                    <img src={img.thumb || img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: previewFilter, transition: "filter 0.3s" }} onError={function(e) { e.target.style.display = "none"; }} />
                    {lockedRole && <div style={{ position: "absolute", top: 2, right: 2, background: uiAccent, color: "#fff", ...CP, fontSize: 5, padding: "1px 3px", borderRadius: 2 }}>{lockedRole}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 1, justifyContent: "center", marginTop: 2, flexWrap: "wrap" }}>
                    {roles.map(function(role, ri) { return (
                      <button key={role} onClick={function() {
                        setPreviewLocked(function(prev) {
                          var n = Object.assign({}, prev);
                          if (n[role] && n[role].url === img.url) { delete n[role]; } else { n[role] = img; }
                          return n;
                        });
                      }}
                        style={{ padding: "1px 3px", border: "none", background: lockedRole === role ? uiAccent : "#eee", color: lockedRole === role ? "#fff" : "#999", cursor: "pointer", ...CP, fontSize: 4, borderRadius: 1 }}>{roleLabels[ri]}</button>
                    ); })}
                  </div>
                  <div style={{ ...CP, fontSize: 4, color: "#999", marginTop: 1 }}>{img.source}</div>
                </div>;
              })}
            </div>
            {Object.keys(previewLocked).length > 0 && <div style={{ marginTop: 4, ...CP, fontSize: 6, color: uiAccent }}>
              {Object.keys(previewLocked).length} image{Object.keys(previewLocked).length > 1 ? "s" : ""} locked
              <button onClick={function() { setPreviewLocked({}); }} style={{ background: "none", border: "none", cursor: "pointer", ...CP, fontSize: 6, color: "#999", marginLeft: 6 }}>Clear all</button>
            </div>}
          </div>}

          {/* Uploaded image — use as cover + topic suggestions */}
          {droppedImage && <div style={{ marginBottom: 6, border: "0.5px solid " + uiAccent, background: "#f8f8f8", padding: 8 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
              <img src={droppedImage.preview} alt="" style={{ width: 56, height: 70, objectFit: "cover", borderRadius: 3, border: "1px solid " + uiAccent + "44" }} />
              <div style={{ flex: 1 }}>
                <div style={{ ...CP, fontSize: 6, color: uiAccent, letterSpacing: "0.1em", marginBottom: 4 }}>UPLOADED IMAGE {reverseLoading && <span style={{ animation: "pulse 1s infinite" }}>...</span>}</div>
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 3 }}>
                  <button onClick={function() {
                    var uploadImg = { url: droppedImage.preview, thumb: droppedImage.preview, alt: "Uploaded", credit: "User", source: "Upload" };
                    setPreviewLocked(function(prev) { return Object.assign({}, prev, { cover: uploadImg }); });
                  }}
                    style={{ padding: "3px 8px", border: "0.5px solid " + uiAccent, background: previewLocked.cover && previewLocked.cover.source === "Upload" ? uiAccent + "22" : "transparent", cursor: "pointer", ...CP, fontSize: 7, color: uiAccent, fontWeight: previewLocked.cover && previewLocked.cover.source === "Upload" ? 700 : 400 }}>
                    {previewLocked.cover && previewLocked.cover.source === "Upload" ? "\u2713 Cover" : "Use as Cover"}</button>
                  <button onClick={function() { setDroppedImage(null); setReverseTopics([]); setPreviewLocked(function(prev) { var n = Object.assign({}, prev); if (n.cover && n.cover.source === "Upload") delete n.cover; return n; }); }}
                    style={{ padding: "3px 8px", border: "0.5px solid #ccc", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: "#999" }}>Remove</button>
                </div>
              </div>
            </div>
            {reverseTopics.length > 0 && <div style={{ borderTop: "0.5px solid #eee", paddingTop: 4 }}>
              <div style={{ ...CP, fontSize: 5, color: "#999", marginBottom: 3 }}>SUGGESTED TOPICS</div>
              {reverseTopics.map(function(rt, i) { return (
                <div key={i} onClick={function() { setTopic(rt.topic); }}
                  style={{ padding: "3px 0", cursor: "pointer", borderBottom: i < reverseTopics.length - 1 ? "0.5px solid #eee" : "none" }}>
                  <div style={{ ...CP, fontSize: 9, color: "#333" }}>{rt.topic}</div>
                  <div style={{ ...CP, fontSize: 6, color: "#999" }}>{rt.hook}</div>
                </div>
              ); })}
            </div>}
          </div>}

          {/* Smart angles + web trends (merged) */}
          {(smartAngles.length > 0 || webResults.length > 0 || isSearching) && <div style={{ marginBottom: 6, border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : activeSegment === "newsdesk" ? "#c8c0aa" : "var(--color-border-tertiary)"), background: activeSegment === "enterprise" ? "#111" : activeSegment === "newsdesk" ? "#ebe6d6" : "var(--color-background-secondary)", padding: 6 }}>
            <div style={{ ...CP, fontSize: 6, color: uiAccent, letterSpacing: "0.1em", marginBottom: 4 }}>ANGLES {isSearching && <span style={{ animation: "pulse 1s infinite" }}>...</span>}</div>
            {smartAngles.map(function(a, i) { return (
              <div key={"a" + i} onClick={function() { setTopic(a.topic); setSmartAngles([]); setWebResults([]); setSuggestions([]); }}
                style={{ padding: "4px 0", cursor: "pointer", borderBottom: "0.5px solid " + (activeSegment === "enterprise" ? "#333" : activeSegment === "newsdesk" ? "#c8c0aa44" : "var(--color-border-tertiary)") }}>
                <div style={{ ...CP, fontSize: 9, color: activeSegment === "enterprise" ? "#ddd" : activeSegment === "newsdesk" ? "#1a1a1a" : "var(--color-text-primary)" }}>{a.topic}</div>
                <div style={{ ...CP, fontSize: 6, color: activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "var(--color-text-tertiary)", marginTop: 1 }}>{a.hook}</div>
              </div>
            ); })}
            {webResults.length > 0 && smartAngles.length > 0 && <div style={{ height: 0.5, background: uiAccent + "33", margin: "4px 0" }} />}
            {webResults.map(function(w, i) { return (
              <div key={"w" + i} onClick={function() { setTopic(w.topic); setSmartAngles([]); setWebResults([]); setSuggestions([]); }}
                style={{ padding: "4px 0", cursor: "pointer", borderBottom: i < webResults.length - 1 ? "0.5px solid " + (activeSegment === "enterprise" ? "#333" : activeSegment === "newsdesk" ? "#c8c0aa44" : "var(--color-border-tertiary)") : "none" }}>
                <div style={{ ...CP, fontSize: 9, color: activeSegment === "enterprise" ? "#ddd" : activeSegment === "newsdesk" ? "#1a1a1a" : "var(--color-text-primary)" }}>{w.topic}</div>
                <div style={{ ...CP, fontSize: 6, color: activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "var(--color-text-tertiary)", marginTop: 1 }}>{w.hook} {w.source && <span style={{ color: uiAccent + "66" }}>{w.source}</span>}</div>
              </div>
            ); })}
          </div>}


          {/* Viral potential — Claude analysis */}
          {(viralScore || viralLoading) && <div style={{ marginBottom: 6, textAlign: "center" }}>
            {viralLoading && <div style={{ ...CP, fontSize: 6, color: activeSegment === "enterprise" ? "#666" : activeSegment === "newsdesk" ? "#8a8270" : "#999", animation: "pulse 1s infinite" }}>Analyzing potential...</div>}
            {viralScore && <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 2 }}>
                <div style={{ ...CP, fontSize: 7, color: activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "#999" }}>Viral Potential:</div>
                <div style={{ ...FN, fontSize: 12, color: viralScore.score >= 7 ? "#22c55e" : viralScore.score >= 4 ? uiAccent : "#ef4444", fontWeight: 700 }}>{viralScore.score}/10</div>
                {[1,2,3,4,5,6,7,8,9,10].map(function(n) { return <div key={n} style={{ width: 3, height: 8, background: n <= viralScore.score ? (viralScore.score >= 7 ? "#22c55e" : viralScore.score >= 4 ? uiAccent : "#ef4444") : (activeSegment === "enterprise" ? "#333" : "#ddd"), borderRadius: 1 }} />; })}
              </div>
              {viralScore.reason && <div style={{ ...CP, fontSize: 6, color: activeSegment === "enterprise" ? "#999" : activeSegment === "newsdesk" ? "#1a1a1a88" : "#666" }}>{viralScore.reason}</div>}
              {viralScore.tip && <div style={{ ...CP, fontSize: 5, color: viralScore.score >= 7 ? "#22c55e88" : uiAccent + "88", marginTop: 1 }}>{"\u2728"} {viralScore.tip}</div>}
            </div>}
          </div>}
          {topic.trim() && topicHistory.some(function(h) { return typeof h === "string" ? h === topic : h.topic === topic; }) && <div style={{ ...CP, fontSize: 6, color: uiAccent, textAlign: "center", marginBottom: 4 }}>previously generated</div>}

          {/* Recent topics */}
          {recentTopics.length > 0 && !topic.trim() && <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 6, justifyContent: "center" }}>
            <span style={{ ...CP, fontSize: 7, color: "var(--color-text-tertiary)" }}>Recent:</span>
            {recentTopics.filter(function(r) { return !category || r.category === category; }).slice(0, 5).map(function(r, i) { return (
              <button key={i} onClick={function() { setTopic(r.topic); if (r.category) setCategory(r.category); }}
                style={{ padding: "2px 6px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: "var(--color-text-tertiary)" }}>{r.topic}</button>
            ); })}
          </div>}

          {/* Timely — category-aware */}
          {!topic.trim() && category && SEASONAL_TOPICS[category] && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6, justifyContent: "center", alignItems: "center" }}>
            <span style={{ ...CP, fontSize: 7, color: "var(--color-text-tertiary)" }}>Timely:</span>
            <button onClick={function() { setTopic(SEASONAL_TOPICS[category][new Date().getMonth()]); }}
              style={{ padding: "3px 8px", border: "0.5px solid " + uiAccent + "44", background: uiAccent + "08", cursor: "pointer", ...CP, fontSize: 8, color: uiAccent }}>
              <Flame size={8} style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }} />{SEASONAL_TOPICS[category][new Date().getMonth()]}
            </button>
          </div>}

          {/* Past Generations */}
          {topicHistory.length > 0 && <div style={{ marginBottom: 6, textAlign: "center" }}>
            <button onClick={function() { setShowPastGen(!showPastGen); }}
              style={{ background: "none", border: "none", cursor: "pointer", ...CP, fontSize: 8, color: "var(--color-text-tertiary)", letterSpacing: "0.1em", opacity: 0.6 }}>
              {showPastGen ? "\u25B2 HIDE PAST GENERATIONS" : "\u25BC PAST GENERATIONS (" + topicHistory.length + ")"}
            </button>
            {showPastGen && <div style={{ marginTop: 6, padding: 8, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", maxHeight: 200, overflowY: "auto" }}>
              {topicHistory.map(function(h, i) {
                var t = typeof h === "string" ? h : h.topic;
                var c = typeof h === "string" ? null : h.category;
                var d = typeof h === "string" ? null : h.date;
                var hasSaved = typeof h !== "string" && h.slides && h.slides.length > 0;
                var catLabel = c ? (CATEGORIES.find(function(x) { return x.id === c; }) || {}).label : null;
                return <div key={i} style={{ padding: "5px 0", borderBottom: i < topicHistory.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div onClick={function() { setTopic(t); if (c) setCategory(c); setShowPastGen(false); }} style={{ cursor: "pointer", flex: 1 }}>
                    <div style={{ ...CP, fontSize: 9, color: "var(--color-text-primary)" }}>{t}</div>
                    {catLabel && <div style={{ ...CP, fontSize: 6, color: uiAccent + "88" }}>{catLabel}{d ? " · " + d : ""}{hasSaved ? " · " + h.slides.length + " slides saved" : ""}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {hasSaved && <button onClick={function(e) { e.stopPropagation(); if (c) setCategory(c); setTopic(t); setOptions([{ angle: "Saved", slides: h.slides }]); setCurrentSlide(0); setSelectedOption(0); setIsRecMode(false); setShowPastGen(false); }}
                      style={{ padding: "2px 6px", border: "0.5px solid " + uiAccent, background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: uiAccent }}>View</button>}
                    <button onClick={function(e) { e.stopPropagation(); setTopic(t); if (c) setCategory(c); setShowPastGen(false); }}
                      style={{ padding: "2px 6px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: "var(--color-text-tertiary)" }}>Redo</button>
                  </div>
                </div>;
              })}
              <button onClick={function() { localStorage.removeItem("loathr_history"); setTopicHistory([]); setShowPastGen(false); }}
                style={{ marginTop: 6, background: "none", border: "0.5px solid var(--color-border-tertiary)", cursor: "pointer", ...CP, fontSize: 7, color: "var(--color-text-tertiary)", padding: "3px 8px", width: "100%" }}>Clear history</button>
            </div>}
          </div>}

          {/* Edition Settings — Level 2+ */}
          {<div>
          <div style={{ marginBottom: 6, textAlign: "center" }}>
            <button onClick={function() { setShowEditionSettings(!showEditionSettings); }}
              style={{ background: "none", border: "none", cursor: "pointer", ...CP, fontSize: 8, color: "var(--color-text-tertiary)", letterSpacing: "0.1em", opacity: 0.6 }}>
              {showEditionSettings ? "\u25B2 HIDE EDITION SETTINGS" : "\u25BC EDITION SETTINGS"}
            </button>
          </div>
          {showEditionSettings && <div style={{ marginBottom: 10, padding: 10, border: "0.5px solid " + (activeSegment === "enterprise" ? "#333" : activeSegment === "newsdesk" ? "#c8c0aa" : "var(--color-border-tertiary)"), background: activeSegment === "enterprise" ? "#111" : activeSegment === "newsdesk" ? "#ebe6d6" : "#fafafa" }}>
            {/* Enterprise settings */}
            {activeSegment === "enterprise" && <div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ ...CP, fontSize: 6, color: "#888", letterSpacing: "0.1em", marginBottom: 3 }}>DEPTH</div>
                <div style={{ display: "flex", gap: 3 }}>
                  {ENTERPRISE_DEPTHS.map(function(d) { var sel = editionPicks.enterpriseDepth === d.id; return (
                    <button key={d.id} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { enterpriseDepth: d.id }); }); }}
                      style={{ padding: "3px 8px", border: "0.5px solid " + (sel ? "#fff" : "#444"), background: sel ? "#ffffff22" : "transparent", cursor: "pointer", ...CP, fontSize: 6, color: sel ? "#fff" : "#888" }}>{d.label}</button>
                  ); })}
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ ...CP, fontSize: 6, color: "#888", letterSpacing: "0.1em", marginBottom: 3 }}>TONE</div>
                <div style={{ display: "flex", gap: 3 }}>
                  {ENTERPRISE_TONES.map(function(t) { var sel = editionPicks.enterpriseTone === t.id; return (
                    <button key={t.id} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { enterpriseTone: t.id }); }); }}
                      style={{ padding: "3px 8px", border: "0.5px solid " + (sel ? "#fff" : "#444"), background: sel ? "#ffffff22" : "transparent", cursor: "pointer", ...CP, fontSize: 6, color: sel ? "#fff" : "#888" }}>{t.label}</button>
                  ); })}
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ ...CP, fontSize: 6, color: "#888", letterSpacing: "0.1em", marginBottom: 3 }}>FOCUS</div>
                <div style={{ display: "flex", gap: 3 }}>
                  {ENTERPRISE_FOCUS.map(function(f) { var sel = editionPicks.enterpriseFocus === f.id; return (
                    <button key={f.id} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { enterpriseFocus: f.id }); }); }}
                      style={{ padding: "3px 8px", border: "0.5px solid " + (sel ? "#fff" : "#444"), background: sel ? "#ffffff22" : "transparent", cursor: "pointer", ...CP, fontSize: 6, color: sel ? "#fff" : "#888" }}>{f.label}</button>
                  ); })}
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ ...CP, fontSize: 6, color: "#888", letterSpacing: "0.1em", marginBottom: 3 }}>CUSTOM VOICE</div>
                <input value={editionPicks.customVoice || ""} onChange={function(e) { setEditionPicks(function(p) { return Object.assign({}, p, { customVoice: e.target.value }); }); }}
                  placeholder='"Write like Bloomberg" or "McKinsey briefing style"'
                  style={{ width: "100%", padding: "4px 8px", border: "0.5px solid #444", ...CP, fontSize: 7, color: "#ddd", background: "#1a1a1a" }} />
              </div>
              <div>
                <div style={{ ...CP, fontSize: 6, color: "#888", letterSpacing: "0.1em", marginBottom: 3 }}>IMAGE FILTER</div>
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  {ENTERPRISE_IMG_FILTERS.map(function(f) { var sel = (editionPicks.enterpriseImgFilter || "none") === f.id; return (
                    <button key={f.id} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { enterpriseImgFilter: f.id }); }); setGlobalImgFilter(f.id); }}
                      style={{ padding: "3px 8px", border: "0.5px solid " + (sel ? "#fff" : "#444"), background: sel ? "#ffffff22" : "transparent", cursor: "pointer", ...CP, fontSize: 6, color: sel ? "#fff" : "#888" }}>{f.label}</button>
                  ); })}
                </div>
              </div>
            </div>}
            {/* News Desk settings */}
            {activeSegment === "newsdesk" && <div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ ...CP, fontSize: 6, color: "#8a8270", letterSpacing: "0.1em", marginBottom: 3 }}>ANGLE</div>
                <div style={{ display: "flex", gap: 3 }}>
                  {NEWSDESK_ANGLES.map(function(a) { var sel = editionPicks.newsdeskAngle === a.id; return (
                    <button key={a.id} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { newsdeskAngle: a.id }); }); }}
                      style={{ padding: "3px 8px", border: "0.5px solid " + (sel ? "#1a1a1a" : "#c8c0aa"), background: sel ? "#1a1a1a11" : "transparent", cursor: "pointer", ...CP, fontSize: 6, color: sel ? "#1a1a1a" : "#8a8270" }}>{a.label}</button>
                  ); })}
                </div>
              </div>
              <div>
                <div style={{ ...CP, fontSize: 6, color: "#8a8270", letterSpacing: "0.1em", marginBottom: 3 }}>EMPHASIS</div>
                <div style={{ display: "flex", gap: 3 }}>
                  {NEWSDESK_EMPHASIS.map(function(e) { var sel = editionPicks.newsdeskEmphasis === e.id; return (
                    <button key={e.id} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { newsdeskEmphasis: e.id }); }); }}
                      style={{ padding: "3px 8px", border: "0.5px solid " + (sel ? "#1a1a1a" : "#c8c0aa"), background: sel ? "#1a1a1a11" : "transparent", cursor: "pointer", ...CP, fontSize: 6, color: sel ? "#1a1a1a" : "#8a8270" }}>{e.label}</button>
                  ); })}
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ ...CP, fontSize: 6, color: "#8a8270", letterSpacing: "0.1em", marginBottom: 3 }}>SLIDES</div>
                <div style={{ display: "flex", gap: 3 }}>
                  <button onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { slideCount: 0 }); }); }}
                    style={{ padding: "3px 6px", border: "0.5px solid " + (!editionPicks.slideCount ? "#1a1a1a" : "#c8c0aa"), background: !editionPicks.slideCount ? "#1a1a1a11" : "transparent", cursor: "pointer", ...CP, fontSize: 6, color: !editionPicks.slideCount ? "#1a1a1a" : "#8a8270" }}>Auto</button>
                  {[5,6,7,8,10].map(function(n) { return (
                    <button key={n} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { slideCount: n }); }); }}
                      style={{ padding: "3px 6px", border: "0.5px solid " + (editionPicks.slideCount === n ? "#1a1a1a" : "#c8c0aa"), background: editionPicks.slideCount === n ? "#1a1a1a11" : "transparent", cursor: "pointer", ...CP, fontSize: 6, color: editionPicks.slideCount === n ? "#1a1a1a" : "#8a8270" }}>{n}</button>
                  ); })}
                </div>
              </div>
            </div>}
            {/* Editorial settings — original */}
            {activeSegment === "editorial" && <div>
            {/* Presets — one-click curated combos */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ ...CP, fontSize: 7, color: uiAccent, letterSpacing: "0.1em", marginBottom: 4 }}>PRESETS</div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {EDITION_PRESETS.map(function(preset) { return (
                  <button key={preset.id} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, preset.settings, { imageStyle: p.imageStyle, slideCount: p.slideCount, customVoice: p.customVoice }); }); }}
                    style={{ padding: "3px 8px", border: "0.5px solid " + uiAccent + "44", background: "transparent", cursor: "pointer", ...CP, fontSize: 6, color: "#666" }}>
                    <span style={{ color: uiAccent, fontWeight: 700 }}>{preset.label}</span>
                    <span style={{ display: "block", fontSize: 4, color: "#999", marginTop: 1 }}>{preset.desc}</span>
                  </button>
                ); })}
              </div>
            </div>
            <div style={{ height: 1, background: "#eee", margin: "8px 0" }} />
            {/* Voice */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ ...CP, fontSize: 7, color: "#999", letterSpacing: "0.1em", marginBottom: 4 }}>VOICE</div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <button onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { persona: -1 }); }); }}
                  style={{ padding: "3px 8px", border: "0.5px solid #ddd", background: editionPicks.persona === -1 ? uiAccent + "22" : "transparent", color: editionPicks.persona === -1 ? uiAccent : "#999", cursor: "pointer", ...CP, fontSize: 6 }}>Random</button>
                {PERSONAS.map(function(per, i) { return (
                  <button key={per.id} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { persona: i }); }); }}
                    title={per.desc}
                    style={{ padding: "3px 8px", border: "0.5px solid #ddd", background: editionPicks.persona === i ? uiAccent + "22" : "transparent", color: editionPicks.persona === i ? uiAccent : "#999", cursor: "pointer", ...CP, fontSize: 6 }}>{per.label}</button>
                ); })}
              </div>
              {editionPicks.persona >= 0 && PERSONAS[editionPicks.persona] && <div style={{ ...CP, fontSize: 5, color: uiAccent + "88", marginTop: 2, fontStyle: "italic" }}>{PERSONAS[editionPicks.persona].desc}</div>}
            </div>
            {/* Angle */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ ...CP, fontSize: 7, color: "#999", letterSpacing: "0.1em", marginBottom: 4 }}>ANGLE</div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <button onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { angle: -1 }); }); }}
                  style={{ padding: "3px 8px", border: "0.5px solid #ddd", background: editionPicks.angle === -1 ? uiAccent + "22" : "transparent", color: editionPicks.angle === -1 ? uiAccent : "#999", cursor: "pointer", ...CP, fontSize: 6 }}>Random</button>
                {FRESHNESS_SEEDS.map(function(seed, i) { return (
                  <button key={seed.id} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { angle: i }); }); }}
                    title={seed.desc}
                    style={{ padding: "3px 8px", border: "0.5px solid #ddd", background: editionPicks.angle === i ? uiAccent + "22" : "transparent", color: editionPicks.angle === i ? uiAccent : "#999", cursor: "pointer", ...CP, fontSize: 6 }}>{seed.label}</button>
                ); })}
              </div>
              {editionPicks.angle >= 0 && FRESHNESS_SEEDS[editionPicks.angle] && <div style={{ ...CP, fontSize: 5, color: "#999", marginTop: 2 }}>{FRESHNESS_SEEDS[editionPicks.angle].desc}</div>}
            </div>
            {/* Style */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ ...CP, fontSize: 7, color: "#999", letterSpacing: "0.1em", marginBottom: 4 }}>STYLE</div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <button onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { style: -1 }); }); }}
                  style={{ padding: "3px 8px", border: "0.5px solid #ddd", background: editionPicks.style === -1 ? uiAccent + "22" : "transparent", color: editionPicks.style === -1 ? uiAccent : "#999", cursor: "pointer", ...CP, fontSize: 6 }}>Random</button>
                {WRITING_STYLES.map(function(ws, i) { return (
                  <button key={ws.id} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { style: i }); }); }}
                    title={ws.desc}
                    style={{ padding: "3px 8px", border: "0.5px solid #ddd", background: editionPicks.style === i ? uiAccent + "22" : "transparent", color: editionPicks.style === i ? uiAccent : "#999", cursor: "pointer", ...CP, fontSize: 6 }}>{ws.label}</button>
                ); })}
              </div>
              {editionPicks.style >= 0 && WRITING_STYLES[editionPicks.style] && <div style={{ ...CP, fontSize: 5, color: "#999", marginTop: 2 }}>{WRITING_STYLES[editionPicks.style].desc}</div>}
            </div>
            {/* Tone */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ ...CP, fontSize: 7, color: "#999", letterSpacing: "0.1em", marginBottom: 4 }}>TONE</div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {TONES.map(function(t) { return (
                  <button key={t.id} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { tone: t.id }); }); }}
                    style={{ padding: "3px 8px", border: "0.5px solid #ddd", background: editionPicks.tone === t.id ? uiAccent + "22" : "transparent", color: editionPicks.tone === t.id ? uiAccent : "#999", cursor: "pointer", ...CP, fontSize: 6 }}>{t.label}</button>
                ); })}
              </div>
              {editionPicks.tone && TONES.find(function(t) { return t.id === editionPicks.tone; }) && <div style={{ ...CP, fontSize: 5, color: "#999", marginTop: 2 }}>{TONES.find(function(t) { return t.id === editionPicks.tone; }).desc}</div>}
            </div>
            {/* Custom Voice */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ ...CP, fontSize: 7, color: "#999", letterSpacing: "0.1em", marginBottom: 4 }}>CUSTOM VOICE <span style={{ fontSize: 5, color: "#bbb" }}>(optional — overrides voice preset)</span></div>
              <input value={editionPicks.customVoice || ""} onChange={function(e) { setEditionPicks(function(p) { return Object.assign({}, p, { customVoice: e.target.value }); }); }}
                placeholder='e.g. "Write like a Lagos music blogger" or "Sound like a Brooklyn barber telling stories"'
                style={{ width: "100%", padding: "4px 8px", border: "0.5px solid #ddd", ...CP, fontSize: 7, color: "#333", background: "#fff" }} />
            </div>
            <div style={{ height: 1, background: "#eee", margin: "8px 0" }} />
            {/* Image Style */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ ...CP, fontSize: 7, color: "#999", letterSpacing: "0.1em", marginBottom: 4 }}>IMAGE STYLE</div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {Object.keys(IMAGE_STYLE_PRESETS).map(function(key) { var preset = IMAGE_STYLE_PRESETS[key]; return (
                  <button key={key}
                    onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { imageStyle: key }); }); setHoverStyle(null); }}
                    onMouseEnter={function() { setHoverStyle(key); }}
                    onMouseLeave={function() { setHoverStyle(null); }}
                    style={{ padding: "3px 8px", border: "0.5px solid #ddd", background: editionPicks.imageStyle === key ? uiAccent + "22" : "transparent", color: editionPicks.imageStyle === key ? uiAccent : "#999", cursor: "pointer", ...CP, fontSize: 6 }}>{preset.label}</button>
                ); })}
              </div>
            </div>
            {/* Slides */}
            <div>
              <div style={{ ...CP, fontSize: 7, color: "#999", letterSpacing: "0.1em", marginBottom: 4 }}>SLIDES</div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <button onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { slideCount: 0 }); }); }}
                  style={{ padding: "3px 8px", border: "0.5px solid #ddd", background: !editionPicks.slideCount ? uiAccent + "22" : "transparent", color: !editionPicks.slideCount ? uiAccent : "#999", cursor: "pointer", ...CP, fontSize: 6 }}>Auto</button>
                {[4,5,6,7,8,9,10,11,12].map(function(n) { return (
                  <button key={n} onClick={function() { setEditionPicks(function(p) { return Object.assign({}, p, { slideCount: n }); }); }}
                    style={{ padding: "3px 8px", border: "0.5px solid #ddd", background: editionPicks.slideCount === n ? uiAccent + "22" : "transparent", color: editionPicks.slideCount === n ? uiAccent : "#999", cursor: "pointer", ...CP, fontSize: 6, minWidth: 22, textAlign: "center" }}>{n}</button>
                ); })}
              </div>
              <div style={{ ...CP, fontSize: 5, color: "#999", marginTop: 2 }}>
                {!editionPicks.slideCount ? "Claude decides based on topic depth" : editionPicks.slideCount <= 5 ? "Quick — cover + key points + closer" : editionPicks.slideCount <= 8 ? "Standard — full editorial structure" : "Deep — all optional roles included"}
              </div>
            </div>
          </div>}
          </div>}
          </div>}

          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10 }}>
            <button onClick={isFetchingTrending ? cancelTrending : fetchTrending}
              style={{ padding: "6px 10px", border: "0.5px solid " + (activeSegment === "enterprise" ? (isFetchingTrending || trending.length > 0 ? "#ffffff" : "#555") : activeSegment === "newsdesk" ? (isFetchingTrending ? "#c41e1e" : "#c8c0aa") : isFetchingTrending ? "#e63946" : "var(--color-border-tertiary)"), background: activeSegment === "enterprise" ? (isFetchingTrending ? "#ffffff11" : trending.length > 0 ? "#ffffff08" : "transparent") : isFetchingTrending ? "#e6394611" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, ...CP, fontSize: 9, color: activeSegment === "enterprise" ? (isFetchingTrending || trending.length > 0 ? "#ffffff" : "#aaa") : activeSegment === "newsdesk" ? (isFetchingTrending ? "#c41e1e" : "#8a8270") : isFetchingTrending ? "#e63946" : "var(--color-text-tertiary)" }}>
              <Flame size={11} />{isFetchingTrending ? "Stop" : activeSegment === "newsdesk" ? "Top Stories" + (newsDesk ? " \u00b7 " + (NEWSDESK_DESKS.find(function(d) { return d.id === newsDesk; }) || {}).label : "") : activeSegment === "enterprise" ? (enterpriseMode === "news" ? "Breaking" : enterpriseMode === "tips" ? "Ideas" : "Trending") + (enterpriseForce ? " \u00b7 " + (ENTERPRISE_FORCES.find(function(f) { return f.id === enterpriseForce; }) || {}).label : "") + (enterpriseSector ? " \u00b7 " + (ENTERPRISE_SECTORS.find(function(s) { return s.id === enterpriseSector; }) || {}).label : "") : "Trending"}</button>
            {activeSegment === "editorial" && <button onClick={function() { setShuffleKey(function(k) { return k + 1; }); }}
              style={{ padding: "6px 10px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, ...CP, fontSize: 9, color: "var(--color-text-tertiary)" }}><Shuffle size={11} />Shuffle</button>}
            {activeSegment === "editorial" && <button onClick={surpriseMe}
              style={{ padding: "6px 10px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, ...CP, fontSize: 9, color: "var(--color-text-tertiary)" }}><Zap size={11} />Surprise</button>}
            {topic.trim() && <button onClick={refineTopic} disabled={isRefining}
              style={{ padding: "6px 10px", border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : activeSegment === "newsdesk" ? "#c8c0aa" : "var(--color-border-tertiary)"), background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, ...CP, fontSize: 9, color: activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "var(--color-text-tertiary)" }}>
              <Sparkles size={11} />{isRefining ? "..." : "Refine"}</button>}
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
          {trending.length > 0 && <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <button onClick={function() { setTrending([]); }}
                style={{ padding: "4px 10px", border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : activeSegment === "newsdesk" ? "#c8c0aa" : "var(--color-border-tertiary)"), background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, ...CP, fontSize: 8, color: activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "var(--color-text-tertiary)" }}>
                {"\u2190"} Back
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {trending.map(function(t, i) { return (
                <button key={i} onClick={function() { setTopic(t.topic); setRefinedAngles([]); setTrending([]); }}
                  style={{ padding: "6px 10px", border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : activeSegment === "newsdesk" ? "#c8c0aa" : uiAccent + "44"), background: activeSegment === "enterprise" ? "#ffffff08" : activeSegment === "newsdesk" ? "#1a1a1a06" : uiAccent + "08", cursor: "pointer", ...CP, fontSize: 9, textAlign: "left", color: activeSegment === "enterprise" ? "#ddd" : activeSegment === "newsdesk" ? "#1a1a1a" : uiAccent }}>
                  <div style={{ fontWeight: 700 }}>{t.topic}</div>
                  <div style={{ fontSize: 6, color: activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : uiAccent + "88", marginTop: 1 }}>{t.hook}{t.source ? " — " + t.source : ""}</div>
                </button>); })}
            </div>
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
          {/* Enterprise preset topics — show when no trending results */}
          {trending.length === 0 && category === "enterprise" && <div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
              {(enterpriseSector && ENTERPRISE_TOPICS[enterpriseSector] ? ENTERPRISE_TOPICS[enterpriseSector] : ENTERPRISE_GENERAL_TOPICS).map(function(t) { return (
                <button key={t} onClick={function() { setTopic(t); setRefinedAngles([]); }}
                  style={{ padding: "5px 10px", cursor: "pointer", fontSize: 9, border: "0.5px solid " + (topic === t ? "#ffffff" : "#333"), background: topic === t ? "#ffffff15" : "transparent", color: topic === t ? "#ffffff" : "#888", ...CP }}>{t}</button>); })}
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

      {cur && <div style={{ marginBottom: 18, textAlign: "center" }}>
        {editionData && <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
          <div style={{ ...CP, fontSize: 6, color: "#999", letterSpacing: "0.08em" }}>ISSUE {editionData.num} {"\u00b7"} {editionData.label}</div>
          <div style={{ ...CP, fontSize: 6, color: uiAccent, letterSpacing: "0.08em" }}>{editionData.voice} {"\u00b7"} {editionData.angle} {"\u00b7"} {editionData.style}{secondaryCategory ? " \u00b7 +" + secondaryCount + " " + (CATEGORIES.find(function(c) { return c.id === secondaryCategory; }) || {}).label : ""}{tertiaryCategory ? " \u00b7 +" + tertiaryCount + " " + (CATEGORIES.find(function(c) { return c.id === tertiaryCategory; }) || {}).label : ""}</div>
        </div>}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 4 }}>
          <div style={{ ...CP, fontSize: 10, letterSpacing: "0.15em", color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>Slide {currentSlide + 1} / {total}</div>
          <div style={{ display: "flex", gap: 3 }}>
            {/* Save single slide — optimized for iPhone (long-press to save) */}
            <button onClick={async function() {
              if (exportStatus) return;
              setExportStatus("Rendering...");
              try {
                await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
                var canvas = await renderSlideToCanvas(slideRef, currentSlide, setCurrentSlide);
                if (canvas) {
                  var blob = await new Promise(function(r) { canvas.toBlob(r, "image/jpeg", 0.92); });
                  var blobUrl = URL.createObjectURL(blob);
                  var a = document.createElement("a"); a.href = blobUrl; a.download = "LOATHR-slide-" + (currentSlide + 1) + ".jpg"; a.click();
                  URL.revokeObjectURL(blobUrl);
                }
                setExportStatus("Saved!");
              } catch (e) { setExportStatus("Failed"); }
              setTimeout(function() { setExportStatus(null); }, 1500);
            }} disabled={!!exportStatus}
              style={{ padding: "6px 8px", border: "1px solid " + uiAccent, background: "transparent", cursor: exportStatus ? "default" : "pointer", ...CP, fontSize: 8, color: uiAccent, opacity: exportStatus ? 0.5 : 1 }}>
              {"\u2B07"} SAVE
            </button>
            {/* Export all — JPEG (smaller, iPhone optimized) */}
            <button onClick={function() { exportSlides(cur.slides, category, slideRef, setCurrentSlide, setExportStatus, "jpeg"); }} disabled={!!exportStatus}
              style={{ padding: "6px 8px", border: "1px solid " + uiAccent, background: uiAccent + "15", cursor: exportStatus ? "default" : "pointer", ...CP, fontSize: 8, color: uiAccent, opacity: exportStatus ? 0.5 : 1 }}>
              <Archive size={9} /> {exportStatus || "ALL JPG"}
            </button>
            {/* Export all — PNG (lossless, larger files) */}
            <button onClick={function() { exportSlides(cur.slides, category, slideRef, setCurrentSlide, setExportStatus, "png"); }} disabled={!!exportStatus}
              style={{ padding: "6px 8px", border: "0.5px solid #ccc", background: "transparent", cursor: exportStatus ? "default" : "pointer", ...CP, fontSize: 8, color: "#999", opacity: exportStatus ? 0.5 : 1 }}>
              ALL PNG
            </button>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div ref={slideRef} style={{ border: "1.5px solid #000000", display: "inline-block", boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ width: 340, height: 425, overflow: "hidden", border: "4px solid #ffffff" }}>
              <div data-export-target="true" style={{ width: "100%", height: "100%", border: "1px solid #000000", overflow: "hidden" }}>
            {isRecMode ? <RecSlideRenderer category={category} slideData={(cur.slides[currentSlide] || {})} slideIndex={currentSlide} totalSlides={total} images={images} /> : <SlideRenderer category={category} slideData={(cur.slides[currentSlide] || {})} slideIndex={currentSlide} totalSlides={total} images={images} edition={editionData} />}
            </div>
          </div>
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
        {/* Image swap controls */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
          <button onClick={function() {
            if (swapSlide === currentSlide) { setSwapSlide(null); setSwapImages([]); setSwapQuery(""); }
            else { setSwapSlide(currentSlide); var slideData = cur.slides[currentSlide] || {}; var q = slideData.heading || slideData.title || topic; setSwapQuery(q); fetchSwapImages(currentSlide, q); }
          }}
            style={{ padding: "4px 10px", border: "0.5px solid " + (swapSlide === currentSlide ? uiAccent : "#ccc"), background: swapSlide === currentSlide ? uiAccent + "15" : "transparent", cursor: "pointer", ...CP, fontSize: 7, color: swapSlide === currentSlide ? uiAccent : "#999", letterSpacing: "0.05em" }}>
            <Camera size={9} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />{swapSlide === currentSlide ? "Cancel Swap" : "Swap Image"}
          </button>
        </div>
        {swapSlide !== null && swapSlide === currentSlide && <div style={{ marginTop: 8, border: "0.5px solid " + uiAccent + "44", background: "#f8f8f8", padding: 8, borderRadius: 3 }}>
          {/* Mosaic panel selector — choose which panel to swap */}
          {_mosaicSlides[currentSlide] && <div style={{ marginBottom: 6 }}>
            <div style={{ ...CP, fontSize: 6, color: "#999", marginBottom: 3 }}>SWAP TARGET</div>
            <div style={{ display: "flex", gap: 3 }}>
              <button onClick={function() { setSwapPanel(-1); }}
                style={{ padding: "2px 6px", border: "0.5px solid " + (swapPanel === -1 ? uiAccent : "#ccc"), background: swapPanel === -1 ? uiAccent + "22" : "transparent", cursor: "pointer", ...CP, fontSize: 6, color: swapPanel === -1 ? uiAccent : "#999" }}>Full Slide</button>
              {_mosaicSlides[currentSlide].map(function(_, pi) { return (
                <button key={pi} onClick={function() { setSwapPanel(pi); }}
                  style={{ padding: "2px 6px", border: "0.5px solid " + (swapPanel === pi ? uiAccent : "#ccc"), background: swapPanel === pi ? uiAccent + "22" : "transparent", cursor: "pointer", ...CP, fontSize: 6, color: swapPanel === pi ? uiAccent : "#999" }}>Panel {pi + 1}</button>
              ); })}
            </div>
          </div>}
          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
            <input value={swapQuery} onChange={function(e) { setSwapQuery(e.target.value); }}
              onKeyDown={function(e) { if (e.key === "Enter") fetchSwapImages(swapSlide, swapQuery); }}
              placeholder="Search for replacement image..."
              style={{ flex: 1, padding: "4px 8px", border: "0.5px solid #ccc", ...CP, fontSize: 8, color: "#333" }} />
            <button onClick={function() { fetchSwapImages(swapSlide, swapQuery); }}
              disabled={swapLoading}
              style={{ padding: "4px 8px", border: "0.5px solid " + uiAccent, background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: uiAccent }}>{swapLoading ? "..." : "Search"}</button>
          </div>
          {swapImages.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
            {swapImages.map(function(img, i) { return (
              <div key={i} onClick={function() { applySwap(swapSlide, img, swapPanel); }}
                style={{ cursor: "pointer", borderRadius: 3, overflow: "hidden", border: "2px solid transparent", transition: "border 0.2s", aspectRatio: "4/5" }}
                onMouseEnter={function(e) { e.currentTarget.style.borderColor = uiAccent; }}
                onMouseLeave={function(e) { e.currentTarget.style.borderColor = "transparent"; }}>
                <img src={img.thumb || img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={function(e) { e.target.style.display = "none"; }} />
              </div>
            ); })}
          </div>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            {swapImages.length > 0 && <div style={{ ...CP, fontSize: 5, color: "#999" }}>Click an image to replace slide {swapSlide + 1}</div>}
            <label style={{ padding: "3px 8px", border: "0.5px solid " + uiAccent, cursor: "pointer", ...CP, fontSize: 7, color: uiAccent, display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Camera size={9} />Upload
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={function(e) {
                var file = e.target.files && e.target.files[0];
                if (file) {
                  var reader = new FileReader();
                  reader.onload = function(ev) {
                    applySwap(swapSlide, { url: ev.target.result, thumb: ev.target.result, alt: "Uploaded", credit: "User", source: "Upload" }, swapPanel);
                  };
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
          </div>
          {!swapLoading && swapImages.length === 0 && swapQuery && <div style={{ ...CP, fontSize: 7, color: "#999", textAlign: "center", padding: 8 }}>No results. Try a different search or upload.</div>}
        </div>}

        {/* Actions — elevated above filmstrip */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          <button onClick={function() { toggleFavorite(topic, category); }}
            style={{ padding: "4px 10px", border: "0.5px solid " + (isFavorited(topic, category) ? uiAccent : "#ccc"), background: isFavorited(topic, category) ? uiAccent + "22" : "transparent", cursor: "pointer", ...CP, fontSize: 7, color: isFavorited(topic, category) ? uiAccent : "#999" }}>
            {isFavorited(topic, category) ? "\u2605 Saved" : "\u2606 Save"}</button>
          <button onClick={generateShareLink}
            style={{ padding: "4px 10px", border: "0.5px solid #ccc", background: shareLink ? uiAccent + "15" : "transparent", cursor: "pointer", ...CP, fontSize: 7, color: shareLink ? uiAccent : "#999" }}>
            {shareLink ? "\u2713 Copied" : "\u21E7 Share"}</button>
          <button onClick={factCheck} disabled={factCheckLoading}
            style={{ padding: "4px 10px", border: "0.5px solid #ccc", background: factCheckResult ? (factCheckResult.score >= 7 ? "#22c55e22" : "#ef444422") : "transparent", cursor: "pointer", ...CP, fontSize: 7, color: factCheckResult ? (factCheckResult.score >= 7 ? "#22c55e" : "#ef4444") : "#999" }}>
            {factCheckLoading ? "Checking..." : factCheckResult ? factCheckResult.score + "/10" : "\u2713 Fact Check"}</button>
          <button onClick={function() { setEditMode(!editMode); setEditField(null); }}
            style={{ padding: "4px 10px", border: "0.5px solid " + (editMode ? uiAccent : "#ccc"), background: editMode ? uiAccent + "22" : "transparent", cursor: "pointer", ...CP, fontSize: 7, color: editMode ? uiAccent : "#999" }}>
            {editMode ? "\u2713 Done Editing" : "\u270E Edit"}</button>
          <button onClick={function() { generate(); }}
            style={{ padding: "4px 10px", border: "0.5px solid " + uiAccent, background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: uiAccent }}>
            {"\u21BB"} Regenerate</button>
        </div>
        {/* Editor panel — slide editing controls */}
        {editMode && cur && (function() {
          var s = cur.slides[currentSlide] || {};
          var isContent = currentSlide > 0 && currentSlide < total - 1;
          var isCover = currentSlide === 0;
          var isCloser = currentSlide === total - 1;
          var fields = [];
          if (isCover) { fields = [["title", s.title], ["subtitle", s.subtitle], ["titleHighlight", s.titleHighlight]]; }
          else if (isCloser) { fields = [["hashtags", s.hashtags], ["funnyLine", s.funnyLine], ["disclaimer", s.disclaimer]]; }
          else if (s.quote) { fields = [["quote", s.quote], ["source", s.source]]; }
          else if (s.stat) { fields = [["heading", s.heading], ["stat", s.stat], ["caption", s.caption || s.statLabel || s.body]]; }
          else { fields = [["heading", s.heading], ["body", s.body]]; }
          // Highlight as separate section (not mixed with body fields)
          var hasHighlight = !isCover && !isCloser && !s.quote && !s.stat && s.highlight !== undefined;
          return <div style={{ marginTop: 6, border: "0.5px solid " + uiAccent + "44", background: "#f8f8f8", padding: 8, borderRadius: 3 }}>
            {/* Section tabs — CONTENT = text + style merged */}
            <div style={{ display: "flex", gap: 0, marginBottom: 6 }}>
              {["content", "layout", "slide"].map(function(sec) {
                var labels = { content: "CONTENT", layout: "LAYOUT", slide: "SLIDE" };
                return <button key={sec} onClick={function() { setEditSection(sec); }}
                  style={{ flex: 1, padding: "4px 0", border: "none", borderBottom: "2px solid " + (editSection === sec ? uiAccent : "transparent"), background: editSection === sec ? uiAccent + "08" : "transparent", cursor: "pointer", ...CP, fontSize: 6, color: editSection === sec ? uiAccent : "#999", letterSpacing: "0.08em" }}>{labels[sec]}</button>;
              })}
            </div>

            {/* === CONTENT (text + style merged) === */}
            {editSection === "content" && <div>
              {/* Text editing */}
              {editField ? <div style={{ marginBottom: 4 }}>
                {editField.field === "body" || editField.field === "context" || editField.field === "quote" ? (
                  <textarea value={editValue} onChange={function(e) { setEditValue(e.target.value); }}
                    rows={3} style={{ width: "100%", padding: "4px 8px", border: "0.5px solid " + uiAccent, ...CP, fontSize: 8, color: "#333", resize: "vertical", background: "#fff" }} />
                ) : (
                  <input value={editValue} onChange={function(e) { setEditValue(e.target.value); }}
                    style={{ width: "100%", padding: "4px 8px", border: "0.5px solid " + uiAccent, ...CP, fontSize: 8, color: "#333", background: "#fff" }} />
                )}
                <div style={{ display: "flex", gap: 3, marginTop: 2 }}>
                  <button onClick={commitEdit} style={{ padding: "2px 8px", background: uiAccent, color: "#fff", border: "none", cursor: "pointer", ...CP, fontSize: 6 }}>Apply</button>
                  <button onClick={function() { setEditField(null); }} style={{ padding: "2px 8px", background: "transparent", border: "0.5px solid #ccc", cursor: "pointer", ...CP, fontSize: 6, color: "#999" }}>Cancel</button>
                </div>
              </div> : null}
              <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 3 }}>
                {fields.map(function(f) { return f[1] !== undefined ? (
                  <button key={f[0]} onClick={function() { startEdit(currentSlide, f[0], f[1] || ""); }}
                    style={{ padding: "2px 6px", border: "0.5px solid #ddd", background: editField && editField.field === f[0] ? uiAccent + "22" : "#fff", cursor: "pointer", ...CP, fontSize: 6, color: "#666", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ color: uiAccent }}>{f[0]}</span>: {f[1] ? String(f[1]).slice(0, 25) : "(empty)"}
                  </button>
                ) : null; })}
              </div>
              {/* Highlight / Insight — separate from body */}
              {hasHighlight && <div style={{ marginBottom: 3 }}>
                <div style={{ ...CP, fontSize: 4, color: uiAccent + "88", marginBottom: 2 }}>INSIGHT</div>
                <input value={s.highlight || ""} onChange={function(e) { updateSlideField(currentSlide, "highlight", e.target.value); }}
                  style={{ width: "100%", padding: "3px 6px", border: "0.5px solid " + uiAccent + "44", ...CP, fontSize: 7, color: "#333", background: "#fff", fontStyle: "italic" }}
                  placeholder="Key insight or takeaway..." />
              </div>}
              {/* Cover layout + photo controls */}
              {isCover && <div style={{ marginBottom: 3, borderTop: "0.5px solid #eee", paddingTop: 3 }}>
                {/* Enterprise cover layouts */}
                {activeSegment === "enterprise" && <div style={{ marginBottom: 4 }}>
                  <div style={{ ...CP, fontSize: 4, color: "#888", marginBottom: 2 }}>COVER LAYOUT</div>
                  <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {ENTERPRISE_COVER_LABELS.map(function(label, li) {
                      var sel = (s.enterpriseCoverLayout || 0) === li;
                      return <button key={li} onClick={function() { updateSlideField(currentSlide, "enterpriseCoverLayout", li); }}
                        style={{ padding: "2px 5px", border: "0.5px solid " + (sel ? "#fff" : "#444"), background: sel ? "#ffffff22" : "transparent", cursor: "pointer", ...CP, fontSize: 5, color: sel ? "#fff" : "#888" }}>{label}</button>;
                    })}
                  </div>
                </div>}
                {/* Split ratio for cover */}
                {activeSegment === "enterprise" && (s.enterpriseCoverLayout === 0 || s.enterpriseCoverLayout === 2 || s.enterpriseCoverLayout === 4 || !s.enterpriseCoverLayout) && <div style={{ display: "flex", gap: 3, alignItems: "center", marginBottom: 3 }}>
                  <div style={{ ...CP, fontSize: 5, color: "#888" }}>Split:</div>
                  <button onClick={function() { updateSlideField(currentSlide, "enterpriseSplit", Math.max(20, (s.enterpriseSplit || 30) - 5)); }}
                    style={{ width: 16, height: 16, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#888", textAlign: "center", lineHeight: "16px" }}>{"\u2190"}</button>
                  <div style={{ ...CP, fontSize: 6, color: "#ccc", minWidth: 30, textAlign: "center" }}>{s.enterpriseSplit || 30}%</div>
                  <button onClick={function() { updateSlideField(currentSlide, "enterpriseSplit", Math.min(70, (s.enterpriseSplit || 30) + 5)); }}
                    style={{ width: 16, height: 16, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#888", textAlign: "center", lineHeight: "16px" }}>{"\u2192"}</button>
                  {s.enterpriseSplit && <button onClick={function() { updateSlideField(currentSlide, "enterpriseSplit", null); }}
                    style={{ padding: "1px 4px", border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 4, color: "#666" }}>Reset</button>}
                </div>}
                {/* Text offset for cover */}
                {activeSegment === "enterprise" && <div style={{ display: "flex", gap: 3, alignItems: "center", marginBottom: 3 }}>
                  <div style={{ ...CP, fontSize: 5, color: "#888" }}>Text:</div>
                  <button onClick={function() { var o = s.enterpriseTextOffset || { top: 0, left: 0 }; updateSlideField(currentSlide, "enterpriseTextOffset", { top: o.top - 10, left: o.left }); }}
                    style={{ width: 16, height: 16, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#888", textAlign: "center", lineHeight: "16px" }}>{"\u2191"}</button>
                  <button onClick={function() { var o = s.enterpriseTextOffset || { top: 0, left: 0 }; updateSlideField(currentSlide, "enterpriseTextOffset", { top: o.top + 10, left: o.left }); }}
                    style={{ width: 16, height: 16, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#888", textAlign: "center", lineHeight: "16px" }}>{"\u2193"}</button>
                  <button onClick={function() { var o = s.enterpriseTextOffset || { top: 0, left: 0 }; updateSlideField(currentSlide, "enterpriseTextOffset", { top: o.top, left: o.left - 10 }); }}
                    style={{ width: 16, height: 16, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#888", textAlign: "center", lineHeight: "16px" }}>{"\u2190"}</button>
                  <button onClick={function() { var o = s.enterpriseTextOffset || { top: 0, left: 0 }; updateSlideField(currentSlide, "enterpriseTextOffset", { top: o.top, left: o.left + 10 }); }}
                    style={{ width: 16, height: 16, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#888", textAlign: "center", lineHeight: "16px" }}>{"\u2192"}</button>
                </div>}
              </div>}
              {/* Font size */}
              {isContent && <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 4 }}>
                <div style={{ ...CP, fontSize: 5, color: "#999" }}>Size:</div>
                <button onClick={function() { adjustFontSize(currentSlide, "heading", -1); }} style={{ width: 14, height: 14, border: "0.5px solid #ddd", background: "#fff", cursor: "pointer", ...CP, fontSize: 7, color: "#666", textAlign: "center", lineHeight: "14px" }}>-</button>
                <div style={{ ...CP, fontSize: 5, color: "#666" }}>H{(s.headingSize || 0) > 0 ? "+" : ""}{s.headingSize || 0}</div>
                <button onClick={function() { adjustFontSize(currentSlide, "heading", 1); }} style={{ width: 14, height: 14, border: "0.5px solid #ddd", background: "#fff", cursor: "pointer", ...CP, fontSize: 7, color: "#666", textAlign: "center", lineHeight: "14px" }}>+</button>
                <div style={{ width: 1, height: 10, background: "#ddd" }} />
                <button onClick={function() { adjustFontSize(currentSlide, "body", -1); }} style={{ width: 14, height: 14, border: "0.5px solid #ddd", background: "#fff", cursor: "pointer", ...CP, fontSize: 7, color: "#666", textAlign: "center", lineHeight: "14px" }}>-</button>
                <div style={{ ...CP, fontSize: 5, color: "#666" }}>B{(s.bodySize || 0) > 0 ? "+" : ""}{s.bodySize || 0}</div>
                <button onClick={function() { adjustFontSize(currentSlide, "body", 1); }} style={{ width: 14, height: 14, border: "0.5px solid #ddd", background: "#fff", cursor: "pointer", ...CP, fontSize: 7, color: "#666", textAlign: "center", lineHeight: "14px" }}>+</button>
              </div>}
              {/* Element movement — all segments */}
              {isContent && <div style={{ borderTop: "0.5px solid #eee", paddingTop: 4 }}>
                {/* Position preset — Editorial only */}
                {activeSegment === "editorial" && <div style={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap", marginBottom: 3 }}>
                  <button onClick={function() { cycleTextPosition(currentSlide); }}
                    style={{ padding: "2px 6px", border: "0.5px solid #ddd", background: "#fff", cursor: "pointer", ...CP, fontSize: 6, color: "#666" }}>
                    {"\u2B12"} {s.textPosition || "auto"}</button>
                  {s.customPosition && <button onClick={function() { resetNudge(currentSlide, "all"); }}
                    style={{ padding: "2px 5px", border: "0.5px solid #ef444444", background: "#fff", cursor: "pointer", ...CP, fontSize: 5, color: "#ef4444" }}>Reset</button>}
                </div>}
                {/* Nudge controls — all segments */}
                <div style={{ display: "flex", gap: 2, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                  <div style={{ ...CP, fontSize: 5, color: "#999" }}>Move:</div>
                  {["all", "heading", "body", "highlight"].map(function(t) { return (
                    <button key={t} onClick={function() { setNudgeTarget(t); }}
                      style={{ padding: "1px 4px", border: "0.5px solid " + (nudgeTarget === t ? uiAccent : "#ddd"), background: nudgeTarget === t ? uiAccent + "22" : "#fff", cursor: "pointer", ...CP, fontSize: 5, color: nudgeTarget === t ? uiAccent : "#999", textTransform: "capitalize" }}>{t}</button>
                  ); })}
                  <div style={{ display: "flex", gap: 1, marginLeft: 4 }}>
                    <button onClick={function() { nudgePosition(currentSlide, nudgeTarget, "up"); }}
                      style={{ width: 16, height: 16, border: "0.5px solid #ddd", background: "#fff", cursor: "pointer", ...CP, fontSize: 8, color: "#666", textAlign: "center", lineHeight: "16px" }}>{"\u2191"}</button>
                    <button onClick={function() { nudgePosition(currentSlide, nudgeTarget, "down"); }}
                      style={{ width: 16, height: 16, border: "0.5px solid #ddd", background: "#fff", cursor: "pointer", ...CP, fontSize: 8, color: "#666", textAlign: "center", lineHeight: "16px" }}>{"\u2193"}</button>
                    <button onClick={function() { nudgePosition(currentSlide, nudgeTarget, "left"); }}
                      style={{ width: 16, height: 16, border: "0.5px solid #ddd", background: "#fff", cursor: "pointer", ...CP, fontSize: 8, color: "#666", textAlign: "center", lineHeight: "16px" }}>{"\u2190"}</button>
                    <button onClick={function() { nudgePosition(currentSlide, nudgeTarget, "right"); }}
                      style={{ width: 16, height: 16, border: "0.5px solid #ddd", background: "#fff", cursor: "pointer", ...CP, fontSize: 8, color: "#666", textAlign: "center", lineHeight: "16px" }}>{"\u2192"}</button>
                  </div>
                  {s.customPosition && s.customPosition[nudgeTarget] && <button onClick={function() { resetNudge(currentSlide, nudgeTarget); }}
                    style={{ padding: "1px 3px", border: "0.5px solid #ddd", cursor: "pointer", ...CP, fontSize: 4, color: "#999" }}>Reset {nudgeTarget}</button>}
                </div>
                {/* Per-block edit — text + size when specific element selected */}
                {nudgeTarget !== "all" && s[nudgeTarget] !== undefined && <div style={{ marginBottom: 4, padding: 4, border: "0.5px solid " + uiAccent + "33", borderRadius: 2, background: "#fff" }}>
                  <div style={{ ...CP, fontSize: 4, color: uiAccent, marginBottom: 2 }}>{nudgeTarget.toUpperCase()}</div>
                  {nudgeTarget === "body" ? (
                    <textarea value={s[nudgeTarget] || ""} onChange={function(e) { updateSlideField(currentSlide, nudgeTarget, e.target.value); }}
                      rows={2} style={{ width: "100%", padding: "2px 4px", border: "0.5px solid #ddd", ...CP, fontSize: 7, color: "#333", background: "#fafafa", resize: "vertical" }} />
                  ) : (
                    <input value={s[nudgeTarget] || ""} onChange={function(e) { updateSlideField(currentSlide, nudgeTarget, e.target.value); }}
                      style={{ width: "100%", padding: "2px 4px", border: "0.5px solid #ddd", ...CP, fontSize: 7, color: "#333", background: "#fafafa" }} />
                  )}
                  {/* Per-block font size */}
                  {(nudgeTarget === "heading" || nudgeTarget === "body") && <div style={{ display: "flex", gap: 3, alignItems: "center", marginTop: 2 }}>
                    <div style={{ ...CP, fontSize: 4, color: "#999" }}>Size:</div>
                    <button onClick={function() { adjustFontSize(currentSlide, nudgeTarget, -1); }}
                      style={{ width: 14, height: 14, border: "0.5px solid #ddd", background: "#fafafa", cursor: "pointer", ...CP, fontSize: 7, color: "#666", textAlign: "center", lineHeight: "14px" }}>-</button>
                    <div style={{ ...CP, fontSize: 5, color: "#666" }}>{(s[nudgeTarget + "Size"] || 0) > 0 ? "+" : ""}{s[nudgeTarget + "Size"] || 0}</div>
                    <button onClick={function() { adjustFontSize(currentSlide, nudgeTarget, 1); }}
                      style={{ width: 14, height: 14, border: "0.5px solid #ddd", background: "#fafafa", cursor: "pointer", ...CP, fontSize: 7, color: "#666", textAlign: "center", lineHeight: "14px" }}>+</button>
                  </div>}
                </div>}
              </div>}
              {/* Container + Color — Editorial only */}
              {isContent && activeSegment === "editorial" && <div style={{ borderTop: "0.5px solid #eee", paddingTop: 4 }}>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 3 }}>
                  <button onClick={function() { updateSlideField(currentSlide, "containerStyle", null); }}
                    style={{ padding: "2px 5px", border: "0.5px solid #ddd", background: !s.containerStyle ? uiAccent + "22" : "#fff", cursor: "pointer", ...CP, fontSize: 5, color: !s.containerStyle ? uiAccent : "#999" }}>Auto</button>
                  {CONTAINER_STYLES.filter(Boolean).map(function(cs) { return (
                    <button key={cs} onClick={function() { updateSlideField(currentSlide, "containerStyle", cs); }}
                      style={{ padding: "2px 5px", border: "0.5px solid #ddd", background: s.containerStyle === cs ? uiAccent + "22" : "#fff", cursor: "pointer", ...CP, fontSize: 5, color: s.containerStyle === cs ? uiAccent : "#999" }}>{CONTAINER_LABELS[cs]}</button>
                  ); })}
                  <button onClick={function() { updateSlideField(currentSlide, "containerVariant", ((s.containerVariant || 0) + 1) % 7); }}
                    style={{ padding: "2px 5px", border: "0.5px solid #ddd", background: "#fff", cursor: "pointer", ...CP, fontSize: 5, color: "#666" }}>V{(s.containerVariant || 0) + 1}/7</button>
                </div>
                <div style={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", marginBottom: 2 }}>
                  {[{ id: null, l: "Auto", c: "#666" }, { id: "rgba(0,0,0,0.85)", l: "Dark", c: "#333" }, { id: "rgba(0,0,0,0.6)", l: "Mid", c: "#555" }, { id: "rgba(255,255,255,0.9)", l: "Light", c: "#eee" }, { id: "rgba(255,255,255,0.15)", l: "Ghost", c: "#ccc" }].map(function(c) {
                    return <button key={c.l} onClick={function() { updateSlideField(currentSlide, "containerBg", c.id); }}
                      style={{ padding: "1px 4px", border: "0.5px solid " + (s.containerBg === c.id ? uiAccent : "#ddd"), background: s.containerBg === c.id ? uiAccent + "22" : c.c, cursor: "pointer", ...CP, fontSize: 4, color: s.containerBg === c.id ? uiAccent : (c.id && c.id.indexOf("255") > -1 ? "#333" : "#fff") }}>{c.l}</button>;
                  })}
                  <button onClick={function() { updateSlideField(currentSlide, "containerBg", "hsla(" + Math.floor(Math.random() * 360) + ",60%,20%,0.85)"); }}
                    style={{ padding: "1px 4px", border: "0.5px solid #ddd", background: "linear-gradient(90deg,#e63946,#e6a817,#1abc9c,#9b59b6)", cursor: "pointer", ...CP, fontSize: 4, color: "#fff" }}>Hue</button>
                  <input type="range" min="0.1" max="1" step="0.05" value={s.containerOpacity || 1}
                    onChange={function(e) { updateSlideField(currentSlide, "containerOpacity", parseFloat(e.target.value)); }}
                    style={{ width: 50, height: 3, cursor: "pointer", marginLeft: 4 }} />
                  <div style={{ ...CP, fontSize: 4, color: "#666" }}>{Math.round((s.containerOpacity || 1) * 100)}%</div>
                </div>
              </div>}
            </div>}

            {/* === LAYOUT === */}
            {editSection === "layout" && <div>
              {/* Enterprise layout picker — content slides only */}
              {activeSegment === "enterprise" && isContent && <div style={{ marginBottom: 6 }}>
                <div style={{ ...CP, fontSize: 5, color: "#888", marginBottom: 3 }}>SLIDE LAYOUT</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <button onClick={function() { updateSlideField(currentSlide, "enterpriseLayout", null); }}
                    style={{ padding: "2px 6px", border: "0.5px solid " + (s.enterpriseLayout == null ? "#fff" : "#444"), background: s.enterpriseLayout == null ? "#ffffff22" : "transparent", cursor: "pointer", ...CP, fontSize: 5, color: s.enterpriseLayout == null ? "#fff" : "#888" }}>Auto</button>
                  {ENTERPRISE_LAYOUT_LABELS.map(function(label, li) { return (
                    <button key={li} onClick={function() { updateSlideField(currentSlide, "enterpriseLayout", li); }}
                      style={{ padding: "2px 6px", border: "0.5px solid " + (s.enterpriseLayout === li ? "#fff" : "#444"), background: s.enterpriseLayout === li ? "#ffffff22" : "transparent", cursor: "pointer", ...CP, fontSize: 5, color: s.enterpriseLayout === li ? "#fff" : "#888" }}>{label}</button>
                  ); })}
                </div>
                {/* Enterprise split ratio + text offset */}
                <div style={{ marginTop: 6, borderTop: "0.5px solid #333", paddingTop: 4 }}>
                  <div style={{ display: "flex", gap: 3, alignItems: "center", marginBottom: 3 }}>
                    <div style={{ ...CP, fontSize: 5, color: "#888" }}>Split:</div>
                    <button onClick={function() { updateSlideField(currentSlide, "enterpriseSplit", Math.max(30, (s.enterpriseSplit || 50) - 5)); }}
                      style={{ width: 16, height: 16, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#888", textAlign: "center", lineHeight: "16px" }}>{"\u2190"}</button>
                    <div style={{ ...CP, fontSize: 6, color: "#ccc", minWidth: 30, textAlign: "center" }}>{s.enterpriseSplit || 50}%</div>
                    <button onClick={function() { updateSlideField(currentSlide, "enterpriseSplit", Math.min(70, (s.enterpriseSplit || 50) + 5)); }}
                      style={{ width: 16, height: 16, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#888", textAlign: "center", lineHeight: "16px" }}>{"\u2192"}</button>
                    {s.enterpriseSplit && s.enterpriseSplit !== 50 && <button onClick={function() { updateSlideField(currentSlide, "enterpriseSplit", null); }}
                      style={{ padding: "1px 4px", border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 4, color: "#666" }}>Reset</button>}
                  </div>
                  <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                    <div style={{ ...CP, fontSize: 5, color: "#888" }}>Text:</div>
                    <button onClick={function() { var o = s.enterpriseTextOffset || { top: 0, left: 0 }; updateSlideField(currentSlide, "enterpriseTextOffset", { top: o.top - 10, left: o.left }); }}
                      style={{ width: 16, height: 16, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#888", textAlign: "center", lineHeight: "16px" }}>{"\u2191"}</button>
                    <button onClick={function() { var o = s.enterpriseTextOffset || { top: 0, left: 0 }; updateSlideField(currentSlide, "enterpriseTextOffset", { top: o.top + 10, left: o.left }); }}
                      style={{ width: 16, height: 16, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#888", textAlign: "center", lineHeight: "16px" }}>{"\u2193"}</button>
                    <button onClick={function() { var o = s.enterpriseTextOffset || { top: 0, left: 0 }; updateSlideField(currentSlide, "enterpriseTextOffset", { top: o.top, left: o.left - 10 }); }}
                      style={{ width: 16, height: 16, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#888", textAlign: "center", lineHeight: "16px" }}>{"\u2190"}</button>
                    <button onClick={function() { var o = s.enterpriseTextOffset || { top: 0, left: 0 }; updateSlideField(currentSlide, "enterpriseTextOffset", { top: o.top, left: o.left + 10 }); }}
                      style={{ width: 16, height: 16, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#888", textAlign: "center", lineHeight: "16px" }}>{"\u2192"}</button>
                    {s.enterpriseTextOffset && (s.enterpriseTextOffset.top || s.enterpriseTextOffset.left) && <button onClick={function() { updateSlideField(currentSlide, "enterpriseTextOffset", null); }}
                      style={{ padding: "1px 4px", border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 4, color: "#666" }}>Reset</button>}
                  </div>
                </div>
              </div>}
              {/* Enterprise cover layout picker */}
              {activeSegment === "enterprise" && isCover && <div style={{ marginBottom: 6 }}>
                <div style={{ ...CP, fontSize: 5, color: "#888", marginBottom: 3 }}>COVER LAYOUT</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {ENTERPRISE_COVER_LABELS.map(function(label, li) { return (
                    <button key={li} onClick={function() { updateSlideField(currentSlide, "enterpriseCoverLayout", li); }}
                      style={{ padding: "2px 6px", border: "0.5px solid " + ((s.enterpriseCoverLayout || 0) === li ? "#fff" : "#444"), background: (s.enterpriseCoverLayout || 0) === li ? "#ffffff22" : "transparent", cursor: "pointer", ...CP, fontSize: 5, color: (s.enterpriseCoverLayout || 0) === li ? "#fff" : "#888" }}>{label}</button>
                  ); })}
                </div>
                <div style={{ marginTop: 4, display: "flex", gap: 3, alignItems: "center" }}>
                  <div style={{ ...CP, fontSize: 5, color: "#888" }}>Split:</div>
                  <button onClick={function() { updateSlideField(currentSlide, "enterpriseSplit", Math.max(25, (s.enterpriseSplit || 50) - 5)); }}
                    style={{ width: 16, height: 16, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#888", textAlign: "center", lineHeight: "16px" }}>{"\u2190"}</button>
                  <div style={{ ...CP, fontSize: 6, color: "#ccc", minWidth: 30, textAlign: "center" }}>{s.enterpriseSplit || 50}%</div>
                  <button onClick={function() { updateSlideField(currentSlide, "enterpriseSplit", Math.min(70, (s.enterpriseSplit || 50) + 5)); }}
                    style={{ width: 16, height: 16, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#888", textAlign: "center", lineHeight: "16px" }}>{"\u2192"}</button>
                </div>
              </div>}
              {/* News Desk layout picker */}
              {activeSegment === "newsdesk" && isContent && <div style={{ marginBottom: 6 }}>
                <div style={{ ...CP, fontSize: 5, color: "#8a8270", marginBottom: 3 }}>SLIDE LAYOUT</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <button onClick={function() { updateSlideField(currentSlide, "newsLayout", null); }}
                    style={{ padding: "2px 6px", border: "0.5px solid " + (s.newsLayout == null ? "#1a1a1a" : "#c8c0aa"), background: s.newsLayout == null ? "#1a1a1a11" : "transparent", cursor: "pointer", ...CP, fontSize: 5, color: s.newsLayout == null ? "#1a1a1a" : "#8a8270" }}>Auto</button>
                  {NEWS_LAYOUT_LABELS.map(function(label, li) { return (
                    <button key={li} onClick={function() { updateSlideField(currentSlide, "newsLayout", li); }}
                      style={{ padding: "2px 6px", border: "0.5px solid " + (s.newsLayout === li ? "#1a1a1a" : "#c8c0aa"), background: s.newsLayout === li ? "#1a1a1a11" : "transparent", cursor: "pointer", ...CP, fontSize: 5, color: s.newsLayout === li ? "#1a1a1a" : "#8a8270" }}>{label}</button>
                  ); })}
                </div>
                <div style={{ marginTop: 4, display: "flex", gap: 3, alignItems: "center" }}>
                  <div style={{ ...CP, fontSize: 5, color: "#8a8270" }}>Split:</div>
                  <button onClick={function() { updateSlideField(currentSlide, "newsSplit", Math.max(25, (s.newsSplit || 45) - 5)); }}
                    style={{ width: 16, height: 16, border: "0.5px solid #c8c0aa", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#8a8270", textAlign: "center", lineHeight: "16px" }}>{"\u2190"}</button>
                  <div style={{ ...CP, fontSize: 6, color: "#1a1a1a", minWidth: 30, textAlign: "center" }}>{s.newsSplit || 45}%</div>
                  <button onClick={function() { updateSlideField(currentSlide, "newsSplit", Math.min(70, (s.newsSplit || 45) + 5)); }}
                    style={{ width: 16, height: 16, border: "0.5px solid #c8c0aa", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#8a8270", textAlign: "center", lineHeight: "16px" }}>{"\u2192"}</button>
                  <div style={{ ...CP, fontSize: 5, color: "#8a8270", marginLeft: 8 }}>Cols:</div>
                  {[1,2,3].map(function(n) { return (
                    <button key={n} onClick={function() { updateSlideField(currentSlide, "columnCount", n); }}
                      style={{ width: 16, height: 16, border: "0.5px solid " + ((s.columnCount || 2) === n ? "#1a1a1a" : "#c8c0aa"), background: (s.columnCount || 2) === n ? "#1a1a1a11" : "transparent", cursor: "pointer", ...CP, fontSize: 7, color: (s.columnCount || 2) === n ? "#1a1a1a" : "#8a8270", textAlign: "center", lineHeight: "16px" }}>{n}</button>
                  ); })}
                </div>
              </div>}
              {/* News Desk cover layout picker */}
              {activeSegment === "newsdesk" && isCover && <div style={{ marginBottom: 6 }}>
                <div style={{ ...CP, fontSize: 5, color: "#8a8270", marginBottom: 3 }}>COVER LAYOUT</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {NEWS_COVER_LABELS.map(function(label, li) { return (
                    <button key={li} onClick={function() { updateSlideField(currentSlide, "newsCoverLayout", li); }}
                      style={{ padding: "2px 6px", border: "0.5px solid " + (s.newsCoverLayout === li ? "#1a1a1a" : "#c8c0aa"), background: s.newsCoverLayout === li ? "#1a1a1a11" : "transparent", cursor: "pointer", ...CP, fontSize: 5, color: s.newsCoverLayout === li ? "#1a1a1a" : "#8a8270" }}>{label}</button>
                  ); })}
                </div>
                <div style={{ marginTop: 4, display: "flex", gap: 3, alignItems: "center" }}>
                  <div style={{ ...CP, fontSize: 5, color: "#8a8270" }}>Split:</div>
                  <button onClick={function() { updateSlideField(currentSlide, "newsSplit", Math.max(25, (s.newsSplit || 45) - 5)); }}
                    style={{ width: 16, height: 16, border: "0.5px solid #c8c0aa", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#8a8270", textAlign: "center", lineHeight: "16px" }}>{"\u2190"}</button>
                  <div style={{ ...CP, fontSize: 6, color: "#1a1a1a", minWidth: 30, textAlign: "center" }}>{s.newsSplit || 45}%</div>
                  <button onClick={function() { updateSlideField(currentSlide, "newsSplit", Math.min(70, (s.newsSplit || 45) + 5)); }}
                    style={{ width: 16, height: 16, border: "0.5px solid #c8c0aa", background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: "#8a8270", textAlign: "center", lineHeight: "16px" }}>{"\u2192"}</button>
                </div>
              </div>}
              {/* News Desk portrait controls (Reaction slides) */}
              {activeSegment === "newsdesk" && s.quote && <div style={{ marginBottom: 4, borderTop: "0.5px solid #c8c0aa", paddingTop: 3 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "center", marginBottom: 2 }}>
                  <div style={{ ...CP, fontSize: 5, color: "#8a8270" }}>Portrait:</div>
                  <button onClick={function() { updateSlideField(currentSlide, "portraitSize", Math.max(40, (s.portraitSize || 80) - 10)); }}
                    style={{ width: 14, height: 14, border: "0.5px solid #c8c0aa", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: "#8a8270", textAlign: "center", lineHeight: "14px" }}>-</button>
                  <div style={{ ...CP, fontSize: 5, color: "#1a1a1a" }}>{s.portraitSize || 80}px</div>
                  <button onClick={function() { updateSlideField(currentSlide, "portraitSize", Math.min(120, (s.portraitSize || 80) + 10)); }}
                    style={{ width: 14, height: 14, border: "0.5px solid #c8c0aa", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: "#8a8270", textAlign: "center", lineHeight: "14px" }}>+</button>
                </div>
                <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <div style={{ ...CP, fontSize: 5, color: "#8a8270" }}>Layout:</div>
                  {[{ id: null, l: "Center" }, { id: "left", l: "Left" }].map(function(lo) {
                    var sel = (s.reactionLayout || null) === lo.id; return <button key={lo.l} onClick={function() { updateSlideField(currentSlide, "reactionLayout", lo.id); }}
                      style={{ padding: "1px 6px", border: "0.5px solid " + (sel ? "#1a1a1a" : "#c8c0aa"), background: sel ? "#1a1a1a11" : "transparent", cursor: "pointer", ...CP, fontSize: 5, color: sel ? "#1a1a1a" : "#8a8270" }}>{lo.l}</button>;
                  })}
                </div>
              </div>}
              {/* News Desk stat + divider controls */}
              {activeSegment === "newsdesk" && isContent && s.stat && <div style={{ marginBottom: 4, borderTop: "0.5px solid #c8c0aa", paddingTop: 3 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  <div style={{ ...CP, fontSize: 5, color: "#8a8270" }}>Stat:</div>
                  <button onClick={function() { adjustFontSize(currentSlide, "stat", -2); }}
                    style={{ width: 14, height: 14, border: "0.5px solid #c8c0aa", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: "#8a8270", textAlign: "center", lineHeight: "14px" }}>-</button>
                  <div style={{ ...CP, fontSize: 5, color: "#1a1a1a" }}>{s.statSize || 0}</div>
                  <button onClick={function() { adjustFontSize(currentSlide, "stat", 2); }}
                    style={{ width: 14, height: 14, border: "0.5px solid #c8c0aa", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: "#8a8270", textAlign: "center", lineHeight: "14px" }}>+</button>
                  <button onClick={function() { updateSlideField(currentSlide, "statHidden", !s.statHidden); }}
                    style={{ padding: "1px 4px", border: "0.5px solid #c8c0aa", background: s.statHidden ? "#1a1a1a11" : "transparent", cursor: "pointer", ...CP, fontSize: 4, color: s.statHidden ? "#1a1a1a" : "#8a8270" }}>{s.statHidden ? "Hidden" : "Visible"}</button>
                </div>
              </div>}
              {activeSegment === "newsdesk" && <div style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  <div style={{ ...CP, fontSize: 5, color: "#8a8270" }}>Divider:</div>
                  <button onClick={function() { updateSlideField(currentSlide, "dividerWeight", Math.max(0, (s.dividerWeight || 1) - 0.5)); }}
                    style={{ width: 14, height: 14, border: "0.5px solid #c8c0aa", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: "#8a8270", textAlign: "center", lineHeight: "14px" }}>-</button>
                  <div style={{ ...CP, fontSize: 5, color: "#1a1a1a" }}>{typeof s.dividerWeight === "number" ? s.dividerWeight : 1}px</div>
                  <button onClick={function() { updateSlideField(currentSlide, "dividerWeight", Math.min(4, (s.dividerWeight || 1) + 0.5)); }}
                    style={{ width: 14, height: 14, border: "0.5px solid #c8c0aa", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: "#8a8270", textAlign: "center", lineHeight: "14px" }}>+</button>
                  <button onClick={function() { updateSlideField(currentSlide, "dividerHidden", !s.dividerHidden); }}
                    style={{ padding: "1px 4px", border: "0.5px solid #c8c0aa", background: s.dividerHidden ? "#1a1a1a11" : "transparent", cursor: "pointer", ...CP, fontSize: 4, color: s.dividerHidden ? "#1a1a1a" : "#8a8270" }}>{s.dividerHidden ? "Hidden" : "Visible"}</button>
                </div>
              </div>}
              {/* Per-element text controls — all segments */}
              <div style={{ marginTop: 4, borderTop: "0.5px solid " + (activeSegment === "enterprise" ? "#333" : activeSegment === "newsdesk" ? "#c8c0aa" : "#eee"), paddingTop: 4 }}>
                <div style={{ display: "flex", gap: 2, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                  <div style={{ ...CP, fontSize: 5, color: activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "#999" }}>Element:</div>
                  {["all", "heading", "body", "highlight", "sources"].concat(s.quote ? ["quote"] : []).concat(s.stat ? ["stat"] : []).map(function(t) { return (
                    <button key={t} onClick={function() { setNudgeTarget(t); }}
                      style={{ padding: "1px 4px", border: "0.5px solid " + (nudgeTarget === t ? (activeSegment === "enterprise" ? "#fff" : activeSegment === "newsdesk" ? "#1a1a1a" : uiAccent) : (activeSegment === "enterprise" ? "#444" : activeSegment === "newsdesk" ? "#c8c0aa" : "#ddd")), background: nudgeTarget === t ? (activeSegment === "enterprise" ? "#ffffff22" : activeSegment === "newsdesk" ? "#1a1a1a11" : uiAccent + "15") : "transparent", cursor: "pointer", ...CP, fontSize: 5, color: nudgeTarget === t ? (activeSegment === "enterprise" ? "#fff" : activeSegment === "newsdesk" ? "#1a1a1a" : uiAccent) : (activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "#999"), textTransform: "capitalize" }}>{t}</button>
                  ); })}
                  <div style={{ display: "flex", gap: 1, marginLeft: 4 }}>
                    {["up","down","left","right"].map(function(dir) { var arrows = { up: "\u2191", down: "\u2193", left: "\u2190", right: "\u2192" }; return (
                      <button key={dir} onClick={function() { nudgePosition(currentSlide, nudgeTarget, dir); }}
                        style={{ width: 16, height: 16, border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : activeSegment === "newsdesk" ? "#c8c0aa" : "#ddd"), background: "transparent", cursor: "pointer", ...CP, fontSize: 8, color: activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "#999", textAlign: "center", lineHeight: "16px" }}>{arrows[dir]}</button>
                    ); })}
                  </div>
                  {s.customPosition && s.customPosition[nudgeTarget] && <button onClick={function() { resetNudge(currentSlide, nudgeTarget); }}
                    style={{ padding: "1px 3px", border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : activeSegment === "newsdesk" ? "#c8c0aa" : "#ddd"), cursor: "pointer", ...CP, fontSize: 4, color: activeSegment === "enterprise" ? "#666" : "#999" }}>Reset</button>}
                </div>
                {/* Per-block text edit + size + font */}
                {nudgeTarget !== "all" && (function() {
                  // Map cover fields: heading→title, body→subtitle/leadParagraph for cover slides
                  var isCover = currentSlide === 0;
                  var coverMap = { heading: "title", body: s.subtitle !== undefined ? "subtitle" : s.leadParagraph !== undefined ? "leadParagraph" : "subtitle", highlight: "titleHighlight", sources: "sources" };
                  var fieldKey = isCover && coverMap[nudgeTarget] ? coverMap[nudgeTarget] : nudgeTarget;
                  // For covers, always show heading (title) and body (subtitle) even if empty
                  var hasField = s[fieldKey] !== undefined || s[nudgeTarget] !== undefined || (isCover && (nudgeTarget === "heading" || nudgeTarget === "body"));
                  if (!hasField) return null;
                  var fieldVal = s[fieldKey] !== undefined ? s[fieldKey] : (s[nudgeTarget] || "");
                  var updateField = function(val) { updateSlideField(currentSlide, fieldKey, val); };
                  // Stat element — special controls
                  if (nudgeTarget === "stat") return <div style={{ padding: 4, border: "0.5px solid " + (activeSegment === "enterprise" ? "#333" : activeSegment === "newsdesk" ? "#c8c0aa" : "#ddd"), borderRadius: 2, background: activeSegment === "enterprise" ? "#1a1a1a" : activeSegment === "newsdesk" ? "#ebe6d6" : "#fafafa" }}>
                    <div style={{ ...CP, fontSize: 4, color: activeSegment === "enterprise" ? "#fff" : activeSegment === "newsdesk" ? "#1a1a1a" : "#333", marginBottom: 2 }}>STAT</div>
                    <input value={s.stat || ""} onChange={function(e) { updateSlideField(currentSlide, "stat", e.target.value); }}
                      style={{ width: "100%", padding: "2px 4px", border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : "#c8c0aa"), ...CP, fontSize: 8, color: activeSegment === "enterprise" ? "#ddd" : "#333", background: activeSegment === "enterprise" ? "#111" : "#fff", fontWeight: 700, marginBottom: 3 }} />
                    <input value={s.statCaption || s.caption || s.statLabel || ""} onChange={function(e) { updateSlideField(currentSlide, "statCaption", e.target.value); }}
                      placeholder="Stat caption text..."
                      style={{ width: "100%", padding: "2px 4px", border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : "#c8c0aa"), ...CP, fontSize: 6, color: activeSegment === "enterprise" ? "#aaa" : "#666", background: activeSegment === "enterprise" ? "#111" : "#fff", marginBottom: 3 }} />
                    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                      <div style={{ ...CP, fontSize: 4, color: activeSegment === "enterprise" ? "#888" : "#8a8270" }}>Caption size:</div>
                      <button onClick={function() { adjustFontSize(currentSlide, "statCaption", -0.5); }}
                        style={{ width: 14, height: 14, border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : "#c8c0aa"), background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: activeSegment === "enterprise" ? "#888" : "#8a8270", textAlign: "center", lineHeight: "14px" }}>-</button>
                      <div style={{ ...CP, fontSize: 5, color: activeSegment === "enterprise" ? "#ccc" : "#1a1a1a" }}>{s.statCaptionSize || 0}</div>
                      <button onClick={function() { adjustFontSize(currentSlide, "statCaption", 0.5); }}
                        style={{ width: 14, height: 14, border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : "#c8c0aa"), background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: activeSegment === "enterprise" ? "#888" : "#8a8270", textAlign: "center", lineHeight: "14px" }}>+</button>
                    </div>
                    <div style={{ display: "flex", gap: 3, alignItems: "center", marginBottom: 2 }}>
                      <div style={{ ...CP, fontSize: 4, color: activeSegment === "enterprise" ? "#888" : "#8a8270" }}>Size:</div>
                      <button onClick={function() { adjustFontSize(currentSlide, "stat", -2); }}
                        style={{ width: 14, height: 14, border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : "#c8c0aa"), background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: activeSegment === "enterprise" ? "#888" : "#8a8270", textAlign: "center", lineHeight: "14px" }}>-</button>
                      <div style={{ ...CP, fontSize: 5, color: activeSegment === "enterprise" ? "#ccc" : "#1a1a1a" }}>{s.statSize || 0}</div>
                      <button onClick={function() { adjustFontSize(currentSlide, "stat", 2); }}
                        style={{ width: 14, height: 14, border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : "#c8c0aa"), background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: activeSegment === "enterprise" ? "#888" : "#8a8270", textAlign: "center", lineHeight: "14px" }}>+</button>
                      <button onClick={function() { updateSlideField(currentSlide, "statHidden", !s.statHidden); }}
                        style={{ padding: "1px 4px", border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : "#c8c0aa"), background: s.statHidden ? (activeSegment === "enterprise" ? "#ffffff22" : "#1a1a1a11") : "transparent", cursor: "pointer", ...CP, fontSize: 4, color: s.statHidden ? (activeSegment === "enterprise" ? "#fff" : "#1a1a1a") : (activeSegment === "enterprise" ? "#888" : "#8a8270") }}>{s.statHidden ? "Hidden" : "Visible"}</button>
                    </div>
                    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <div style={{ ...CP, fontSize: 4, color: activeSegment === "enterprise" ? "#888" : "#8a8270" }}>Color:</div>
                      {[{ id: "#c41e1e", l: "Red" }, { id: "#1a1a1a", l: "Black" }, { id: "#ffffff", l: "White" }, { id: null, l: "Auto" }].map(function(c) {
                        var sel = (s.statColor || null) === c.id; return <button key={c.l} onClick={function() { updateSlideField(currentSlide, "statColor", c.id); }}
                          style={{ width: c.id ? 14 : "auto", height: 14, padding: c.id ? 0 : "0 4px", border: "1px solid " + (sel ? (activeSegment === "enterprise" ? "#fff" : "#333") : "#ddd"), background: c.id || "transparent", cursor: "pointer", ...CP, fontSize: 4, color: "#999", lineHeight: "14px", textAlign: "center" }} title={c.l}>{c.id ? "" : c.l}</button>;
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 2, alignItems: "center", marginTop: 2 }}>
                      <div style={{ ...CP, fontSize: 4, color: activeSegment === "enterprise" ? "#888" : "#8a8270" }}>Box:</div>
                      {[{ id: "#1a1a1a", l: "Dark" }, { id: "#c41e1e", l: "Red" }, { id: "#f5f0e4", l: "Light" }].map(function(b) {
                        var sel = (s.statBoxBg || "#1a1a1a") === b.id; return <button key={b.l} onClick={function() { updateSlideField(currentSlide, "statBoxBg", b.id); }}
                          style={{ padding: "0 4px", height: 14, border: "1px solid " + (sel ? (activeSegment === "enterprise" ? "#fff" : "#333") : "#ddd"), background: b.id, cursor: "pointer", ...CP, fontSize: 4, color: b.id === "#1a1a1a" ? "#fff" : "#333", lineHeight: "14px" }}>{b.l}</button>;
                      })}
                      <button onClick={function() { updateSlideField(currentSlide, "statBoxHidden", !s.statBoxHidden); }}
                        style={{ padding: "0 4px", height: 14, border: "1px solid " + (activeSegment === "enterprise" ? "#444" : "#ddd"), background: s.statBoxHidden ? (activeSegment === "enterprise" ? "#ffffff22" : "#1a1a1a11") : "transparent", cursor: "pointer", ...CP, fontSize: 4, color: activeSegment === "enterprise" ? "#888" : "#8a8270", lineHeight: "14px" }}>{s.statBoxHidden ? "No Box" : "Boxed"}</button>
                    </div>
                    <div style={{ display: "flex", gap: 2, alignItems: "center", marginTop: 2 }}>
                      <div style={{ ...CP, fontSize: 4, color: activeSegment === "enterprise" ? "#888" : "#8a8270" }}>Caption:</div>
                      {[{ id: null, l: "Below" }, { id: "beside", l: "Beside" }].map(function(lo) {
                        var sel = (s.statLayout || null) === lo.id; return <button key={lo.l} onClick={function() { updateSlideField(currentSlide, "statLayout", lo.id); }}
                          style={{ padding: "0 4px", height: 14, border: "1px solid " + (sel ? (activeSegment === "enterprise" ? "#fff" : "#333") : "#ddd"), background: sel ? (activeSegment === "enterprise" ? "#ffffff22" : "#1a1a1a11") : "transparent", cursor: "pointer", ...CP, fontSize: 4, color: sel ? (activeSegment === "enterprise" ? "#fff" : "#333") : "#999", lineHeight: "14px" }}>{lo.l}</button>;
                      })}
                    </div>
                  </div>;
                  return <div style={{ padding: 4, border: "0.5px solid " + (activeSegment === "enterprise" ? "#333" : activeSegment === "newsdesk" ? "#c8c0aa" : "#ddd"), borderRadius: 2, background: activeSegment === "enterprise" ? "#1a1a1a" : activeSegment === "newsdesk" ? "#ebe6d6" : "#fafafa" }}>
                  <div style={{ ...CP, fontSize: 4, color: activeSegment === "enterprise" ? "#fff" : activeSegment === "newsdesk" ? "#1a1a1a" : "#333", marginBottom: 2 }}>{nudgeTarget.toUpperCase()}{isCover && coverMap[nudgeTarget] ? " (" + coverMap[nudgeTarget] + ")" : ""}</div>
                  {nudgeTarget === "body" || fieldKey === "subtitle" || fieldKey === "leadParagraph" ? (
                    <textarea value={fieldVal || ""} onChange={function(e) { updateField(e.target.value); }}
                      rows={2} style={{ width: "100%", padding: "2px 4px", border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : activeSegment === "newsdesk" ? "#c8c0aa" : "#ddd"), ...CP, fontSize: 7, color: activeSegment === "enterprise" ? "#ddd" : "#333", background: activeSegment === "enterprise" ? "#111" : activeSegment === "newsdesk" ? "#fff" : "#fff", resize: "vertical" }} />
                  ) : (
                    <input value={fieldVal || ""} onChange={function(e) { updateField(e.target.value); }}
                      style={{ width: "100%", padding: "2px 4px", border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : activeSegment === "newsdesk" ? "#c8c0aa" : "#ddd"), ...CP, fontSize: 7, color: activeSegment === "enterprise" ? "#ddd" : "#333", background: activeSegment === "enterprise" ? "#111" : activeSegment === "newsdesk" ? "#fff" : "#fff" }} />
                  )}
                  {(nudgeTarget === "heading" || nudgeTarget === "body" || nudgeTarget === "highlight" || nudgeTarget === "sources" || nudgeTarget === "quote") && <div style={{ display: "flex", gap: 3, alignItems: "center", marginTop: 2 }}>
                    <div style={{ ...CP, fontSize: 4, color: activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "#999" }}>Size:</div>
                    <button onClick={function() { adjustFontSize(currentSlide, nudgeTarget, -1); }}
                      style={{ width: 14, height: 14, border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : activeSegment === "newsdesk" ? "#c8c0aa" : "#ddd"), background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "#999", textAlign: "center", lineHeight: "14px" }}>-</button>
                    <div style={{ ...CP, fontSize: 5, color: activeSegment === "enterprise" ? "#ccc" : "#666" }}>{(s[nudgeTarget + "Size"] || 0) > 0 ? "+" : ""}{s[nudgeTarget + "Size"] || 0}</div>
                    <button onClick={function() { adjustFontSize(currentSlide, nudgeTarget, 1); }}
                      style={{ width: 14, height: 14, border: "0.5px solid " + (activeSegment === "enterprise" ? "#444" : activeSegment === "newsdesk" ? "#c8c0aa" : "#ddd"), background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "#999", textAlign: "center", lineHeight: "14px" }}>+</button>
                  </div>}
                  {(nudgeTarget === "heading" || nudgeTarget === "body" || nudgeTarget === "highlight" || nudgeTarget === "sources" || nudgeTarget === "quote") && <div style={{ display: "flex", gap: 2, alignItems: "center", marginTop: 3 }}>
                    <div style={{ ...CP, fontSize: 4, color: activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "#999" }}>Font:</div>
                    {ALL_FONTS.map(function(f) { var fontKey = nudgeTarget + "Font"; var defaults = { heading: "foun", body: "maheni", highlight: activeSegment === "enterprise" ? "maheni" : activeSegment === "newsdesk" ? "maheni" : "wenssep", sources: "courier" }; var sel = (s[fontKey] || defaults[nudgeTarget] || "maheni") === f.id; return (
                      <button key={f.id} onClick={function() { updateSlideField(currentSlide, fontKey, f.id); }}
                        style={{ padding: "1px 4px", border: "0.5px solid " + (sel ? (activeSegment === "enterprise" ? "#fff" : activeSegment === "newsdesk" ? "#1a1a1a" : uiAccent) : (activeSegment === "enterprise" ? "#444" : activeSegment === "newsdesk" ? "#c8c0aa" : "#ddd")), background: sel ? (activeSegment === "enterprise" ? "#ffffff22" : activeSegment === "newsdesk" ? "#1a1a1a11" : uiAccent + "15") : "transparent", cursor: "pointer", ...CP, fontSize: 4, color: sel ? (activeSegment === "enterprise" ? "#fff" : activeSegment === "newsdesk" ? "#1a1a1a" : uiAccent) : (activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "#999") }}>{f.label}</button>
                    ); })}
                  </div>}
                  {(nudgeTarget === "heading" || nudgeTarget === "body" || nudgeTarget === "highlight" || nudgeTarget === "sources" || nudgeTarget === "quote") && <div style={{ display: "flex", gap: 2, alignItems: "center", marginTop: 3, flexWrap: "wrap" }}>
                    <div style={{ ...CP, fontSize: 4, color: activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "#999" }}>Color:</div>
                    {(TEXT_COLORS[activeSegment] || TEXT_COLORS.editorial).map(function(c) { var colorKey = nudgeTarget + "Color"; var sel = (s[colorKey] || null) === c.id; return (
                      <button key={c.label} onClick={function() { updateSlideField(currentSlide, colorKey, c.id); }}
                        style={{ width: c.id ? 14 : "auto", height: 14, padding: c.id ? 0 : "0 4px", border: "1px solid " + (sel ? (activeSegment === "enterprise" ? "#fff" : "#333") : (activeSegment === "enterprise" ? "#444" : "#ddd")), background: c.id || "transparent", cursor: "pointer", ...CP, fontSize: 4, color: sel ? (activeSegment === "enterprise" ? "#fff" : "#333") : "#999", lineHeight: "14px", textAlign: "center" }} title={c.label}>{c.id ? "" : c.label}</button>
                    ); })}
                  </div>}
                  {(nudgeTarget === "heading" || nudgeTarget === "body" || nudgeTarget === "highlight" || nudgeTarget === "sources" || nudgeTarget === "quote") && <div style={{ display: "flex", gap: 2, alignItems: "center", marginTop: 3 }}>
                    <div style={{ ...CP, fontSize: 4, color: activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "#999" }}>Align:</div>
                    {[{ id: "left", label: "\u2190" }, { id: "center", label: "\u2194" }, { id: "right", label: "\u2192" }, { id: "justify", label: "\u2261" }].map(function(a) { var alignKey = nudgeTarget + "Align"; var sel = (s[alignKey] || "") === a.id; return (
                      <button key={a.id} onClick={function() { updateSlideField(currentSlide, alignKey, sel ? null : a.id); }}
                        style={{ width: 18, height: 14, border: "0.5px solid " + (sel ? (activeSegment === "enterprise" ? "#fff" : activeSegment === "newsdesk" ? "#1a1a1a" : uiAccent) : (activeSegment === "enterprise" ? "#444" : activeSegment === "newsdesk" ? "#c8c0aa" : "#ddd")), background: sel ? (activeSegment === "enterprise" ? "#ffffff22" : activeSegment === "newsdesk" ? "#1a1a1a11" : uiAccent + "15") : "transparent", cursor: "pointer", ...CP, fontSize: 7, color: sel ? (activeSegment === "enterprise" ? "#fff" : activeSegment === "newsdesk" ? "#1a1a1a" : uiAccent) : (activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "#999"), textAlign: "center", lineHeight: "14px" }}>{a.label}</button>
                    ); })}
                  </div>}
                  {nudgeTarget === "highlight" && <div style={{ display: "flex", gap: 2, alignItems: "center", marginTop: 3 }}>
                    <div style={{ ...CP, fontSize: 4, color: activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "#999" }}>Style:</div>
                    {HIGHLIGHT_STYLES.map(function(hs) { var sel = (s.highlightStyle || (activeSegment === "enterprise" ? "bar" : activeSegment === "newsdesk" ? "bar" : "pill")) === hs.id; return (
                      <button key={hs.id} onClick={function() { updateSlideField(currentSlide, "highlightStyle", hs.id); }}
                        style={{ padding: "1px 4px", border: "0.5px solid " + (sel ? (activeSegment === "enterprise" ? "#fff" : activeSegment === "newsdesk" ? "#1a1a1a" : uiAccent) : (activeSegment === "enterprise" ? "#444" : activeSegment === "newsdesk" ? "#c8c0aa" : "#ddd")), background: sel ? (activeSegment === "enterprise" ? "#ffffff22" : activeSegment === "newsdesk" ? "#1a1a1a11" : uiAccent + "15") : "transparent", cursor: "pointer", ...CP, fontSize: 4, color: sel ? (activeSegment === "enterprise" ? "#fff" : activeSegment === "newsdesk" ? "#1a1a1a" : uiAccent) : (activeSegment === "enterprise" ? "#888" : activeSegment === "newsdesk" ? "#8a8270" : "#999") }}>{hs.label}</button>
                    ); })}
                  </div>}
                  {nudgeTarget === "body" && activeSegment === "enterprise" && <div style={{ marginTop: 3 }}>
                    <div style={{ ...CP, fontSize: 4, color: "#888", marginBottom: 2 }}>Keywords <span style={{ color: "#666" }}>(comma-separated, emphasized in body)</span></div>
                    <input value={(s.keywords || []).join(", ")} onChange={function(e) { var kw = e.target.value.split(",").map(function(k) { return k.trim(); }).filter(Boolean); updateSlideField(currentSlide, "keywords", kw); }}
                      placeholder="e.g. Tesla, market share, disruption"
                      style={{ width: "100%", padding: "2px 4px", border: "0.5px solid #444", ...CP, fontSize: 6, color: "#ddd", background: "#111" }} />
                    <div style={{ display: "flex", gap: 3, alignItems: "center", marginTop: 3 }}>
                      <div style={{ ...CP, fontSize: 4, color: "#888" }}>Underline:</div>
                      <button onClick={function() { updateSlideField(currentSlide, "underlineWeight", Math.max(0.5, (s.underlineWeight || 1.5) - 0.5)); }}
                        style={{ width: 14, height: 14, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: "#888", textAlign: "center", lineHeight: "14px" }}>-</button>
                      <div style={{ ...CP, fontSize: 5, color: "#ccc" }}>{s.underlineWeight || 1.5}px</div>
                      <button onClick={function() { updateSlideField(currentSlide, "underlineWeight", Math.min(4, (s.underlineWeight || 1.5) + 0.5)); }}
                        style={{ width: 14, height: 14, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: "#888", textAlign: "center", lineHeight: "14px" }}>+</button>
                    </div>
                  </div>}
                </div>;
                })()}
              </div>
              {/* Divider line + Sources controls — Enterprise */}
              {activeSegment === "enterprise" && <div style={{ marginTop: 4, borderTop: "0.5px solid #333", paddingTop: 4 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "center", marginBottom: 3 }}>
                  <div style={{ ...CP, fontSize: 5, color: "#888" }}>Divider:</div>
                  <button onClick={function() { updateSlideField(currentSlide, "dividerWeight", Math.max(0, (s.dividerWeight || 0.5) - 0.5)); }}
                    style={{ width: 14, height: 14, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: "#888", textAlign: "center", lineHeight: "14px" }}>-</button>
                  <div style={{ ...CP, fontSize: 5, color: "#ccc" }}>{typeof s.dividerWeight === "number" ? s.dividerWeight : 0.5}px</div>
                  <button onClick={function() { updateSlideField(currentSlide, "dividerWeight", Math.min(4, (s.dividerWeight || 0.5) + 0.5)); }}
                    style={{ width: 14, height: 14, border: "0.5px solid #444", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: "#888", textAlign: "center", lineHeight: "14px" }}>+</button>
                  <button onClick={function() { updateSlideField(currentSlide, "dividerHidden", !s.dividerHidden); }}
                    style={{ padding: "1px 4px", border: "0.5px solid #444", background: s.dividerHidden ? "#ffffff22" : "transparent", cursor: "pointer", ...CP, fontSize: 4, color: s.dividerHidden ? "#fff" : "#888" }}>{s.dividerHidden ? "Hidden" : "Visible"}</button>
                </div>
                <div style={{ display: "flex", gap: 2, alignItems: "center", marginTop: 3, flexWrap: "wrap" }}>
                  <div style={{ ...CP, fontSize: 5, color: "#888" }}>Filter:</div>
                  {ENTERPRISE_IMG_FILTERS.map(function(f) { var sel = (s.imgFilter || "") === f.id || (!s.imgFilter && (editionPicks.enterpriseImgFilter || "none") === f.id); return (
                    <button key={f.id} onClick={function() { updateSlideField(currentSlide, "imgFilter", f.id); }}
                      style={{ padding: "1px 4px", border: "0.5px solid " + (sel ? "#fff" : "#444"), background: sel ? "#ffffff22" : "transparent", cursor: "pointer", ...CP, fontSize: 4, color: sel ? "#fff" : "#888" }}>{f.label}</button>
                  ); })}
                  {s.imgFilter && <button onClick={function() { updateSlideField(currentSlide, "imgFilter", null); }}
                    style={{ padding: "1px 3px", border: "0.5px solid #444", cursor: "pointer", ...CP, fontSize: 4, color: "#666" }}>Reset</button>}
                </div>
              </div>}
              {activeSegment !== "newsdesk" && <><button onClick={function() { updateSlideField(currentSlide, "imageLayout", "single"); delete _mosaicSlides[currentSlide]; setImages(function(prev) { return Object.assign({}, prev); }); }}
                style={{ padding: "3px 8px", border: "0.5px solid " + (!_mosaicSlides[currentSlide] ? uiAccent : "#ddd"), background: !_mosaicSlides[currentSlide] ? uiAccent + "22" : "#fff", cursor: "pointer", ...CP, fontSize: 6, color: !_mosaicSlides[currentSlide] ? uiAccent : "#999", marginBottom: 4, display: "block" }}>Single Image</button>
              <div style={{ ...CP, fontSize: 5, color: "#999", marginBottom: 2 }}>MOSAIC</div>
              <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {MOSAIC_LAYOUTS.map(function(layout, li) {
                  var isMosaic = _mosaicSlides[currentSlide];
                  var active = isMosaic && isMosaic._layoutIdx === li;
                  return <button key={layout.id} onClick={function() {
                    updateSlideField(currentSlide, "imageLayout", layout.id);
                    // Preserve existing swapped images, only add new ones if needed
                    var existing = _mosaicSlides[currentSlide] ? _mosaicSlides[currentSlide].filter(function(u) { return typeof u === "string"; }) : [];
                    var mUrls = existing.length > 0 ? existing.slice() : getMosaicImgs(_allImages, currentSlide);
                    // Pad with more images if the new layout needs more panels
                    if (mUrls.length < layout.count) {
                      var used = {}; mUrls.forEach(function(u) { used[u] = true; });
                      var keys = Object.keys(_allImages);
                      for (var ki = 0; ki < keys.length && mUrls.length < layout.count; ki++) {
                        if (_allImages[keys[ki]] && _allImages[keys[ki]].url && !used[_allImages[keys[ki]].url]) { mUrls.push(_allImages[keys[ki]].url); used[_allImages[keys[ki]].url] = true; }
                      }
                    }
                    _mosaicSlides[currentSlide] = mUrls.slice(0, layout.count);
                    _mosaicSlides[currentSlide]._layoutIdx = li;
                    setImages(function(prev) { return Object.assign({}, prev); });
                  }}
                    style={{ padding: "2px 5px", border: "0.5px solid " + (active ? uiAccent : "#ddd"), background: active ? uiAccent + "22" : "#fff", cursor: "pointer", ...CP, fontSize: 5, color: active ? uiAccent : "#999" }}>{layout.label}</button>;
                })}
              </div></>}
            </div>}

            {/* === SLIDE === */}
            {editSection === "slide" && <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              <button onClick={function() { duplicateSlide(currentSlide); }}
                style={{ padding: "2px 5px", border: "0.5px solid #ddd", background: "#fff", cursor: "pointer", ...CP, fontSize: 5, color: "#666" }}>{"\u2398"} Copy</button>
              {currentSlide > 1 && <button onClick={function() { moveSlide(currentSlide, currentSlide - 1); }}
                style={{ padding: "2px 5px", border: "0.5px solid #ddd", background: "#fff", cursor: "pointer", ...CP, fontSize: 6, color: "#666" }}>{"\u2191"}</button>}
              {currentSlide < total - 2 && currentSlide > 0 && <button onClick={function() { moveSlide(currentSlide, currentSlide + 1); }}
                style={{ padding: "2px 5px", border: "0.5px solid #ddd", background: "#fff", cursor: "pointer", ...CP, fontSize: 6, color: "#666" }}>{"\u2193"}</button>}
              <div style={{ flex: 1 }} />
              {isContent && <button onClick={function() { deleteSlide(currentSlide); }}
                style={{ padding: "2px 5px", border: "0.5px solid #ef444444", background: "#fff", cursor: "pointer", ...CP, fontSize: 5, color: "#ef4444" }}>{"\u2715"} Delete</button>}
            </div>}
          </div>;
        })()}
        {/* Fact-check results */}
        {factCheckResult && factCheckResult.issues && factCheckResult.issues.length > 0 && <div style={{ marginTop: 6, border: "0.5px solid " + (factCheckResult.score >= 7 ? "#22c55e44" : "#ef444444"), background: "#f8f8f8", padding: 6, borderRadius: 3 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
            <div style={{ ...CP, fontSize: 6, color: factCheckResult.score >= 7 ? "#22c55e" : "#ef4444" }}>{factCheckResult.summary}</div>
            {factCheckResult.issues.some(function(is) { return is.fix; }) && <button onClick={function() {
              // Auto-apply all fixes that have a suggested correction
              factCheckResult.issues.forEach(function(issue) {
                if (!issue.fix || !issue.slide) return;
                var slideIdx = issue.slide - 1; // fact checker uses 1-indexed
                var curSlide = cur.slides[slideIdx];
                if (!curSlide) return;
                // Find which field the fix applies to — check body first, then heading, then stat
                var fixText = issue.fix;
                if (curSlide.body && issue.issue.toLowerCase().indexOf("body") > -1) { updateSlideField(slideIdx, "body", fixText); }
                else if (curSlide.stat && (issue.issue.toLowerCase().indexOf("stat") > -1 || issue.issue.toLowerCase().indexOf("number") > -1 || issue.issue.toLowerCase().indexOf("revenue") > -1)) { updateSlideField(slideIdx, "stat", fixText); }
                else if (curSlide.quote && issue.issue.toLowerCase().indexOf("quote") > -1) { updateSlideField(slideIdx, "quote", fixText); }
                else if (curSlide.body) {
                  // Default: replace the problematic text in body
                  var newBody = curSlide.body;
                  // Try to find and replace the incorrect part
                  var issueWords = issue.issue.split('"').filter(function(w) { return w.length > 5; });
                  if (issueWords.length > 0) {
                    issueWords.forEach(function(w) { if (newBody.indexOf(w) > -1) newBody = newBody.replace(w, fixText); });
                  }
                  if (newBody !== curSlide.body) updateSlideField(slideIdx, "body", newBody);
                }
              });
              setFactCheckResult(Object.assign({}, factCheckResult, { _applied: true }));
            }}
              style={{ padding: "2px 6px", border: "0.5px solid #22c55e", background: factCheckResult._applied ? "#22c55e22" : "transparent", cursor: "pointer", ...CP, fontSize: 6, color: "#22c55e" }}>
              {factCheckResult._applied ? "\u2713 Applied" : "Apply Fixes"}</button>}
          </div>
          {factCheckResult.issues.map(function(issue, i) { return (
            <div key={i} style={{ ...CP, fontSize: 6, color: "#666", marginBottom: 2 }}>
              <span style={{ color: "#ef4444", fontWeight: 700 }}>Slide {issue.slide}:</span> {issue.issue}
              {issue.fix && <span style={{ color: "#22c55e" }}> {"\u2192"} {issue.fix}</span>}
            </div>
          ); })}
        </div>}
        {factCheckResult && (!factCheckResult.issues || factCheckResult.issues.length === 0) && factCheckResult.score > 0 && <div style={{ marginTop: 4, ...CP, fontSize: 6, color: "#22c55e", textAlign: "center" }}>{"\u2713"} {factCheckResult.summary}</div>}
        {/* Related topics — elevated */}
        {relatedTopics.length > 0 && <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
          <span style={{ ...CP, fontSize: 6, color: "#999" }}>Next:</span>
          {relatedTopics.slice(0, 4).map(function(t, i) { return (
            <button key={i} onClick={function() { setTopic(t); setRelatedTopics([]); setOptions(null); }}
              style={{ padding: "2px 6px", border: "0.5px solid " + uiAccent + "44", background: uiAccent + "08", cursor: "pointer", ...CP, fontSize: 7, color: uiAccent }}>{t}</button>
          ); })}
        </div>}

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

      {/* Related topics after generation */}
      {relatedTopics.length > 0 && options && <div style={{ marginTop: 12, marginBottom: 4 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginBottom: 6 }}>
          <span style={{ ...CP, fontSize: 7, color: "var(--color-text-tertiary)" }}>Related:</span>
          {relatedTopics.map(function(t, i) { return (
            <button key={i} onClick={function() { setTopic(t); setRelatedTopics([]); setOptions(null); }}
              style={{ padding: "3px 8px", border: "0.5px solid " + uiAccent + "44", background: uiAccent + "08", cursor: "pointer", ...CP, fontSize: 8, color: uiAccent }}>{t}</button>
          ); })}
        </div>
        {crossCatRelated.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ ...CP, fontSize: 7, color: "var(--color-text-tertiary)" }}>Related in:</span>
          {crossCatRelated.map(function(x, i) { return (
            <button key={i} onClick={function() { setCategory(x.category); setTopic(x.topic); setRelatedTopics([]); setCrossCatRelated([]); setOptions(null); }}
              style={{ padding: "3px 8px", border: "0.5px solid var(--color-border-tertiary)", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: "var(--color-text-secondary)" }}>{x.topic} <span style={{ fontSize: 6, color: uiAccent }}>({x.category})</span></button>
          ); })}
        </div>}
      </div>}

      {/* Claude-generated "If you liked this..." */}
      {claudeRelated.length > 0 && options && <div style={{ marginBottom: 4 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ ...CP, fontSize: 7, color: "var(--color-text-tertiary)" }}>If you liked this:</span>
          {claudeRelated.map(function(cr, i) { return (
            <button key={i} onClick={function() { var c = CATEGORIES.find(function(x) { return x.label.toLowerCase().indexOf(cr.category.toLowerCase()) !== -1 || x.id === cr.category; }); setTopic(cr.topic); if (c) setCategory(c.id); setClaudeRelated([]); setOptions(null); }}
              style={{ padding: "3px 8px", border: "0.5px solid " + uiAccent + "33", background: "transparent", cursor: "pointer", ...CP, fontSize: 7, color: "var(--color-text-secondary)" }} title={cr.hook}>{cr.topic}</button>
          ); })}
        </div>
      </div>}


      {/* Topic chain breadcrumb */}
      {topicChain.length > 1 && <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", marginBottom: 8, alignItems: "center" }}>
        <span style={{ ...CP, fontSize: 6, color: "var(--color-text-tertiary)" }}>Journey:</span>
        {topicChain.map(function(tc, i) { return (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <button onClick={function() { setTopic(tc.topic); setCategory(tc.category); setOptions(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", ...CP, fontSize: 6, color: i === topicChain.length - 1 ? uiAccent : "var(--color-text-tertiary)", textDecoration: i === topicChain.length - 1 ? "none" : "underline" }}>{tc.topic}</button>
            {i < topicChain.length - 1 && <span style={{ ...CP, fontSize: 6, color: "var(--color-text-tertiary)" }}>{"\u2192"}</span>}
          </span>
        ); })}
      </div>}

      {/* Favorites panel */}
      {favorites.length > 0 && <div style={{ textAlign: "center", marginBottom: 8 }}>
        <button onClick={function() { setShowFavorites(!showFavorites); }}
          style={{ background: "none", border: "none", cursor: "pointer", ...CP, fontSize: 7, color: "var(--color-text-tertiary)", opacity: 0.6 }}>
          {showFavorites ? "\u25B2 HIDE FAVORITES" : "\u2605 FAVORITES (" + favorites.length + ")"}
        </button>
        {showFavorites && <div style={{ marginTop: 4, padding: 6, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
          {favorites.map(function(f, i) {
            var catLabel = (CATEGORIES.find(function(x) { return x.id === f.category; }) || {}).label || "";
            return <button key={i} onClick={function() { setTopic(f.topic); setCategory(f.category); setShowFavorites(false); }}
              style={{ padding: "3px 8px", border: "0.5px solid " + uiAccent + "33", background: uiAccent + "08", cursor: "pointer", ...CP, fontSize: 7, color: uiAccent }} title={catLabel}>{f.topic}</button>;
          })}
        </div>}
      </div>}

      <div style={{ textAlign: "center", padding: "18px 0 12px", borderTop: "0.5px solid var(--color-border-tertiary)", marginTop: 16 }}>
        <div style={{ ...CP, fontSize: 8, letterSpacing: "0.3em", color: "var(--color-text-tertiary)", opacity: 0.4 }}>L O A T H R</div>
        <div style={{ ...CP, fontSize: 6, letterSpacing: "0.2em", color: "var(--color-text-tertiary)", opacity: 0.3, marginTop: 2 }}>MEDIA MAKER</div>
      </div>
    </div>
  );
}

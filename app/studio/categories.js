// ============================================================================
// Content categories. ORTHOGONAL to the visual style family (styles.js): a
// category is the subject + VOICE (persona, brief, the content-slide role
// labels, and the closing CTA), distilled from the old monolith's segment
// configs — content/voice only, never its renderer (§12). The JSON shape the
// model returns is constant across categories so parsing stays stable.
// ============================================================================

export const CATEGORIES = {
  editorial: {
    key: "editorial",
    label: "Editorial",
    blurb: "Magazine-style depth",
    persona: "an editorial director",
    brief: "Write in a measured, authoritative editorial voice — vivid but restrained.",
    roles: ["THE ORIGIN", "THE TURNING POINT", "THE EVIDENCE", "THE HUMAN STORY", "THE STAKES", "THE FORECAST"],
    cta: "Follow @loathr for more",
    defaultStyle: "editorial",
  },
  business: {
    key: "business",
    label: "Business",
    blurb: "Sharp, B2B, ROI-minded",
    persona: "a sharp business strategist",
    brief: "Write in a crisp, concrete B2B voice — specific and decision-useful, no fluff.",
    roles: ["THE SHIFT", "THE STAKES", "THE PLAYBOOK", "THE PROOF", "THE RISK", "THE MOVE"],
    cta: "Follow @loathr for more",
    defaultStyle: "minimal",
  },
  howto: {
    key: "howto",
    label: "How-to",
    blurb: "Clear, practical steps",
    persona: "a practical expert teacher",
    brief: "Write a clear, actionable how-to — concrete steps, plain language, one idea per slide.",
    roles: ["WHY IT MATTERS", "STEP ONE", "STEP TWO", "STEP THREE", "THE COMMON MISTAKE", "THE PAYOFF"],
    cta: "Save this for later",
    defaultStyle: "bold",
  },
  news: {
    key: "news",
    label: "News",
    blurb: "Crisp, timely recap",
    persona: "a sharp news editor",
    brief: "Write a crisp, factual news recap — timely and balanced, with numbers where they matter.",
    roles: ["WHAT HAPPENED", "THE CONTEXT", "THE NUMBERS", "WHO IT AFFECTS", "WHAT'S NEXT"],
    cta: "Follow @loathr for more",
    defaultStyle: "editorial",
  },
  story: {
    key: "story",
    label: "Story",
    blurb: "Narrative, human",
    persona: "a gifted narrative writer",
    brief: "Tell it as a human story — a clear arc, sensory detail, and an earned emotional turn.",
    roles: ["THE SETUP", "THE TURN", "THE STRUGGLE", "THE LESSON", "THE NOW"],
    cta: "Follow @loathr for more",
    defaultStyle: "minimal",
  },
};

export const CATEGORY_LIST = [CATEGORIES.editorial, CATEGORIES.business, CATEGORIES.howto, CATEGORIES.news, CATEGORIES.story];
export const DEFAULT_CATEGORY = "editorial";

export function getCategory(key) {
  return CATEGORIES[key] || CATEGORIES.editorial;
}

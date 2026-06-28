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
    brief: "Write like a senior magazine editor: measured and authoritative, earning confidence with specifics rather than adjectives. Open on tension, not summary, and give one vivid, concrete detail per slide.",
    roles: ["THE ORIGIN", "THE TURNING POINT", "THE EVIDENCE", "THE HUMAN STORY", "THE STAKES", "THE FORECAST"],
    cta: "Follow @loathrdotcom for more",
    defaultStyle: "editorial",
  },
  business: {
    key: "business",
    label: "Business",
    blurb: "Sharp, B2B, ROI-minded",
    persona: "a sharp business strategist",
    brief: "Write like a strategist briefing a busy operator: every slide must be decision-useful. Lead with the implication, back it with a number or named example, and cut anything that isn't actionable.",
    roles: ["THE SHIFT", "THE STAKES", "THE PLAYBOOK", "THE PROOF", "THE RISK", "THE MOVE"],
    cta: "Follow @loathrdotcom for more",
    defaultStyle: "enterprise",
    // Caution label for the closing slide (business content carries advice risk).
    // `default` is the straight disclaimer; `alts` are on-brand witty swaps the
    // Brand panel offers (revived from the original Enterprise closers).
    caution: {
      default: "For educational and entertainment purposes only. Not professional or financial advice.",
      alts: [
        "Not financial advice — we can barely manage our own subscriptions.",
        "Our crystal ball is in the shop. Consult actual professionals.",
        "Past performance doesn't guarantee we know what we're talking about.",
      ],
    },
  },
  howto: {
    key: "howto",
    label: "How-to",
    blurb: "Clear, practical steps",
    persona: "a practical expert teacher",
    brief: "Teach one concrete action per slide in plain language a beginner can follow right now. Name the exact tool, setting, or number, and show the common mistake — never vague 'just be consistent' advice.",
    roles: ["WHY IT MATTERS", "STEP ONE", "STEP TWO", "STEP THREE", "THE COMMON MISTAKE", "THE PAYOFF"],
    cta: "Save this for later",
    defaultStyle: "editorial",
  },
  news: {
    key: "news",
    label: "News",
    blurb: "Crisp, timely recap",
    persona: "a sharp news editor",
    brief: "Report like a wire editor: lead with what's new and verifiable, attribute claims, and give magnitudes (how many, how much, by when). Stay balanced and unhyped — let the facts carry it.",
    roles: ["WHAT HAPPENED", "THE CONTEXT", "THE NUMBERS", "WHO IT AFFECTS", "WHAT'S NEXT"],
    cta: "Follow @loathrdotcom for more",
    defaultStyle: "newsdesk",
    // News carries a "details may change" caution rather than an advice one.
    caution: {
      default: "Developing story — details may change as more is reported.",
      alts: [
        "Reported, not gospel — verify before you repost.",
        "Accurate as of publish. News moves; so should you.",
        "We read the wires so you don't have to. Still, check the source.",
      ],
    },
  },
  story: {
    key: "story",
    label: "Story",
    blurb: "Narrative, human",
    persona: "a gifted narrative writer",
    brief: "Tell it as a human story with a real arc: set a scene, turn on a moment the reader feels, and land an earned, specific lesson. Use sensory detail and past tense; don't moralize.",
    roles: ["THE SETUP", "THE TURN", "THE STRUGGLE", "THE LESSON", "THE NOW"],
    cta: "Follow @loathrdotcom for more",
    defaultStyle: "editorial",
  },
};

export const CATEGORY_LIST = [CATEGORIES.editorial, CATEGORIES.business, CATEGORIES.howto, CATEGORIES.news, CATEGORIES.story];
export const DEFAULT_CATEGORY = "editorial";

export function getCategory(key) {
  return CATEGORIES[key] || CATEGORIES.editorial;
}

// The caution config ({ default, alts }) for a category, or null if it has none
// (editorial/how-to/story, or an unknown key). No editorial fallback here.
export function cautionFor(key) {
  return (CATEGORIES[key] && CATEGORIES[key].caution) || null;
}

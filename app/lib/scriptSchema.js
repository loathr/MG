// Script generator — schema + helpers shared by the API route and the client.

// Category → bible file. Keep in sync with Network/00_README.md.
export const CHARACTER_FOR_CATEGORY = {
  film: { id: "loathr_bot", name: "Loathr Bot", file: "01_loathr_bot.md" },
  photo: { id: "loathr_bot", name: "Loathr Bot", file: "01_loathr_bot.md" },
  trivia: { id: "loathr_bot", name: "Loathr Bot", file: "01_loathr_bot.md" },
  sports: { id: "ash", name: "Ash", file: "04_ash.md" },
  art: { id: "ash", name: "Ash", file: "04_ash.md" },
  fashion: { id: "ash", name: "Ash", file: "04_ash.md" },
  food: { id: "ash", name: "Ash", file: "04_ash.md" },
  nightlife: { id: "ash", name: "Ash", file: "04_ash.md" },
  gossip: { id: "ash", name: "Ash", file: "04_ash.md" },
  enterprise: { id: "miss_water", name: "Miss Water", file: "02_miss_water.md" },
  newsdesk: { id: "mr_coffee", name: "Mr. Coffee", file: "03_mr_coffee.md" },
};

// Carousel option id → bible mode id.
export const MODE_MAPPING = {
  deep: "deep_dive",
  hot: "hot_take",
  timeline: "timeline",
};

export const VALID_MODES = ["deep_dive", "hot_take", "timeline"];

// Tool definition the model is forced to call. Output shape is the input_schema below.
export const SCRIPT_TOOL = {
  name: "submit_script",
  description:
    "Submit the finished video script. The cold_open and sign_off MUST be selected verbatim from the rotation library in your bible — do not invent new ones. Each beat is one delivered unit of the script.",
  input_schema: {
    type: "object",
    properties: {
      cold_open: {
        type: "string",
        description: "One of the cold opens from the bible's rotation library, with [topic] etc. filled in.",
      },
      beats: {
        type: "array",
        minItems: 3,
        maxItems: 8,
        items: {
          type: "object",
          properties: {
            text: { type: "string", description: "What the character says, in their voice." },
            animation_note: {
              type: "string",
              description:
                "Optional one-line gesture/expression cue from the bible's signature animation list (e.g. 'arms crossed', 'leans forward'). Omit if none fits.",
            },
          },
          required: ["text"],
        },
      },
      sign_off: {
        type: "string",
        description: "One of the sign-offs from the bible's rotation library.",
      },
    },
    required: ["cold_open", "beats", "sign_off"],
  },
};

// Strip a slide down to fields the bibles read. Drops layout/style/image fields.
const SCRIPT_FIELDS = [
  "title",
  "subtitle",
  "heading",
  "leadParagraph",
  "body",
  "highlight",
  "quote",
  "source",
  "stat",
  "statCaption",
  "caption",
  "relatedBody",
  "sources",
  "person",
  "hashtags",
  "funnyLine",
  "disclaimer",
];

export function extractCarouselPayload(topic, category, slides) {
  return {
    topic: topic || "",
    category: category || "",
    slides: (slides || [])
      .filter((s) => s && !s._deleted)
      .map((s) => {
        const out = {};
        SCRIPT_FIELDS.forEach((f) => {
          if (s[f] !== undefined && s[f] !== null && s[f] !== "") out[f] = s[f];
        });
        return out;
      })
      .filter((s) => Object.keys(s).length > 0),
  };
}

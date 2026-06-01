import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import {
  CHARACTER_FOR_CATEGORY,
  SCRIPT_TOOL,
  VALID_MODES,
} from "../../lib/scriptSchema.js";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 5000, 10000];

async function callAnthropic(payload, apiKey, attempt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!text) throw new Error(`Empty response (status ${response.status})`);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON: ${text.slice(0, 200)}`);
  }

  if (
    (response.status === 529 || data.error?.type === "overloaded_error") &&
    attempt < MAX_RETRIES
  ) {
    await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt] || 5000));
    return callAnthropic(payload, apiKey, attempt + 1);
  }

  if (response.status === 429 && attempt < MAX_RETRIES) {
    const retryAfter = parseInt(response.headers.get("retry-after") || "5", 10);
    const delay = Math.max(retryAfter * 1000, RETRY_DELAYS[attempt] || 5000);
    await new Promise((r) => setTimeout(r, delay));
    return callAnthropic(payload, apiKey, attempt + 1);
  }

  if (!response.ok) {
    return {
      error: data.error?.message || `API error (${response.status})`,
      status: response.status,
    };
  }
  return { data, status: 200 };
}

function extractBibleVersion(bibleText) {
  const m = bibleText.match(/\*\*Bible version:\*\*\s+(v[\d.]+)/);
  return m ? m[1] : "unknown";
}

// Load a character's signature library from signatures/<character>_<kind>.json.
// Returns null if the file doesn't exist or can't be parsed — caller falls back to model-choice.
async function loadSignatures(character, kind) {
  try {
    const filePath = path.join(process.cwd(), "signatures", `${character}_${kind}.json`);
    const raw = await fs.readFile(filePath, "utf-8");
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return null;
    return items;
  } catch {
    return null;
  }
}

// Weighted random pick. Items can opt out via weight: 0 (e.g. handoff-only sign-offs).
function pickWeighted(items) {
  const eligible = items.filter((i) => i && typeof i.text === "string" && (i.weight ?? 1) > 0);
  if (!eligible.length) return null;
  const total = eligible.reduce((s, i) => s + (i.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const item of eligible) {
    r -= item.weight ?? 1;
    if (r <= 0) return item;
  }
  return eligible[eligible.length - 1];
}

// Words that should lowercase when a topic is embedded mid-sentence.
// Without this, "...about [topic]" with topic="Why X happened" produces "...about Why X happened."
const QUESTION_WORDS = new Set([
  "why", "how", "what", "when", "where", "who", "which", "whose",
  "should", "will", "can", "could", "would",
  "does", "do", "did",
  "is", "are", "was", "were",
  "has", "have", "had",
  "if",
]);

function smartLowerFirst(s) {
  const m = (s || "").match(/^(\w+)(.*)$/);
  if (!m) return s;
  if (QUESTION_WORDS.has(m[1].toLowerCase())) {
    return m[1].toLowerCase() + m[2];
  }
  return s;
}

// Replace [topic] respecting position: keep caps at sentence-start, smart-lower mid-sentence.
function fillTopic(text, topic) {
  if (!text || !topic) return text;
  const TOKEN = "[topic]";
  let result = "";
  let i = 0;
  while (i < text.length) {
    const idx = text.toLowerCase().indexOf(TOKEN, i);
    if (idx === -1) {
      result += text.slice(i);
      break;
    }
    result += text.slice(i, idx);
    // Look back through whitespace at the most recent non-space char in result so far.
    const trimmed = result.replace(/\s+$/, "");
    const lastChar = trimmed.slice(-1);
    const isSentenceStart = lastChar === "" || ".:!?".indexOf(lastChar) !== -1;
    result += isSentenceStart ? topic : smartLowerFirst(topic);
    i = idx + TOKEN.length;
  }
  return result;
}

// Replace placeholders before handing to the model.
function fillTemplate(text, vars) {
  if (!text) return text;
  let out = text;
  // [NN] — Loathr Bot file number convention. Random 3-digit, zero-padded.
  out = out.replace(/\[NN\]/g, () =>
    String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")
  );
  // [topic] / [Topic] — smart-cased substitution.
  out = fillTopic(out, vars.topic || "");
  return out;
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const carousel = body.carousel;
    const mode = body.mode;

    if (!carousel || !carousel.category || !carousel.topic || !Array.isArray(carousel.slides)) {
      return NextResponse.json(
        { error: "Invalid carousel payload — need { topic, category, slides[] }" },
        { status: 400 }
      );
    }
    if (!VALID_MODES.includes(mode)) {
      return NextResponse.json(
        { error: `Invalid mode '${mode}'. Expected one of: ${VALID_MODES.join(", ")}` },
        { status: 400 }
      );
    }

    const charMap = CHARACTER_FOR_CATEGORY[carousel.category];
    if (!charMap) {
      return NextResponse.json(
        { error: `No character mapped for category '${carousel.category}'` },
        { status: 400 }
      );
    }

    const biblePath = path.join(process.cwd(), "Network", charMap.file);
    let bibleText;
    try {
      bibleText = await fs.readFile(biblePath, "utf-8");
    } catch {
      return NextResponse.json(
        { error: `Bible file not readable: Network/${charMap.file}` },
        { status: 500 }
      );
    }
    const bibleVersion = extractBibleVersion(bibleText);

    // Server-side rotation. If a signatures library exists for this character,
    // pick the cold open and sign-off here and pass them as hard constraints.
    // Falls back to model-choice for characters without a JSON library yet.
    const [opensLib, closesLib] = await Promise.all([
      loadSignatures(charMap.id, "opens"),
      loadSignatures(charMap.id, "closes"),
    ]);
    const pickedOpenItem = opensLib ? pickWeighted(opensLib) : null;
    const pickedCloseItem = closesLib ? pickWeighted(closesLib) : null;
    const pickedOpen = pickedOpenItem
      ? fillTemplate(pickedOpenItem.text, { topic: carousel.topic })
      : null;
    const pickedClose = pickedCloseItem
      ? fillTemplate(pickedCloseItem.text, { topic: carousel.topic })
      : null;

    const constraintLines = [];
    if (pickedOpen) {
      constraintLines.push(
        `cold_open MUST be EXACTLY: "${pickedOpen}"  (server-rotated; do not paraphrase, substitute, or shorten)`
      );
    }
    if (pickedClose) {
      constraintLines.push(
        `sign_off MUST be EXACTLY: "${pickedClose}"  (server-rotated; do not paraphrase, substitute, or shorten)`
      );
    }
    const constraintBlock = constraintLines.length
      ? "\n\n[ROTATION CONSTRAINT — server-selected, non-negotiable]\n- " +
        constraintLines.join("\n- ") +
        "\n[End of rotation constraint]"
      : "";

    const userPayload = JSON.stringify(
      { carousel_content: carousel, mode },
      null,
      2
    );

    const userPrompt =
      userPayload +
      constraintBlock +
      "\n\n---\n\nGenerate the video script. Follow the bible's voice rules and the mode-specific structure exactly." +
      (constraintBlock
        ? " The cold_open and sign_off above are server-selected — copy them verbatim into the corresponding fields. Focus your judgment on the beats."
        : " Pick the cold_open and sign_off VERBATIM from your rotation library — do not invent.") +
      " Submit through the submit_script tool.";

    const payload = {
      model: body.model || "claude-opus-4-7",
      max_tokens: 4000,
      system: bibleText,
      messages: [{ role: "user", content: userPrompt }],
      tools: [SCRIPT_TOOL],
      tool_choice: { type: "tool", name: "submit_script" },
    };

    const result = await callAnthropic(payload, apiKey, 0);
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 502 }
      );
    }

    const toolBlock = (result.data.content || []).find(
      (b) => b.type === "tool_use" && b.name === "submit_script"
    );
    if (!toolBlock || !toolBlock.input) {
      return NextResponse.json(
        { error: "Model did not call submit_script tool" },
        { status: 502 }
      );
    }

    // If we passed a server-rotation constraint, prefer the picked text over
    // whatever the model returned — guards against any stray paraphrase.
    const finalOpen = pickedOpen || toolBlock.input.cold_open || "";
    const finalClose = pickedClose || toolBlock.input.sign_off || "";

    const out = {
      version: 1,
      bible: `${charMap.id}@${bibleVersion}`,
      character: charMap.id,
      character_name: charMap.name,
      mode,
      topic: carousel.topic,
      category: carousel.category,
      cold_open: finalOpen,
      beats: Array.isArray(toolBlock.input.beats) ? toolBlock.input.beats : [],
      sign_off: finalClose,
      generated_at: new Date().toISOString(),
      rotation: {
        cold_open: pickedOpen ? "server" : "model",
        sign_off: pickedClose ? "server" : "model",
      },
    };
    return NextResponse.json(out);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

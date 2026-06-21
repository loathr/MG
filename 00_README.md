# Loathr Network — Character Bibles

This directory contains the working system prompts for the script generation pipeline. Each character bible is a drop-in `system` message for the Claude API call that converts carousel content into character-voiced video scripts.

## Cast

| File | Character | Page | Lanes | Role |
|------|-----------|------|-------|------|
| `01_loathr_bot.md` | Loathr Bot | Page 1 (Studio) | Film & TV, Photography, Did You Know? | Network mascot, connoisseur |
| `02_miss_water.md` | Miss Water | Page 2 (Enterprise) | Business analysis | Industry analyst |
| `03_mr_coffee.md` | Mr. Coffee [black] | Page 2 (Enterprise) | News Desk lead | News anchor |
| `04_ash.md` | Ash | Page 1 (Studio) | All 6 culture lanes | Co-host (maximalist) |
| `05_snow.md` | Snow | Page 1 (Studio) | All 6 culture lanes | Co-host (minimalist) |

## How to use

Each bible is structured to function as a system prompt. The script generator's API call shape:

```
system: <contents of the relevant bible .md file>
user: {
  "carousel_content": <structured carousel JSON>,
  "mode": "deep_dive" | "hot_take" | "timeline" | "split_verdict",
  "partner_handoff": <optional, for Page 2 handoffs and Page 1 split verdicts>
}
```

The model returns structured JSON conforming to `script.schema.json` (see parent project).

## Versioning

Each bible has a `Bible version` field at the top. When a bible is updated, increment the version. All scripts generated should be tagged with the bible version that produced them, for downstream debugging and consistency tracking.

## What lives outside the bibles

- **Visual specifications** for animation reference live in `design_brief_*.pdf` files and `visual_specs/`.
- **Voice specifications** (ElevenLabs voice IDs, prosody notes, sample audio) live in `voice_specs/`.
- **Script templates** (mode structures: deep dive, hot take, timeline, split verdict) live in `script_templates/`.
- **Signature libraries** (cold opens, sign-offs) are listed in each bible but should also live as JSON files for programmatic rotation: `signatures/<character>_opens.json`, `signatures/<character>_closes.json`.

## Editorial governance

The bibles are the network's brand voice in document form. Treat them as production assets:

- Changes go through review.
- Substantial voice shifts require a major version bump and may invalidate older content.
- Add new signature constructions with care — they are quoted by the audience and become part of the brand.
- Banned moves are non-negotiable in production scripts.

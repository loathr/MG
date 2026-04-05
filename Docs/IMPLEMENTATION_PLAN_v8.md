# LOATHR Media Generator — v8 Magazine Edition System
## Implementation Plan (Saved Apr 5, 2026)

---

## Overview
Transform each carousel generation into a unique "magazine issue" with varied content, dynamic visuals, and editorial identity.

## 8 Features

### 1. Editorial Personas
5 rotating voices: Historian, Critic, Insider, Storyteller, Researcher
- Randomly assigned per generation
- Controls tone, vocabulary, and perspective
- Consistent across all slides in one carousel

### 2. Freshness Seeds
8 angle constraints injected into prompts:
- Economics/money, Psychology, Technology disruption
- Cultural clash, Untold backstory, Bold prediction
- Failure story, Surprising parallel

### 3. Writing Styles
5 slide content schemas that rotate:
- Classic (heading, body, highlight)
- Interview (question, answer, quotable)
- Manifesto (declaration, evidence, challenge)
- Observation (scene-setting, first-person)
- Contrast (then vs now, comparison)

### 4. Micro-Citations
- Prompt requests `sources` field on each slide
- Rendered as 4px text, 33% opacity, bottom-right
- Format: "MIT, 2023" or "via The Guardian"

### 5. Per-Slide Image Search
- Each slide gets unique search query from its heading/keywords
- Instead of one query for whole carousel
- getSlideImageQuery() builds query from slide content

### 6. Mixed API Sources Per Slide
- Alternates between stock (Unsplash/Pexels) and vintage APIs per slide
- Slide 1: stock, Slide 2: Met Museum, Slide 3: Pexels, etc.
- Creates magazine collage mixing photography + art + archival

### 7. Image Filter Rotation
5 CSS filter presets rotating per slide:
- Default: saturate(0.85) brightness(0.75)
- Documentary: grayscale(0.4) contrast(1.1)
- Vintage warmth: sepia(0.25) brightness(0.85)
- Vivid: saturate(1.2) brightness(0.7) contrast(1.05)
- Black & white: grayscale(1) brightness(0.85)

### 8. Edition Identity
- Deterministic issue number from topic hash (ISSUE 347)
- Current month/year stamp
- Displayed on cover
- Subtle palette hue shift per edition (±5-15 degrees)

## Category-to-API Mapping
| Category | Primary Vintage | Secondary Vintage |
|----------|----------------|-------------------|
| Film | Library of Congress | Met Museum |
| Photography | Met Museum | Art Institute Chicago |
| Sports | Library of Congress | Europeana |
| Trivia | Library of Congress | NASA |
| Art | Met Museum | Art Institute Chicago |
| Fashion | Met Museum | Europeana |
| Food | Europeana | Library of Congress |
| Nightlife | Library of Congress | Europeana |

## Execution Order
1. Add constants (top of file)
2. Add utility functions
3. Update buildPrompt()
4. Update generate() image search
5. Add IMG_FILTERS to slide components
6. Add micro-citations render
7. Add edition tag to cover
8. Add cover layout rotation

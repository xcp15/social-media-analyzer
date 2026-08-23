# Social Media Content Analyzer

Upload a PDF or image (JPG/JPEG/PNG) of a social media post. The app extracts
the text (PDF parsing or OCR), sends it to an LLM for analysis, and returns
an engagement score with strengths, weaknesses, and suggestions.

> Status: in progress — this README will be filled in as each milestone lands.

## Project structure

```
social-media-analyzer/
├── frontend/   React + TypeScript + Tailwind CSS + Vite
└── backend/    Node.js + Express + TypeScript
```

## AI/LLM use

This project intentionally calls a free-tier LLM API server-side to analyze
extracted post text. The assignment explicitly permits this ("Free to use
AI/ML services, any free tier") — it is a deliberate design choice, not a
shortcut.

Model: Google Gemini (`gemini-flash-lite-latest`, free tier), called from
`backend/src/services/analysisService.ts`. The API key is never exposed to
the frontend — all calls happen server-side. The request uses Gemini's
structured output mode (`responseSchema`) so the model is constrained to
return valid JSON matching the shape below, rather than relying on prompt
wording alone.

**For image uploads, the actual image is sent to Gemini** (as inline base64
data alongside the extracted OCR text), so "Visual Appeal" reflects a real
vision-based assessment of the image — not a guess from OCR'd text. For
PDFs, only the extracted text is available, so `visualAppeal` is omitted
from the request/response entirely rather than having the model invent a
number for something it never saw.

Exact prompt template (`${text}` is the extracted post text; the bracketed
line and the `visualAppeal` field are included only when an image is
attached):

```
You are a social media growth expert. Analyze the following social media post[, including the attached image,] across specific dimensions.

Post text:
"""
${text}
"""

Score each applicable dimension from 0-100:
- hook: does the opening immediately capture attention and create curiosity?
- clarity: how clear, readable, and easy to understand is the message?
- callToAction: does the post ask the audience to do something specific (comment, share, click, etc.)? Score low if there is no call to action.
- visualAppeal: composition, readability of any on-image text, visual hierarchy, and whether the image supports the message.  [omitted entirely when no image is attached]
- engagementPotential: overall likelihood of likes/comments/shares, considering the whole post (not a duplicate of the other scores).

Respond with ONLY a JSON object (no markdown, no commentary) with this exact shape:
{
  "scoreBreakdown": {
    "hook": <integer 0-100>,
    "clarity": <integer 0-100>,
    "callToAction": <integer 0-100>,
    "visualAppeal": <integer 0-100>,
    "engagementPotential": <integer 0-100>
  },
  "strengths": [<short strings describing what the post does well>],
  "weaknesses": [<short strings describing what could hurt engagement>],
  "suggestions": [<short, actionable strings to improve the post>]
}
```

### Overall score: computed, not model-guessed

The model is **not** asked for an overall score directly. Instead, the
backend computes it deterministically as a weighted average of the five
dimension scores (`backend/src/services/analysisService.ts`, `SCORE_WEIGHTS`):

| Dimension | Weight |
|---|---|
| Hook | 0.25 |
| Clarity | 0.20 |
| Call to Action | 0.20 |
| Visual Appeal | 0.15 |
| Engagement Potential | 0.20 |

This guarantees the headline score and its breakdown always tell the same
story (an LLM asked to output both independently can produce an overall
score that doesn't match its own breakdown). When `visualAppeal` is
unavailable (PDF text, or the model omitted/malformed a dimension), that
weight is redistributed proportionally across the remaining dimensions
rather than penalizing the post for something that was never assessed. If
every dimension is unusable, the request fails with a clean error instead
of returning a meaningless score.

The response is still defensively parsed and validated server-side — every
dimension is checked to be a finite number and clamped to 0-100; malformed,
empty, or failed LLM responses surface a clean error to the user instead of
crashing the request.

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in GEMINI_API_KEY
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Known limitations

- **Loading states are two-staged, not four.** The spec's ideal flow is
  uploading → extracting → analyzing → done. Extraction and analysis happen
  inside a single backend request/response (no streaming), so the frontend
  can only honestly distinguish "uploading" (real byte progress via
  `XMLHttpRequest.upload.onprogress`) from "analyzing" (the whole
  extract+LLM window). Splitting those two further would need
  Server-Sent Events or WebSockets, which was cut to stay in scope —
  no fake/timed progress is shown either way.
- **Scanned/image-only PDFs are not OCR'd.** If `pdf-parse` extracts little
  or no text, the app returns a clear error asking the user to upload the
  page as an image instead, rather than rendering PDF pages to images for
  OCR (which would need a native canvas dependency).

## Future improvements

- Persistence (save past analyses) and a database
- User accounts / auth
- OCR fallback for scanned PDFs via server-side page rendering
- Streaming progress (SSE/WebSockets) for true multi-stage loading states

## Roadmap

- [x] Project structure
- [x] Upload UI with drag-and-drop
- [x] Express backend with health check
- [x] PDF and OCR text extraction
- [x] LLM analysis service
- [x] Results dashboard
- [x] Error handling and loading states
- [ ] Deploy and verify production

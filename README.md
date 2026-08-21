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
shortcut. Details on the exact prompt used will be added once the analysis
service is implemented.

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

## Roadmap

- [x] Project structure
- [ ] Upload UI with drag-and-drop
- [ ] Express backend with health check
- [ ] PDF and OCR text extraction
- [ ] LLM analysis service
- [ ] Results dashboard
- [ ] Error handling and loading states
- [ ] Deploy and verify production

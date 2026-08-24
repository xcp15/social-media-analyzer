# Social Media Content Analyzer

> **AI-powered social media post analysis with deterministic engagement scoring and actionable recommendations.**

The **Social Media Content Analyzer** is a web application that analyzes social media posts uploaded as **PDF, JPG, JPEG, or PNG** files.

The application extracts the post content using **PDF parsing or OCR**, analyzes it using **Google Gemini**, and generates an engagement report containing:

* Overall engagement score
* Dimension-level score breakdown
* Strengths
* Weaknesses
* Actionable suggestions

For image uploads, the original image is also analyzed by Gemini's vision capabilities so that **Visual Appeal** is evaluated from the actual image rather than only its extracted text.

---

## Live Demo

**App:** https://social-media-analyzer-tan.vercel.app

**Deployment**

* **Frontend:** Vercel
* **Backend:** Render
* **LLM:** Google Gemini

> **Note:** The backend is deployed on Render's free tier. After approximately 15 minutes of inactivity, the service may spin down. The first request after an idle period can therefore take around **30–50 seconds** while the server wakes up. Subsequent requests respond normally.

---

## Features

### File Upload

Supports:

* PDF
* JPG
* JPEG
* PNG

The frontend supports both **drag-and-drop** and standard file selection.

### Text Extraction

The backend extracts post content using:

* **PDF:** `pdf-parse`
* **Images:** OCR

### AI-Powered Analysis

Google Gemini analyzes the post across five engagement dimensions:

| Dimension            | Description                                | Weight |
| -------------------- | ------------------------------------------ | -----: |
| Hook                 | Ability to immediately capture attention   |    25% |
| Clarity              | Readability and clarity of the message     |    20% |
| Call to Action       | Effectiveness of the CTA                   |    20% |
| Visual Appeal        | Composition, hierarchy, and visual quality |    15% |
| Engagement Potential | Overall likelihood of interaction          |    20% |

The analyzer also returns:

* Strengths
* Weaknesses
* Actionable suggestions

---

## How It Works

```text
User Uploads Post
        │
        ▼
   File Detection
        │
   ┌────┴─────┐
   │          │
  PDF       Image
   │          │
   ▼          ▼
PDF Parsing   OCR
   │          │
   └────┬─────┘
        │
        ▼
  Extracted Text
        │
        ▼
  Google Gemini
        │
        ▼
Structured Analysis
        │
        ▼
Deterministic Score
   Calculation
        │
        ▼
 Results Dashboard
```

---

# AI / LLM Implementation

The application uses **Google Gemini** through a server-side API integration.

### Model

```text
gemini-flash-lite-latest
```

The analysis service is implemented in:

```text
backend/src/services/analysisService.ts
```

The Gemini API key is stored exclusively on the backend and is **never exposed to the frontend**.

### Structured Output

Gemini's structured output capability with `responseSchema` is used to constrain the response to the expected JSON structure.

```json
{
  "scoreBreakdown": {
    "hook": 0,
    "clarity": 0,
    "callToAction": 0,
    "visualAppeal": 0,
    "engagementPotential": 0
  },
  "strengths": [],
  "weaknesses": [],
  "suggestions": []
}
```

This makes the response easier to validate and consume reliably on the backend.

---

## Image Analysis

For image uploads, the actual image is sent to Gemini as inline image data alongside the OCR-extracted text.

This allows the model to evaluate:

* Composition
* Visual hierarchy
* Readability of on-image text
* Layout
* Whether the visual supports the message

Therefore, **Visual Appeal** is based on the actual uploaded image.

For PDFs, only extracted text is available. Since the application does not render PDF pages into images, `visualAppeal` is omitted when visual information is unavailable rather than allowing the model to invent a score.

---

# Deterministic Overall Score

The model is **not asked to generate the overall score**.

Instead, the backend calculates the final score using a weighted average of the individual dimensions.

```text
Overall Score =
    Hook × 0.25
  + Clarity × 0.20
  + CallToAction × 0.20
  + VisualAppeal × 0.15
  + EngagementPotential × 0.20
```

This ensures that the headline score always remains consistent with the displayed score breakdown.

### Missing Dimensions

When `visualAppeal` is unavailable, its weight is redistributed proportionally across the remaining dimensions.

This prevents a post from being penalized for a dimension that could not actually be assessed.

If every dimension is unusable, the backend returns a clean error instead of producing a meaningless score.

---

# Server-Side Validation

LLM responses are validated before being returned to the frontend.

For every score, the backend:

1. Checks that the value is numeric
2. Ensures the value is finite
3. Clamps it to the `0–100` range
4. Rejects unusable responses
5. Returns a clean error for malformed or failed responses

This prevents invalid LLM output from reaching the scoring system or crashing the request.

---

# Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express
* TypeScript

### AI & Processing

* Google Gemini API
* OCR
* `pdf-parse`

### Deployment

* Vercel
* Render

---

# Project Structure

```text
social-media-analyzer/
│
├── frontend/
│   └── React + TypeScript + Tailwind CSS + Vite
│
├── backend/
│   └── Node.js + Express + TypeScript
│
└── README.md
```

---

# Getting Started

## Prerequisites

* Node.js
* npm
* Google Gemini API key

## Backend

```bash
cd backend

npm install

cp .env.example .env
```

Add your Gemini API key to `.env`:

```env
GEMINI_API_KEY=your_api_key_here
```

Start the development server:

```bash
npm run dev
```

## Frontend

Open another terminal:

```bash
cd frontend

npm install

npm run dev
```

---

# API Architecture

The application follows a client-server architecture:

```text
React Frontend
      │
      │ HTTP Request
      ▼
Express Backend
      │
      ├── File Validation
      ├── PDF Parsing / OCR
      ├── Gemini Analysis
      ├── Response Validation
      └── Score Calculation
      │
      ▼
Structured JSON Response
      │
      ▼
Results Dashboard
```

All Gemini API communication happens on the backend, keeping the API key private and separating AI processing from the client.

---

# Loading Flow

The application intentionally uses two loading stages:

```text
Uploading → Analyzing → Complete
```

Upload progress is reported using:

```text
XMLHttpRequest.upload.onprogress
```

Extraction and analysis currently happen within the same backend request, so the frontend does not display artificial progress between them.

A more granular flow such as:

```text
Uploading → Extracting → Analyzing → Complete
```

would require streaming communication such as **Server-Sent Events (SSE)** or **WebSockets**.

---

# Known Limitations

### Scanned / Image-only PDFs

Scanned PDFs are currently not OCR'd.

If `pdf-parse` extracts little or no usable text, the application returns a clear error asking the user to upload the page as an image instead.

Rendering PDF pages into images for OCR would require additional server-side PDF rendering dependencies.

### Backend Cold Starts

The backend runs on Render's free tier and may spin down after inactivity.

As a result, the first request after an idle period can take significantly longer than subsequent requests.

### No Persistence

Analyses are currently processed per request and are not stored in a database.

---

## Project Status

**Completed and deployed.**

The application has been deployed to production and verified with the implemented upload, extraction, AI analysis, scoring, error handling, and results dashboard flows.

# ESG News Analyzer & Sentiment Tracker

A full-stack web application that aggregates ESG (Environmental, Social, Governance) news about companies, analyzes sentiment using AI or rule-based logic, auto-categorizes articles into E/S/G, and provides dashboards and AI-generated summaries.

---

## Problem Statement

Understanding how companies perform on ESG metrics is important for investors, regulators, and the public. Manually tracking and classifying ESG news is time-consuming and inconsistent. This project addresses:

- **Aggregation:** Centralising ESG-related news for a set of companies in one place.
- **Sentiment analysis:** Automatically labelling each article as positive, negative, or neutral (with a score).
- **Categorisation:** Tagging articles as Environmental, Social, and/or Governance.
- **Insights:** Providing trend visualisations and concise AI-generated summaries so users can quickly see key ESG themes and sentiment over time.

The application enables users to search for a company, view its ESG news, filter by category, re-analyze articles with AI, and explore trends and summaries—all through a single interface.

---

## Features

| Feature | Description |
|--------|-------------|
| **Company search** | Search and select from sample companies (e.g. Tesla, Amazon, Microsoft, BP, Unilever, Patagonia, Nike, Nestlé, Google, Walmart). |
| **ESG news list** | View all stored news articles for the selected company with title, summary, source, date, sentiment, and categories. |
| **Category filter** | Filter news by **Environmental**, **Social**, or **Governance** (or view all). |
| **Sentiment analysis** | Each article shows a sentiment (Positive / Negative / Neutral) and score. Use **Re-analyze with AI** to refresh analysis when an AI API key is set. |
| **AI categorisation** | Articles are tagged into E/S/G; AI is used when an API key is configured, otherwise rule-based keyword logic is used. |
| **Trend dashboard** | Line chart (sentiment over time), pie and bar charts (distribution by E/S/G), and a timeline of ESG events. |
| **AI summary** | Generate a short summary of key ESG issues and trending topics for the selected company. |
| **Responsive UI** | Layout works on desktop and mobile. |

---

## Tech Stack

- **Frontend:** React (Vite), Recharts for charts
- **Backend:** Node.js, Express
- **Database:** SQLite (better-sqlite3)
- **AI:** Optional — OpenAI or Google Gemini API for sentiment, categorisation, and summaries; built-in rule-based fallback when no API key is set

---

## Project Structure

```
├── client/                 # React (Vite) frontend
│   ├── src/
│   │   ├── App.jsx         # Main app, search, news, dashboard, summary
│   │   └── main.jsx
│   └── vite.config.js      # Dev server + API proxy
├── server/                 # Express API + DB
│   ├── index.js            # API routes
│   ├── db.js               # SQLite schema + seed data
│   ├── ai.js               # Sentiment, categorisation, summary (AI + rule-based)
│   ├── esg.db              # SQLite database (seed articles)
│   └── .env.example        # Example env vars (copy to .env)
├── package.json            # Root scripts (concurrently: server + client)
├── README.md               # This file
└── SUBMISSION.txt          # Submission links and details
```

---

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm** (comes with Node.js)

---

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

2. **Install all dependencies** (root, client, and server)
   ```bash
   npm run install:all
   ```
   Or manually:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

3. **Optional — AI (OpenAI or Gemini)**  
   For live AI sentiment, categorisation, and summaries:
   - Copy `server/.env.example` to `server/.env`
   - Set one of:
     - `OPENAI_API_KEY=your_openai_key`  
     - `GEMINI_API_KEY=your_gemini_key`  
   Without any API key, the app uses built-in rule-based analysis and still runs fully.

---

## How to Run

### Development (recommended)

```bash
npm run dev
```

- **API server:** http://localhost:3001  
- **Client:** http://localhost:5173 (or next free port, e.g. 5174, 5175)  
- The client is configured to call the API at `http://localhost:3001` in dev.

Open the **client** URL in your browser. Search for a company, view news, use the category filter, re-analyze articles, and generate summaries as needed.

### Production build

```bash
npm run build
cd server && node index.js
```

- The server serves the built client from `client/dist` and the API from the same origin (e.g. http://localhost:3001).

---

## Configuration

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001). |
| `OPENAI_API_KEY` | Optional. OpenAI API key for sentiment, categorisation, and summaries. |
| `GEMINI_API_KEY` | Optional. Google Gemini API key for the same AI features (used if set and OpenAI is not). |

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies` | List all companies. |
| GET | `/api/companies/search?q=` | Search companies by name. |
| GET | `/api/news/:companyId` | News for a company; optional `?category=Environmental\|Social\|Governance`. |
| POST | `/api/analyze/sentiment` | Body: `{ companyName, title, summary }` → sentiment + score. |
| POST | `/api/analyze/categorize` | Body: `{ companyName, title, summary }` → categories. |
| POST | `/api/analyze/analyze-article` | Full analysis (sentiment + categories). |
| PATCH | `/api/articles/:id` | Update article sentiment/categories. |
| GET | `/api/summary/:companyId` | AI-generated ESG summary. |
| GET | `/api/trends/:companyId` | Sentiment over time, category distribution, timeline. |

---

## Database

- **File:** `server/esg.db` (SQLite)
- **Tables:** `companies`, `articles`
- **Seed data:** 30 sample ESG articles across the listed companies with pre-filled sentiment and categories. The app creates tables and seeds data on first run if needed.

---

## Demo / Screenshots

- Use the **category filter** dropdown (Environmental / Social / Governance) to filter the news list.
- Use **Re-analyze with AI** on an article when an API key is set to refresh sentiment and categories.
- Use **Generate summary** to get an AI (or rule-based) overview for the selected company.

*(You can add screenshots or a short video link here for your submission.)*

---

## License

MIT.

---

## Submission

This project is submitted as part of the assignment. See **SUBMISSION.txt** for repository link, video demo link, problem statement, and AI usage report.

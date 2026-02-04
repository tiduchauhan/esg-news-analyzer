# AI Usage Report
## ESG News Analyzer & Sentiment Tracker — Assignment 2

---

### 1. Overview

This document describes how AI (and rule-based alternatives) are used in the ESG News Analyzer project for sentiment analysis, ESG categorisation, and summary generation. The application supports both external AI APIs (OpenAI, Google Gemini) and a built-in rule-based fallback so it can run without any API keys.

---

### 2. AI Tools and APIs Used

| Tool / Approach        | Purpose                          | When used                                      |
|------------------------|----------------------------------|------------------------------------------------|
| **OpenAI API** (GPT)   | Sentiment, categorisation, summary | When `OPENAI_API_KEY` is set in `server/.env` |
| **Google Gemini API**  | Same as above                    | When `GEMINI_API_KEY` is set (alternative to OpenAI) |
| **Rule-based logic**   | Sentiment, categorisation, summary | When no AI API key is set, or if an API call fails |

Only one AI provider is used at a time (OpenAI preferred if both keys are set). The rule-based logic is implemented in JavaScript in `server/ai.js` and does not call any external service.

---

### 3. How AI Is Used in the Application

**3.1 Sentiment analysis**

- **Input:** Company name, article title, and summary.
- **AI approach:** The model is asked to classify the text as positive, negative, or neutral and to return a numeric score (e.g. from -1 to 1) in a structured JSON format. Low temperature (e.g. 0.2) is used for more consistent outputs.
- **Rule-based fallback:** The code uses fixed lists of positive and negative keywords (e.g. “renewable”, “safety”, “criticism”, “antitrust”). It scores the text by counting keyword matches and maps the result to positive, negative, or neutral and a score.

**3.2 ESG categorisation**

- **Input:** Company name, article title, and summary.
- **AI approach:** The model is prompted to assign one or more of Environmental, Social, and Governance. The response is parsed as JSON (e.g. `{"categories": ["Environmental", "Social"]}`).
- **Rule-based fallback:** Regular expressions and keyword lists are used to detect Environmental (e.g. climate, carbon, renewable, water, plastic), Social (e.g. labor, diversity, wage, safety, human rights), and Governance (e.g. board, governance, ethics, antitrust, compliance). If nothing matches, a default set of categories may be applied.

**3.3 AI-generated summary**

- **Input:** Company name and a set of recent articles (titles and summaries).
- **AI approach:** The model is asked to act as an ESG analyst and produce a short summary (e.g. 2–3 paragraphs) plus a few trending topics. The prompt instructs it to highlight main concerns and positive developments.
- **Rule-based fallback:** The application counts positive vs negative articles and the most frequent E/S/G categories, then produces a short textual summary (e.g. “X positive and Y negative stories; key themes: Environmental, Social”).

---

### 4. Implementation Details

- **Backend:** All AI and rule-based logic lives in `server/ai.js`. API routes in `server/index.js` call these functions.
- **Structured outputs:** For sentiment and categorisation, the AI is prompted to return JSON so the response can be parsed and stored (e.g. in SQLite) and shown in the UI.
- **Error handling:** If an AI API call fails (e.g. network error, rate limit), the code falls back to the rule-based method and optionally logs a warning. The user still receives a result.

---

### 5. Limitations and Disclosure

- **Rule-based logic:** Keyword and regex rules are simple and may misclassify nuanced or ambiguous headlines. They are intended as a fallback, not a replacement for human judgment.
- **AI outputs:** AI-generated sentiment, categories, and summaries can be wrong or biased. They should be treated as aids, not as sole sources of truth.
- **No API key required:** The application is designed to run fully without any API key using only the rule-based logic, so submission and grading do not depend on access to OpenAI or Gemini.

---

### 6. Summary

AI is used in this project for (1) sentiment analysis, (2) ESG categorisation, and (3) summary generation. The app supports OpenAI and Google Gemini when API keys are provided, and uses a transparent rule-based fallback when they are not. All usage is documented in this report and implemented in the server-side code.

# Problem Statement
## ESG News Analyzer & Sentiment Tracker — Assignment 2

---

### Background

Environmental, Social, and Governance (ESG) factors are increasingly important for investors, regulators, and the public when assessing companies. Tracking and interpreting ESG-related news manually is time-consuming, inconsistent, and hard to scale. There is a need for a tool that aggregates such news, classifies it reliably, and presents clear insights.

### Problem

1. **Scattered information** — ESG news is spread across many sources; there is no single place to view it per company.
2. **Subjective classification** — Deciding whether a headline is positive, negative, or neutral, and whether it is Environmental, Social, or Governance-related, is subjective when done by hand.
3. **Lack of overview** — Without aggregation and summarisation, it is difficult to see trends, sentiment over time, or the main ESG themes for a company.
4. **Repetitive work** — Manually labelling and categorising large numbers of articles does not scale.

### Proposed Solution

This project delivers a **web application** that:

- **Aggregates** ESG-related news for a set of companies (e.g. Tesla, Amazon, Microsoft, BP, Unilever, Patagonia, Nike, Nestlé, Google, Walmart) in one place.
- **Analyses sentiment** automatically, labelling each article as Positive, Negative, or Neutral and assigning a score, using either AI (when an API key is configured) or a rule-based fallback.
- **Categorises** each article into one or more of Environmental, Social, and Governance (E/S/G) using the same AI or rule-based logic.
- **Filters** news by E/S/G so users can focus on the category they care about.
- **Visualises trends** via dashboards (e.g. sentiment over time, distribution by category, timeline of events).
- **Generates summaries** of key ESG issues and trending topics per company, again using AI when available or a simple statistical summary otherwise.

### Outcome

Users can search for a company, view its ESG news, filter by category, re-analyse articles with AI where configured, and explore trends and summaries through a single, responsive interface—reducing effort and improving consistency in ESG news assessment.

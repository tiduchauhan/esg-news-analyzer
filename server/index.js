import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { getCompanyId } from './db.js';
import { analyzeSentiment, categorizeESG, generateSummary } from './ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

// API routes first (so /api/* is never served as static)
app.get('/api/companies', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, name FROM companies ORDER BY name').all();
    res.json(rows);
  } catch (e) {
    console.error('GET /api/companies', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/companies/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const rows = db.prepare("SELECT id, name FROM companies WHERE LOWER(name) LIKE ? ORDER BY name").all(`%${q.toLowerCase()}%`);
  res.json(rows);
});

app.get('/api/news/:companyId', (req, res) => {
  const companyId = parseInt(req.params.companyId, 10);
  const category = req.query.category;
  let sql = 'SELECT a.*, c.name as company_name FROM articles a JOIN companies c ON a.company_id = c.id WHERE a.company_id = ?';
  const params = [companyId];
  if (category) {
    sql += ' AND (a.categories LIKE ? OR a.categories = ?)';
    params.push(`%${category}%`, category);
  }
  sql += ' ORDER BY a.published_at DESC, a.id DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(r => ({
    ...r,
    categories: r.categories ? r.categories.split(',').map(c => c.trim()) : []
  })));
});

app.get('/api/news/company/:name', (req, res) => {
  const name = decodeURIComponent(req.params.name || '');
  const cid = getCompanyId(name);
  if (!cid) return res.json([]);
  const rows = db.prepare('SELECT a.*, c.name as company_name FROM articles a JOIN companies c ON a.company_id = c.id WHERE a.company_id = ? ORDER BY a.published_at DESC').all(cid);
  res.json(rows.map(r => ({ ...r, categories: r.categories ? r.categories.split(',').map(c => c.trim()) : [] })));
});

app.post('/api/analyze/sentiment', async (req, res) => {
  const { companyName, title, summary } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const result = await analyzeSentiment(companyName || 'Company', title, summary);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/analyze/categorize', async (req, res) => {
  const { companyName, title, summary } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const categories = await categorizeESG(companyName || 'Company', title, summary);
    res.json({ categories });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/analyze/analyze-article', async (req, res) => {
  const { companyName, title, summary } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const [sentiment, { categories }] = await Promise.all([
      analyzeSentiment(companyName || 'Company', title, summary),
      categorizeESG(companyName || 'Company', title, summary)
    ]);
    res.json({ sentiment: sentiment.sentiment, sentiment_score: sentiment.score, categories });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/summary/:companyId', async (req, res) => {
  const companyId = parseInt(req.params.companyId, 10);
  const company = db.prepare('SELECT name FROM companies WHERE id = ?').get(companyId);
  if (!company) return res.status(404).json({ error: 'Company not found' });
  const articles = db.prepare('SELECT title, summary, sentiment, categories FROM articles WHERE company_id = ? ORDER BY published_at DESC').all(companyId);
  try {
    const summary = await generateSummary(company.name, articles);
    res.json({ companyName: company.name, summary });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/trends/:companyId', (req, res) => {
  const companyId = parseInt(req.params.companyId, 10);
  const articles = db.prepare('SELECT published_at, sentiment, sentiment_score, categories FROM articles WHERE company_id = ? ORDER BY published_at').all(companyId);
  const byDate = {};
  const byCategory = { Environmental: 0, Social: 0, Governance: 0 };
  articles.forEach(a => {
    const d = (a.published_at || '').slice(0, 10);
    if (!byDate[d]) byDate[d] = { positive: 0, negative: 0, neutral: 0 };
    byDate[d][a.sentiment] = (byDate[d][a.sentiment] || 0) + 1;
    (a.categories || '').split(',').map(c => c.trim()).filter(Boolean).forEach(c => { if (byCategory[c] !== undefined) byCategory[c]++; });
  });
  const sentimentOverTime = Object.entries(byDate).map(([date, v]) => ({ date, ...v }));
  res.json({ sentimentOverTime, categoryDistribution: byCategory, timeline: articles.map(a => ({ date: a.published_at, sentiment: a.sentiment, categories: (a.categories || '').split(',').map(c => c.trim()).filter(Boolean) })) });
});

app.patch('/api/articles/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { sentiment, sentiment_score, categories } = req.body || {};
  db.prepare('UPDATE articles SET sentiment = ?, sentiment_score = ?, categories = ? WHERE id = ?').run(
    sentiment ?? null, sentiment_score ?? null, Array.isArray(categories) ? categories.join(', ') : categories, id
  );
  const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ ...row, categories: row.categories ? row.categories.split(',').map(c => c.trim()) : [] });
});

// Serve built client (only for production; in dev, Vite serves the client)
app.use(express.static(path.join(__dirname, '../client/dist')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ESG API running on http://localhost:${PORT}`));

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

const API = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

function SentimentBadge({ sentiment, score }) {
  const c = sentiment === 'positive' ? 'sentiment-positive' : sentiment === 'negative' ? 'sentiment-negative' : 'sentiment-neutral';
  const label = sentiment ? sentiment.charAt(0).toUpperCase() + sentiment.slice(1) : '—';
  const scoreStr = score != null && score !== undefined ? ` (${Number(score).toFixed(2)})` : '';
  return <span className={c}>{label}{scoreStr}</span>;
}

function CategoryTags({ categories }) {
  if (!categories || !categories.length) return null;
  const map = { Environmental: 'tag-e', Social: 'tag-s', Governance: 'tag-g' };
  return (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {categories.map(cat => (
        <span key={cat} className={map[cat] || ''} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>
          {cat}
        </span>
      ))}
    </span>
  );
}

function SearchBar({ onSelect, placeholder }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  const search = useCallback(async () => {
    if (!q.trim()) { setResults([]); return; }
    const res = await fetch(`${API}/companies/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data);
    setOpen(true);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(search, 200);
    return () => clearTimeout(t);
  }, [q, search]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder || 'Search companies...'}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          fontSize: 16,
        }}
      />
      {open && results.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            margin: 0,
            padding: 0,
            listStyle: 'none',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            marginTop: 4,
            maxHeight: 240,
            overflow: 'auto',
            zIndex: 10,
          }}
        >
          {results.map(c => (
            <li
              key={c.id}
              onMouseDown={() => { onSelect(c); setQ(''); setResults([]); setOpen(false); }}
              style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
            >
              {c.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NewsCard({ article, onReanalyze }) {
  const [analyzing, setAnalyzing] = useState(false);
  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`${API}/analyze/analyze-article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: article.company_name,
          title: article.title,
          summary: article.summary,
        }),
      });
      const data = await res.json();
      await fetch(`${API}/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentiment: data.sentiment,
          sentiment_score: data.sentiment_score,
          categories: data.categories,
        }),
      });
      onReanalyze?.();
    } finally {
      setAnalyzing(false);
    }
  };

  const categories = Array.isArray(article.categories) ? article.categories : (article.categories || '').split(',').map(c => c.trim()).filter(Boolean);

  return (
    <article
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 16,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{article.title}</h3>
          {article.summary && <p style={{ margin: '0 0 8px', color: 'var(--text-muted)', fontSize: 14 }}>{article.summary}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <SentimentBadge sentiment={article.sentiment} score={article.sentiment_score} />
            <CategoryTags categories={categories} />
            {article.source && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{article.source}</span>}
            {article.published_at && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{article.published_at}</span>}
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          style={{
            padding: '8px 12px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          {analyzing ? 'Analyzing…' : 'Re-analyze with AI'}
        </button>
      </div>
    </article>
  );
}

function Dashboard({ companyId, companyName }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!companyId) return;
    fetch(`${API}/trends/${companyId}`)
      .then(r => r.json())
      .then(setData);
  }, [companyId]);

  if (!data) return <p style={{ color: 'var(--text-muted)' }}>Loading trends…</p>;

  const { sentimentOverTime, categoryDistribution, timeline } = data;
  const pieData = Object.entries(categoryDistribution).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  const colors = { Environmental: '#3fb950', Social: '#58a6ff', Governance: '#d29922' };

  return (
    <div style={{ display: 'grid', gap: 24, marginTop: 24 }}>
      <h2 style={{ margin: 0 }}>Trend Dashboard — {companyName}</h2>

      <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Sentiment over time</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={sentimentOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
            <YAxis stroke="var(--text-muted)" fontSize={12} />
            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
            <Legend />
            <Line type="monotone" dataKey="positive" stroke="#3fb950" name="Positive" strokeWidth={2} />
            <Line type="monotone" dataKey="negative" stroke="#f85149" name="Negative" strokeWidth={2} />
            <Line type="monotone" dataKey="neutral" stroke="#d29922" name="Neutral" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Distribution by ESG category</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={colors[pieData[i].name] || '#8b949e'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No category data yet.</p>
          )}
        </section>

        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Category bar chart</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pieData}>
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
              <Bar dataKey="value" fill="var(--accent)" name="Articles" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Timeline of ESG events</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {timeline.slice(0, 15).map((ev, i) => (
            <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13, minWidth: 100 }}>{ev.date}</span>
              <SentimentBadge sentiment={ev.sentiment} />
              <CategoryTags categories={ev.categories} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function AISummary({ companyId, companyName }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (!companyId) return;
    setLoading(true);
    fetch(`${API}/summary/${companyId}`)
      .then(r => r.json())
      .then(d => { setSummary(d.summary || ''); })
      .finally(() => setLoading(false));
  }, [companyId]);

  useEffect(() => { if (companyId) load(); }, [companyId, load]);

  if (!companyId) return null;

  return (
    <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0 }}>AI-generated ESG summary — {companyName}</h2>
        <button onClick={load} disabled={loading} style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6 }}>
          {loading ? 'Generating…' : 'Regenerate summary'}
        </button>
      </div>
      {loading && !summary ? (
        <p style={{ color: 'var(--text-muted)' }}>Generating summary…</p>
      ) : (
        <div style={{ whiteSpace: 'pre-wrap', marginTop: 16, lineHeight: 1.6 }}>{summary || 'No summary available.'}</div>
      )}
    </section>
  );
}

export default function App() {
  const [selected, setSelected] = useState(null);
  const [news, setNews] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [key, setKey] = useState(0);

  const loadNews = useCallback(async () => {
    if (!selected) { setNews([]); return; }
    const url = categoryFilter ? `${API}/news/${selected.id}?category=${encodeURIComponent(categoryFilter)}` : `${API}/news/${selected.id}`;
    const res = await fetch(url);
    const data = await res.json();
    setNews(data);
  }, [selected, categoryFilter]);

  useEffect(() => { loadNews(); }, [loadNews]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <header style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700 }}>ESG News Analyzer & Sentiment Tracker</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          Search for companies, view ESG news, sentiment, and AI-generated insights.
        </p>
        <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchBar onSelect={setSelected} placeholder="e.g. Tesla, Amazon, Microsoft..." />
          {selected && (
            <span style={{ color: 'var(--text-muted)' }}>Showing: <strong style={{ color: 'var(--text)' }}>{selected.name}</strong></span>
          )}
        </div>
      </header>

      {selected && (
        <>
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>ESG News</h2>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  color: 'var(--text)',
                }}
              >
                <option value="">All categories</option>
                <option value="Environmental">Environmental</option>
                <option value="Social">Social</option>
                <option value="Governance">Governance</option>
              </select>
            </div>
            {news.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No articles found for this company.</p>
            ) : (
              news.map(article => (
                <NewsCard key={article.id} article={article} onReanalyze={() => { setKey(k => k + 1); loadNews(); }} />
              ))
            )}
          </section>

          <AISummary companyId={selected.id} companyName={selected.name} />
          <Dashboard companyId={selected.id} companyName={selected.name} key={key} />
        </>
      )}

      {!selected && (
        <p style={{ color: 'var(--text-muted)', marginTop: 24 }}>
          Sample companies: Tesla, Amazon, Microsoft, BP, Unilever, Patagonia, Nike, Nestlé, Google, Walmart. Search above to get started.
        </p>
      )}
    </div>
  );
}

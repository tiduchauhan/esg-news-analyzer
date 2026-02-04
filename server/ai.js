import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

function ruleBasedSentiment(text) {
  const t = (text || '').toLowerCase();
  const positive = ['renewable', 'solar', 'diversity', 'safety', 'reduces', 'commits', 'achieves', 'expands', 'improves', 'donates', 'fair', 'living wage', 'carbon negative', 'recycled', 'stewardship', 'progress', 'certification'];
  const negative = ['scrutiny', 'faces', 'concerns', 'demand', 'probe', 'criticism', 'allegations', 'issues', 'ruling', 'antitrust', 'lobbying', 'child labor'];
  let score = 0;
  positive.forEach(w => { if (t.includes(w)) score += 0.15; });
  negative.forEach(w => { if (t.includes(w)) score -= 0.2; });
  if (score >= 0.3) return { sentiment: 'positive', score: Math.min(0.95, score) };
  if (score <= -0.3) return { sentiment: 'negative', score: Math.max(-0.95, score) };
  return { sentiment: 'neutral', score: 0 };
}

function ruleBasedCategories(text) {
  const t = (text || '').toLowerCase();
  const categories = [];
  if (/\b(climate|carbon|emissions|renewable|solar|wind|water|plastic|waste|environment|pollution)\b/.test(t)) categories.push('Environmental');
  if (/\b(labor|worker|diversity|inclusion|wage|safety|human rights|community|employee)\b/.test(t)) categories.push('Social');
  if (/\b(board|governance|compensation|corruption|transparency|shareholder|ethics|antitrust|compliance)\b/.test(t)) categories.push('Governance');
  return categories.length ? categories : ['Environmental', 'Social', 'Governance'];
}

export async function analyzeSentiment(companyName, title, summary) {
  const text = [title, summary].filter(Boolean).join(' ');
  if (openai.apiKey) {
    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You analyze news sentiment. Reply with only a JSON object: {"sentiment":"positive"|"negative"|"neutral","score":number from -1 to 1}. No other text.' },
          { role: 'user', content: `Analyze sentiment of this ESG news about ${companyName}: ${text}. Classify as Positive, Negative, or Neutral and provide a confidence score.` }
        ],
        temperature: 0.2
      });
      const content = res.choices?.[0]?.message?.content?.trim() || '{}';
      const parsed = JSON.parse(content.replace(/```\w*\n?/g, '').trim());
      return { sentiment: (parsed.sentiment || 'neutral').toLowerCase(), score: Number(parsed.score) || 0 };
    } catch (e) {
      console.warn('OpenAI sentiment error:', e.message);
    }
  }
  return ruleBasedSentiment(text);
}

export async function categorizeESG(companyName, title, summary) {
  const text = [title, summary].filter(Boolean).join(' ');
  if (openai.apiKey) {
    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You categorize ESG news. Reply with only a JSON object: {"categories":["Environmental","Social","Governance"]} - include one or more. No other text.' },
          { role: 'user', content: `Categorize this article into ESG categories (Environmental, Social, Governance): ${text}. Which category/categories and why briefly.` }
        ],
        temperature: 0.2
      });
      const content = res.choices?.[0]?.message?.content?.trim() || '{}';
      const parsed = JSON.parse(content.replace(/```\w*\n?/g, '').trim());
      const cats = Array.isArray(parsed.categories) ? parsed.categories : [parsed.categories].filter(Boolean);
      return cats.length ? cats : ['Environmental'];
    } catch (e) {
      console.warn('OpenAI categorization error:', e.message);
    }
  }
  return ruleBasedCategories(text);
}

export async function generateSummary(companyName, articles) {
  const highlights = articles.slice(0, 10).map(a => `- ${a.title}: ${a.summary || ''}`).join('\n');
  if (openai.apiKey) {
    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an ESG analyst. Provide a concise 2-3 paragraph summary. Highlight major concerns and positive developments. Then list top 3 trending ESG topics for this company.' },
          { role: 'user', content: `Summarize key ESG issues for ${companyName} based on these recent articles:\n\n${highlights}` }
        ],
        temperature: 0.4
      });
      return res.choices?.[0]?.message?.content?.trim() || 'Summary unavailable.';
    } catch (e) {
      console.warn('OpenAI summary error:', e.message);
    }
  }
  const pos = articles.filter(a => a.sentiment === 'positive').length;
  const neg = articles.filter(a => a.sentiment === 'negative').length;
  const byCat = {};
  articles.forEach(a => {
    (a.categories || '').split(',').map(c => c.trim()).filter(Boolean).forEach(c => { byCat[c] = (byCat[c] || 0) + 1; });
  });
  const topCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  return `${companyName} ESG overview: ${pos} positive and ${neg} negative stories in the sample. Key themes: ${topCats.join(', ')}. Review the article list and charts for details.`;
}

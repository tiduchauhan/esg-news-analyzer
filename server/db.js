import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'esg.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    source TEXT,
    url TEXT,
    published_at TEXT,
    sentiment TEXT,
    sentiment_score REAL,
    categories TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );
`);

const companies = [
  'Tesla', 'Amazon', 'Microsoft', 'BP', 'Unilever', 'Patagonia', 'Nike', 'Nestlé', 'Google', 'Walmart'
];

const insertCompany = db.prepare('INSERT OR IGNORE INTO companies (name) VALUES (?)');
companies.forEach(name => insertCompany.run(name));

function getCompanyId(name) {
  const row = db.prepare('SELECT id FROM companies WHERE LOWER(name) = LOWER(?)').get(name);
  return row ? row.id : null;
}

const insertArticle = db.prepare(`
  INSERT INTO articles (company_id, title, summary, source, url, published_at, sentiment, sentiment_score, categories)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const sampleArticles = [
  { company: 'Tesla', title: 'Tesla expands solar and battery storage amid renewable push', summary: 'Tesla announced major investments in solar and Megapack storage, boosting its environmental credentials.', source: 'ESG Today', sentiment: 'positive', score: 0.85, categories: 'Environmental', date: '2025-01-15' },
  { company: 'Tesla', title: 'Tesla faces scrutiny over water use at Gigafactory', summary: 'Local groups raise concerns about water consumption at Tesla\'s Berlin Gigafactory.', source: 'Reuters', sentiment: 'negative', score: -0.6, categories: 'Environmental', date: '2025-01-10' },
  { company: 'Tesla', title: 'Tesla improves worker safety metrics at Fremont plant', summary: 'OSHA data shows reduced incident rates following safety initiatives.', source: 'Bloomberg', sentiment: 'positive', score: 0.7, categories: 'Social', date: '2025-01-08' },
  { company: 'Tesla', title: 'Tesla board diversity report shows gradual progress', summary: 'Latest governance report highlights increased board diversity efforts.', source: 'CNBC', sentiment: 'neutral', score: 0.1, categories: 'Governance', date: '2025-01-05' },
  { company: 'Amazon', title: 'Amazon commits to 100% renewable energy by 2025', summary: 'Company announces new wind and solar deals to meet climate pledge.', source: 'The Verge', sentiment: 'positive', score: 0.9, categories: 'Environmental', date: '2025-01-14' },
  { company: 'Amazon', title: 'Amazon warehouse workers demand better conditions', summary: 'Labor groups call for improved safety and pay at fulfillment centers.', source: 'Guardian', sentiment: 'negative', score: -0.75, categories: 'Social', date: '2025-01-12' },
  { company: 'Amazon', title: 'Amazon faces antitrust probe in EU', summary: 'European regulators expand investigation into marketplace practices.', source: 'Reuters', sentiment: 'negative', score: -0.5, categories: 'Governance', date: '2025-01-09' },
  { company: 'Amazon', title: 'Amazon launches diversity and inclusion fund', summary: '$50M fund to support underrepresented businesses and communities.', source: 'TechCrunch', sentiment: 'positive', score: 0.8, categories: 'Social', date: '2025-01-06' },
  { company: 'Microsoft', title: 'Microsoft achieves carbon negative milestone', summary: 'Company removes more carbon than it emits in operations.', source: 'ESG Today', sentiment: 'positive', score: 0.95, categories: 'Environmental', date: '2025-01-13' },
  { company: 'Microsoft', title: 'Microsoft expands accessibility initiatives globally', summary: 'New programs to make technology accessible to people with disabilities.', source: 'Microsoft Blog', sentiment: 'positive', score: 0.85, categories: 'Social', date: '2025-01-11' },
  { company: 'Microsoft', title: 'Microsoft board approves executive compensation framework', summary: 'Shareholders vote on pay-for-performance alignment.', source: 'WSJ', sentiment: 'neutral', score: 0.0, categories: 'Governance', date: '2025-01-07' },
  { company: 'BP', title: 'BP accelerates renewable energy investments', summary: 'Oil major shifts capital toward wind and solar projects.', source: 'Financial Times', sentiment: 'positive', score: 0.7, categories: 'Environmental', date: '2025-01-14' },
  { company: 'BP', title: 'BP faces criticism over fossil fuel lobbying', summary: 'Climate activists question alignment of lobbying with net-zero goals.', source: 'Guardian', sentiment: 'negative', score: -0.65, categories: 'Environmental,Governance', date: '2025-01-10' },
  { company: 'BP', title: 'BP reports progress on safety and process safety', summary: 'Annual sustainability report highlights safety improvements.', source: 'BP Report', sentiment: 'positive', score: 0.6, categories: 'Social', date: '2025-01-04' },
  { company: 'Unilever', title: 'Unilever sets plastic packaging reduction targets', summary: 'Company aims to halve virgin plastic use by 2025.', source: 'Reuters', sentiment: 'positive', score: 0.8, categories: 'Environmental', date: '2025-01-12' },
  { company: 'Unilever', title: 'Unilever supports living wage across supply chain', summary: 'Commitment to ensure fair wages for agricultural workers.', source: 'ESG Today', sentiment: 'positive', score: 0.85, categories: 'Social', date: '2025-01-08' },
  { company: 'Unilever', title: 'Unilever board refresh and governance update', summary: 'New independent directors appointed to strengthen governance.', source: 'Unilever News', sentiment: 'neutral', score: 0.2, categories: 'Governance', date: '2025-01-03' },
  { company: 'Patagonia', title: 'Patagonia donates company to fight climate change', summary: 'Founder transfers ownership to trust dedicated to environmental causes.', source: 'NYT', sentiment: 'positive', score: 0.95, categories: 'Environmental,Governance', date: '2025-01-15' },
  { company: 'Patagonia', title: 'Patagonia leads in fair labor certification', summary: 'Brand achieves Fair Trade certification across more product lines.', source: 'Forbes', sentiment: 'positive', score: 0.9, categories: 'Social', date: '2025-01-11' },
  { company: 'Nike', title: 'Nike increases use of recycled materials in footwear', summary: 'Move to recycled polyester and rubber in key product lines.', source: 'Nike News', sentiment: 'positive', score: 0.75, categories: 'Environmental', date: '2025-01-13' },
  { company: 'Nike', title: 'Nike faces ongoing labor concerns in supply chain', summary: 'Advocacy groups report issues at some supplier factories.', source: 'Reuters', sentiment: 'negative', score: -0.7, categories: 'Social', date: '2025-01-09' },
  { company: 'Nike', title: 'Nike publishes diversity and inclusion metrics', summary: 'Annual report shows workforce and leadership diversity data.', source: 'CNBC', sentiment: 'neutral', score: 0.3, categories: 'Social,Governance', date: '2025-01-06' },
  { company: 'Nestlé', title: 'Nestlé invests in water stewardship projects', summary: 'Partnerships to protect watersheds in key sourcing regions.', source: 'Nestlé News', sentiment: 'positive', score: 0.7, categories: 'Environmental', date: '2025-01-12' },
  { company: 'Nestlé', title: 'Nestlé child labor allegations in cocoa supply chain', summary: 'Report highlights ongoing challenges in West African cocoa.', source: 'Guardian', sentiment: 'negative', score: -0.8, categories: 'Social', date: '2025-01-07' },
  { company: 'Nestlé', title: 'Nestlé updates governance and compliance program', summary: 'Enhanced anti-corruption and transparency measures.', source: 'Reuters', sentiment: 'neutral', score: 0.1, categories: 'Governance', date: '2025-01-02' },
  { company: 'Google', title: 'Google signs major renewable energy deals', summary: 'New PPA agreements to power data centers with clean energy.', source: 'TechCrunch', sentiment: 'positive', score: 0.85, categories: 'Environmental', date: '2025-01-14' },
  { company: 'Google', title: 'Google workforce diversity report shows incremental gains', summary: 'Underrepresented groups see slight increase in technical roles.', source: 'Wired', sentiment: 'neutral', score: 0.25, categories: 'Social', date: '2025-01-10' },
  { company: 'Google', title: 'Google faces antitrust ruling in EU', summary: 'Regulators impose remedies in advertising and search case.', source: 'Reuters', sentiment: 'negative', score: -0.55, categories: 'Governance', date: '2025-01-05' },
  { company: 'Walmart', title: 'Walmart expands electric vehicle fleet for delivery', summary: 'Partnership with EV makers to reduce logistics emissions.', source: 'ESG Today', sentiment: 'positive', score: 0.75, categories: 'Environmental', date: '2025-01-11' },
  { company: 'Walmart', title: 'Walmart raises minimum wage for store workers', summary: 'Pay increase for frontline associates across US stores.', source: 'CNN', sentiment: 'positive', score: 0.8, categories: 'Social', date: '2025-01-08' },
  { company: 'Walmart', title: 'Walmart board faces shareholder proposal on ethics', summary: 'Investors push for stronger ethics and compliance reporting.', source: 'Bloomberg', sentiment: 'neutral', score: -0.2, categories: 'Governance', date: '2025-01-04' },
];

const count = db.prepare('SELECT COUNT(*) as c FROM articles').get();
if (count.c === 0) {
  sampleArticles.forEach(a => {
    const cid = getCompanyId(a.company);
    if (cid) insertArticle.run(cid, a.title, a.summary, a.source, '#', a.date, a.sentiment, a.score, a.categories);
  });
}

export default db;
export { getCompanyId };

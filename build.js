// build.js
// -----------------------------------------
// Smart Finance 360 - Static Builder
// Articles (Sheet1) + Thoughts (Sheet2)
// -----------------------------------------

const { google } = require('googleapis');
const fs = require('fs-extra');
const path = require('path');
const Mustache = require('mustache');
const slugify = require('slugify');

// --- Load Google service account ---
const keyFile = './smartfinance360-api-5cfa9a8e3677.json';
const keys = require(keyFile);

const auth = new google.auth.JWT({
  email: keys.client_email,
  key: keys.private_key.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

// --- Spreadsheet config ---
const SHEET_ID = "1TxdvMNgP6bN-566gtVo10qkI595Q76T9_nt8-G5SwBs";
const ARTICLES_SHEET = "Sheet1";
const THOUGHTS_SHEET = "Sheet3";

// --- Output paths ---
const PUBLIC_DIR = path.join(__dirname, 'public');
const ARTICLES_DIR = path.join(PUBLIC_DIR, 'articles');
const TEMPLATES_DIR = path.join(__dirname, 'templates');

// --- Global data for templates ---
const globalData = {
  logoURL: '../images/logo.png',
  siteName: 'Smart Finance 360',
  siteURL: 'https://smartfinance360.com'
};

// --- Load templates and partials ---
const articleTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'article.mustache'), 'utf8');
const motivationalTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'motivational.mustache'), 'utf8');

const partials = {
  header: fs.readFileSync(path.join(TEMPLATES_DIR, 'header.mustache'), 'utf8'),
  footer: fs.readFileSync(path.join(TEMPLATES_DIR, 'footer.mustache'), 'utf8'),
  sidebar: fs.readFileSync(path.join(TEMPLATES_DIR, 'sidebar.mustache'), 'utf8'),
};

// --- Fetch articles ---
async function fetchArticles() {
  console.log('📄 Fetching articles from Sheet1...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${ARTICLES_SHEET}!A1:Z1000`,
  });

  const rows = res.data.values;
  if (!rows || rows.length === 0) return [];

  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((header, i) => obj[header] = row[i] || '');
    const title = obj.MetaTitle || obj.Title || 'Untitled';
    const slug = slugify(obj.Slug || title, { lower: true, strict: true });

    return {
      slug,
      Title: obj.Title || title,
      Content: obj.Content || '',
      Excerpt: obj.Excerpt || '',
      DateTime: obj.DateTime || '',
      Category: obj.Category || '',
      Author: obj.Author || 'Admin',
      ReadTime: obj.ReadTime || '2',
      ImageURL: obj.ImageURL || 'images/default.jpg',
      Keywords: obj.Keywords || '',
      MetaDescription: obj.MetaDescription || '',
      CanonicalURL: `https://smartfinance360.com/articles/${slug}.html`
    };
  });
}

// --- Fetch thoughts (Sheet3) ---
async function fetchThoughts() {
  console.log('🧠 Fetching thoughts from Sheet3...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${THOUGHTS_SHEET}!A1:C1000`, // Only 3 columns
  });

  const rows = res.data.values;
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase());
  const thought = rows.slice(1).map((row, index) => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = row[i] || '');

    return {
      id: index + 1,
      text: obj.thought || obj.Thought || 'Stay motivated!',
      author: obj.author || 'Smart Finance 360',
      bg: obj.color || '#ffffff',
      showAd: (index + 1) % 3 === 0 // Show ad after every 3rd
    };
  });

  return thought;
}

// --- Build process ---
(async () => {
  try {
    console.log('🚀 Starting build process...');
    await fs.ensureDir(PUBLIC_DIR);
    await fs.ensureDir(ARTICLES_DIR);

    // Fetch articles & thought
    const [articles, thought] = await Promise.all([fetchArticles(), fetchThoughts()]);

    // --- Generate article pages ---
    for (const article of articles) {
      const html = Mustache.render(articleTemplate, { ...article, ...globalData, root: '../' }, partials);
      const filePath = path.join(ARTICLES_DIR, `${article.slug}.html`);
      await fs.writeFile(filePath, html, 'utf8');
      console.log(`✅ Article: ${filePath}`);
    }

    // --- Generate motivational.html ---
    const motivationalPage = Mustache.render(
  motivationalTemplate,
  {
    ...globalData,
    title: 'Motivational Thoughts | Smart Finance 360',
    pageHeading: 'Motivational Thoughts of the Day',
    metaDescription: 'Get daily motivational thoughts, inspirational quotes, and success mantras that boost confidence and positivity every day.',
    metaKeywords: 'motivational thoughts, inspirational quotes, success motivation, life quotes, positive thinking, daily motivation',
    metaAuthor: 'Smart Finance 360',
    canonical: 'https://smartfinance360.com/motivational.html',

    ogTitle: 'Motivational Thoughts for Daily Inspiration | Smart Finance 360',
    ogDescription: 'Read powerful motivational thoughts that inspire success, positivity, and growth — updated daily.',
    ogUrl: 'https://smartfinance360.com/motivational.html',
    ogSiteName: 'Smart Finance 360',
    ogImage: 'https://smartfinance360.com/images/motivation-cover.jpg',
    ogImageAlt: 'Motivational Thoughts - Smart Finance 360',
    favicon: '../images/favicon.png',

    shareTitle: 'Motivational Thought | Smart Finance 360',
    pageBasePath: '/motivational.html',

    thought: thought,
    hasPagination: false,
    adsClient: 'ca-pub-9846205135944521',
    adsSlot: '2835292413'
  },
  partials
);


    const motivationalPath = path.join(PUBLIC_DIR, 'motivational.html');
    await fs.writeFile(motivationalPath, motivationalPage, 'utf8');
    console.log('✅ Motivational page generated:', motivationalPath);

    // --- Generate sitemap.xml ---
    const pages = [
      { loc: 'https://smartfinance360.com/index.html', changefreq: 'hourly', priority: 1.0 },
      { loc: 'https://smartfinance360.com/motivational.html', changefreq: 'daily', priority: 0.9 },
      { loc: 'https://smartfinance360.com/finance.html', changefreq: 'daily', priority: 0.8 },
      { loc: 'https://smartfinance360.com/investment.html', changefreq: 'daily', priority: 0.8 },
      { loc: 'https://smartfinance360.com/sports.html', changefreq: 'daily', priority: 0.8 },
      { loc: 'https://smartfinance360.com/technology.html', changefreq: 'daily', priority: 0.8 },
      { loc: 'https://smartfinance360.com/business.html', changefreq: 'daily', priority: 0.8 },
      { loc: 'https://smartfinance360.com/contact.html', changefreq: 'weekly', priority: 0.6 },
    ];

    articles.forEach(article => {
      pages.push({
        loc: article.CanonicalURL,
        changefreq: 'daily',
        priority: 0.9
      });
    });

    const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXML, 'utf8');
    console.log('✅ sitemap.xml generated');

    console.log(`🎉 Build complete: ${articles.length} articles, ${thought.length} thought.`);
  } catch (err) {
    console.error('❌ Build failed:', err);
  }
})();
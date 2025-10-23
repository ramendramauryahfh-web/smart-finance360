// build.js
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
  key: keys.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Spreadsheet config
const SHEET_ID = "1TxdvMNgP6bN-566gtVo10qkI595Q76T9_nt8-G5SwBs";
const ARTICLES_SHEET = "Sheet1";

// Output paths
const PUBLIC_DIR = path.join(__dirname, 'public');
const ARTICLES_DIR = path.join(PUBLIC_DIR, 'articles');
const TEMPLATES_DIR = path.join(__dirname, 'templates');

// Global data for header/footer
const globalData = {
  logoURL: '../images/logo.png',
  siteName: 'Smart Finance 360'
};

// Load templates and partials
const articleTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'article.mustache'), 'utf8');
const partials = {
  header: fs.readFileSync(path.join(TEMPLATES_DIR, 'header.mustache'), 'utf8'),
  footer: fs.readFileSync(path.join(TEMPLATES_DIR, 'footer.mustache'), 'utf8'),
  sidebar: fs.readFileSync(path.join(TEMPLATES_DIR, 'sidebar.mustache'), 'utf8'),
};

// Fetch articles from spreadsheet
async function fetchArticles() {
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

    // Split categories and keywords into arrays
    const categories = (obj.Category || '').split(',').map(c => c.trim()).filter(Boolean);
    const keywords = (obj.Keywords || '').split(',').map(k => k.trim()).filter(Boolean);

    return {
      slug,
      Title: title,
      Content: obj.Content || '',
      Excerpt: obj.Excerpt || '',
      DateTime: obj.DateTime || '',
      Category: obj.Category || '',
      CategoryList: categories,
      Author: obj.Author || 'Admin',
      ReadTime: obj.ReadTime || '2',
      ImageURL: obj.ImageURL || 'images/default.jpg',
      Views: obj.Views || '0',
      Keywords: obj.Keywords || '',
      KeywordsList: keywords,
      MetaDescription: obj.MetaDescription || '',
      CanonicalURL: `https://smartfinance360.com/articles/${slug}.html`,
      BreadcrumbPosition: categories.length + 2 // Home + categories + current page
    };
  });
}

// Build HTML files + sitemap
(async () => {
  try {
    const articles = await fetchArticles();
    if (!articles.length) {
      console.log('No articles found.');
      return;
    }

    await fs.ensureDir(ARTICLES_DIR);

    // Generate article pages
    for (const article of articles) {
      const html = Mustache.render(articleTemplate, { ...article, ...globalData, root: '../' }, partials);
      const filePath = path.join(ARTICLES_DIR, `${article.slug}.html`);
      await fs.writeFile(filePath, html, 'utf8');
      console.log('Generated:', filePath);
    }

    console.log(`✅ Build complete: ${articles.length} articles generated.`);

    // --- Generate sitemap.xml ---
    const pages = [
      { loc: 'https://smartfinance360.com/index.html', changefreq: 'always', priority: 1.0 },
      { loc: 'https://smartfinance360.com/finance.html', changefreq: 'hourly', priority: 0.8 },
      { loc: 'https://smartfinance360.com/investment.html', changefreq: 'hourly', priority: 0.8 },
      { loc: 'https://smartfinance360.com/sports.html', changefreq: 'hourly', priority: 0.8 },
      { loc: 'https://smartfinance360.com/technology.html', changefreq: 'hourly', priority: 0.8 },
      { loc: 'https://smartfinance360.com/business.html', changefreq: 'hourly', priority: 0.8 },
      { loc: 'https://smartfinance360.com/motivational.html', changefreq: 'hourly', priority: 0.8 },
      { loc: 'https://smartfinance360.com/contact.html', changefreq: 'hourly', priority: 0.6 },
    ];

    articles.forEach(article => {
      pages.push({
        loc: article.CanonicalURL,
        changefreq: 'always',
        priority: 1.0
      });
    });

    const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapXML, 'utf8');
    console.log('✅ sitemap.xml generated at:', sitemapPath);

  } catch (err) {
    console.error('Build failed:', err);
  }
})();

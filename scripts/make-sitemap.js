// Writes sitemap.xml and robots.txt once you know the site's address.
// Run:  node scripts/make-sitemap.js https://your-site-address
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const base = (process.argv[2] || '').replace(/\/$/, '');
if (!/^https:\/\//.test(base)) { console.error('Give the full address, e.g. node scripts/make-sitemap.js https://wheat.example.com'); process.exit(1); }

const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets', 'guides.js'), 'utf8'), ctx);
const today = new Date().toISOString().slice(0, 10);
const urls = ['/', '/privacy.html', '/terms.html', ...ctx.window.GUIDES.map(g => `/guide.html?g=${g.slug}`)];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url><loc>${base}${u.replace(/&/g, '&amp;')}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
console.log(`Wrote sitemap.xml (${urls.length} pages) and robots.txt for ${base}`);

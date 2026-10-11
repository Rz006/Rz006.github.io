// Pulls the live TikTok profile (name, bio, pfp, followers, likes, videos) into data/stats.json
// and saves the profile picture to assets/avatar.jpg. The site reads both on every page load.
//
// Run:  node scripts/update-stats.js
// Runs daily by itself via .github/workflows/update-stats.yml once the site is on GitHub.
const fs = require('fs');
const path = require('path');

const HANDLE = 'wheatsellz0';
const ROOT = path.join(__dirname, '..');

function loadPuppeteer() {
  try { return require('puppeteer'); } catch { /* fall through */ }
  try { return require('puppeteer-core'); } catch { /* fall through */ }
  throw new Error('Install puppeteer first:  npm install puppeteer');
}

(async () => {
  const puppeteer = loadPuppeteer();
  const opts = { headless: true, args: ['--no-sandbox'] };
  if (process.env.BROWSER_PATH) opts.executablePath = process.env.BROWSER_PATH;
  const browser = await puppeteer.launch(opts);
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36');
    await page.goto(`https://www.tiktok.com/@${HANDLE}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 4000));
    const info = await page.evaluate(() => {
      const s = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
      if (!s) return null;
      const u = JSON.parse(s.textContent).__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo;
      return u ? { user: u.user, stats: u.stats } : null;
    });
    if (!info) throw new Error('TikTok did not return profile data (it may have shown a captcha). Keeping the old stats.');

    const out = {
      handle: info.user.uniqueId,
      name: info.user.nickname,
      bio: info.user.signature,
      followers: info.stats.followerCount,
      following: info.stats.followingCount,
      likes: info.stats.heartCount ?? info.stats.heart,
      videos: info.stats.videoCount,
      updated: new Date().toISOString(),
    };

    // Save the pfp locally: TikTok's image links expire after a few days.
    const img = await page.goto(info.user.avatarLarger, { timeout: 30000 });
    if (img && img.ok()) fs.writeFileSync(path.join(ROOT, 'assets', 'avatar.jpg'), await img.buffer());

    fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'data', 'stats.json'), JSON.stringify(out, null, 2));
    // Also as a .js file, so the site shows fresh stats even when opened straight from disk.
    fs.writeFileSync(path.join(ROOT, 'data', 'stats.js'), 'window.WHEAT_STATS = ' + JSON.stringify(out) + ';\n');
    console.log('Updated:', out);
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e.message); process.exit(1); });

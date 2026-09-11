// Render original store artwork around actual synthetic-fixture popup screenshots.
import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
const asset = async file => `data:image/png;base64,${(await readFile(file)).toString('base64')}`;
const icon = await readFile('extension/icons/icon.svg', 'utf8');
const connect = await asset('work/screenshots/disconnected.png');
const sent = await asset('work/screenshots/submitted.png');
await mkdir('store-assets', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const render = async (filename, title, subtitle, screenshot) => {
    await page.setContent(`<!doctype html><style>
      *{box-sizing:border-box}body{margin:0;background:#f6efe6;color:#343138;font-family:system-ui,sans-serif}
      main{width:1280px;height:800px;padding:72px;display:grid;grid-template-columns:1fr 500px;align-items:center;gap:64px}
      .identity{display:flex;align-items:center;gap:14px;font-size:20px;font-weight:600;margin-bottom:40px}.identity svg{width:48px;height:48px}
      h1{font-size:54px;line-height:1.12;letter-spacing:-1.6px;margin:0 0 22px;max-width:500px;font-weight:700}
      p{font-size:23px;line-height:1.5;color:#665e58;max-width:450px;margin:0}
      .popup{display:block;width:480px;height:auto;border:1px solid #d9d0c7;border-radius:14px;box-shadow:0 22px 60px #43251826}
      footer{position:absolute;bottom:36px;left:72px;font-size:16px;color:#786e67}
    </style><main><div><div class="identity">${icon}<span>Paprika Recipe Clipper</span></div><h1>${title}</h1><p>${subtitle}</p></div><img class="popup" src="${screenshot}" alt="Extension popup"></main><footer>Independent extension · Requires a Paprika account</footer>`);
    await page.screenshot({ path: `store-assets/${filename}` });
  };
  await render('screenshot-connect.png', 'Connect once.<br>Clip your recipes.', 'Sign in on Paprika’s website.<br>Your password stays there.', connect);
  await render('screenshot-sent.png', 'From the web<br>to Paprika.', 'Click the scissors on a recipe page.<br>Paprika handles the extraction.', sent);
  await page.setViewportSize({ width: 440, height: 280 });
  await page.setContent(`<!doctype html><style>body{margin:0;background:#b43e35}svg{display:block}</style><svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280"><circle cx="422" cy="18" r="146" fill="#963127"/><circle cx="8" cy="280" r="110" fill="#c75e4b"/><g transform="translate(234 58) rotate(9 62 82)"><rect width="124" height="164" rx="14" fill="#fff4df"/><path d="M25 36h74M25 59h74M25 82h52M25 116h74M25 137h44" fill="none" stroke="#ce9c85" stroke-width="8" stroke-linecap="round"/></g><g transform="translate(49 55) scale(1.35)" fill="none" stroke="#fff4df" stroke-width="9" stroke-linecap="round"><circle cx="34" cy="37" r="13"/><circle cx="34" cy="91" r="13"/><path d="M44 47l54 51M44 81l54-51"/></g></svg>`);
  await page.screenshot({ path: 'store-assets/promo-small.png' });
} finally { await browser.close(); }
console.log('Rendered two 1280×800 store screenshots and a 440×280 promotional image.');

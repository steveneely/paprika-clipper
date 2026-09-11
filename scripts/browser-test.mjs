// Isolated, synthetic browser integration test. Never uses a personal profile.
import { chromium } from '@playwright/test';
import { mkdtemp, cp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { inflateRawSync } from 'node:zlib';

const temp = await mkdtemp(path.join(tmpdir(), 'paprika-clipper-test-'));
const extension = path.join(temp, 'extension');
await cp('extension', extension, { recursive: true });
const manifest = JSON.parse(await readFile(path.join(extension, 'manifest.json'), 'utf8'));
// Automated fixture access replaces the toolbar's user-granted activeTab permission.
// This is applied ONLY to a disposable test copy, never the shipped manifest.
manifest.host_permissions.push('https://recipe.example/*');
await writeFile(path.join(extension, 'manifest.json'), JSON.stringify(manifest));
const context = await chromium.launchPersistentContext(path.join(temp, 'profile'), {
  channel: 'chromium', headless: true,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
});
context.setDefaultTimeout(10000);
try {
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  const extensionId = new URL(worker.url()).host;
  const popupURL = `chrome-extension://${extensionId}/popup.html`;
  let uploads = [];
  // Intercept fetch in the extension worker, so no sample recipes reach Paprika.
  await worker.evaluate(() => {
    globalThis.__uploads = [];
    globalThis.__responseStatus = 200;
    globalThis.fetch = async (url, options) => {
      if (url !== 'https://www.paprikaapp.com/bookmarklet/v1/recipe') throw new Error('Unexpected endpoint');
      globalThis.__uploads.push({ url, body: options.body.toString(), credentials: options.credentials });
      if (globalThis.__responseStatus === -1) throw new TypeError('Simulated connection lost');
      return new Response('<html><body>Unverified response</body></html>', { status: globalThis.__responseStatus });
    };
  });
  const errors = [];
  const watch = page => page.on('pageerror', error => errors.push(error.message));
  context.on('page', watch);
  await context.route('https://www.paprikaapp.com/bookmarklet/**', route => route.fulfill({
    contentType: 'text/html', body: '<!doctype html><title>Paprika fixture</title><h1>Log in on Paprika</h1><input type="password">'
  }));
  await context.route('https://recipe.example/**', route => route.fulfill({
    contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta charset="utf-8"><title>Test recipe</title><style>p{font-size:17px}</style><h1>Fixture soup</h1><p>½ cup crème fraîche 🥘</p><div>Before <b>middle</b> after</div><input type="password" value="SECRET_FIXTURE">'
  }));

  const settings = await context.newPage();
  await settings.goto(`${popupURL}#settings`);
  await settings.getByRole('button', { name: /Connect Paprika/ }).waitFor();
  await mkdir('work/screenshots', { recursive: true });
  await settings.setViewportSize({ width: 376, height: 445 });
  await settings.evaluate(() => document.fonts.ready);
  await settings.locator('main').screenshot({ path: 'work/screenshots/disconnected.png' });
  const fontSession = await context.newCDPSession(settings);
  await fontSession.send('DOM.enable');
  await fontSession.send('CSS.enable');
  const { root } = await fontSession.send('DOM.getDocument');
  for (const selector of ['.brand-name', '#heading', '#message']) {
    const { nodeId } = await fontSession.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    const { fonts } = await fontSession.send('CSS.getPlatformFontsForNode', { nodeId });
    console.log(`Rendered font ${selector}: ${fonts.map(font => font.familyName).join(', ')}`);
  }
  await fontSession.detach();
  const newPage = context.waitForEvent('page');
  await settings.getByRole('button', { name: /Connect Paprika/ }).click();
  const connectPage = await newPage;
  await connectPage.waitForURL('https://www.paprikaapp.com/bookmarklet/');
  await connectPage.waitForLoadState('domcontentloaded');
  await connectPage.evaluate(() => {
    const link = document.createElement('a');
    link.href = "javascript:save('//www.paprikaapp.com/bookmarklet/v1?token=0123456789abcdef&timestamp=0')";
    link.textContent = 'Save recipe';
    document.body.append(link);
  });
  await connectPage.getByRole('status').filter({ hasText: 'Paprika Clipper connected' }).waitFor();
  assert.equal(await worker.evaluate(async () => (await chrome.storage.local.get('token')).token), '0123456789abcdef');
  console.log('PASS automatic connection after login markup appears');

  const recipe = await context.newPage();
  await recipe.goto('https://recipe.example/soup?q=50%25');
  const recipeTab = await worker.evaluate(async () => (await chrome.tabs.query({ url: 'https://recipe.example/*' }))[0]);
  const popup = await context.newPage();
  // Opening popup.html in a test tab does not invoke the Chrome toolbar. Control
  // its active-tab query in this test only, keeping the rest of the real APIs.
  await popup.addInitScript(tab => { chrome.tabs.query = async () => [tab]; }, recipeTab);
  await popup.goto(popupURL);
  await popup.getByRole('heading', { name: 'Sent to Paprika.' }).waitFor();
  uploads = await worker.evaluate(() => globalThis.__uploads);
  assert.equal(uploads.length, 1);
  const data = new URLSearchParams(uploads[0].body);
  assert.equal(data.get('token'), '0123456789abcdef');
  assert.equal(data.get('url'), recipeTab.url);
  assert.equal(uploads[0].credentials, 'omit');
  const html = inflateRawSync(Buffer.from(data.get('html'), 'base64')).toString();
  assert.match(html, /½ cup crème fraîche 🥘/);
  assert.ok(!html.includes('SECRET_FIXTURE'));
  assert.ok(!html.includes('0123456789abcdef'));
  const styles = JSON.parse(inflateRawSync(Buffer.from(data.get('styles'), 'base64')).toString());
  assert.ok(Object.values(styles).some(style => style['font-size'] === '17px'));
  assert.equal(await recipe.locator('[data-prm-id]').count(), 0);
  const denied = await worker.evaluate(async tabId => (await chrome.scripting.executeScript({
    target: { tabId }, func: async () => {
      try { await chrome.storage.local.get('token'); return false; } catch { return true; }
    }
  }))[0].result, recipeTab.id);
  assert.equal(denied, true);
  console.log('PASS real page capture, layout, Unicode payload, and credential isolation');
  await popup.setViewportSize({ width: 376, height: 520 });
  await popup.evaluate(() => document.fonts.ready);
  await popup.locator('main').screenshot({ path: 'work/screenshots/submitted.png' });
  await popup.reload();
  await popup.getByRole('heading', { name: 'Sent to Paprika.' }).waitFor();
  assert.equal(await worker.evaluate(() => globalThis.__uploads.length), 1);
  assert.ok(await popup.locator('#retry').isHidden());
  assert.equal(await popup.getByRole('checkbox').count(), 0);
  await popup.evaluate(tab => chrome.runtime.sendMessage({ type: 'SAVE', tabId: tab.id, url: tab.url, retry: true }), recipeTab);
  assert.equal(await worker.evaluate(() => globalThis.__uploads.length), 1);
  console.log('PASS popup reopening does not create duplicates');
  await worker.evaluate(() => { globalThis.__responseStatus = -1; });
  await recipe.goto('https://recipe.example/network-failure');
  await popup.addInitScript(tab => { chrome.tabs.query = async () => [tab]; }, { ...recipeTab, url: recipe.url() });
  await popup.reload();
  await popup.getByRole('heading', { name: 'Check your recipes.' }).waitFor();
  assert.ok(await popup.locator('#retry').isHidden());
  await popup.evaluate(tab => chrome.runtime.sendMessage({ type: 'SAVE', tabId: tab.id, url: 'https://recipe.example/network-failure', retry: true }), recipeTab);
  await popup.reload();
  await popup.getByRole('heading', { name: 'Check your recipes.' }).waitFor();
  assert.equal(await worker.evaluate(() => globalThis.__uploads.length), 2);
  console.log('PASS unknown network outcome prevents duplicate retry');
  await worker.evaluate(() => { globalThis.__responseStatus = 403; });
  await recipe.goto('https://recipe.example/refused');
  await popup.addInitScript(tab => { chrome.tabs.query = async () => [tab]; }, { ...recipeTab, url: recipe.url() });
  await popup.reload();
  await popup.getByRole('heading', { name: 'Reconnect Paprika.' }).waitFor();
  console.log('PASS refused request offers reconnection');
  await popup.getByRole('button', { name: 'Disconnect', exact: true }).click();
  await popup.getByRole('button', { name: /Connect Paprika/ }).waitFor();
  assert.equal(await worker.evaluate(async () => (await chrome.storage.local.get('token')).token), undefined);
  console.log('PASS disconnect clears the credential');
  assert.deepEqual(errors, []);
  console.log('Browser fixture checks passed. Real Paprika login/save and manual toolbar permission still need validation.');
} finally {
  await context.close();
  await rm(temp, { recursive: true, force: true });
}

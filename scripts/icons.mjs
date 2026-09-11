import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const svg = await readFile('extension/icons/icon.svg', 'utf8');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:100vw;height:100vh}</style>${svg}`);
  for (const size of [16, 32, 48, 128]) {
    await page.setViewportSize({ width: size, height: size });
    // Store guidance: 96px artwork with 16px transparent padding in the 128px icon.
    await page.addStyleTag({ content: size === 128 ? 'svg{width:96px;height:96px;margin:16px}' : 'svg{width:100vw;height:100vh;margin:0}' });
    await page.screenshot({ path: `extension/icons/icon-${size}.png`, omitBackground: true });
  }
} finally { await browser.close(); }

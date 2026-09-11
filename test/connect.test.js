import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const script = await readFile(new URL('../extension/connect.js', import.meta.url), 'utf8');
const fake = "javascript:save('//www.paprikaapp.com/bookmarklet/v1?token=0123456789abcdef&timestamp=0')";
const tick = ms => new Promise(resolve => setTimeout(resolve, ms));

async function page(eligible) {
  const dom = new JSDOM('<!doctype html><body><input type="password" value="NEVER_READ"></body>', {
    url: 'https://www.paprikaapp.com/bookmarklet/', runScripts: 'outside-only'
  });
  const messages = [];
  Object.defineProperty(dom.window.document.querySelector('input'), 'value', { get() { throw new Error('Password accessed'); } });
  dom.window.chrome = { runtime: { sendMessage: async message => {
    messages.push(message);
    return message.type === 'CONNECT_CONTEXT' ? { eligible, expiresAt: Date.now() + 5000 } : { connected: true };
  } } };
  return { dom, messages };
}

test('detects an already generated bookmarklet and never reads the password field', async () => {
  const { dom, messages } = await page(true);
  const link = dom.window.document.createElement('a');
  link.setAttribute('href', fake);
  dom.window.document.body.append(link);
  dom.window.eval(script);
  await tick(20);
  assert.equal(messages[1].bookmarklet, fake);
  assert.match(dom.window.document.querySelector('[role=status]').textContent, /connected/);
  dom.window.close();
});

test('watches a bookmarklet appearing after login and stops after acceptance', async () => {
  const { dom, messages } = await page(true);
  dom.window.eval(script);
  await tick(10);
  const code = dom.window.document.createElement('textarea');
  code.setAttribute('readonly', '');
  code.value = fake;
  dom.window.document.body.append(code);
  await tick(220);
  assert.equal(messages.filter(m => m.type === 'CONNECT_TOKEN').length, 1);
  dom.window.document.body.append(dom.window.document.createElement('div'));
  await tick(220);
  assert.equal(messages.filter(m => m.type === 'CONNECT_TOKEN').length, 1);
  dom.window.close();
});

test('a bookmarklet on an unrelated browsing session is not collected', async () => {
  const { dom, messages } = await page(false);
  const link = dom.window.document.createElement('a');
  link.setAttribute('href', fake);
  dom.window.document.body.append(link);
  dom.window.eval(script);
  await tick(20);
  assert.deepEqual(messages.map(m => m.type), ['CONNECT_CONTEXT']);
  dom.window.close();
});

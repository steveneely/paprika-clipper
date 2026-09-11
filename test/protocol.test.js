import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateRawSync } from 'node:zlib';
import { parseBookmarklet, isBookmarkletPage, validConnectionSender, deflateBase64, makePayload, classifyResponse, canCapture } from '../extension/protocol.js';

const fakeToken = '0123456789abcdef';
const bookmarklet = `javascript:(function(){var s=document.createElement('script');s.src=document.location.protocol+'//www.paprikaapp.com/bookmarklet/v1?token=${fakeToken}&timestamp='+Date.now()})();`;

test('parses synthetic generated bookmarklets without evaluating them', () => {
  assert.equal(parseBookmarklet(bookmarklet), fakeToken);
  assert.equal(parseBookmarklet(bookmarklet.replace("'//www", "'https://www")), fakeToken);
  assert.equal(parseBookmarklet(bookmarklet.replace('paprikaapp.com/', 'paprikaapp.com.evil.example/')), null);
  assert.equal(parseBookmarklet(bookmarklet.replace('javascript:', 'https:')), null);
  assert.equal(parseBookmarklet(bookmarklet.replace(fakeToken, `${fakeToken}INVALID`)), null);
  assert.equal(parseBookmarklet(null), null);
});

test('connection capture requires the intended top-level tab, origin, path, and unexpired flow', () => {
  const pending = { tabId: 12, expiresAt: 2000 };
  const sender = { tab: { id: 12 }, frameId: 0, url: 'https://www.paprikaapp.com/bookmarklet/' };
  assert.ok(validConnectionSender(sender, pending, 1000));
  assert.ok(!validConnectionSender(sender, pending, 2000));
  assert.ok(!validConnectionSender({ ...sender, frameId: 1 }, pending, 1000));
  assert.ok(!validConnectionSender({ ...sender, tab: { id: 13 } }, pending, 1000));
  assert.ok(!validConnectionSender({ ...sender, url: 'https://evil.example/bookmarklet/' }, pending, 1000));
  assert.ok(!validConnectionSender(sender, null, 1000));
  assert.ok(!isBookmarkletPage('https://www.paprikaapp.com/bookmarklet/v1'));
  assert.ok(!isBookmarkletPage('http://www.paprikaapp.com/bookmarklet/'));
});

test('page eligibility excludes internal pages and Paprika account pages', () => {
  assert.ok(canCapture('https://example.com/recipe'));
  for (const url of ['chrome://extensions', 'file:///tmp/recipe.html', 'https://www.paprikaapp.com/bookmarklet/', 'https://chromewebstore.google.com/detail/test', 'invalid']) assert.ok(!canCapture(url));
});

test('compression interoperates with raw DEFLATE and preserves Unicode', async () => {
  for (const input of ['', '½ cup crème fraîche 🥘', 'a'.repeat(100000)]) {
    assert.equal(inflateRawSync(Buffer.from(await deflateBase64(input), 'base64')).toString('utf8'), input);
  }
});

test('submission format preserves URL encoding and compressed page/style content', async () => {
  const capture = { url: 'https://example.com/recipe?q=50%25&x=é', html: '<p>½ cup</p>', styles: '{"0":{"frame":"0;0;1;1"}}' };
  const payload = await makePayload(capture, fakeToken);
  const roundtrip = new URLSearchParams(payload.toString());
  assert.deepEqual([...roundtrip.keys()].sort(), ['html', 'styles', 'token', 'url']);
  assert.equal(roundtrip.get('url'), capture.url);
  assert.equal(roundtrip.get('token'), fakeToken);
  for (const field of ['html', 'styles']) assert.equal(inflateRawSync(Buffer.from(roundtrip.get(field), 'base64')).toString(), capture[field]);
  await assert.rejects(makePayload({ ...capture, url: 'file:///secret' }, fakeToken));
});

test('HTTP success and arbitrary response HTML are never reported as confirmed saves', () => {
  assert.equal(classifyResponse(200, '<script>alert(1)</script>Recipe saved').kind, 'submitted');
  assert.equal(classifyResponse(200, '{"result":true}', 'application/json').kind, 'submitted');
  assert.equal(classifyResponse(200, '{"error":"private diagnostic"}', 'application/json').kind, 'error');
  assert.equal(classifyResponse(403, '').kind, 'reconnect');
  assert.equal(classifyResponse(429, '').kind, 'error');
  assert.equal(classifyResponse(500, '').kind, 'uncertain');
  assert.equal(classifyResponse(302, '').kind, 'error');
});

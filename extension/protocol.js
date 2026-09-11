export const BOOKMARKLET_URL = 'https://www.paprikaapp.com/bookmarklet/';
export const SAVE_URL = 'https://www.paprikaapp.com/bookmarklet/v1/recipe';
export const MAX_CAPTURE_BYTES = 20 * 1024 * 1024;

export function isBookmarkletPage(value) {
  try {
    const url = new URL(value);
    return url.origin === 'https://www.paprikaapp.com' &&
      ['/bookmarklet', '/bookmarklet/'].includes(url.pathname);
  } catch { return false; }
}

export function parseBookmarklet(value) {
  if (typeof value !== 'string' || value.length > 32768 || !/^javascript:/i.test(value.trim())) return null;
  // Parse a literal URL in the generated bookmarklet. Never evaluate its code.
  const match = value.match(/['"](?:https?:)?\/\/www\.paprikaapp\.com\/bookmarklet\/v1\?token=([a-f0-9]{16,128})(?=&|['"])/i);
  return match ? match[1] : null;
}

export function canCapture(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) &&
      !['paprikaapp.com', 'www.paprikaapp.com', 'chromewebstore.google.com'].includes(url.hostname) &&
      !(url.hostname === 'chrome.google.com' && url.pathname.startsWith('/webstore'));
  } catch { return false; }
}

export function validConnectionSender(sender, pending, now = Date.now()) {
  return Boolean(pending && pending.expiresAt > now && sender.frameId === 0 &&
    sender.tab?.id === pending.tabId && isBookmarkletPage(sender.url));
}

export async function deflateBase64(text) {
  // CompressionStream('deflate') emits zlib. Paprika expects raw DEFLATE:
  // remove the two-byte zlib header and four-byte Adler-32 checksum.
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate'));
  const zlib = new Uint8Array(await new Response(stream).arrayBuffer());
  const raw = zlib.subarray(2, -4);
  let binary = '';
  for (let i = 0; i < raw.length; i += 32768) {
    binary += String.fromCharCode(...raw.subarray(i, i + 32768));
  }
  return btoa(binary);
}

export async function makePayload(capture, token) {
  if (!canCapture(capture?.url) || typeof capture.html !== 'string' || typeof capture.styles !== 'string') {
    throw new Error('The page could not be captured.');
  }
  if (new Blob([capture.html, capture.styles]).size > MAX_CAPTURE_BYTES) {
    throw new Error('This page is too large. Try its print-friendly recipe page.');
  }
  const [html, styles] = await Promise.all([deflateBase64(capture.html), deflateBase64(capture.styles)]);
  return new URLSearchParams({ url: capture.url, html, styles, token });
}

export function classifyResponse(status, body, contentType = '') {
  // Treat undocumented responses conservatively. HTTP 200 is not a save receipt.
  if (status === 401 || status === 403) {
    return { kind: 'reconnect', message: 'Paprika refused this request. Reconnect your account and try again.' };
  }
  if (status === 429) return { kind: 'error', message: 'Paprika is busy. Wait a little before trying again.' };
  if (status >= 500) return { kind: 'uncertain', message: 'Paprika had a server error. Check your recipes in Paprika. This page will not be sent again automatically.' };
  if (status < 200 || status >= 300) return { kind: 'error', message: `Paprika could not accept this request (HTTP ${status}).` };
  if (contentType.includes('application/json')) {
    try {
      const data = JSON.parse(body);
      if (data?.error || data?.success === false) {
        return { kind: 'error', message: 'Paprika reported a problem saving this page. Try reconnecting or using its print-friendly recipe page.' };
      }
    } catch { /* Unknown response: never interpret it as confirmation. */ }
  }
  return { kind: 'submitted', message: 'Page sent to Paprika. Open Paprika to view your recipe and confirm it was saved.' };
}

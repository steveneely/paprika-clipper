import { BOOKMARKLET_URL, SAVE_URL, parseBookmarklet, validConnectionSender, canCapture, makePayload, classifyResponse } from './protocol.js';
import { capturePage } from './capture.js';

const ready = Promise.all([
  chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }),
  chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' })
]);
let mutations = Promise.resolve();
const serialize = fn => {
  const next = mutations.then(fn, fn);
  mutations = next.catch(() => {});
  return next;
};
const inFlight = new Map();
const statusKey = tabId => `save:${tabId}`;
const trustedUI = sender => sender.id === chrome.runtime.id &&
  sender.url?.split('#')[0] === chrome.runtime.getURL('popup.html');

async function setStatus(tabId, status) {
  const state = { ...status, updatedAt: Date.now() };
  await chrome.storage.session.set({ [statusKey(tabId)]: state });
  const badges = { capturing: '…', sending: '…', submitted: 'SENT', uncertain: '?', error: '!', reconnect: '!' };
  await Promise.allSettled([
    chrome.action.setBadgeText({ tabId, text: badges[state.kind] || '' }),
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#b43e35' }),
    chrome.action.setTitle({ tabId, title: `Paprika Clipper (Unofficial): ${state.message}` })
  ]);
  return state;
}

async function state(tabId) {
  const { token } = await chrome.storage.local.get('token');
  const stored = await chrome.storage.session.get(['pending', statusKey(tabId)]);
  let save = stored[statusKey(tabId)] || null;
  if (save && ['capturing', 'sending'].includes(save.kind) && !inFlight.has(tabId)) {
    save = await setStatus(tabId, { ...save, kind: 'uncertain', message: 'The save was interrupted. Check Paprika before trying again.' });
  }
  return { connected: Boolean(token), connecting: stored.pending?.expiresAt > Date.now(), save };
}

async function connect() {
  if (inFlight.size) return { error: 'Wait for the current save to finish before changing your connection.' };
  const { pending } = await chrome.storage.session.get('pending');
  if (pending?.expiresAt > Date.now()) {
    try { await chrome.tabs.update(pending.tabId, { active: true }); return { ok: true }; } catch { /* Closed tab. */ }
  }
  const tab = await chrome.tabs.create({ url: 'about:blank' });
  await chrome.storage.session.set({ pending: { tabId: tab.id, expiresAt: Date.now() + 15 * 60 * 1000 } });
  await chrome.tabs.update(tab.id, { url: BOOKMARKLET_URL });
  return { ok: true };
}

async function acceptToken(message, sender) {
  if (inFlight.size) return { connected: false };
  const { pending } = await chrome.storage.session.get('pending');
  if (!validConnectionSender(sender, pending)) return { expired: true };
  const token = parseBookmarklet(message.bookmarklet);
  if (!token) return { connected: false };
  await chrome.storage.local.set({ token, connectedAt: Date.now() });
  await chrome.storage.session.remove('pending');
  // A freshly connected account must not inherit another account's save history.
  const all = await chrome.storage.session.get(null);
  await chrome.storage.session.remove(Object.keys(all).filter(key => key.startsWith('save:')));
  return { connected: true };
}

async function performSave(tabId, expectedUrl) {
  let submitted = false;
  try {
    const { token } = await chrome.storage.local.get('token');
    if (!token) return await setStatus(tabId, { url: expectedUrl, kind: 'reconnect', message: 'Connect Paprika to save recipes.' });
    const tab = await chrome.tabs.get(tabId);
    if (!canCapture(tab.url) || tab.url !== expectedUrl) {
      return await setStatus(tabId, { url: expectedUrl, kind: 'error', message: 'Open a recipe webpage, then click the extension again.' });
    }
    await setStatus(tabId, { kind: 'capturing', url: tab.url, message: 'Preparing this page for Paprika…' });
    const results = await chrome.scripting.executeScript({ target: { tabId }, func: capturePage });
    const capture = results[0]?.result;
    if (capture?.error) throw new Error(capture.error);
    if (!capture || capture.url !== expectedUrl) throw new Error('The page changed. Open the recipe and try again.');
    const payload = await makePayload(capture, token);
    const current = await chrome.storage.local.get('token');
    if (current.token !== token) throw new Error('Your connection changed. Open the extension and try again.');
    await setStatus(tabId, { kind: 'sending', url: expectedUrl, message: 'Sending this page to Paprika…' });
    submitted = true;
    // No automatic retry: a dropped response may still have created the recipe.
    const response = await fetch(SAVE_URL, {
      method: 'POST', body: payload, credentials: 'omit', redirect: 'error',
      referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(25000)
    });
    const body = await response.text();
    return await setStatus(tabId, { url: expectedUrl, ...classifyResponse(response.status, body, response.headers.get('content-type') || '') });
  } catch (error) {
    const message = submitted ? 'The response was interrupted. The recipe may have saved. Check Paprika before trying again.' :
      /too large|page changed|connection changed|page is not ready/i.test(error.message) ? error.message :
        'Chrome could not capture this page. Refresh the recipe page and try again.';
    return await setStatus(tabId, { url: expectedUrl, kind: submitted ? 'uncertain' : 'error', message });
  }
}

async function save(tabId, url, retry) {
  if (!Number.isInteger(tabId) || !canCapture(url)) return { error: 'Open a recipe webpage first.' };
  if (inFlight.has(tabId)) return inFlight.get(tabId);
  // Register the lock before awaiting storage to prevent simultaneous invocations.
  const job = (async () => {
    const stored = (await chrome.storage.session.get(statusKey(tabId)))[statusKey(tabId)];
    if (stored?.url === url && !retry) return stored;
    return performSave(tabId, url);
  })();
  inFlight.set(tabId, job);
  try { return await job; } finally { inFlight.delete(tabId); }
}

async function handle(message, sender) {
  await ready;
  if (sender.id !== chrome.runtime.id) return { error: 'Unavailable.' };
  if (message?.type === 'CONNECT_CONTEXT') {
    const { pending } = await chrome.storage.session.get('pending');
    return validConnectionSender(sender, pending) ? { eligible: true, expiresAt: pending.expiresAt } : { eligible: false };
  }
  if (message?.type === 'CONNECT_TOKEN') return serialize(() => acceptToken(message, sender));
  if (!trustedUI(sender)) return { error: 'Unavailable.' };
  switch (message?.type) {
    case 'STATE': return state(message.tabId);
    case 'CONNECT': return serialize(connect);
    case 'DISCONNECT': return serialize(async () => {
      if (inFlight.size) return { error: 'Wait for the current save to finish before disconnecting.' };
      await chrome.storage.local.clear();
      await chrome.storage.session.clear();
      await Promise.allSettled((await chrome.tabs.query({})).map(tab => chrome.action.setBadgeText({ tabId: tab.id, text: '' })));
      return { ok: true };
    });
    case 'SAVE': return save(message.tabId, message.url, message.retry === true);
    default: return { error: 'Unknown action.' };
  }
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  handle(message, sender).then(respond).catch(() => respond({ error: 'The extension could not complete this action. Please try again.' }));
  return true;
});
chrome.tabs.onRemoved.addListener(tabId => {
  serialize(async () => {
    await ready;
    const { pending } = await chrome.storage.session.get('pending');
    if (pending?.tabId === tabId) await chrome.storage.session.remove('pending');
    await chrome.storage.session.remove(statusKey(tabId));
  }).catch(() => {});
});

import { canCapture, isBookmarkletPage } from './protocol.js';

const el = id => document.getElementById(id);
const send = message => chrome.runtime.sendMessage(message);
const settings = location.hash === '#settings';
if (settings) document.body.dataset.view = 'settings';
let tab;
let busy = false;
let retryNeedsCheck = false;
let polling;

function render(state) {
  const connected = state.connected;
  el('connection').textContent = connected ? 'Connected' : 'Not connected';
  el('connection').dataset.connected = String(Boolean(connected));
  el('connect').hidden = connected;
  el('disconnect').hidden = !connected;
  el('disconnect').disabled = false;
  el('retry').hidden = true;
  el('check-label').hidden = true;
  el('detail').textContent = connected ? 'Your connection is stored only in this Chrome profile.' : 'Sign in on Paprika’s website. Your password stays there.';
  if (!connected) {
    el('heading').textContent = state.connecting ? 'Finish connecting' : 'Connect to Paprika';
    el('message').textContent = state.connecting ? 'Sign in on the Paprika tab. We’ll connect automatically when your bookmarklet appears.' : 'Connect your Paprika account to save recipes straight from Chrome.';
    el('connect').textContent = state.connecting ? 'Return to Paprika ↗' : 'Connect Paprika ↗';
    return;
  }
  if (settings || !canCapture(tab?.url)) {
    el('heading').textContent = 'Ready to save recipes';
    el('message').textContent = isBookmarkletPage(tab?.url) ? 'You’re connected. Open a recipe webpage and click the Paprika Clipper toolbar button.' : 'Open a recipe webpage, then click the toolbar button to save it to Paprika.';
    return;
  }
  const save = state.save?.url === tab.url ? state.save : null;
  const titles = { capturing: 'Preparing your page.', sending: 'Sending to Paprika…', submitted: 'Sent to Paprika.', uncertain: 'Check your recipes.', error: 'Unable to save this page', reconnect: 'Reconnect Paprika.' };
  el('heading').textContent = titles[save?.kind] || 'Preparing your page.';
  el('message').textContent = save?.message || 'Getting this recipe page ready for Paprika…';
  const saving = !save || ['capturing', 'sending'].includes(save.kind);
  el('disconnect').disabled = saving;
  if (save?.kind === 'reconnect') {
    el('connect').hidden = false;
    el('connect').textContent = 'Reconnect Paprika ↗';
  } else if (!saving) {
    retryNeedsCheck = ['submitted', 'uncertain'].includes(save.kind);
    el('retry').hidden = false;
    el('retry').textContent = retryNeedsCheck ? 'Save this page again' : 'Try again';
    el('check-label').hidden = !retryNeedsCheck;
    el('retry').disabled = busy || (retryNeedsCheck && !el('checked').checked);
  }
}

async function refresh() {
  const state = await send({ type: 'STATE', tabId: tab?.id });
  if (state.error) throw new Error(state.error);
  render(state);
  return state;
}
function failure() {
  el('heading').textContent = 'Something went wrong.';
  el('message').textContent = 'Close and reopen the extension to try again.';
}
async function save(retry = false) {
  if (busy) return;
  busy = true;
  el('retry').disabled = true;
  try {
    const result = await send({ type: 'SAVE', tabId: tab.id, url: tab.url, retry });
    if (result?.error) throw new Error(result.error);
    await refresh();
  } catch { failure(); }
  finally { busy = false; }
}
el('connect').addEventListener('click', async () => {
  el('connect').disabled = true;
  try {
    const result = await send({ type: 'CONNECT' });
    if (result.error) throw new Error(result.error);
    window.close();
  } catch { failure(); el('connect').disabled = false; }
});
el('disconnect').addEventListener('click', async () => {
  try {
    const result = await send({ type: 'DISCONNECT' });
    if (result.error) { el('detail').textContent = result.error; return; }
    await refresh();
  } catch { failure(); }
});
el('checked').addEventListener('change', () => { el('retry').disabled = busy || (retryNeedsCheck && !el('checked').checked); });
el('retry').addEventListener('click', () => {
  if (!retryNeedsCheck || el('checked').checked) { el('checked').checked = false; save(true); }
});
try {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const initial = await refresh();
  if (!settings && initial.connected && canCapture(tab?.url)) save();
  polling = setInterval(() => refresh().catch(failure), 650);
} catch { failure(); }
window.addEventListener('pagehide', () => clearInterval(polling));

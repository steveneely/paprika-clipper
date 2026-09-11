import { canCapture } from './protocol.js';

const el = id => document.getElementById(id);
const send = message => chrome.runtime.sendMessage(message);
const settings = location.hash === '#settings';
if (settings) document.body.dataset.view = 'settings';
let tab;
let busy = false;
let polling;

function render(state) {
  const connected = state.connected;
  el('heading').hidden = !connected && !state.connecting;
  el('connection').textContent = connected ? 'Connected' : 'Not connected';
  el('connection').dataset.connected = String(Boolean(connected));
  el('connect').hidden = connected;
  el('disconnect').hidden = !connected;
  el('disconnect').disabled = false;
  el('retry').hidden = true;
  el('signin-note').hidden = connected;
  el('account-row').hidden = !connected;
  el('message').hidden = false;
  if (!connected) {
    el('heading').textContent = state.connecting ? 'Finish connecting' : '';
    el('message').textContent = state.connecting ? 'Finish signing in on the Paprika tab.' : 'Sign in on Paprika’s website.';
    el('connect').textContent = state.connecting ? 'Return to Paprika ↗' : 'Connect Paprika ↗';
    return;
  }
  if (settings || !canCapture(tab?.url)) {
    el('heading').textContent = 'Ready to save recipes';
    el('message').textContent = 'Open a recipe and click the scissors to save it.';
    return;
  }
  const save = state.save?.url === tab.url ? state.save : null;
  const titles = { capturing: 'Preparing your page.', sending: 'Sending to Paprika…', submitted: 'Sent to Paprika.', uncertain: 'Check your recipes.', error: 'Unable to save this page', reconnect: 'Reconnect Paprika.' };
  el('heading').textContent = titles[save?.kind] || 'Preparing your page.';
  el('message').textContent = save?.kind === 'submitted' ? 'Check Paprika to confirm it was saved.' : save?.kind === 'uncertain' ? 'The recipe may have saved. Check Paprika.' : save?.message || '';
  el('message').hidden = !save || ['capturing', 'sending'].includes(save.kind);
  const saving = !save || ['capturing', 'sending'].includes(save.kind);
  el('disconnect').disabled = saving;
  if (save?.kind === 'reconnect') {
    el('connect').hidden = false;
    el('connect').textContent = 'Reconnect Paprika ↗';
    el('signin-note').hidden = false;
  } else if (save?.kind === 'error') {
    el('retry').hidden = false;
    el('retry').disabled = busy;
  }
}

async function refresh() {
  const state = await send({ type: 'STATE', tabId: tab?.id });
  if (state.error) throw new Error(state.error);
  render(state);
  return state;
}
function failure() {
  el('message').hidden = false;
  el('heading').hidden = false;
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
    if (result.error) { el('message').hidden = false; el('message').textContent = result.error; return; }
    await refresh();
  } catch { failure(); }
});
el('retry').addEventListener('click', () => save(true));

try {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const initial = await refresh();
  if (!settings && initial.connected && canCapture(tab?.url)) save();
  polling = setInterval(() => refresh().catch(failure), 650);
} catch { failure(); }
window.addEventListener('pagehide', () => clearInterval(polling));

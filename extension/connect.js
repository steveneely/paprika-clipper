(() => {
  // Only the tab opened by an explicit Connect action is eligible.
  if (window.top !== window || !['/bookmarklet', '/bookmarklet/'].includes(location.pathname)) return;
  let observer;
  let timer;
  let expiry;
  let interval;
  let sending = false;
  const stop = () => { observer?.disconnect(); clearTimeout(timer); clearTimeout(expiry); clearInterval(interval); };
  const showConnected = () => {
    const notice = document.createElement('div');
    notice.setAttribute('role', 'status');
    const check = document.createElement('div');
    check.textContent = '✓';
    check.setAttribute('aria-hidden', 'true');
    check.style.cssText = 'display:grid;place-items:center;width:56px;height:56px;margin:0 auto 18px;border-radius:50%;background:#b43e35;color:#fff4df;font:700 34px/1 system-ui,sans-serif;';
    const title = document.createElement('strong');
    title.textContent = 'Paprika Recipe Clipper connected';
    title.style.cssText = 'display:block;font-size:28px;font-weight:700;line-height:1.2;color:#343138;';
    const next = document.createElement('div');
    next.style.cssText = 'margin-top:16px;font-size:20px;font-weight:600;line-height:1.4;color:#b43e35;';
    let seconds = 3;
    next.textContent = 'Closing this tab in 3 seconds…';
    const attribution = document.createElement('div');
    attribution.textContent = 'Unofficial, third-party extension. Not affiliated with Paprika or Hindsight Labs.';
    attribution.style.cssText = 'font-size:12px;line-height:1.5;margin-top:24px;color:#666;';
    notice.append(check, title, next, attribution);
    notice.style.cssText = 'box-sizing:border-box;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:420px;max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);overflow:auto;z-index:2147483647;padding:32px 24px;border:1px solid #e5ddd8;border-top:5px solid #b43e35;border-radius:16px;background:#fff;text-align:center;color:#333;font:14px/1.5 system-ui,sans-serif;box-shadow:0 16px 64px #0004,0 0 0 100vmax #0006;';
    document.body.append(notice);
    const countdown = setInterval(async () => {
      seconds -= 1;
      if (seconds > 0) {
        next.textContent = `Closing this tab in ${seconds} ${seconds === 1 ? 'second' : 'seconds'}…`;
        return;
      }
      clearInterval(countdown);
      next.textContent = 'Closing this tab…';
      try {
        const result = await chrome.runtime.sendMessage({ type: 'CLOSE_CONNECTION' });
        if (result?.closed) return;
      } catch { /* Closing the tab can end the message channel. */ }
      next.textContent = 'You’re connected. You can close this tab.';
    }, 1000);
    window.addEventListener('pagehide', () => clearInterval(countdown), { once: true });
  };
  async function scan() {
    if (sending) return;
    // Never read password inputs, form data, or the full authenticated page.
    const candidates = [...document.querySelectorAll('a[href]')].map(el => el.getAttribute('href'));
    for (const el of document.querySelectorAll('textarea[readonly], input[readonly]:not([type="password"]), pre, code')) {
      candidates.push(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.value : el.textContent);
    }
    for (const candidate of candidates) {
      if (!candidate || candidate.length > 32768 || !/^javascript:/i.test(candidate.trim()) ||
          !candidate.includes('www.paprikaapp.com/bookmarklet/v1?token=')) continue;
      sending = true;
      try {
        const result = await chrome.runtime.sendMessage({ type: 'CONNECT_TOKEN', bookmarklet: candidate });
        if (result?.connected) { stop(); showConnected(); return; }
        if (result?.expired) { stop(); return; }
      } catch { stop(); return; }
      finally { sending = false; }
    }
  }
  chrome.runtime.sendMessage({ type: 'CONNECT_CONTEXT' }).then(context => {
    if (!context?.eligible) return;
    observer = new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(scan, 150); });
    observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['href', 'value', 'readonly'] });
    expiry = setTimeout(stop, Math.max(0, context.expiresAt - Date.now()));
    // Updating a readonly control's .value does not trigger MutationObserver.
    interval = setInterval(scan, 1000);
    scan();
  }).catch(stop);
})();

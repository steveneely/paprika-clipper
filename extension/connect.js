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
    const title = document.createElement('strong');
    title.textContent = 'Paprika Clipper connected';
    const next = document.createElement('div');
    next.textContent = 'You can close this tab and save a recipe with the extension.';
    const attribution = document.createElement('div');
    attribution.textContent = 'Unofficial, third-party extension. Not affiliated with Paprika or Hindsight Labs.';
    attribution.style.cssText = 'font-size:12px;margin-top:8px;';
    notice.append(title, next, attribution);
    notice.style.cssText = 'position:fixed;bottom:24px;left:24px;right:24px;z-index:2147483647;padding:20px;border:1px solid #ddd;border-top:3px solid #d10505;border-radius:4px;background:#fff;color:#333;font:14px/1.428571429 "Helvetica Neue",Helvetica,Arial,sans-serif;box-shadow:0 1px 3px #0003;';
    document.body.append(notice);
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

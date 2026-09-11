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
    notice.textContent = 'Paprika Clipper connected. You can close this tab and save a recipe with the extension.';
    notice.style.cssText = 'position:fixed;bottom:24px;left:24px;right:24px;z-index:2147483647;padding:20px 24px;border-radius:14px;background:#203c2f;color:white;font:16px/1.5 system-ui;box-shadow:0 6px 30px #0003;';
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

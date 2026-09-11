// Serialized by chrome.scripting.executeScript into an isolated world.
// This function must not close over module variables or receive credentials.
export function capturePage() {
  if (!document.body || !document.documentElement) return { error: 'The page is not ready yet. Refresh it and try again.' };
  const elements = [...document.getElementsByTagName('*')];
  if (elements.length > 20000) return { error: 'This page is too large. Try its print-friendly recipe page.' };
  const properties = ['font-size', 'font-family', 'font-style', 'font-weight', 'text-transform', 'color', 'background-color', 'background-image', 'display', 'float', 'position', 'flex-direction', 'padding-left', 'padding-top', 'padding-right', 'padding-bottom', 'margin-left', 'margin-top', 'margin-right', 'margin-bottom', 'white-space', 'opacity', 'visibility', 'text-decoration', 'line-height', 'clear'];
  const clone = document.documentElement.cloneNode(true);
  const clonedElements = [clone, ...clone.querySelectorAll('*')];
  const ids = new Map(elements.map((element, index) => [element, String(index)]));
  const results = {};
  const rectText = rect => [rect.left + window.scrollX, rect.top + window.scrollY, rect.width, rect.height].join(';');
  // Match Paprika's IDs in a detached copy, without changing the live webpage.
  for (let i = 0; i < elements.length; i++) {
    clonedElements[i].setAttribute('data-prm-id', String(i));
    results[String(i)] = {};
  }
  for (const element of elements) {
    const attrs = results[ids.get(element)];
    if (['SCRIPT', 'LINK', 'NOSCRIPT', 'META', 'TITLE'].includes(element.tagName)) continue;
    const range = document.createRange();
    range.selectNodeContents(element);
    attrs.frame = rectText(range.getBoundingClientRect());
    if (element.children.length) {
      for (const node of element.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue.trim()) continue;
        const textRange = document.createRange();
        textRange.selectNodeContents(node);
        let previous = node.previousSibling;
        while (previous && previous.nodeType !== Node.ELEMENT_NODE) previous = previous.previousSibling;
        if (previous) results[ids.get(previous)]['frame-tail'] = rectText(textRange.getBoundingClientRect());
        else attrs['frame-head'] = rectText(textRange.getBoundingClientRect());
      }
    }
    const styles = window.getComputedStyle(element);
    for (const property of properties) attrs[property] = styles.getPropertyValue(property);
    attrs['before-content'] = window.getComputedStyle(element, ':before').getPropertyValue('content');
    attrs['after-content'] = window.getComputedStyle(element, ':after').getPropertyValue('content');
  }
  // Password/autofill fields have no role in recipe capture.
  for (const input of clone.querySelectorAll('input')) input.removeAttribute('value');
  for (const textarea of clone.querySelectorAll('textarea')) textarea.textContent = '';
  const html = clone.outerHTML;
  const styles = JSON.stringify(results);
  if (new Blob([html, styles]).size > 20 * 1024 * 1024) return { error: 'This page is too large. Try its print-friendly recipe page.' };
  return { url: location.href, html, styles };
}

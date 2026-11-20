// Tiny DOM helpers: build elements without innerHTML so guide text is always inserted as text.

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  appendChildren(node, children);
  return node;
}

export function appendChildren(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function clearNode(node) {
  node.replaceChildren();
  return node;
}

// Turns "text [2] more [1][3]" into text nodes plus clickable citation markers that jump to the sources list.
export function linkSourceMarkers(text, onCite) {
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(/\[(\d+)\]/g)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const n = Number(match[1]);
    parts.push(el('button', { class: 'cite', type: 'button', title: `Source ${n}`, onclick: () => onCite?.(n) }, String(n)));
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function percent(part, whole) {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

export function progressBar(part, whole, className = '') {
  const pct = percent(part, whole);
  return el('div', { class: `bar ${className}`, role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 },
    el('span', { class: 'bar-fill', style: { width: `${pct}%` } }));
}

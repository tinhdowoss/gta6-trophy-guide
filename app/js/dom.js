// DOM helpers for Leonida Ledger: elements are built node by node (never innerHTML), so guide text stays text.

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style') Object.assign(node.style, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  return appendChildren(node, children);
}

export function appendChildren(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

// One citation marker per source number: [3][5] after a step, each a button that highlights that source.
export function citeMarkers(refs, onCite) {
  return el('span', { class: 'cite-group' },
    refs.map((ref) => el('button', {
      class: 'cite', type: 'button', title: `Source [${ref}]`, dataset: { ref },
      onclick: (event) => { event.stopPropagation(); onCite?.(ref); },
    }, `[${ref}]`)));
}

// Turns guide prose containing "[3][4]" into text nodes plus clickable markers.
export function proseWithCitations(text, onCite) {
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(/\[(\d+)\]/g)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(citeMarkers([Number(match[1])], onCite));
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function percent(part, whole) {
  return whole ? Math.round((part / whole) * 100) : 0;
}

export function progressBar(part, whole, className = '') {
  const pct = percent(part, whole);
  return el('span', { class: `bar ${className}`, role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 },
    el('span', { class: 'bar-fill', style: { width: `${pct}%` } }));
}

export function gradeBadge(grade) {
  return el('span', { class: `grade-badge grade-${grade}`, title: grade }, grade[0].toUpperCase());
}

export function siteOf(url) {
  return url.replace(/^[a-z]+:\/\//, '').replace(/^www\./, '').split('/')[0];
}

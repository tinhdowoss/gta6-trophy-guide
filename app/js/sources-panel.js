// The sources column: every source the open guide cites, numbered as cited ([1]..[10] are global), with site,
// page title, link, date read, whether we read it in full, and how many of the 55 guides cite it.

import { el, siteOf } from './dom.js';

export function countGuidesCitingEachSource(trophies) {
  const counts = new Map();
  for (const t of trophies) {
    for (const s of t.sources) counts.set(s.ref, (counts.get(s.ref) ?? 0) + 1);
  }
  return counts;
}

function readLabel(source) {
  if (source.read === 'full') return 'read in full';
  return 'official list only';
}

function renderSourceItem(source, citedBy, total, highlighted) {
  return el('li', { class: `source-item${highlighted ? ' is-highlighted' : ''}`, id: `source-${source.ref}` },
    el('span', { class: 'source-ref' }, `[${source.ref}]`),
    el('div', { class: 'source-body' },
      el('a', { class: 'source-title', href: source.url, target: '_blank', rel: 'noopener noreferrer' }, `${source.site} — ${source.title}`),
      el('span', { class: 'source-meta' },
        el('span', { class: 'source-host' }, siteOf(source.url)),
        el('span', {}, `read ${source.retrieved}`),
        el('span', { class: `source-read read-${source.read}` }, readLabel(source)),
        el('span', { class: 'source-cited' }, `cited by ${citedBy} of ${total}`))));
}

export function renderSourcesColumn(container, trophy, state) {
  state.citedBy ??= countGuidesCitingEachSource(state.trophies);
  const refs = trophy ? trophy.sources.map((s) => s.ref) : state.sources.map((s) => s.ref);
  const items = refs.map((ref) => state.sourceByRef.get(ref)).filter(Boolean);
  container.replaceChildren(
    el('div', { class: 'column-head' },
      el('h2', {}, 'Sources'),
      el('span', { class: 'column-meta' }, trophy ? `${items.length} cited by this guide` : `${items.length} in the register`)),
    el('ol', { id: 'source-list', class: 'source-list' },
      items.map((s) => renderSourceItem(s, state.citedBy.get(s.ref) ?? 0, state.trophies.length, state.ui.highlightRef === s.ref))));
}

// The checklist column: every trophy as a row with its grade letter, official name and description, tags and citations.

import { escapeHtml, gradeBadge, riskTags } from './html-helpers.js';
import { applySpoilerMode } from './spoiler-mode.js';
import { describeFilters } from './trophy-filters.js';

export function checklistRow(trophy, store, openId) {
  const shown = applySpoilerMode(trophy, store);
  const earned = store.isEarned(trophy.id);
  const classes = ['trophy-row', earned && 'is-earned', shown.masked && 'is-masked', trophy.id === openId && 'is-open']
    .filter(Boolean)
    .join(' ');
  const counted = earned && trophy.count ? trophy.count.target : store.counter(trophy.id);
  const counter = trophy.count ? `<span class="row-counter">${counted}/${trophy.count.target}</span>` : '';
  const citeCount = new Set(trophy.steps.flatMap((s) => s.cites)).size;
  return `<div class="${classes}" data-trophy="${trophy.id}">
    <input type="checkbox" data-earn="${trophy.id}" ${earned ? 'checked' : ''} aria-label="Earned">
    ${gradeBadge(trophy.grade)}
    <div class="row-text">
      <div class="row-line"><span class="row-name">${escapeHtml(shown.name)}</span>${riskTags(trophy)}</div>
      <div class="row-line"><span class="row-desc">${escapeHtml(shown.description)}</span>${counter}<span class="row-cites" title="Sources cited by this guide">[${citeCount} src]</span></div>
    </div>
  </div>`;
}

export function renderChecklist(container, { trophies, filtered, filters, store, openId, onOpen }) {
  const earnedHere = filtered.filter((t) => store.isEarned(t.id)).length;
  const rows = filtered.map((t) => checklistRow(t, store, openId)).join('');
  container.innerHTML =
    `<div class="checklist-head"><span>${filtered.length} of ${trophies.length} · ${escapeHtml(describeFilters(filters))}</span><span>${earnedHere} earned</span></div>` +
    (rows || '<p class="checklist-empty">No trophy matches these filters.</p>');

  container.onclick = (event) => {
    const box = event.target.closest('[data-earn]');
    if (box) {
      store.setEarned(Number(box.dataset.earn), box.checked);
      return;
    }
    const row = event.target.closest('[data-trophy]');
    if (row && onOpen) onOpen(Number(row.dataset.trophy));
  };
  const open = container.querySelector('.is-open');
  if (open && !container.dataset.scrolled) {
    open.scrollIntoView({ block: 'nearest' });
  }
}

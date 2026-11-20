// Right column: the open trophy's numbered sources (site, page, link, date read, how many guides cite it) and "Next up".

import { escapeHtml, gradeBadge, riskTags } from './html-helpers.js';
import { trophiesInRoadmapOrder } from './trophy-data.js';
import { applySpoilerMode } from './spoiler-mode.js';

export function renderSourceList(trophy, index) {
  const items = trophy.sources
    .slice()
    .sort((a, b) => a.ref - b.ref)
    .map((s) => {
      const full = index.sourcesByRef.get(s.ref);
      return `<li class="source-item">
        <span class="source-num">[${s.ref}]</span>
        <div class="source-body"><div class="source-head"><span class="source-site">${escapeHtml(full.site)}</span> <span class="source-title" title="${escapeHtml(full.title)}">${escapeHtml(full.title)}</span></div>
          <a class="source-url" href="${escapeHtml(full.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(full.url.replace(/^https:\/\/(www\.)?/, ''))}</a>
          <div class="source-date">read ${escapeHtml(s.retrieved)} · cited by ${full.citedBy}/${index.trophies.length}</div></div>
      </li>`;
    })
    .join('');
  return `<h2 class="side-title">Sources for this trophy [${trophy.sources.length}]</h2><ol class="source-list">${items}</ol>`;
}

/** The next unearned trophies in platinum-roadmap order (missables first within a stage). */
export function nextUpTrophies(index, store, limit = 6) {
  return trophiesInRoadmapOrder(index).filter((t) => !store.isEarned(t.id) && t.grade !== 'platinum').slice(0, limit);
}

export function renderNextUp(index, store) {
  const items = nextUpTrophies(index, store)
    .map((t) => {
      const shown = applySpoilerMode(t, store);
      return `<li class="next-up-item" data-trophy="${t.id}">${gradeBadge(t.grade)}<span class="next-up-name">${escapeHtml(shown.masked ? 'Hidden story trophy' : t.name)}</span>${riskTags(t)}<span class="next-up-stage">st ${t.roadmapStage}</span></li>`;
    })
    .join('');
  return `<h2 class="side-title">Next up in roadmap order</h2><ol class="next-up-list">${items}</ol>`;
}

export function renderSourcesColumn(container, trophy, index, store, onOpen) {
  container.innerHTML = (trophy ? renderSourceList(trophy, index) : '') + renderNextUp(index, store);
  container.onclick = (event) => {
    const item = event.target.closest('[data-trophy]');
    if (item) onOpen(Number(item.dataset.trophy));
  };
}

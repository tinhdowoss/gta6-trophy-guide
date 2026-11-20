// Platinum roadmap: the 10 stages in play order, each with its trophies, grade badges, progress and missable flags.

import { escapeHtml, gradeBadge, riskTags, progressBar } from './html-helpers.js';
import { applySpoilerMode } from './spoiler-mode.js';

export function stageProgress(stage, store) {
  const earned = stage.trophies.filter((t) => store.isEarned(t.id)).length;
  return { earned, total: stage.trophies.length };
}

export function buildPlatinumRoadmap(container, index, store, onOpen) {
  const totalEarned = index.trophies.filter((t) => store.isEarned(t.id)).length;
  const flagged = index.trophies.filter((t) => t.missable !== 'no').length;
  const cards = index.stages
    .map((stage) => {
      const { earned, total } = stageProgress(stage, store);
      const rows = stage.trophies
        .map((t) => {
          const shown = applySpoilerMode(t, store);
          const done = store.isEarned(t.id) ? ' is-earned' : '';
          return `<li class="stage-trophy${done}" data-trophy="${t.id}">${gradeBadge(t.grade)}<span class="stage-name">${escapeHtml(shown.masked ? 'Hidden story trophy' : t.name)}</span>${riskTags(t)}</li>`;
        })
        .join('');
      return `<section class="roadmap-stage${earned === total ? ' is-done' : ''}">
        <h2><span>${stage.stage}</span>${escapeHtml(stage.title)}</h2>
        <p class="stage-note">${escapeHtml(stage.note)}</p>
        <div class="stage-progress">${progressBar(earned, total)}<span>${earned}/${total}</span></div>
        <ul class="stage-trophies">${rows}</ul>
      </section>`;
    })
    .join('');
  container.innerHTML =
    `<p class="view-intro"><b>Platinum roadmap · ${totalEarned}/${index.trophies.length} earned</b> — story chapters, then strands, collectibles, activities, crime, 100%. ` +
    `${flagged} missable/watch trophies listed first in their stage. Order follows the three-step plans of PowerPyx, GTABase and KeenGamer <sup class="cite">[1][3][4]</sup>.</p>` +
    `<div class="roadmap-grid">${cards}</div>`;
  container.onclick = (event) => {
    const row = event.target.closest('[data-trophy]');
    if (row) onOpen(Number(row.dataset.trophy));
  };
}

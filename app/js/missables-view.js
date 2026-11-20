// Missables view: every possibly-missable and watch trophy with its point of no return, a chapter timeline,
// and the spoiler panel showing which story trophies stay masked until earned.

import { escapeHtml, gradeBadge, citeMarks, riskTags } from './html-helpers.js';
import { applySpoilerMode, isSpoilerTrophy } from './spoiler-mode.js';
import { checklistRow } from './render-checklist.js';

export function missableTrophies(index) {
  const rank = { possibly: 0, watch: 1 };
  return index.trophies.filter((t) => t.missable !== 'no').sort((a, b) => rank[a.missable] - rank[b.missable] || a.roadmapStage - b.roadmapStage);
}

function missableCard(trophy, store) {
  const shown = applySpoilerMode(trophy, store);
  const cites = [...new Set(trophy.steps.flatMap((s) => s.cites))].sort((a, b) => a - b);
  const verdict = trophy.missable === 'possibly' ? 'Possibly missable' : 'Watch';
  return `<article class="missable-card${trophy.missable === 'watch' ? ' is-watch' : ''}" data-trophy="${trophy.id}">
    <header>${gradeBadge(trophy.grade)}<h2>${escapeHtml(shown.name)}</h2>${riskTags(trophy, { withDiffer: true })}<span class="muted">${escapeHtml(trophy.chapter)}</span></header>
    <p class="ponr"><b>${verdict} · point of no return:</b> ${escapeHtml(trophy.pointOfNoReturn)} ${citeMarks(cites)}</p>
    ${trophy.differ ? `<p class="ponr-detail"><b>Sources differ</b> — A: ${escapeHtml(trophy.differ.a.text)} ${citeMarks(trophy.differ.a.cites)} · B: ${escapeHtml(trophy.differ.b.text)} ${citeMarks(trophy.differ.b.cites)} · <b>Our call:</b> ${escapeHtml(trophy.differ.call)}</p>` : ''}
  </article>`;
}

function pointsTimeline(points) {
  return `<ol class="timeline">${points
    .map((p) => `<li class="${p.ponr ? 'is-ponr' : ''}"><span class="tl-chapter">${escapeHtml(p.chapter)} · ${escapeHtml(p.when)}</span><br>${escapeHtml(p.what)} ${citeMarks(p.cites)}</li>`)
    .join('')}</ol>`;
}

export function renderMissablesView(container, index, store, onOpen) {
  const list = missableTrophies(index);
  const spoilerTrophies = index.trophies.filter(isSpoilerTrophy);
  const masked = spoilerTrophies.filter((t) => applySpoilerMode(t, store).masked);
  const possibly = list.filter((t) => t.missable === 'possibly').length;
  container.innerHTML = `<div>
      <p class="view-intro"><b>Missables</b> — ${possibly} possibly missable, ${list.length - possibly} to watch. Every guide we read agrees nothing else is lost for good; where they disagree, both versions are on the trophy's page.</p>
      <div class="missable-cards">${list.map((t) => missableCard(t, store)).join('')}</div>
    </div>
    <aside>
      <h2 class="side-title">Points of no return, in story order</h2>
      ${pointsTimeline(index.meta.pointsOfNoReturn)}
      <section class="spoiler-panel">
        <h2 class="side-title">Spoiler mode: ${masked.length} of ${spoilerTrophies.length} story trophies masked until earned</h2>
        ${[...masked, ...spoilerTrophies.filter((t) => !masked.includes(t))].slice(0, 6).map((t) => checklistRow(t, store, null)).join('')}
      </section>
    </aside>`;
  container.onclick = (event) => {
    const card = event.target.closest('.missable-card');
    if (card) onOpen(Number(card.dataset.trophy));
  };
}

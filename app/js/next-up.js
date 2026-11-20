// Next up: the unearned trophies to chase now, picked by roadmap order with missables pulled to the front.

import { el } from './dom.js';
import { gradeBadge } from './checklist-view.js';
import { displayName } from './spoiler-mode.js';
import { collectibleCount } from './progress-store.js';
import { applyTrophyFilters, describeActiveFilters } from './trophy-filters.js';

export function pickNextUpTrophies(state, limit = 8) {
  const open = applyTrophyFilters(state.trophies, state).filter((t) => !state.progress.earned.has(t.id) && t.id !== 1);
  if (open.length === 0) return [];
  const firstStage = Math.min(...open.map((t) => t.roadmapStage));
  return open
    .map((t) => ({ t, score: (t.roadmapStage - firstStage) * 10 - (t.missable === 'yes' ? 25 : t.missable === 'caution' ? 12 : 0) }))
    .sort((a, b) => a.score - b.score || a.t.id - b.t.id)
    .slice(0, limit)
    .map(({ t }) => t);
}

function nextUpReason(t, state) {
  if (t.missable === 'yes') return `Do now: closes at ${t.pointOfNoReturn}`;
  if (t.missable === 'caution') return `Soon: ${t.pointOfNoReturn ?? 'time-sensitive'}`;
  if (t.count) return `${collectibleCount(state.progress, t)}/${t.count.target} ${t.count.unit}`;
  return `Roadmap stage ${t.roadmapStage} · ${t.chapter}`;
}

export function renderNextUpView(container, state, actions) {
  const picks = pickNextUpTrophies(state);
  container.replaceChildren(
    el('div', { class: 'view-head' },
      el('h2', {}, 'Next up'),
      el('span', { class: 'view-meta' }, `Earliest roadmap stage first, missables pulled forward · ${describeActiveFilters(state)}`)),
    el('ol', { id: 'next-up-list', class: 'next-up-list' }, picks.map((t, i) => el('li', {
      class: `next-card ${t.isMissable ? 'is-missable' : ''} ${state.ui.selectedId === t.id ? 'is-selected' : ''}`,
      onclick: () => actions.selectTrophy(t.id),
    },
    el('span', { class: 'next-n' }, String(i + 1)),
    gradeBadge(t.grade),
    el('span', { class: 'next-text' }, el('b', {}, displayName(t, state)), el('span', {}, nextUpReason(t, state))),
    el('button', { class: 'btn btn-small', type: 'button', onclick: (e) => { e.stopPropagation(); actions.toggleEarned(t, true); } }, 'Earned ✓')))),
  );
}

// "Next up in roadmap order": the first unearned trophies following the platinum roadmap, missables first
// within each stage, so the reader always sees what to do next.

import { el, gradeBadge } from './dom.js';
import { compareRoadmapOrder } from './trophy-data.js';
import { isEarned } from './progress-store.js';
import { displayName } from './spoiler-mode.js';
import { missableTag } from './checklist-view.js';

export function buildNextUpList(state, limit = 5) {
  return state.trophies
    .filter((t) => !isEarned(state.progress, t) && t.grade !== 'platinum')
    .sort(compareRoadmapOrder)
    .slice(0, limit);
}

export function renderNextUpPanel(container, state, actions, limit = 5) {
  const next = buildNextUpList(state, limit);
  const remaining = state.trophies.filter((t) => !isEarned(state.progress, t)).length;
  container.replaceChildren(
    el('div', { class: 'column-head' },
      el('h2', {}, 'Next up'),
      el('span', { class: 'column-meta' }, `roadmap order · ${remaining} left`)),
    el('ol', { id: 'next-up-list', class: 'next-up-list' },
      next.map((t) => el('li', { class: 'next-up-item', onclick: () => actions.selectTrophy(t.id, 'checklist') },
        gradeBadge(t.grade),
        el('span', { class: 'next-name' }, displayName(t, state)),
        missableTag(t),
        el('span', { class: 'next-stage' }, `S${t.roadmapStage}`)))));
}

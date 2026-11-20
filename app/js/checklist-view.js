// The trophy checklist: official names, descriptions and grades, grouped by platinum-roadmap stage (or the
// official list order), with earned checkboxes, missable tags, counters and how many sources each guide cites.

import { el, gradeBadge } from './dom.js';
import { compareRoadmapOrder, KIND_LABELS } from './trophy-data.js';
import { getCount, isEarned } from './progress-store.js';
import { displayDescription, displayName, isTrophyMasked } from './spoiler-mode.js';
import { describeActiveFilters, filterTrophies } from './trophy-filters.js';

export function missableTag(trophy) {
  if (trophy.missable === 'possibly') return el('span', { class: 'tag tag-missable' }, 'Missable?');
  if (trophy.missable === 'watch') return el('span', { class: 'tag tag-watch' }, 'Watch');
  return null;
}

function confidenceTag(trophy) {
  if (trophy.confidence === 'unconfirmed') return el('span', { class: 'tag tag-unconfirmed' }, 'Unconfirmed');
  if (trophy.confidence === 'single') return el('span', { class: 'tag tag-single' }, '1 source');
  return null;
}

function renderTrophyRow(trophy, state, actions) {
  const earned = isEarned(state.progress, trophy);
  const masked = isTrophyMasked(trophy, state);
  const selected = state.ui.selectedId === trophy.id;
  const count = trophy.count ? el('span', { class: 'tag tag-count' }, `${getCount(state.progress, trophy)}/${trophy.count.target}`) : null;
  return el('li', {
    class: `trophy-row${earned ? ' is-earned' : ''}${masked ? ' is-masked' : ''}${selected ? ' is-selected' : ''} miss-${trophy.missable}`,
    dataset: { id: trophy.id },
    onclick: () => actions.selectTrophy(trophy.id),
  },
  el('input', {
    type: 'checkbox', class: 'earned-check', checked: earned, 'aria-label': `Earned: ${displayName(trophy, state)}`,
    onclick: (e) => e.stopPropagation(), onchange: (e) => actions.toggleEarned(trophy, e.target.checked),
  }),
  gradeBadge(trophy.grade),
  el('div', { class: 'row-text' },
    el('span', { class: 'row-name' }, displayName(trophy, state)),
    el('span', { class: 'row-desc' }, displayDescription(trophy, state))),
  el('div', { class: 'row-tags' },
    el('div', {}, missableTag(trophy), confidenceTag(trophy), count),
    el('div', {},
      el('span', { class: 'tag tag-kind' }, KIND_LABELS[trophy.kind]),
      el('span', { class: 'tag tag-src', title: `${trophy.sources.length} cited sources` }, `${trophy.sources.length} src`))));
}

function groupByStage(trophies, state) {
  return state.roadmap
    .map((stage) => ({ stage, items: trophies.filter((t) => t.roadmapStage === stage.stage) }))
    .filter((group) => group.items.length);
}

export function renderTrophyChecklist(container, state, actions, options = {}) {
  const shown = filterTrophies(state.trophies, state).sort(state.ui.sort === 'list' ? (a, b) => a.id - b.id : compareRoadmapOrder);
  const earnedShown = shown.filter((t) => isEarned(state.progress, t)).length;
  const sortSelect = el('select', { id: 'checklist-sort', 'aria-label': 'Order', onchange: (e) => actions.setSort(e.target.value) },
    el('option', { value: 'roadmap', selected: state.ui.sort !== 'list' }, 'Roadmap order'),
    el('option', { value: 'list', selected: state.ui.sort === 'list' }, 'Official order'));
  const head = el('div', { class: 'column-head' },
    el('h2', {}, options.title ?? 'Checklist'),
    el('span', { class: 'column-meta' }, `${shown.length}/${state.trophies.length} shown · ${earnedShown} earned · ${describeActiveFilters(state)}`),
    sortSelect);
  const list = el('div', { id: 'trophy-checklist', class: 'trophy-checklist' });
  if (!shown.length) list.append(el('p', { class: 'empty' }, 'No trophy matches these filters.'));
  else if (state.ui.sort === 'list') list.append(el('ul', { class: 'trophy-rows' }, shown.map((t) => renderTrophyRow(t, state, actions))));
  else {
    for (const { stage, items } of groupByStage(shown, state)) {
      const done = items.filter((t) => isEarned(state.progress, t)).length;
      list.append(
        el('h3', { class: 'stage-head' }, el('span', { class: 'stage-num' }, `Stage ${stage.stage}`), ` ${stage.title}`,
          el('span', { class: 'stage-count' }, `${done}/${items.length}`)),
        el('ul', { class: 'trophy-rows' }, items.map((t) => renderTrophyRow(t, state, actions))));
    }
  }
  container.replaceChildren(head, list);
}

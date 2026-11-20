// The checklist: every trophy with checkbox, grade badge, official name and description, and kind/missable tags.

import { el } from './dom.js';
import { GRADE_LETTER, KIND_LABELS, gradeLabel } from './trophy-data.js';
import { displayDescription, displayName, isSpoilerMasked } from './spoiler-mode.js';
import { collectibleCount } from './progress-store.js';
import { applyTrophyFilters, describeActiveFilters } from './trophy-filters.js';

export function gradeBadge(grade, size = '') {
  return el('span', { class: `grade-badge grade-${grade} ${size}`, title: gradeLabel(grade) }, GRADE_LETTER[grade]);
}

export function renderTrophyTags(trophy, state, { compact = false } = {}) {
  const tags = [];
  if (trophy.missable === 'yes') tags.push(el('span', { class: 'tag tag-missable' }, 'Missable'));
  if (trophy.missable === 'caution') tags.push(el('span', { class: 'tag tag-caution' }, 'Time-sensitive'));
  tags.push(el('span', { class: `tag tag-kind kind-${trophy.kind}` }, KIND_LABELS[trophy.kind] ?? trophy.kind));
  if (!compact && (trophy.kind === 'story' || /^Ch /.test(trophy.chapter))) tags.push(el('span', { class: 'tag tag-chapter' }, trophy.chapter));
  if (trophy.count) {
    const have = collectibleCount(state.progress, trophy);
    tags.push(el('span', { class: 'tag tag-count' }, `${have}/${trophy.count.target}`));
  }
  if (!compact && trophy.hidden) tags.push(el('span', { class: 'tag tag-hidden', title: 'Hidden on PlayStation until earned' }, 'Hidden'));
  return el('span', { class: 'trophy-tags' }, tags);
}

export function renderTrophyRow(trophy, state, actions) {
  const earned = state.progress.earned.has(trophy.id);
  const masked = isSpoilerMasked(trophy, state);
  const selected = state.ui.selectedId === trophy.id;
  const box = el('input', {
    type: 'checkbox', class: 'earned-box', checked: earned, 'aria-label': `Mark ${displayName(trophy, state)} earned`,
    onclick: (e) => e.stopPropagation(),
    onchange: (e) => actions.toggleEarned(trophy, e.target.checked),
  });
  return el('li', {
    class: `trophy-row ${earned ? 'is-earned' : ''} ${masked ? 'is-masked' : ''} ${selected ? 'is-selected' : ''} ${trophy.isMissable ? 'is-missable' : ''}`,
    dataset: { id: trophy.id },
    onclick: () => actions.selectTrophy(trophy.id),
  },
  box,
  gradeBadge(trophy.grade),
  el('span', { class: 'trophy-text' },
    el('span', { class: 'trophy-name-line' },
      el('span', { class: 'trophy-name' }, displayName(trophy, state)),
      renderTrophyTags(trophy, state, { compact: true })),
    el('span', { class: 'trophy-desc' }, displayDescription(trophy, state))));
}

// Roadmap order groups the rows under their stage so the checklist reads in the order you will earn them.
export function sortTrophiesForChecklist(trophies, sort) {
  if (sort !== 'roadmap') return [...trophies].sort((a, b) => a.id - b.id);
  return [...trophies].sort((a, b) => a.roadmapStage - b.roadmapStage
    || Number(b.isMissable) - Number(a.isMissable) || a.id - b.id);
}

function renderStageDivider(stage, trophies, state) {
  const inStage = state.trophies.filter((t) => t.roadmapStage === stage.stage);
  const done = inStage.filter((t) => state.progress.earned.has(t.id)).length;
  return el('li', { class: 'stage-divider' },
    el('span', { class: 'stage-divider-n' }, `Stage ${stage.stage}`),
    el('span', { class: 'stage-divider-title' }, stage.title),
    el('span', { class: 'stage-divider-count' }, `${done}/${inStage.length}`));
}

export function renderTrophyChecklist(container, state, actions, { title = 'Checklist' } = {}) {
  const sort = state.ui.filters.sort;
  const shown = sortTrophiesForChecklist(applyTrophyFilters(state.trophies, state), sort);
  const earnedShown = shown.filter((t) => state.progress.earned.has(t.id)).length;
  const rows = [];
  let lastStage = null;
  for (const t of shown) {
    if (sort === 'roadmap' && t.roadmapStage !== lastStage) {
      const stage = state.roadmap.find((s) => s.stage === t.roadmapStage);
      if (stage) rows.push(renderStageDivider(stage, shown, state));
      lastStage = t.roadmapStage;
    }
    rows.push(renderTrophyRow(t, state, actions));
  }
  const list = el('ol', { id: 'trophy-checklist', class: 'trophy-checklist' }, rows);
  if (shown.length === 0) list.append(el('li', { class: 'empty' }, 'No trophy matches these filters.'));
  container.replaceChildren(
    el('div', { class: 'view-head' },
      el('h2', {}, title),
      el('span', { class: 'view-meta' }, `${shown.length} of 55 shown · ${earnedShown} earned · ${describeActiveFilters(state)}`),
      el('label', { class: 'sort-select' }, 'Order ',
        el('select', { id: 'checklist-sort', onchange: (e) => actions.setSort(e.target.value) },
          el('option', { value: 'roadmap', selected: sort === 'roadmap' }, 'Roadmap'),
          el('option', { value: 'list', selected: sort === 'list' }, 'Official list')))),
    list,
  );
}

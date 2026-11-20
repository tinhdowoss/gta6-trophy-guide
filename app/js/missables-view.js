// Missables view: every trophy that can be lost or is time-sensitive, ordered by when its window closes, with
// the exact point of no return and the cited reason. Beside it, the spoiler list shows hidden trophies masked.

import { citeMarkers, el, gradeBadge } from './dom.js';
import { compareRoadmapOrder, gradeLabel } from './trophy-data.js';
import { isEarned } from './progress-store.js';
import { displayDescription, displayName, isTrophyMasked } from './spoiler-mode.js';

export function listMissableTrophies(state) {
  return state.trophies.filter((t) => t.isMissable).sort(compareRoadmapOrder);
}

function renderMissableCard(t, state, actions) {
  const earned = isEarned(state.progress, t);
  const onCite = (ref) => actions.highlightSource(ref);
  const refs = [...new Set(t.steps.flatMap((s) => s.cite))].sort((a, b) => a - b);
  return el('li', { class: `missable-card miss-${t.missable}${earned ? ' is-earned' : ''}`, onclick: () => actions.selectTrophy(t.id, 'checklist') },
    el('header', {},
      el('input', { type: 'checkbox', checked: earned, 'aria-label': 'Earned', onclick: (e) => e.stopPropagation(), onchange: (e) => actions.toggleEarned(t, e.target.checked) }),
      gradeBadge(t.grade),
      el('h3', {}, displayName(t, state)),
      el('span', { class: `verdict verdict-${t.missable}` }, t.missable === 'possibly' ? 'MISSABLE? POSSIBLY' : 'WATCH'),
      el('span', { class: 'missable-stage' }, `Stage ${t.roadmapStage}`)),
    el('p', { class: 'point-of-no-return' }, el('span', {}, 'Point of no return'), ` ${t.pointOfNoReturn.replace(/^Watch: /, '')}`),
    el('p', { class: 'missable-why' }, isTrophyMasked(t, state) ? 'Details hidden by spoiler mode.' : t.missableWhen, ' ', citeMarkers(refs, onCite)));
}

export function renderMissablesView(container, state, actions) {
  const missables = listMissableTrophies(state);
  const safe = state.trophies.length - missables.length;
  container.replaceChildren(
    el('div', { class: 'column-head' },
      el('h2', {}, 'Missables & points of no return'),
      el('span', { class: 'column-meta' }, `${missables.filter((t) => t.missable === 'possibly').length} possibly missable · ${missables.filter((t) => t.missable === 'watch').length} watch · ${safe} safe any time`)),
    el('p', { class: 'missables-note' },
      'No trophy is confirmed permanently missable. Story trophies unlock automatically; there is no mission replay or New Game Plus, so keep a manual save per chapter. ',
      citeMarkers([3, 4, 8], (ref) => actions.highlightSource(ref))),
    el('ol', { id: 'missables-list', class: 'missables-list' }, missables.map((t) => renderMissableCard(t, state, actions))));
}

// Right-hand list for spoiler mode: hidden trophies stay masked until earned or revealed one by one.
export function renderSpoilerStoryList(container, state, actions) {
  const hidden = state.trophies.filter((t) => t.hidden).sort(compareRoadmapOrder);
  const masked = hidden.filter((t) => isTrophyMasked(t, state)).length;
  container.replaceChildren(
    el('div', { class: 'column-head' },
      el('h2', {}, 'Spoiler mode'),
      el('span', { class: 'column-meta' }, state.settings.spoiler ? `ON · ${masked}/${hidden.length} hidden trophies masked` : 'OFF · all names shown')),
    el('ul', { id: 'spoiler-story-list', class: 'spoiler-list' },
      hidden.map((t) => {
        const isMasked = isTrophyMasked(t, state);
        return el('li', { class: `spoiler-item${isMasked ? ' is-masked' : ''}${isEarned(state.progress, t) ? ' is-earned' : ''}` },
          gradeBadge(t.grade),
          el('div', { class: 'row-text' },
            el('span', { class: 'row-name' }, displayName(t, state)),
            el('span', { class: 'row-desc' }, isMasked ? `${gradeLabel(t.grade)} · stage ${t.roadmapStage}` : displayDescription(t, state))),
          isMasked ? el('button', { class: 'btn btn-small', type: 'button', onclick: () => actions.revealTrophy(t) }, 'Reveal') : el('span', { class: 'tag' }, isEarned(state.progress, t) ? 'Earned' : 'Revealed'));
      })));
}

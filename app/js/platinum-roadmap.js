// The platinum roadmap: ten stages in play order (story chapters, story finale, strands, collectibles,
// activities, cleanup, 100%), each with its summary, cited sources, progress bar and trophies; missable
// trophies are flagged inline with their point of no return.

import { citeMarkers, el, gradeBadge, progressBar } from './dom.js';
import { compareRoadmapOrder } from './trophy-data.js';
import { getCount, isEarned } from './progress-store.js';
import { displayName, isTrophyMasked } from './spoiler-mode.js';
import { missableTag } from './checklist-view.js';

export function buildPlatinumRoadmap(state) {
  return state.roadmap.map((stage) => {
    const trophies = state.trophies.filter((t) => t.roadmapStage === stage.stage).sort(compareRoadmapOrder);
    return { ...stage, trophies, earned: trophies.filter((t) => isEarned(state.progress, t)).length };
  });
}

function renderRoadmapTrophy(t, state, actions) {
  const earned = isEarned(state.progress, t);
  return el('li', { class: `roadmap-trophy${earned ? ' is-earned' : ''}${isTrophyMasked(t, state) ? ' is-masked' : ''} miss-${t.missable}`, onclick: () => actions.selectTrophy(t.id, 'checklist') },
    el('input', { type: 'checkbox', checked: earned, 'aria-label': 'Earned', onclick: (e) => e.stopPropagation(), onchange: (e) => actions.toggleEarned(t, e.target.checked) }),
    gradeBadge(t.grade),
    el('span', { class: 'roadmap-name' }, displayName(t, state)),
    t.count ? el('span', { class: 'tag tag-count' }, `${getCount(state.progress, t)}/${t.count.target}`) : null,
    missableTag(t),
    t.isMissable ? el('span', { class: 'roadmap-pnr' }, t.pointOfNoReturn.replace(/^Watch: /, '')) : null);
}

export function renderPlatinumRoadmap(container, state, actions) {
  const stages = buildPlatinumRoadmap(state);
  const done = stages.reduce((n, s) => n + s.earned, 0);
  container.replaceChildren(
    el('div', { class: 'column-head' },
      el('h2', {}, 'Platinum roadmap'),
      el('span', { class: 'column-meta' }, `10 stages in play order · ${done}/${state.trophies.length} earned · one playthrough, ~200 h, 4/10`),
      citeMarkers([3, 4], (ref) => actions.highlightSource(ref))),
    el('ol', { id: 'platinum-roadmap', class: 'roadmap-stages' },
      stages.map((stage) => el('li', { class: `roadmap-stage${stage.earned === stage.trophies.length ? ' is-done' : ''}` },
        el('header', {},
          el('span', { class: 'stage-num' }, String(stage.stage)),
          el('h3', {}, stage.title),
          el('span', { class: 'stage-count' }, `${stage.earned}/${stage.trophies.length}`)),
        progressBar(stage.earned, stage.trophies.length, 'stage-bar'),
        el('p', { class: 'stage-summary' }, stage.summary, ' ', citeMarkers(stage.cite ?? [], (ref) => actions.highlightSource(ref))),
        el('ul', {}, stage.trophies.map((t) => renderRoadmapTrophy(t, state, actions)))))));
}

// The platinum roadmap: the stages from trophies.json in order, each with its trophies, grade badges,
// a per-stage progress bar and missable trophies flagged inline.

import { el, progressBar } from './dom.js';
import { gradeBadge } from './checklist-view.js';
import { displayName, isSpoilerMasked } from './spoiler-mode.js';

const STAGE_GROUP = { 1: 'Story', 2: 'Story', 3: 'Story', 4: 'Story', 5: 'Story', 6: 'Cleanup', 7: 'Collectibles', 8: 'Activities', 9: 'Cleanup', 10: 'Platinum' };

export function buildPlatinumRoadmap(roadmap, trophies, progress) {
  return roadmap.map((stage) => {
    const items = trophies.filter((t) => t.roadmapStage === stage.stage)
      .sort((a, b) => Number(b.isMissable) - Number(a.isMissable) || a.id - b.id);
    const earned = items.filter((t) => progress.earned.has(t.id)).length;
    return { ...stage, group: STAGE_GROUP[stage.stage] ?? 'Cleanup', items, earned, missables: items.filter((t) => t.isMissable).length };
  });
}

export function renderPlatinumRoadmap(container, state, actions) {
  const stages = buildPlatinumRoadmap(state.roadmap, state.trophies, state.progress);
  const current = stages.find((s) => s.earned < s.items.length);
  container.replaceChildren(
    el('div', { class: 'view-head' },
      el('h2', {}, 'Platinum roadmap'),
      el('span', { class: 'view-meta' }, `10 stages in order · ~200 h (KeenGamer, Output Lag) · one playthrough · you are on stage ${current?.stage ?? 10}`),
      el('span', { class: 'roadmap-legend' },
        el('span', { class: 'tag tag-missable' }, 'Missable'), el('span', { class: 'tag tag-caution' }, 'Timed'),
        el('span', { class: 'legend-earned' }, 'earned'), el('span', { class: 'legend-masked' }, 'spoiler-masked'))),
    el('ol', { id: 'platinum-roadmap', class: 'roadmap-grid' },
      stages.map((s) => el('li', { class: `roadmap-stage group-${s.group.toLowerCase()} ${s.wide ? 'is-wide' : ''} ${s === current ? 'is-current' : ''} ${s.earned === s.items.length ? 'is-done' : ''}` },
        el('div', { class: 'stage-head' },
          el('span', { class: 'stage-n' }, String(s.stage)),
          el('div', { class: 'stage-title' }, el('span', { class: 'stage-group' }, s.group), el('h3', {}, s.title)),
          el('span', { class: 'stage-count' }, `${s.earned}/${s.items.length}`)),
        progressBar(s.earned, s.items.length, 'stage-bar'),
        el('p', { class: 'stage-summary' }, s.summary),
        el('ul', { class: 'stage-trophies' }, s.items.map((t) => el('li', {
          class: `stage-trophy ${t.isMissable ? 'is-missable' : ''} ${state.progress.earned.has(t.id) ? 'is-earned' : ''} ${isSpoilerMasked(t, state) ? 'is-masked' : ''}`,
          onclick: () => actions.selectTrophy(t.id, 'checklist'),
        },
        gradeBadge(t.grade, 'is-small'),
        el('span', { class: 'stage-trophy-name' }, displayName(t, state)),
        t.missable === 'yes' ? el('span', { class: 'tag tag-missable' }, 'Missable') : null,
        t.missable === 'caution' ? el('span', { class: 'tag tag-caution' }, 'Timed') : null)))))),
  );
}

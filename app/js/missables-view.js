// Missables: every trophy with a point of no return, in story order, plus the run-wide rules that can cost a
// trophy, and the spoiler-protected story trophies listed by chapter with their names masked until earned.

import { el } from './dom.js';
import { gradeBadge } from './checklist-view.js';
import { displayName, isSpoilerMasked } from './spoiler-mode.js';

export const RUN_WIDE_WARNINGS = [
  { title: 'No mission replay, no New Game Plus', text: 'Finished story missions cannot be picked again. Keep a manual save at the start of every chapter (15 slots + autosave).', cite: 'Output Lag, CULTR' },
  { title: 'Cheats disable trophies and saving', text: 'Even the No Reload reward from 25 range golds counts. Test cheats on a separate save only.', cite: 'CULTR, Output Lag' },
  { title: 'Save before the final mission', text: 'Free roam continues after the credits, but the finale cannot be replayed.', cite: 'Output Lag' },
];

export function listMissableTrophies(trophies) {
  return trophies.filter((t) => t.isMissable).sort((a, b) => a.roadmapStage - b.roadmapStage || a.id - b.id);
}

const TIMELINE = [
  { key: 'Ch 1', label: 'Ch 1' }, { key: 'Ch 2', label: 'Ch 2' }, { key: 'Ch 3', label: 'Ch 3' },
  { key: 'Ch 4', label: 'Ch 4' }, { key: 'Final', label: 'Finale' }, { key: 'Post', label: 'Post-story' },
];

// A strip of the story's chapters with each point of no return pinned where it closes.
export function renderMissableTimeline(missables) {
  const at = (t) => (t.pointOfNoReturn?.match(/Chapter (\d)/)?.[1] ? `Ch ${t.pointOfNoReturn.match(/Chapter (\d)/)[1]}` : 'Post');
  return el('ol', { id: 'missable-timeline', class: 'missable-timeline' }, TIMELINE.map((step) => {
    const here = missables.filter((t) => at(t) === step.key);
    return el('li', { class: here.length ? 'has-ponr' : '' },
      el('span', { class: 'tl-label' }, step.label),
      here.map((t) => el('span', { class: `tl-pin ${t.missable === 'yes' ? 'pin-missable' : 'pin-caution'}` }, t.name)));
  }));
}

export function renderMissablesView(container, state, actions) {
  const missables = listMissableTrophies(state.trophies);
  container.replaceChildren(
    el('div', { class: 'view-head' },
      el('h2', {}, `Missables · ${missables.length} with a point of no return`),
      el('span', { class: 'view-meta' }, 'From the official descriptions + cited launch guides')),
    renderMissableTimeline(missables),
    el('ol', { id: 'missables-list', class: 'missables-list' },
      missables.map((t) => el('li', {
        class: `missable-card ${t.missable === 'yes' ? 'is-missable' : 'is-caution'} ${state.progress.earned.has(t.id) ? 'is-earned' : ''}`,
        onclick: () => actions.selectTrophy(t.id, 'checklist'),
      },
      el('div', { class: 'missable-head' }, gradeBadge(t.grade),
        el('strong', {}, t.name),
        el('span', { class: `tag ${t.missable === 'yes' ? 'tag-missable' : 'tag-caution'}` }, t.missable === 'yes' ? 'Missable' : 'Time-sensitive'),
        state.progress.earned.has(t.id) ? el('span', { class: 'tag tag-done' }, 'Earned') : null,
        el('span', { class: 'missable-src' }, `${t.sources.length} sources`)),
      el('div', { class: 'ponr-line' }, el('span', {}, 'Point of no return'), el('b', {}, t.pointOfNoReturn ?? 'Optional missions that close mid-story')),
      el('p', {}, t.missableWhen)))),
    el('ul', { class: 'run-warnings' }, RUN_WIDE_WARNINGS.map((w) => el('li', {},
      el('strong', {}, w.title), ` ${w.text} `, el('span', { class: 'cite-name' }, `(${w.cite})`)))),
  );
}

const SPOILER_GROUP_ORDER = ['Ch 1', 'Ch 2', 'Ch 3', 'Ch 4', 'Story missions', 'Final chapter', 'Character strands', 'Secrets & free roam'];

// Right-hand column of the Missables tab: the 28 PlayStation-hidden trophies by chapter, masked under spoiler mode.
export function renderSpoilerStoryList(panel, state, actions) {
  const protectedTrophies = state.trophies.filter((t) => t.isSpoilerProtected)
    .sort((a, b) => a.roadmapStage - b.roadmapStage || a.id - b.id);
  const maskedCount = protectedTrophies.filter((t) => isSpoilerMasked(t, state)).length;
  const groups = new Map();
  for (const t of protectedTrophies) {
    const key = t.kind === 'story' ? (t.chapter.startsWith('Main') ? 'Story missions' : t.chapter) : t.kind === 'strand' ? 'Character strands' : 'Secrets & free roam';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }
  panel.replaceChildren(
    el('div', { id: 'spoiler-story-list', class: 'spoiler-panel' },
      el('div', { class: 'spoiler-panel-head' },
        el('h2', { class: 'guide-title' }, 'Hidden story trophies'),
        el('span', { class: `spoiler-state ${state.settings.spoiler ? 'is-on' : ''}` },
          state.settings.spoiler ? `Spoiler mode ON · ${maskedCount} of ${protectedTrophies.length} masked until earned` : 'Spoiler mode OFF · all names shown')),
      el('p', { class: 'spoiler-note' }, 'PlayStation hides these 28 until earned. With spoiler mode on, only grade, chapter and kind show; earned ones unlock their name here and in the checklist.'),
      el('div', { class: 'spoiler-grid' },
        [...groups].sort(([a], [b]) => SPOILER_GROUP_ORDER.indexOf(a) - SPOILER_GROUP_ORDER.indexOf(b)).map(([chapter, list]) => el('section', { class: 'spoiler-group' },
          el('h3', {}, `${chapter} · ${list.filter((t) => state.progress.earned.has(t.id)).length}/${list.length}`),
          el('ul', {}, list.map((t) => {
            const masked = isSpoilerMasked(t, state);
            return el('li', { class: `${masked ? 'is-masked' : ''} ${state.progress.earned.has(t.id) ? 'is-earned' : ''}`, onclick: () => actions.selectTrophy(t.id, 'checklist') },
              gradeBadge(t.grade, 'is-small'),
              masked ? el('span', { class: 'mask-bar', title: 'Hidden by spoiler mode' }, '▇▇▇▇ ▇▇▇▇▇▇') : el('span', {}, displayName(t, state)));
          }))))),
    ),
  );
}

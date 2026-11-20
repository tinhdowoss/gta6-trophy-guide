// The guide for one trophy: official description, missable box with the point of no return, roadmap stage,
// location, collectible counter, numbered steps each with its own citations, a "sources differ" box where
// guides disagree, and our write-up. Citations highlight the matching entry in the sources column.

import { citeMarkers, el, gradeBadge, progressBar, proseWithCitations } from './dom.js';
import { CONFIDENCE_LABELS, gradeLabel, KIND_LABELS } from './trophy-data.js';
import { getCount, isEarned } from './progress-store.js';
import { isTrophyMasked, maskedTrophyName } from './spoiler-mode.js';

function renderMissableBox(trophy, onCite) {
  if (!trophy.isMissable) {
    return el('div', { class: 'safe-box' }, el('b', {}, 'Not missable'), ' · can be done any time', trophy.roadmapStage <= 5 ? ' in or after its chapter' : '');
  }
  const possibly = trophy.missable === 'possibly';
  return el('section', { id: 'missable-box', class: `missable-box ${possibly ? 'is-possibly' : 'is-watch'}` },
    el('h3', {}, possibly ? 'Missable? POSSIBLY — when and why' : 'WATCH — time-sensitive'),
    el('p', { class: 'point-of-no-return' }, el('span', {}, 'Point of no return'), ` ${trophy.pointOfNoReturn}`),
    el('p', {}, trophy.missableWhen, ' ',
      trophy.differs && possibly ? el('span', { class: 'missable-refs' }, 'Disputed — see Sources differ ', citeMarkers(trophy.differs.a.cite.concat(trophy.differs.b.cite), onCite)) : null));
}

function renderMetaGrid(trophy) {
  return el('dl', { class: 'meta-grid' },
    el('div', {}, el('dt', {}, 'Where / how'), el('dd', {}, trophy.location)),
    el('div', { title: trophy.stageTitle }, el('dt', {}, 'Roadmap stage'), el('dd', {}, `Stage ${trophy.roadmapStage} of 10`),
      el('dd', { class: `conf-${trophy.confidence}` }, CONFIDENCE_LABELS[trophy.confidence])));
}

export function renderCollectibleCounter(trophy, state, actions) {
  if (!trophy.count) return null;
  const value = getCount(state.progress, trophy);
  const { target, unit } = trophy.count;
  return el('div', { class: 'collectible-counter', id: 'collectible-counter' },
    el('span', { class: 'counter-label' }, 'Counter'),
    el('button', { class: 'counter-btn', type: 'button', 'aria-label': 'Minus one', onclick: () => actions.setCount(trophy, value - 1) }, '−'),
    el('span', { class: 'counter-value' }, el('b', {}, String(value)), ` / ${target} ${unit}`),
    el('button', { class: 'counter-btn', type: 'button', 'aria-label': 'Plus one', onclick: () => actions.setCount(trophy, value + 1) }, '+'),
    progressBar(value, target, 'counter-bar'));
}

function renderSteps(trophy, onCite) {
  return el('section', { class: 'guide-steps' },
    el('h3', {}, 'Steps ', el('small', {}, `${trophy.steps.length} · each cited`)),
    el('ol', {}, trophy.steps.map((step) => el('li', {}, step.text, ' ', citeMarkers(step.cite, onCite)))));
}

export function renderSourcesDiffer(trophy, onCite) {
  const d = trophy.differs;
  if (!d) return null;
  return el('section', { class: 'differ-box' },
    el('h3', {}, 'Sources differ — both versions shown'),
    el('p', { class: 'differ-topic' }, d.topic),
    el('p', {}, el('b', {}, 'A '), d.a.text, ' ', citeMarkers(d.a.cite, onCite)),
    el('p', {}, el('b', {}, 'B '), d.b.text, ' ', citeMarkers(d.b.cite, onCite)),
    el('p', { class: 'differ-call' }, el('b', {}, 'Our call '), d.call));
}

function renderMaskedGuide(container, trophy, actions) {
  container.replaceChildren(el('div', { class: 'masked-guide' },
    el('h2', {}, maskedTrophyName(trophy)),
    el('p', {}, 'Spoiler mode hides this trophy\'s name, description and guide until you earn it.'),
    el('button', { class: 'btn', type: 'button', onclick: () => actions.revealTrophy(trophy) }, 'Reveal this one'),
    el('button', { class: 'btn', type: 'button', onclick: () => actions.toggleEarned(trophy, true) }, 'Mark earned')));
}

export function renderTrophyGuide(container, trophy, state, actions) {
  if (isTrophyMasked(trophy, state)) return renderMaskedGuide(container, trophy, actions);
  const onCite = (ref) => actions.highlightSource(ref);
  const earned = isEarned(state.progress, trophy);
  container.replaceChildren(
    el('header', { class: 'guide-head' },
      gradeBadge(trophy.grade),
      el('div', {},
        el('h2', { id: 'guide-title' }, trophy.name),
        el('p', { class: 'guide-sub' }, `#${trophy.id} · ${gradeLabel(trophy.grade)} · ${KIND_LABELS[trophy.kind]} · Stage ${trophy.roadmapStage} · ${trophy.chapter}${trophy.hidden ? ' · hidden on PSN' : ''}`)),
      el('label', { class: `earned-toggle${earned ? ' is-on' : ''}` },
        el('input', { type: 'checkbox', checked: earned, onchange: (e) => actions.toggleEarned(trophy, e.target.checked) }),
        earned ? `Earned ${state.progress.earned[trophy.id]}` : 'Mark earned')),
    el('blockquote', { class: 'official-description' },
      el('span', { class: 'label' }, 'Official description · PlayStation'), `“${trophy.description}”`),
    renderMissableBox(trophy, onCite),
    renderMetaGrid(trophy),
    renderCollectibleCounter(trophy, state, actions),
    renderSteps(trophy, onCite),
    renderSourcesDiffer(trophy, onCite),
    el('section', { class: 'guide-prose' }, el('h3', {}, 'Guide · in our words'), el('p', {}, proseWithCitations(trophy.guide, onCite))));
}

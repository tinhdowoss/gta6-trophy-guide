// The open trophy guide: official description, missable verdict, roadmap stage, collectible counter,
// numbered steps with citation markers, location, the guide in our words, and the numbered sources list.

import { el, linkSourceMarkers, progressBar } from './dom.js';
import { MISSABLE_LABELS, gradeLabel } from './trophy-data.js';
import { gradeBadge, renderTrophyTags } from './checklist-view.js';
import { displayName, isSpoilerMasked } from './spoiler-mode.js';
import { collectibleCount } from './progress-store.js';

function highlightSource(panel, n) {
  const item = panel.querySelector(`#source-${n}`);
  if (!item) return;
  item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  item.classList.remove('is-flash');
  void item.offsetWidth;
  item.classList.add('is-flash');
}

export function renderMissableVerdict(trophy) {
  if (trophy.missable === 'no') {
    return el('div', { class: 'verdict verdict-safe' },
      el('strong', {}, 'Not missable'),
      el('span', {}, trophy.kind === 'story'
        ? ' Story progress awards it; it cannot be skipped. No mission replay, so keep chapter saves.'
        : ' Available in free roam after the story too.'));
  }
  return el('div', { class: `verdict ${trophy.missable === 'yes' ? 'verdict-missable' : 'verdict-caution'}` },
    el('div', { class: 'verdict-title' },
      el('strong', {}, `${MISSABLE_LABELS[trophy.missable]}: when and why`),
      trophy.pointOfNoReturn ? el('span', { class: 'ponr' }, `Point of no return: ${trophy.pointOfNoReturn}`) : null),
    el('p', {}, trophy.missableWhen));
}

export function renderCollectibleCounter(trophy, state, actions) {
  if (!trophy.count) return null;
  const have = collectibleCount(state.progress, trophy);
  const target = trophy.count.target;
  const step = target >= 100 ? 5 : 1;
  return el('div', { class: 'collectible-counter' },
    el('span', { class: 'counter-label' }, 'Counter'),
    el('button', { class: 'counter-btn', type: 'button', 'aria-label': 'Decrease', onclick: () => actions.setCount(trophy, have - step) }, '−'),
    el('span', { class: 'counter-value' }, el('b', {}, String(have)), ` / ${target} ${trophy.count.unit}`),
    el('button', { class: 'counter-btn', type: 'button', 'aria-label': 'Increase', onclick: () => actions.setCount(trophy, have + step) }, '+'),
    progressBar(have, target, 'counter-bar'));
}

export function renderSourcesList(trophy) {
  return el('ol', { id: 'trophy-sources', class: 'sources-list' },
    trophy.sources.map((s, i) => el('li', { id: `source-${i + 1}` },
      el('span', { class: 'source-n' }, `[${i + 1}]`),
      el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.name),
      el('span', { class: 'source-host' }, hostOf(s.url), el('span', { class: 'source-date' }, ` · retrieved ${s.retrieved}`)))));
}

function hostOf(url) {
  return url.replace(/^[a-z]+:\/\/(www\.)?/i, '').split('/')[0];
}

function renderMaskedGuide(panel, trophy, state, actions) {
  panel.replaceChildren(
    el('div', { class: 'guide-head' }, gradeBadge(trophy.grade, 'is-large'),
      el('div', {}, el('h2', { class: 'guide-title masked-text' }, displayName(trophy, state)),
        el('p', { class: 'guide-sub' }, `${gradeLabel(trophy.grade)} · ${trophy.chapter} · roadmap stage ${trophy.roadmapStage}`))),
    el('div', { class: 'spoiler-shield' },
      el('p', {}, 'Spoiler mode is hiding this trophy’s name, description and guide until you earn it.'),
      el('div', { class: 'shield-lines', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')),
      el('button', { class: 'btn btn-accent', type: 'button', onclick: () => actions.revealTrophy(trophy) }, 'Reveal this one')),
    renderMissableVerdict(trophy));
}

export function renderTrophyGuide(panel, trophy, state, actions) {
  if (!trophy) {
    panel.replaceChildren(el('p', { class: 'guide-empty' }, 'Pick a trophy to open its guide.'));
    return;
  }
  if (isSpoilerMasked(trophy, state)) {
    renderMaskedGuide(panel, trophy, state, actions);
    return;
  }
  const earned = state.progress.earned.has(trophy.id);
  const stage = state.roadmap.find((s) => s.stage === trophy.roadmapStage);
  const cite = (n) => highlightSource(panel, n);
  panel.replaceChildren(
    el('div', { class: 'guide-head' },
      gradeBadge(trophy.grade, 'is-large'),
      el('div', { class: 'guide-head-text' },
        el('h2', { id: 'guide-title', class: 'guide-title' }, trophy.name),
        el('p', { class: 'guide-sub' }, `#${trophy.id} · ${gradeLabel(trophy.grade)}${trophy.hidden ? ' · hidden on PSN' : ''}`, renderTrophyTags(trophy, state))),
      el('label', { class: `earned-toggle ${earned ? 'is-on' : ''}` },
        el('input', { type: 'checkbox', checked: earned, onchange: (e) => actions.toggleEarned(trophy, e.target.checked) }),
        earned ? 'Earned' : 'Mark earned')),
    el('div', { class: 'guide-columns' },
      el('div', { class: 'guide-col guide-col-facts' },
        el('blockquote', { id: 'official-description', class: 'official-description' },
          el('span', { class: 'official-label' }, 'Official description · PlayStation'),
          el('q', {}, trophy.description)),
        renderMissableVerdict(trophy),
        el('div', { class: 'guide-meta' },
          el('div', { class: 'meta-cell' }, el('span', {}, 'Roadmap stage'),
            el('button', { class: 'link-btn', type: 'button', onclick: () => actions.openTab('roadmap') }, `${trophy.roadmapStage} · ${stage?.title ?? ''}`)),
          el('div', { class: 'meta-cell' }, el('span', {}, 'Chapter'), el('b', {}, trophy.chapter)),
          el('div', { class: 'meta-cell meta-wide' }, el('span', {}, 'Where / how'), el('b', {}, trophy.location ?? ''))),
        renderCollectibleCounter(trophy, state, actions),
        el('h3', { class: 'guide-h' }, 'Guide · in our words'),
        el('p', { id: 'guide-text', class: 'guide-text' }, linkSourceMarkers(trophy.guide, cite))),
      el('div', { class: 'guide-col guide-col-steps' },
        el('h3', { class: 'guide-h first' }, 'Steps'),
        el('ol', { id: 'guide-steps', class: 'guide-steps' }, trophy.steps.map((s) => el('li', {}, linkSourceMarkers(s, cite)))),
        el('h3', { class: 'guide-h' }, `Sources [1]–[${trophy.sources.length}]`),
        renderSourcesList(trophy))),
  );
}

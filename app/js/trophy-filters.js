// Checklist filters: kind chips (story, missable, collectibles, activities, strands, crime, online), grade,
// earned status and free-text search across names, descriptions, guides, places and chapters.

import { el } from './dom.js';
import { isEarned } from './progress-store.js';
import { isTrophyMasked } from './spoiler-mode.js';

export const FILTER_CHIPS = [
  { key: 'story', label: 'Story', test: (t) => t.kind === 'story' },
  { key: 'missable', label: 'Missable', test: (t) => t.isMissable },
  { key: 'collectible', label: 'Collectibles', test: (t) => t.kind === 'collectible' },
  { key: 'activity', label: 'Activities', test: (t) => t.kind === 'activity' },
  { key: 'strand', label: 'Strands', test: (t) => t.kind === 'strand' },
  { key: 'crime', label: 'Crime', test: (t) => t.kind === 'crime' },
  { key: 'online', label: 'Online', test: (t) => t.kind === 'online' },
];

function matchesSearch(trophy, query, state) {
  if (!query) return true;
  const masked = isTrophyMasked(trophy, state);
  const haystack = [
    masked ? '' : trophy.name, masked ? '' : trophy.description, masked ? '' : trophy.guide,
    trophy.location ?? '', trophy.chapter ?? '', trophy.kind,
  ].join(' ').toLowerCase();
  return query.toLowerCase().split(/\s+/).every((word) => haystack.includes(word));
}

export function filterTrophies(trophies, state) {
  const { chips, grade, status, query } = state.ui.filters;
  const active = FILTER_CHIPS.filter((c) => chips.has(c.key));
  return trophies.filter((t) => {
    if (active.length && !active.some((c) => c.test(t))) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    const earned = isEarned(state.progress, t);
    if (status === 'earned' && !earned) return false;
    if (status === 'unearned' && earned) return false;
    return matchesSearch(t, query.trim(), state);
  });
}

export function describeActiveFilters(state) {
  const { chips, grade, status, query } = state.ui.filters;
  const parts = FILTER_CHIPS.filter((c) => chips.has(c.key)).map((c) => c.label);
  if (grade !== 'all') parts.push(grade);
  if (status !== 'all') parts.push(status);
  if (query.trim()) parts.push(`“${query.trim()}”`);
  return parts.length ? parts.join(' + ') : 'no filter';
}

export function renderFilterChips(container, state, render) {
  const { chips } = state.ui.filters;
  const allChip = el('button', {
    class: `chip${chips.size === 0 ? ' is-on' : ''}`, type: 'button', 'aria-pressed': String(chips.size === 0),
    onclick: () => { chips.clear(); render(); },
  }, 'All ', el('b', {}, String(state.trophies.length)));
  const kindChips = FILTER_CHIPS.map((chip) => {
    const count = state.trophies.filter(chip.test).length;
    const on = chips.has(chip.key);
    return el('button', {
      class: `chip chip-${chip.key}${on ? ' is-on' : ''}${count === 0 ? ' is-empty' : ''}`, type: 'button',
      'aria-pressed': String(on), title: count === 0 ? 'The official list has no online trophies' : `Show ${chip.label.toLowerCase()} trophies`,
      onclick: () => { if (on) chips.delete(chip.key); else chips.add(chip.key); render(); },
    }, `${chip.label} `, el('b', {}, String(count)));
  });
  container.replaceChildren(allChip, ...kindChips);
}

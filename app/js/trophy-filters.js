// Filter chips (by kind, missable, online), grade and earned selects, and text search.
// Chips combine with OR among themselves and AND with grade, status and search.

import { el } from './dom.js';
import { isSpoilerMasked, maskedTrophyName } from './spoiler-mode.js';

export const FILTER_CHIPS = [
  { key: 'story', label: 'Story', test: (t) => t.kind === 'story' },
  { key: 'missable', label: 'Missable', test: (t) => t.isMissable },
  { key: 'collectible', label: 'Collectibles', test: (t) => t.kind === 'collectible' },
  { key: 'activity', label: 'Activities', test: (t) => t.kind === 'activity' },
  { key: 'strand', label: 'Strands', test: (t) => t.kind === 'strand' },
  { key: 'crime', label: 'Crime', test: (t) => t.kind === 'crime' },
  { key: 'misc', label: 'Misc', test: (t) => t.kind === 'misc' || t.kind === 'completion' },
  { key: 'online', label: 'Online', test: (t) => t.kind === 'online', note: 'The official list has no online trophies' },
];

export function applyTrophyFilters(trophies, state) {
  const { chips, grade, status, query } = state.ui.filters;
  const active = FILTER_CHIPS.filter((c) => chips.has(c.key));
  const needle = query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (active.length && !active.some((c) => c.test(t))) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    const earned = state.progress.earned.has(t.id);
    if (status === 'earned' && !earned) return false;
    if (status === 'unearned' && earned) return false;
    if (needle) {
      // A masked trophy is only searchable by what spoiler mode shows, so search never leaks a hidden name.
      const haystack = isSpoilerMasked(t, state)
        ? `${maskedTrophyName(t)} ${t.chapter} ${t.grade}`
        : `${t.name} ${t.description} ${t.guide} ${t.location ?? ''} ${t.chapter}`;
      if (!haystack.toLowerCase().includes(needle)) return false;
    }
    return true;
  });
}

export function countByFilterChip(trophies, chip) {
  return trophies.filter(chip.test).length;
}

export function renderFilterChips(container, state, onChange) {
  const all = el('button', {
    class: `chip ${state.ui.filters.chips.size === 0 ? 'is-on' : ''}`, type: 'button',
    onclick: () => { state.ui.filters.chips.clear(); onChange(); },
  }, 'All ', el('b', {}, String(state.trophies.length)));
  const chips = FILTER_CHIPS.map((chip) => {
    const count = countByFilterChip(state.trophies, chip);
    const on = state.ui.filters.chips.has(chip.key);
    return el('button', {
      class: `chip chip-${chip.key} ${on ? 'is-on' : ''}`, type: 'button', 'aria-pressed': on,
      disabled: count === 0, title: chip.note ?? `Show ${chip.label.toLowerCase()} trophies`,
      onclick: () => { on ? state.ui.filters.chips.delete(chip.key) : state.ui.filters.chips.add(chip.key); onChange(); },
    }, `${chip.label} `, el('b', {}, String(count)));
  });
  container.replaceChildren(all, ...chips);
}

export function describeActiveFilters(state) {
  const parts = FILTER_CHIPS.filter((c) => state.ui.filters.chips.has(c.key)).map((c) => c.label);
  if (state.ui.filters.grade !== 'all') parts.push(state.ui.filters.grade);
  if (state.ui.filters.status !== 'all') parts.push(state.ui.filters.status);
  if (state.ui.filters.query) parts.push(`“${state.ui.filters.query}”`);
  return parts.length ? parts.join(' + ') : 'no filter';
}

// Filters: kind chips (story, missable, collectibles, activities, crime, online), grade, status and text search.

import { escapeHtml } from './html-helpers.js';
import { searchableText } from './trophy-data.js';

export const KIND_CHIPS = [
  { key: 'story', label: 'Story', test: (t) => t.kind === 'story' || t.kind === 'strand' },
  { key: 'missable', label: 'Missable / watch', test: (t) => t.missable !== 'no' },
  { key: 'collectible', label: 'Collectibles', test: (t) => t.kind === 'collectible' },
  { key: 'activity', label: 'Activities', test: (t) => t.kind === 'activity' },
  { key: 'crime', label: 'Crime', test: (t) => t.kind === 'crime' },
  { key: 'online', label: 'Online', test: (t) => t.kind === 'online' },
];

export function createFilterState() {
  return { chips: new Set(), grade: '', status: '', query: '' };
}

export function applyTrophyFilters(trophies, filters, store) {
  const query = filters.query.trim().toLowerCase();
  const chipTests = KIND_CHIPS.filter((chip) => filters.chips.has(chip.key));
  return trophies.filter((t) => {
    if (chipTests.length && !chipTests.some((chip) => chip.test(t))) return false;
    if (filters.grade && t.grade !== filters.grade) return false;
    if (filters.status === 'earned' && !store.isEarned(t.id)) return false;
    if (filters.status === 'todo' && store.isEarned(t.id)) return false;
    if (query && !searchableText(t).includes(query)) return false;
    return true;
  });
}

export function renderFilterChips(container, trophies, filters, onChange) {
  container.innerHTML = KIND_CHIPS.map((chip) => {
    const count = trophies.filter(chip.test).length;
    const on = filters.chips.has(chip.key);
    return `<button type="button" class="filter-chip" data-chip="${chip.key}" aria-pressed="${on}">${escapeHtml(chip.label)}<span class="chip-count">${count}</span></button>`;
  }).join('');
  container.onclick = (event) => {
    const chip = event.target.closest('[data-chip]');
    if (!chip) return;
    const key = chip.dataset.chip;
    if (filters.chips.has(key)) filters.chips.delete(key);
    else filters.chips.add(key);
    onChange();
  };
}

export function bindFilterInputs({ grade, status, search }, filters, onChange) {
  grade.addEventListener('change', () => { filters.grade = grade.value; onChange(); });
  status.addEventListener('change', () => { filters.status = status.value; onChange(); });
  search.addEventListener('input', () => { filters.query = search.value; onChange(); });
}

export function describeFilters(filters) {
  const parts = [...filters.chips].map((key) => KIND_CHIPS.find((c) => c.key === key).label);
  if (filters.grade) parts.push(filters.grade);
  if (filters.status) parts.push(filters.status === 'todo' ? 'to do' : 'earned');
  if (filters.query) parts.push(`“${filters.query}”`);
  return parts.length ? parts.join(' + ') : 'all trophies';
}

// Small string helpers shared by every view: escaping, grade letters, citation marks, tags.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

export const GRADE_LETTER = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };
export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
export const GRADE_POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };

export function gradeBadge(grade) {
  return `<span class="grade-badge grade-${grade}" title="${grade}">${GRADE_LETTER[grade]}</span>`;
}

/** "[1][3]" after a step: each number is a source in the registry. */
export function citeMarks(cites) {
  return cites.map((n) => `<sup class="cite" title="Source ${n}">[${n}]</sup>`).join('');
}

/** The honesty tags a trophy carries: possibly missable, watch, unconfirmed, sources differ. */
export function riskTags(trophy, { withDiffer = false } = {}) {
  const tags = [];
  if (trophy.missable === 'possibly') tags.push('<span class="tag tag-possibly">Missable?</span>');
  if (trophy.missable === 'watch') tags.push('<span class="tag tag-watch">Watch</span>');
  if (trophy.status === 'unconfirmed') tags.push('<span class="tag tag-unconfirmed">Unconf.</span>');
  if (withDiffer && trophy.differ) tags.push('<span class="tag tag-differ">Differ</span>');
  return tags.join(' ');
}

export function percent(part, whole) {
  return whole ? Math.round((part / whole) * 100) : 0;
}

export function progressBar(part, whole) {
  return `<div class="progress-bar"><i style="width:${percent(part, whole)}%"></i></div>`;
}

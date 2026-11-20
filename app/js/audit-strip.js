// The audit strip: numbers a reader can check at a glance, all computed from trophies.json at load time.

import { el } from './dom.js';
import { GRADE_LETTER, GRADE_ORDER, countCitedSteps } from './trophy-data.js';

export function computeGuideAudit(state) {
  const { trophies, sources } = state;
  const grades = Object.fromEntries(GRADE_ORDER.map((g) => [g, trophies.filter((t) => t.grade === g).length]));
  const official = trophies.filter((t) => t.name && t.description && t.grade).length;
  const cited = trophies.filter((t) => t.guide.trim() && t.sources.length >= 2 && /\[\d+\]/.test(t.guide)).length;
  const steps = trophies.reduce((n, t) => n + t.steps.length, 0);
  const citedSteps = trophies.reduce((n, t) => n + countCitedSteps(t), 0);
  const read = sources.filter((s) => s.read === 'full');
  const dates = [...new Set(read.map((s) => s.retrieved))].sort();
  return {
    total: trophies.length,
    official,
    grades,
    hidden: trophies.filter((t) => t.hidden).length,
    cited,
    steps,
    citedSteps,
    sourcesRead: read.length,
    sourcesListed: sources.length,
    readDate: dates.at(-1) ?? '',
    possibly: trophies.filter((t) => t.missable === 'possibly').length,
    watch: trophies.filter((t) => t.missable === 'watch').length,
    unconfirmed: trophies.filter((t) => t.confidence === 'unconfirmed').length,
    single: trophies.filter((t) => t.confidence === 'single').length,
    disagree: trophies.filter((t) => t.differs).length,
  };
}

function auditItem(value, label, className = '', title = '') {
  return el('li', { class: `audit-item ${className}`, title }, el('b', {}, value), ` ${label}`);
}

export function renderAuditStrip(container, state) {
  const a = state.audit ??= computeGuideAudit(state);
  const gradeText = GRADE_ORDER.map((g) => `${a.grades[g]}${GRADE_LETTER[g]}`).join(' ');
  container.replaceChildren(
    el('span', { class: 'audit-title' }, 'Audit'),
    el('ul', { class: 'audit-list' },
      auditItem(`${a.official}/${a.total}`, 'official', 'is-ok', 'Official names, descriptions and grades'),
      auditItem(gradeText, '', 'is-grades'),
      auditItem(String(a.hidden), 'hidden'),
      auditItem(`${a.cited}/${a.total}`, 'guides cited', 'is-ok', 'Guides citing 2 or more sources inline'),
      auditItem(`${a.citedSteps}/${a.steps}`, 'steps cited', 'is-ok'),
      auditItem(`${a.sourcesRead}/${a.sourcesListed}`, `sources read ${a.readDate}`),
      auditItem(String(a.possibly), 'possibly missable', 'is-danger'),
      auditItem(String(a.watch), 'watch', 'is-warn'),
      auditItem(String(a.unconfirmed), 'unconfirmed', 'is-muted', `${a.single} more rest on a single source`),
      auditItem(String(a.disagree), 'sources differ', 'is-differ'),
    ),
  );
}

// The audit strip: every number is computed from trophies.json at load time, never typed in.

import { escapeHtml, GRADE_LETTER, GRADE_ORDER } from './html-helpers.js';

export function computeAudit(index) {
  const { trophies, meta } = index;
  const grades = Object.fromEntries(GRADE_ORDER.map((g) => [g, trophies.filter((t) => t.grade === g).length]));
  const allSteps = trophies.flatMap((t) => t.steps);
  const dates = [...new Set(meta.sourcesRead.map((s) => s.retrieved))].sort();
  return {
    official: trophies.length,
    grades,
    hidden: trophies.filter((t) => t.hidden).length,
    guidesCited: trophies.filter((t) => t.guide.trim() && t.sources.length > 0).length,
    multiSourced: trophies.filter((t) => t.sources.length >= 2).length,
    stepsTotal: allSteps.length,
    stepsCited: allSteps.filter((s) => s.cites.length > 0).length,
    sourcesRead: meta.sourcesRead.length,
    sites: new Set(meta.sourcesRead.map((s) => s.site)).size,
    readOn: dates.join('/'),
    possiblyMissable: trophies.filter((t) => t.missable === 'possibly').length,
    watch: trophies.filter((t) => t.missable === 'watch').length,
    unconfirmed: trophies.filter((t) => t.status === 'unconfirmed').length,
    differ: trophies.filter((t) => t.differ).length,
    online: trophies.filter((t) => t.kind === 'online').length,
  };
}

export function renderAuditStrip(container, audit) {
  const n = audit.official;
  const gradeText = GRADE_ORDER.map((g) => `${audit.grades[g]}${GRADE_LETTER[g]}`).join(' ');
  const items = [
    ['pass', `${n}/55`, 'official'],
    ['', gradeText, ''],
    ['', audit.hidden, 'hidden'],
    ['pass', `${audit.guidesCited}/${n}`, 'guides cite sources'],
    ['pass', `${audit.multiSourced}/${n}`, 'have ≥2'],
    ['pass', `${audit.stepsCited}/${audit.stepsTotal}`, 'steps cited'],
    ['', `${audit.sourcesRead} pages · ${audit.sites} sites`, `read ${audit.readOn}`],
    ['risk', audit.possiblyMissable, 'possibly missable'],
    ['watch', audit.watch, 'watch'],
    ['', audit.unconfirmed, 'unconfirmed'],
    ['', audit.differ, 'sources differ'],
    ['', audit.online, 'online'],
  ];
  container.innerHTML =
    '<span class="audit-title">AUDIT</span>' +
    items
      .map(([kind, value, label]) => `<span class="audit-item audit-${kind || 'plain'}"><b>${escapeHtml(value)}</b> ${escapeHtml(label)}</span>`)
      .join('<span class="muted">·</span>');
}

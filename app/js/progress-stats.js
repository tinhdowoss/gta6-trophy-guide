// Progress numbers: the header (total, per-grade counts, PSN points) and the Progress & export panel
// (earned by grade, by kind, points toward platinum, export to a file and import back).

import { el, gradeBadge, percent, progressBar } from './dom.js';
import { compareRoadmapOrder, GRADE_LETTER, GRADE_ORDER, GRADE_POINTS, gradeLabel, KIND_LABELS } from './trophy-data.js';
import { buildProgressFile, isEarned } from './progress-store.js';
import { displayName } from './spoiler-mode.js';

export function computeProgressStats(state) {
  const earned = state.trophies.filter((t) => isEarned(state.progress, t));
  const byGrade = Object.fromEntries(GRADE_ORDER.map((g) => [g, {
    earned: earned.filter((t) => t.grade === g).length,
    total: state.trophies.filter((t) => t.grade === g).length,
  }]));
  const byKind = Object.keys(KIND_LABELS).map((kind) => ({
    kind,
    earned: earned.filter((t) => t.kind === kind).length,
    total: state.trophies.filter((t) => t.kind === kind).length,
  })).filter((k) => k.total);
  const points = earned.reduce((n, t) => n + GRADE_POINTS[t.grade], 0);
  const maxPoints = state.trophies.reduce((n, t) => n + GRADE_POINTS[t.grade], 0);
  return { earned: earned.length, total: state.trophies.length, byGrade, byKind, points, maxPoints };
}

export function renderProgressHeader(state) {
  const stats = computeProgressStats(state);
  document.getElementById('total-progress').replaceChildren(
    el('span', { class: 'total-num' }, el('b', {}, String(stats.earned)), `/${stats.total}`),
    el('span', { class: 'total-pct' }, `${percent(stats.earned, stats.total)}%`),
    progressBar(stats.earned, stats.total, 'total-bar'));
  document.getElementById('grade-progress').replaceChildren(...GRADE_ORDER.map((g) => el('li', { class: `grade-pill grade-pill-${g}`, title: gradeLabel(g) },
    gradeBadge(g), el('b', {}, String(stats.byGrade[g].earned)), `/${stats.byGrade[g].total}`)));
}

// A short, one-line-per-entry preview of the JSON file Export writes.
function describeExportFile(file) {
  const lines = [`{ "format": "${file.format}",`, `  "exportedAt": "${file.exportedAt.slice(0, 19)}Z",`, '  "earned": ['];
  for (const e of file.earned.slice(0, 4)) lines.push(`    { "id": ${e.id}, "name": ${JSON.stringify(e.name)}, "on": "${e.on}" },`);
  if (file.earned.length > 4) lines.push(`    … ${file.earned.length - 4} more`);
  lines.push('  ],', `  "counts": ${JSON.stringify(file.counts)},`, `  "settings": ${JSON.stringify(file.settings)} }`);
  return lines.join('\n');
}

function renderStageRemaining(state) {
  return el('section', { class: 'stats-card stage-card' }, el('h3', {}, 'Roadmap stages · earned / total'),
    el('ol', { class: 'stage-stats' }, state.roadmap.map((stage) => {
      const items = state.trophies.filter((t) => t.roadmapStage === stage.stage);
      return statRow(`${stage.stage}. ${stage.title}`, items.filter((t) => isEarned(state.progress, t)).length, items.length);
    })));
}

function statRow(label, part, whole, extra = null) {
  return el('li', { class: 'stat-row' },
    el('span', { class: 'stat-label' }, label, extra),
    progressBar(part, whole, 'stat-bar'),
    el('span', { class: 'stat-num' }, `${part}/${whole}`));
}

export function renderProgressStats(container, state, actions) {
  const stats = computeProgressStats(state);
  const file = buildProgressFile(state.progress, state.trophies, state.settings);
  const preview = describeExportFile(file);
  container.replaceChildren(
    el('div', { class: 'column-head' }, el('h2', {}, 'Progress & export'),
      el('span', { class: 'column-meta' }, state.progress.updatedAt ? `saved in this browser ${state.progress.updatedAt.slice(0, 16).replace('T', ' ')}` : 'nothing saved yet')),
    el('div', { class: 'stats-grid' },
      el('section', { class: 'stats-card' }, el('h3', {}, 'Earned by grade'),
        el('ul', {}, GRADE_ORDER.map((g) => statRow(`${GRADE_LETTER[g]} · ${gradeLabel(g)}`, stats.byGrade[g].earned, stats.byGrade[g].total)))),
      el('section', { class: 'stats-card' }, el('h3', {}, 'Earned by kind'),
        el('ul', {}, stats.byKind.map((k) => statRow(KIND_LABELS[k.kind], k.earned, k.total)))),
      el('section', { class: 'stats-card points-card' }, el('h3', {}, 'Points toward platinum'),
        el('p', { class: 'points-big' }, el('b', {}, String(stats.points)), ` / ${stats.maxPoints} pts`),
        progressBar(stats.points, stats.maxPoints, 'points-bar'),
        el('p', { class: 'points-note' }, `${percent(stats.points, stats.maxPoints)}% of points · ${stats.total - stats.earned} trophies to go · B 15 · S 30 · G 90 · P 300`),
        el('h3', { class: 'risk-head' }, 'Still at risk'),
        el('ul', { class: 'risk-list' }, state.trophies.filter((t) => t.isMissable && !isEarned(state.progress, t)).sort(compareRoadmapOrder).map((t) =>
          el('li', { class: `miss-${t.missable}` }, el('b', {}, t.missable === 'possibly' ? 'Missable? ' : 'Watch '),
            `${displayName(t, state)} — ${t.pointOfNoReturn.replace(/^Watch: /, '')}`)))),
      el('section', { class: 'stats-card transfer-card', id: 'export-import-panel' }, el('h3', {}, 'Export / import'),
        el('div', { class: 'transfer-actions' },
          el('button', { class: 'btn btn-primary', type: 'button', id: 'export-progress-panel', onclick: () => actions.exportProgress() }, '↓ Export progress (.json)'),
          el('label', { class: 'btn', for: 'import-progress-input' }, '↑ Import a file')),
        el('ul', { class: 'transfer-log' },
          el('li', {}, state.ui.lastExport ? `Last export: ${state.ui.lastExport}` : 'No export yet this session'),
          el('li', {}, state.ui.lastImport ? `Last import: ${state.ui.lastImport}` : 'No import yet this session')),
        el('pre', { class: 'file-preview', 'aria-label': 'Export file preview' }, preview)),
      renderStageRemaining(state)));
}

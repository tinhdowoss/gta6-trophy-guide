// Progress numbers: the header's total and per-grade counts, and the Progress & export panel
// (earned by grade, by kind, PSN points toward the platinum, export/import with the file format shown).

import { el, percent, progressBar } from './dom.js';
import { GRADE_ORDER, GRADE_POINTS, KIND_LABELS, gradeLabel } from './trophy-data.js';
import { gradeBadge } from './checklist-view.js';
import { buildPlatinumRoadmap } from './platinum-roadmap.js';

export function computeGradeProgress(trophies, progress) {
  return GRADE_ORDER.map((grade) => {
    const list = trophies.filter((t) => t.grade === grade);
    return { grade, total: list.length, earned: list.filter((t) => progress.earned.has(t.id)).length };
  });
}

export function computeKindProgress(trophies, progress) {
  return Object.keys(KIND_LABELS).map((kind) => {
    const list = trophies.filter((t) => t.kind === kind);
    return { kind, total: list.length, earned: list.filter((t) => progress.earned.has(t.id)).length };
  }).filter((k) => k.total > 0);
}

export function computePlatinumPoints(trophies, progress) {
  const total = trophies.reduce((sum, t) => sum + GRADE_POINTS[t.grade], 0);
  const earned = trophies.filter((t) => progress.earned.has(t.id)).reduce((sum, t) => sum + GRADE_POINTS[t.grade], 0);
  return { total, earned };
}

export function renderProgressHeader(state) {
  const earned = state.progress.earned.size;
  const total = state.trophies.length;
  document.getElementById('total-progress').replaceChildren(
    el('div', { class: 'total-line' }, el('b', {}, `${earned}/${total}`), el('span', {}, ` trophies · ${percent(earned, total)}%`)),
    progressBar(earned, total, 'total-bar'));
  document.getElementById('grade-progress').replaceChildren(
    ...computeGradeProgress(state.trophies, state.progress).map((g) => el('li', { class: `grade-pill pill-${g.grade}`, title: `${gradeLabel(g.grade)}: ${g.earned} of ${g.total}` },
      gradeBadge(g.grade, 'is-small'), el('span', {}, el('b', {}, String(g.earned)), `/${g.total}`), el('small', {}, gradeLabel(g.grade)))));
}

function statRows(rows, labelOf) {
  return el('ul', { class: 'stat-rows' }, rows.map((r) => el('li', {},
    el('span', { class: 'stat-label' }, labelOf(r)),
    progressBar(r.earned, r.total, `stat-bar ${r.grade ? `fill-${r.grade}` : ''}`),
    el('span', { class: 'stat-num' }, `${r.earned}/${r.total}`))));
}

export function renderProgressStats(panel, state, actions) {
  const points = computePlatinumPoints(state.trophies, state.progress);
  const stages = buildPlatinumRoadmap(state.roadmap, state.trophies, state.progress);
  const lastExport = state.ui.lastExport;
  const counted = state.trophies.filter((t) => t.count && (state.progress.counts[t.id] ?? 0) > 0).length;
  panel.replaceChildren(
    el('div', { id: 'progress-stats', class: 'stats-panel' },
      el('h2', { class: 'guide-title' }, 'Progress & stats'),
      el('div', { class: 'points-card' },
        el('span', { class: 'points-label' }, 'PSN points toward the platinum'),
        el('div', { class: 'points-line' }, el('b', {}, points.earned.toLocaleString('en-US')), ` / ${points.total.toLocaleString('en-US')} pts · ${percent(points.earned, points.total)}%`),
        progressBar(points.earned, points.total, 'points-bar')),
      el('div', { class: 'stats-cols' },
        el('section', {}, el('h3', { class: 'guide-h' }, 'Earned by grade'),
          statRows(computeGradeProgress(state.trophies, state.progress), (r) => gradeLabel(r.grade))),
        el('section', {}, el('h3', { class: 'guide-h' }, 'Earned by kind'),
          statRows(computeKindProgress(state.trophies, state.progress), (r) => KIND_LABELS[r.kind]))),
      el('h3', { class: 'guide-h' }, 'Roadmap stages'),
      el('ol', { class: 'stage-strip' }, stages.map((s) => el('li', { title: s.title, class: s.earned === s.items.length ? 'is-done' : s.earned ? 'is-partial' : '' },
        el('b', {}, String(s.stage)), el('span', {}, `${s.earned}/${s.items.length}`)))),
      el('section', { id: 'export-import-box', class: 'export-box' },
        el('h3', { class: 'guide-h' }, 'Back up or move your progress'),
        el('p', {}, `Saved automatically in this browser (localStorage). ${state.progress.earned.size} earned, ${counted} counters in progress.`),
        el('div', { class: 'export-actions' },
          el('button', { class: 'btn btn-accent', type: 'button', onclick: () => actions.exportProgress() }, '⬇ Export progress (.json)'),
          el('button', { class: 'btn', type: 'button', onclick: () => document.getElementById('import-progress-input').click() }, '⬆ Import file')),
        el('ul', { class: 'export-log' },
          el('li', {}, el('span', {}, 'Last export'), el('b', {}, lastExport ? `${lastExport.name} · ${lastExport.earned} trophies · ${lastExport.at} UTC` : 'none this session')),
          el('li', {}, el('span', {}, 'Last import'), el('b', {}, state.ui.lastImport ?? 'none this session')),
          el('li', {}, el('span', {}, 'File format'), el('b', {}, 'leonida-ledger-progress/v1 · ids + names, counters, spoiler setting')))),
    ),
  );
}

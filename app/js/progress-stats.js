// Progress view: earned by grade and by kind, PSN points toward the platinum, counters, and the export/import card.

import { escapeHtml, GRADE_ORDER, GRADE_POINTS, gradeBadge, progressBar, percent } from './html-helpers.js';
import { KIND_LABELS } from './trophy-data.js';
import { lastTransfer, progressFileName } from './progress-export.js';

function statRow(label, earned, total) {
  return `<div class="stat-row"><span>${label}</span>${progressBar(earned, total)}<span class="num">${earned}/${total}</span></div>`;
}

export function computeProgressStats(index, store) {
  const earned = index.trophies.filter((t) => store.isEarned(t.id));
  const pointsTotal = index.trophies.reduce((sum, t) => sum + GRADE_POINTS[t.grade], 0);
  const pointsEarned = earned.reduce((sum, t) => sum + GRADE_POINTS[t.grade], 0);
  const counted = index.trophies.filter((t) => t.count);
  return {
    earned: earned.length,
    total: index.trophies.length,
    pointsEarned,
    pointsTotal,
    byGrade: GRADE_ORDER.map((g) => ({ grade: g, earned: earned.filter((t) => t.grade === g).length, total: index.trophies.filter((t) => t.grade === g).length })),
    byKind: Object.keys(KIND_LABELS)
      .map((k) => ({ kind: k, earned: earned.filter((t) => t.kind === k).length, total: index.trophies.filter((t) => t.kind === k).length }))
      .filter((row) => row.total > 0),
    counters: counted.map((t) => ({ trophy: t, value: store.counter(t.id) })).filter((c) => c.value > 0),
    missablesLeft: index.trophies.filter((t) => t.missable !== 'no' && !store.isEarned(t.id)).length,
  };
}

export function renderProgressStats(container, index, store) {
  const s = computeProgressStats(index, store);
  const gradeRows = s.byGrade.map((g) => statRow(`${gradeBadge(g.grade)} ${g.grade}`, g.earned, g.total)).join('');
  const kindRows = s.byKind.map((k) => statRow(KIND_LABELS[k.kind], k.earned, k.total)).join('');
  const counterRows = s.counters.map((c) => statRow(escapeHtml(c.trophy.name), c.value, c.trophy.count.target)).join('') || '<p class="muted">No counters started yet.</p>';
  const transfer = lastTransfer
    ? `Last ${lastTransfer.kind}: ${lastTransfer.file}\n${lastTransfer.earned} earned · ${lastTransfer.counters} counters`
    : 'No export or import yet this session.';
  const saved = store.get().updated ? new Date(store.get().updated).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : 'not yet';
  container.innerHTML = `
    <section class="stats-card"><h2>Toward the platinum</h2>
      <div class="points-big">${s.pointsEarned} / ${s.pointsTotal} pts</div>
      <p class="muted">PSN points (P300 · G90 · S30 · B15) · ${s.earned}/${s.total} trophies · ${percent(s.earned, s.total)}% · ${s.missablesLeft} missable/watch left</p>
      ${progressBar(s.pointsEarned, s.pointsTotal)}</section>
    <section class="stats-card"><h2>Export / import progress</h2>
      <div class="stats-actions"><button type="button" data-action="export">⇩ Export to ${progressFileName()}</button>
      <label class="button-like">⇧ Import a file<input type="file" accept=".json" data-action="import" hidden></label></div>
      <pre class="export-log">${escapeHtml(transfer)}\nSaved in this browser (localStorage) · ${escapeHtml(saved)}</pre></section>
    <section class="stats-card"><h2>Earned by grade</h2>${gradeRows}</section>
    <section class="stats-card"><h2>Earned by kind</h2>${kindRows}</section>
    <section class="stats-card wide"><h2>Counters in progress</h2>${counterRows}</section>`;
}

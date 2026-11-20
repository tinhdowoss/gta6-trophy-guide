// Entry point: loads the trophy data, restores progress, wires header, filters and views, and re-renders on change.

import { loadTrophyData, trophiesInRoadmapOrder } from './trophy-data.js';
import { createProgressStore } from './progress-store.js';
import { computeAudit, renderAuditStrip } from './audit-numbers.js';
import { createFilterState, applyTrophyFilters, renderFilterChips, bindFilterInputs } from './trophy-filters.js';
import { bindSpoilerToggle } from './spoiler-mode.js';
import { renderChecklist } from './render-checklist.js';
import { renderTrophyGuide } from './render-trophy-guide.js';
import { renderSourcesColumn } from './render-sources-column.js';
import { buildPlatinumRoadmap } from './platinum-roadmap.js';
import { renderMissablesView } from './missables-view.js';
import { renderProgressStats } from './progress-stats.js';
import { bindExportImport, exportProgress, importProgress } from './progress-export.js';
import { escapeHtml, GRADE_ORDER, gradeBadge, progressBar, percent } from './html-helpers.js';

const VIEWS = ['guide', 'roadmap', 'missables', 'progress'];
const $ = (id) => document.getElementById(id);

function readHashState() {
  const params = new URLSearchParams(location.hash.slice(1));
  const view = VIEWS.includes(params.get('view')) ? params.get('view') : 'guide';
  return { view, trophy: Number(params.get('trophy')) || null, chips: (params.get('chips') || '').split(',').filter(Boolean) };
}

function renderHeaderProgress(index, store) {
  const earned = index.trophies.filter((t) => store.isEarned(t.id)).length;
  $('total-progress').innerHTML = `<strong>${earned}/${index.trophies.length}</strong>${progressBar(earned, index.trophies.length)}<span>${percent(earned, index.trophies.length)}%</span>`;
  $('grade-progress').innerHTML = GRADE_ORDER.map((g) => {
    const all = index.trophies.filter((t) => t.grade === g);
    const got = all.filter((t) => store.isEarned(t.id)).length;
    return `<span class="grade-count" title="${g}">${gradeBadge(g)}<b>${got}</b>/${all.length}</span>`;
  }).join('');
}

function notifier() {
  let timer;
  return (message) => {
    const toast = $('toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => { toast.hidden = true; }, 3500);
  };
}

async function bootLedger() {
  const index = await loadTrophyData();
  const store = createProgressStore();
  const filters = createFilterState();
  const hash = readHashState();
  hash.chips.forEach((chip) => filters.chips.add(chip));
  const ui = { view: hash.view, openId: hash.trophy ?? index.trophies.find((t) => t.missable === 'possibly')?.id ?? 1 };
  const notify = notifier();

  renderAuditStrip($('audit-strip'), computeAudit(index));
  const ordered = trophiesInRoadmapOrder(index);

  function openTrophy(id) {
    ui.openId = id;
    ui.view = 'guide';
    renderAll();
  }

  function renderAll() {
    const filtered = applyTrophyFilters(ordered, filters, store);
    const open = index.byId.get(ui.openId);
    renderHeaderProgress(index, store);
    renderFilterChips($('filter-chips'), index.trophies, filters, renderAll);
    for (const view of VIEWS) $(`${view}-view`).hidden = view !== ui.view;
    document.querySelectorAll('#view-tabs [data-view]').forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.view === ui.view)));
    if (ui.view === 'guide') {
      renderChecklist($('checklist-column'), { trophies: index.trophies, filtered, filters, store, openId: ui.openId, onOpen: openTrophy });
      renderTrophyGuide($('trophy-guide'), open, index, store);
      renderSourcesColumn($('sources-column'), open, index, store, openTrophy);
    } else if (ui.view === 'roadmap') {
      buildPlatinumRoadmap($('roadmap-view'), index, store, openTrophy);
    } else if (ui.view === 'missables') {
      renderMissablesView($('missables-view'), index, store, openTrophy);
    } else {
      renderChecklist($('progress-checklist'), { trophies: index.trophies, filtered, filters, store, openId: null, onOpen: openTrophy });
      renderProgressStats($('progress-stats'), index, store);
    }
    const chips = [...filters.chips].join(',');
    history.replaceState(null, '', `#view=${ui.view}${ui.view === 'guide' ? `&trophy=${ui.openId}` : ''}${chips ? `&chips=${chips}` : ''}`);
  }

  $('view-tabs').addEventListener('click', (event) => {
    const tab = event.target.closest('[data-view]');
    if (tab) { ui.view = tab.dataset.view; renderAll(); }
  });
  $('progress-stats').addEventListener('click', (event) => {
    if (event.target.closest('[data-action="export"]')) notify(`Exported to ${exportProgress(store, index).file}`);
  });
  $('progress-stats').addEventListener('change', async (event) => {
    const input = event.target.closest('[data-action="import"]');
    if (!input?.files?.[0]) return;
    try { notify(`Imported ${(await importProgress(input.files[0], store, index)).earned} earned trophies`); } catch (error) { notify(error.message); }
  });
  $('missables-view').addEventListener('change', (event) => {
    const box = event.target.closest('[data-earn]');
    if (box) store.setEarned(Number(box.dataset.earn), box.checked);
  });

  bindFilterInputs({ grade: $('grade-filter'), status: $('status-filter'), search: $('trophy-search') }, filters, renderAll);
  bindSpoilerToggle($('spoiler-toggle'), store);
  bindExportImport({ exportButton: $('export-progress'), importInput: $('import-progress') }, store, index, (msg) => { notify(msg); renderAll(); });
  store.subscribe(renderAll);
  renderAll();
}

bootLedger().catch((error) => {
  document.body.insertAdjacentHTML('beforeend', `<p id="load-error">Could not load the trophy data: ${escapeHtml(error.message)}. Serve app/ with a static server (node serve.ts).</p>`);
});

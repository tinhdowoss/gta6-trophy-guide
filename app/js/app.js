// Leonida Ledger entry module: loads the trophy data, restores saved progress and settings, wires the header,
// tabs and filters, and renders the active view with the guide, sources and next-up columns beside it.

import { el } from './dom.js';
import { loadTrophyData } from './trophy-data.js';
import { exportProgress, importProgress, loadProgress, loadSettings, saveSettings, setCollectibleCount, toggleEarned } from './progress-store.js';
import { applySpoilerMode, revealTrophyOnce } from './spoiler-mode.js';
import { renderFilterChips } from './trophy-filters.js';
import { renderAuditStrip } from './audit-strip.js';
import { renderTrophyChecklist } from './checklist-view.js';
import { renderTrophyGuide } from './trophy-guide-panel.js';
import { renderSourcesColumn } from './sources-panel.js';
import { renderNextUpPanel } from './next-up.js';
import { renderPlatinumRoadmap } from './platinum-roadmap.js';
import { renderMissablesView, renderSpoilerStoryList } from './missables-view.js';
import { renderProgressHeader, renderProgressStats } from './progress-stats.js';

const TABS = ['checklist', 'roadmap', 'missables', 'progress'];
const DEFAULT_TROPHY = 28;
const $ = (id) => document.getElementById(id);

function readHashState() {
  const params = new URLSearchParams(location.hash.slice(1));
  return { tab: TABS.includes(params.get('tab')) ? params.get('tab') : 'checklist', trophy: Number(params.get('trophy')) || null };
}

function writeHashState(state) {
  const params = new URLSearchParams({ tab: state.ui.tab, trophy: String(state.ui.selectedId) });
  history.replaceState(null, '', `#${params}`);
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 3000);
}

function showSavedStatus(state) {
  if (!state.progress.updatedAt) return;
  const time = new Date(state.progress.updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  $('save-status').textContent = `✓ Saved in this browser · ${time}`;
}

function createActions(state, render) {
  return {
    selectTrophy(id, tab) {
      state.ui.selectedId = id;
      state.ui.highlightRef = null;
      if (tab && state.ui.tab !== 'progress') state.ui.tab = tab;
      render();
    },
    toggleEarned(trophy, earned) {
      toggleEarned(state.progress, trophy, earned);
      showSavedStatus(state);
      render();
    },
    setCount(trophy, value) {
      setCollectibleCount(state.progress, trophy, value);
      showSavedStatus(state);
      render();
    },
    revealTrophy(trophy) {
      revealTrophyOnce(trophy, state);
      render();
    },
    highlightSource(ref) {
      state.ui.highlightRef = ref;
      render();
      $(`source-${ref}`)?.scrollIntoView({ block: 'nearest' });
    },
    setSort(sort) {
      state.ui.sort = sort;
      render();
    },
    openTab(tab) {
      state.ui.tab = tab;
      render();
    },
    exportProgress() {
      const file = exportProgress(state.progress, state.trophies, state.settings);
      state.ui.lastExport = `gta6-trophy-progress-${file.exportedAt.slice(0, 10)}.json · ${file.earned.length} earned · ${file.exportedAt.slice(11, 16)}`;
      showToast(`Exported ${file.earned.length} earned trophies to a JSON file`);
      render();
    },
  };
}

// Which columns each tab uses: the checklist tab shows checklist | guide | sources + next up.
function renderColumns(state, actions) {
  const view = $('primary-view');
  const guide = $('trophy-guide-panel');
  document.body.dataset.tab = state.ui.tab;
  for (const button of document.querySelectorAll('#view-tabs [data-tab]')) {
    button.setAttribute('aria-selected', String(button.dataset.tab === state.ui.tab));
  }
  const selected = state.byId.get(state.ui.selectedId) ?? state.byId.get(DEFAULT_TROPHY);
  if (state.ui.tab === 'roadmap') renderPlatinumRoadmap(view, state, actions);
  else if (state.ui.tab === 'missables') renderMissablesView(view, state, actions);
  else renderTrophyChecklist(view, state, actions);

  if (state.ui.tab === 'progress') renderProgressStats(guide, state, actions);
  else if (state.ui.tab === 'checklist') renderTrophyGuide(guide, selected, state, actions);
  else guide.replaceChildren();

  if (state.ui.tab === 'missables') renderSpoilerStoryList($('sources-column'), state, actions);
  else renderSourcesColumn($('sources-column'), state.ui.tab === 'checklist' ? selected : null, state);
  renderNextUpPanel($('next-up-panel'), state, actions, state.ui.tab === 'roadmap' ? 4 : 5);
  keepSelectedRowVisible(view);
}

function keepSelectedRowVisible(view) {
  const row = view.querySelector('.trophy-row.is-selected');
  if (!row) return;
  const top = row.offsetTop - view.offsetTop;
  if (top < view.scrollTop || top > view.scrollTop + view.clientHeight - 60) view.scrollTop = Math.max(0, top - 90);
}

async function readImportFile(event, state, render) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const result = await importProgress(file, state.progress, state.trophies);
    if (typeof result.settings?.spoiler === 'boolean') {
      state.settings.spoiler = result.settings.spoiler;
      saveSettings(state.settings);
    }
    state.ui.lastImport = `${file.name} · ${result.earnedCount} earned restored`;
    showToast(`Imported ${result.earnedCount} earned trophies from ${file.name}`);
    showSavedStatus(state);
  } catch (error) {
    showToast(`Import failed: ${error.message}`);
  }
  event.target.value = '';
  render();
}

function wireControls(state, render, actions) {
  for (const button of document.querySelectorAll('#view-tabs [data-tab]')) {
    button.addEventListener('click', () => actions.openTab(button.dataset.tab));
  }
  $('spoiler-mode-input').addEventListener('change', (e) => {
    state.settings.spoiler = e.target.checked;
    state.ui.revealed.clear();
    saveSettings(state.settings);
    render();
  });
  $('grade-filter').addEventListener('change', (e) => { state.ui.filters.grade = e.target.value; render(); });
  $('status-filter').addEventListener('change', (e) => { state.ui.filters.status = e.target.value; render(); });
  $('trophy-search').addEventListener('input', (e) => { state.ui.filters.query = e.target.value; render(); });
  $('export-progress').addEventListener('click', () => actions.exportProgress());
  $('import-progress-input').addEventListener('change', (e) => readImportFile(e, state, render));
  addEventListener('hashchange', () => {
    const hash = readHashState();
    state.ui.tab = hash.tab;
    if (hash.trophy) state.ui.selectedId = hash.trophy;
    render();
  });
}

export async function initTrophyApp() {
  let data;
  try {
    data = await loadTrophyData();
  } catch (error) {
    $('primary-view').replaceChildren(el('p', { class: 'load-error' }, `Could not read data/trophies.json (${error.message}). Serve the app folder over HTTP, e.g. node serve.ts.`));
    return;
  }
  for (const t of data.trophies) t.stageTitle = data.roadmap.find((s) => s.stage === t.roadmapStage)?.title ?? '';
  const hash = readHashState();
  const state = {
    ...data,
    progress: loadProgress(),
    settings: loadSettings(),
    ui: {
      tab: hash.tab, selectedId: hash.trophy ?? DEFAULT_TROPHY, sort: 'roadmap', highlightRef: null, revealed: new Set(),
      filters: { chips: new Set(), grade: 'all', status: 'all', query: '' }, lastExport: null, lastImport: null,
    },
  };
  const render = () => {
    applySpoilerMode(state);
    renderProgressHeader(state);
    renderAuditStrip($('audit-strip'), state);
    renderFilterChips($('filter-chips'), state, render);
    renderColumns(state, actions);
    writeHashState(state);
  };
  const actions = createActions(state, render);
  wireControls(state, render, actions);
  showSavedStatus(state);
  render();
}

initTrophyApp();

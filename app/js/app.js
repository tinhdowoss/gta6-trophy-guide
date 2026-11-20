// Leonida Ledger: entry module. Loads the trophy data, restores progress and settings, wires the header,
// tabs and filters, and renders the active view beside the trophy guide (or the progress panel).

import { el } from './dom.js';
import { loadTrophyData } from './trophy-data.js';
import {
  exportProgress, importProgress, loadProgress, loadSettings, saveSettings, setCollectibleCount, toggleEarned,
} from './progress-store.js';
import { applySpoilerMode, revealTrophyOnce } from './spoiler-mode.js';
import { renderFilterChips } from './trophy-filters.js';
import { renderTrophyChecklist } from './checklist-view.js';
import { renderTrophyGuide } from './trophy-guide-panel.js';
import { renderPlatinumRoadmap } from './platinum-roadmap.js';
import { renderMissablesView, renderSpoilerStoryList } from './missables-view.js';
import { renderNextUpView } from './next-up.js';
import { renderProgressHeader, renderProgressStats } from './progress-stats.js';

const TABS = ['checklist', 'roadmap', 'missables', 'nextup', 'progress'];
const $ = (id) => document.getElementById(id);

function readHashState() {
  const params = new URLSearchParams(location.hash.slice(1));
  return {
    tab: TABS.includes(params.get('tab')) ? params.get('tab') : 'checklist',
    trophy: Number(params.get('trophy')) || null,
  };
}

function writeHashState(state) {
  const params = new URLSearchParams({ tab: state.ui.tab });
  if (state.ui.selectedId) params.set('trophy', String(state.ui.selectedId));
  history.replaceState(null, '', `#${params}`);
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 3200);
}

function flashSaved(state) {
  const time = new Date(state.progress.updatedAt ?? Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  $('save-status').textContent = `✓ Saved in this browser · ${time}`;
}

function createActions(state, render) {
  return {
    selectTrophy(id, tab) {
      state.ui.selectedId = id;
      if (tab && (state.ui.tab === 'roadmap' || state.ui.tab === 'missables')) state.ui.tab = tab;
      render();
    },
    toggleEarned(trophy, earned) {
      toggleEarned(state.progress, trophy, earned);
      flashSaved(state);
      render();
    },
    setCount(trophy, value) {
      setCollectibleCount(state.progress, trophy, value);
      flashSaved(state);
      render();
    },
    revealTrophy(trophy) {
      revealTrophyOnce(trophy, state);
      render();
    },
    setSort(sort) {
      state.ui.filters.sort = sort;
      render();
    },
    openTab(tab) {
      state.ui.tab = tab;
      render();
    },
    exportProgress() {
      const file = exportProgress(state.progress, state.trophies, state.settings);
      state.ui.lastExport = { name: `gta6-trophy-progress-${file.exportedAt.slice(0, 10)}.json`, earned: file.earned.length, at: file.exportedAt.slice(11, 16) };
      showToast(`Exported ${file.earned.length} earned trophies to a JSON file`);
      render();
    },
  };
}

function renderPrimaryView(state, actions) {
  const view = $('primary-view');
  const panel = $('trophy-guide-panel');
  document.body.dataset.tab = state.ui.tab;
  for (const button of document.querySelectorAll('#view-tabs [data-tab]')) {
    button.setAttribute('aria-selected', String(button.dataset.tab === state.ui.tab));
  }
  const selected = state.byId.get(state.ui.selectedId) ?? state.trophies[0];
  switch (state.ui.tab) {
    case 'roadmap':
      renderPlatinumRoadmap(view, state, actions);
      break;
    case 'missables':
      renderMissablesView(view, state, actions);
      break;
    case 'nextup':
      renderNextUpView(view, state, actions);
      break;
    case 'progress':
      renderTrophyChecklist(view, state, actions, { title: 'Checklist' });
      break;
    default:
      renderTrophyChecklist(view, state, actions);
  }
  if (state.ui.tab === 'progress') renderProgressStats(panel, state, actions);
  else if (state.ui.tab === 'missables') renderSpoilerStoryList(panel, state, actions);
  else renderTrophyGuide(panel, selected, state, actions);
  scrollSelectedRowIntoView(view);
}

function scrollSelectedRowIntoView(view) {
  const row = view.querySelector('.trophy-row.is-selected');
  if (!row) return;
  const top = row.offsetTop - view.offsetTop;
  if (top < view.scrollTop || top > view.scrollTop + view.clientHeight - 60) view.scrollTop = Math.max(0, top - 120);
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
  $('import-progress-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsed = await importProgress(file, state.progress, state.trophies);
      if (parsed.settings && typeof parsed.settings.spoiler === 'boolean') {
        state.settings.spoiler = parsed.settings.spoiler;
        saveSettings(state.settings);
      }
      state.ui.lastImport = `${file.name} · ${parsed.earned.size} trophies`;
      showToast(`Imported ${parsed.earned.size} earned trophies from ${file.name}`);
      flashSaved(state);
    } catch (error) {
      showToast(`Import failed: ${error.message}`);
    }
    e.target.value = '';
    render();
  });
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
    $('primary-view').replaceChildren(el('p', { class: 'load-error' },
      `Could not read data/trophies.json (${error.message}). Serve the app folder over HTTP, e.g. node serve.ts.`));
    return;
  }
  const hash = readHashState();
  const state = {
    ...data,
    progress: loadProgress(),
    settings: loadSettings(),
    ui: {
      tab: hash.tab,
      selectedId: hash.trophy ?? 28,
      revealed: new Set(),
      filters: { chips: new Set(), grade: 'all', status: 'all', query: '', sort: 'roadmap' },
      lastExport: null,
      lastImport: null,
    },
  };
  const render = () => {
    applySpoilerMode(state);
    renderProgressHeader(state);
    renderFilterChips($('filter-chips'), state, render);
    renderPrimaryView(state, actions);
    writeHashState(state);
  };
  const actions = createActions(state, render);
  wireControls(state, render, actions);
  if (state.progress.updatedAt) flashSaved(state);
  render();
  window.leonidaLedger = state;
}

initTrophyApp();

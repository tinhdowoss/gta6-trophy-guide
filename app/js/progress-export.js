// Export progress to a JSON file and import it back. Nothing leaves the browser except the download itself.

import { normaliseProgress } from './progress-store.js';

export let lastTransfer = null;

export function progressFileName(date = new Date()) {
  return `leonida-ledger-progress-${date.toISOString().slice(0, 10)}.json`;
}

export function exportProgress(store, index) {
  const state = store.get();
  const payload = {
    app: 'Leonida Ledger',
    format: 'leonida-ledger/progress/v1',
    exported: new Date().toISOString(),
    trophyCount: index.trophies.length,
    ...state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = progressFileName();
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  lastTransfer = { kind: 'export', file: link.download, earned: Object.keys(state.earned).length, counters: Object.keys(state.counters).length };
  return lastTransfer;
}

/** Reads a chosen file, checks it is one of ours, and replaces the saved progress with it. */
export async function importProgress(file, store, index) {
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not JSON.');
  }
  if (parsed.format !== 'leonida-ledger/progress/v1') throw new Error('That file is not a Leonida Ledger progress export.');
  const clean = normaliseProgress(parsed);
  const known = new Set(index.trophies.map((t) => String(t.id)));
  for (const id of Object.keys(clean.earned)) if (!known.has(id)) delete clean.earned[id];
  for (const id of Object.keys(clean.counters)) if (!known.has(id)) delete clean.counters[id];
  store.replaceAll(clean);
  lastTransfer = { kind: 'import', file: file.name, earned: Object.keys(clean.earned).length, counters: Object.keys(clean.counters).length };
  return lastTransfer;
}

export function bindExportImport({ exportButton, importInput }, store, index, notify) {
  exportButton.addEventListener('click', () => {
    const result = exportProgress(store, index);
    notify(`Exported ${result.earned} earned + ${result.counters} counters to ${result.file}`);
  });
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const result = await importProgress(file, store, index);
      notify(`Imported ${result.earned} earned + ${result.counters} counters from ${result.file}`);
    } catch (error) {
      notify(error.message);
    }
    importInput.value = '';
  });
}

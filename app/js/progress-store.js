// Progress lives in localStorage: earned trophy ids, collectible counters and settings.
// exportProgress writes the same data to a JSON file; importProgress reads one back (by id, or by name as a fallback).

const STORAGE_KEY = 'leonida-ledger/progress/v1';
const SETTINGS_KEY = 'leonida-ledger/settings/v1';
export const EXPORT_FORMAT = 'leonida-ledger-progress/v1';

export function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return {
      earned: new Set(raw?.earned ?? []),
      counts: { ...(raw?.counts ?? {}) },
      updatedAt: raw?.updatedAt ?? null,
    };
  } catch {
    return { earned: new Set(), counts: {}, updatedAt: null };
  }
}

export function saveProgress(progress) {
  progress.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    earned: [...progress.earned].sort((a, b) => a - b),
    counts: progress.counts,
    updatedAt: progress.updatedAt,
  }));
}

export function loadSettings() {
  try {
    return { spoiler: true, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}')) };
  } catch {
    return { spoiler: true };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function toggleEarned(progress, trophy, earned = !progress.earned.has(trophy.id)) {
  if (earned) progress.earned.add(trophy.id);
  else progress.earned.delete(trophy.id);
  // A trophy with a counter that is ticked off is, by definition, complete.
  if (earned && trophy.count) progress.counts[trophy.id] = trophy.count.target;
  saveProgress(progress);
  return earned;
}

export function setCollectibleCount(progress, trophy, value) {
  const target = trophy.count?.target ?? 0;
  const next = Math.max(0, Math.min(target, Math.round(Number(value) || 0)));
  progress.counts[trophy.id] = next;
  if (next >= target && target > 0) progress.earned.add(trophy.id);
  saveProgress(progress);
  return next;
}

export function collectibleCount(progress, trophy) {
  return progress.counts[trophy.id] ?? 0;
}

export function buildProgressFile(progress, trophies, settings) {
  return {
    format: EXPORT_FORMAT,
    game: 'Grand Theft Auto VI (PS5)',
    exportedAt: new Date().toISOString(),
    earned: trophies.filter((t) => progress.earned.has(t.id)).map((t) => ({ id: t.id, name: t.name })),
    counts: Object.fromEntries(Object.entries(progress.counts).filter(([, v]) => v > 0)),
    settings,
  };
}

export function exportProgress(progress, trophies, settings) {
  const file = buildProgressFile(progress, trophies, settings);
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `gta6-trophy-progress-${file.exportedAt.slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  return file;
}

// Accepts this app's export, or a bare array of ids or names (the starter's format).
export function parseProgressFile(text, trophies) {
  const data = JSON.parse(text);
  const byName = new Map(trophies.map((t) => [t.name.toLowerCase(), t.id]));
  const ids = new Set(trophies.map((t) => t.id));
  const entries = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(entries)) throw new Error('No "earned" list in this file.');
  const earned = new Set();
  for (const entry of entries) {
    const id = typeof entry === 'number' ? entry
      : typeof entry === 'string' ? byName.get(entry.toLowerCase())
      : entry?.id ?? byName.get(String(entry?.name ?? '').toLowerCase());
    if (ids.has(id)) earned.add(id);
  }
  const counts = {};
  for (const [key, value] of Object.entries(Array.isArray(data) ? {} : data.counts ?? {})) {
    if (ids.has(Number(key)) && Number.isFinite(value)) counts[Number(key)] = value;
  }
  return { earned, counts, settings: Array.isArray(data) ? null : data.settings ?? null };
}

export async function importProgress(file, progress, trophies) {
  const parsed = parseProgressFile(await file.text(), trophies);
  progress.earned = parsed.earned;
  progress.counts = parsed.counts;
  saveProgress(progress);
  return parsed;
}

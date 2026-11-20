// Progress kept in this browser's localStorage: earned trophies with dates, collectible counters, settings.
// exportProgress downloads it as a JSON file; importProgress reads such a file back and validates it.

const PROGRESS_KEY = 'leonida-ledger:progress:v2';
const SETTINGS_KEY = 'leonida-ledger:settings:v2';
const FILE_FORMAT = 'leonida-ledger-progress/2';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function loadProgress() {
  const saved = readJson(PROGRESS_KEY, {});
  return { earned: saved.earned ?? {}, counts: saved.counts ?? {}, updatedAt: saved.updatedAt ?? null };
}

export function saveProgress(progress) {
  progress.updatedAt = new Date().toISOString();
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function loadSettings() {
  return { spoiler: true, ...readJson(SETTINGS_KEY, {}) };
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function isEarned(progress, trophy) {
  return Boolean(progress.earned[trophy.id]);
}

export function toggleEarned(progress, trophy, earned = !isEarned(progress, trophy)) {
  if (earned) {
    progress.earned[trophy.id] = new Date().toISOString().slice(0, 10);
    if (trophy.count) progress.counts[trophy.id] = trophy.count.target;
  } else {
    delete progress.earned[trophy.id];
  }
  saveProgress(progress);
}

export function getCount(progress, trophy) {
  return progress.counts[trophy.id] ?? 0;
}

// Counter for collectible trophies (meditations, vaults…): clamps to 0..target, ticks earned at the target.
export function setCollectibleCount(progress, trophy, value) {
  const target = trophy.count?.target ?? 0;
  const next = Math.max(0, Math.min(target, Math.round(value)));
  progress.counts[trophy.id] = next;
  if (target && next >= target) progress.earned[trophy.id] ??= new Date().toISOString().slice(0, 10);
  saveProgress(progress);
}

export function buildProgressFile(progress, trophies, settings) {
  return {
    format: FILE_FORMAT,
    exportedAt: new Date().toISOString(),
    game: 'Grand Theft Auto VI (PS5)',
    earned: trophies.filter((t) => progress.earned[t.id]).map((t) => ({ id: t.id, name: t.name, on: progress.earned[t.id] })),
    counts: progress.counts,
    settings: { spoiler: settings.spoiler },
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

// Accepts this tracker's export (format 2) and matches trophies by id, falling back to the official name.
export async function importProgress(file, progress, trophies) {
  const data = JSON.parse(await file.text());
  if (!data || !Array.isArray(data.earned)) throw new Error('not a Leonida Ledger progress file');
  const byName = new Map(trophies.map((t) => [t.name, t]));
  const byId = new Map(trophies.map((t) => [t.id, t]));
  const earned = {};
  for (const item of data.earned) {
    const trophy = byId.get(item.id) ?? byName.get(item.name);
    if (trophy) earned[trophy.id] = item.on ?? new Date().toISOString().slice(0, 10);
  }
  const counts = {};
  for (const [id, value] of Object.entries(data.counts ?? {})) {
    const trophy = byId.get(Number(id));
    if (trophy?.count && Number.isFinite(value)) counts[trophy.id] = Math.max(0, Math.min(trophy.count.target, value));
  }
  progress.earned = earned;
  progress.counts = counts;
  saveProgress(progress);
  return { earnedCount: Object.keys(earned).length, settings: data.settings };
}

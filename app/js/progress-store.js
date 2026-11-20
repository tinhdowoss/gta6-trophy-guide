// The tracker's saved state in localStorage: earned trophies, per-trophy counters and the spoiler setting.

const STORAGE_KEY = 'leonida-ledger/progress/v1';

function emptyProgress() {
  return { version: 1, earned: {}, counters: {}, spoilersHidden: true, updated: null };
}

export function readSavedProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normaliseProgress(JSON.parse(raw)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

/** Accepts saved or imported JSON; keeps only well-formed fields so a bad file can't break the app. */
export function normaliseProgress(input) {
  const clean = emptyProgress();
  if (!input || typeof input !== 'object') return clean;
  for (const [id, when] of Object.entries(input.earned ?? {})) {
    if (/^\d+$/.test(id)) clean.earned[id] = typeof when === 'string' ? when : new Date().toISOString();
  }
  for (const [id, value] of Object.entries(input.counters ?? {})) {
    const n = Number(value);
    if (/^\d+$/.test(id) && Number.isFinite(n) && n >= 0) clean.counters[id] = Math.floor(n);
  }
  if (typeof input.spoilersHidden === 'boolean') clean.spoilersHidden = input.spoilersHidden;
  clean.updated = typeof input.updated === 'string' ? input.updated : null;
  return clean;
}

export function createProgressStore() {
  let state = readSavedProgress();
  const listeners = new Set();

  function commit(next) {
    state = { ...next, updated: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    listeners.forEach((fn) => fn(state));
  }

  return {
    get: () => state,
    subscribe(fn) { listeners.add(fn); },
    isEarned: (id) => Boolean(state.earned[id]),
    counter: (id) => state.counters[id] ?? 0,
    setEarned(id, earned) {
      const next = { ...state.earned };
      if (earned) next[id] = new Date().toISOString();
      else delete next[id];
      commit({ ...state, earned: next });
    },
    setCounter(id, value, target) {
      const clamped = Math.max(0, Math.min(target ?? Infinity, value));
      commit({ ...state, counters: { ...state.counters, [id]: clamped } });
    },
    setSpoilersHidden(hidden) { commit({ ...state, spoilersHidden: hidden }); },
    replaceAll(imported) { commit(normaliseProgress(imported)); },
  };
}

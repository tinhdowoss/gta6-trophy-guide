// Loads app/data/trophies.json and describes its vocabulary: grades, kinds, PSN points, missable verdicts.

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
export const GRADE_LETTER = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };
export const GRADE_TOTALS = { platinum: 1, gold: 2, silver: 6, bronze: 46 };
// PlayStation's trophy point values per grade, used for the "points toward platinum" meter.
export const GRADE_POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };

export const KIND_LABELS = {
  story: 'Story',
  strand: 'Strand',
  collectible: 'Collectible',
  activity: 'Activity',
  crime: 'Crime',
  misc: 'Misc',
  completion: '100%',
};

export const MISSABLE_LABELS = {
  yes: 'Missable',
  caution: 'Time-sensitive',
  no: 'Not missable',
};

export async function loadTrophyData(url = 'data/trophies.json') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
  const doc = await response.json();
  const trophies = (Array.isArray(doc) ? doc : doc.trophies).map(normalizeTrophy);
  return { meta: doc, trophies, roadmap: doc.roadmap ?? [], byId: new Map(trophies.map((t) => [t.id, t])) };
}

function normalizeTrophy(t) {
  return {
    ...t,
    steps: t.steps ?? [],
    sources: t.sources ?? [],
    missable: t.missable ?? 'no',
    isMissable: t.missable === 'yes' || t.missable === 'caution',
    isSpoilerProtected: Boolean(t.hidden),
  };
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function sortTrophiesByList(trophies) {
  return [...trophies].sort((a, b) => a.id - b.id);
}

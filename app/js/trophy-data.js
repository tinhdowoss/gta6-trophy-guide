// Loads app/data/trophies.json and names its vocabulary: grades, kinds, missable verdicts, confidence levels.

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
export const GRADE_LETTER = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };
// PlayStation trophy points per grade, for the "points toward platinum" meter.
export const GRADE_POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };

export const KIND_LABELS = {
  story: 'Story', strand: 'Strand', collectible: 'Collectible', activity: 'Activity',
  crime: 'Crime', misc: 'Misc', completion: '100%',
};

export const MISSABLE_LABELS = { possibly: 'Missable? Possibly', watch: 'Watch', no: 'Not missable' };
export const CONFIDENCE_LABELS = { confirmed: '2+ sources agree', single: 'Single source', unconfirmed: 'Unconfirmed' };

export async function loadTrophyData(url = 'data/trophies.json') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const doc = await response.json();
  const trophies = (Array.isArray(doc) ? doc : doc.trophies).map(normalizeTrophy);
  const sources = doc.sources ?? [];
  return {
    meta: doc,
    trophies,
    roadmap: doc.roadmap ?? [],
    sources,
    sourceByRef: new Map(sources.map((s) => [s.ref, s])),
    byId: new Map(trophies.map((t) => [t.id, t])),
  };
}

function normalizeTrophy(t) {
  return {
    ...t,
    steps: (t.steps ?? []).map((s) => (typeof s === 'string' ? { text: s, cite: [] } : s)),
    sources: t.sources ?? [],
    missable: t.missable ?? 'no',
    confidence: t.confidence ?? 'confirmed',
    isMissable: t.missable === 'possibly' || t.missable === 'watch',
  };
}

export function gradeLabel(grade) {
  return grade[0].toUpperCase() + grade.slice(1);
}

// Roadmap order: stage first, then missable trophies before safe ones, then the official list order.
export function compareRoadmapOrder(a, b) {
  const rank = { possibly: 0, watch: 1, no: 2 };
  return (a.roadmapStage - b.roadmapStage) || (rank[a.missable] - rank[b.missable]) || (a.id - b.id);
}

export function countCitedSteps(trophy) {
  return trophy.steps.filter((s) => s.cite && s.cite.length > 0).length;
}

// Loads app/data/trophies.json (a local file, same origin) and indexes it for the views.

export const KIND_LABELS = {
  story: 'Story',
  strand: 'Side strand',
  collectible: 'Collectible',
  activity: 'Activity',
  crime: 'Crime',
  misc: 'Misc',
  completion: 'Completion',
};

export async function loadTrophyData() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error(`trophies.json: HTTP ${response.status}`);
  const data = await response.json();
  return indexTrophyData(data);
}

export function indexTrophyData(data) {
  const trophies = data.trophies.slice().sort((a, b) => a.id - b.id);
  const byId = new Map(trophies.map((t) => [t.id, t]));
  const sourcesByRef = new Map(data.sourcesRead.map((s) => [s.ref, { ...s, citedBy: 0 }]));
  for (const trophy of trophies) {
    for (const source of trophy.sources) {
      const entry = sourcesByRef.get(source.ref);
      if (entry) entry.citedBy += 1;
    }
  }
  const stages = data.roadmap.map((stage) => ({
    ...stage,
    trophies: trophies.filter((t) => t.roadmapStage === stage.stage).sort(roadmapOrder),
  }));
  return { meta: data, trophies, byId, sourcesByRef, stages };
}

/** Inside a roadmap stage: missable first, then watch, then by grade weight, then list order. */
export function roadmapOrder(a, b) {
  const risk = { possibly: 0, watch: 1, no: 2 };
  return (risk[a.missable] - risk[b.missable]) || a.id - b.id;
}

/** The whole list in the order the platinum roadmap plays it. */
export function trophiesInRoadmapOrder(index) {
  return index.stages.flatMap((stage) => stage.trophies);
}

export function searchableText(trophy) {
  return [trophy.name, trophy.description, trophy.chapter, trophy.guide, ...trophy.steps.map((s) => s.text)]
    .join(' ')
    .toLowerCase();
}

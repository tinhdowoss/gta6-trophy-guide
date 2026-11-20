// Leonida Ledger — hands the GTA VI trophy guide in for make.fun's gta6-trophy-guide-01 bounty (Node 22, stdlib only).
// It checks app/data/trophies.json, copies app/ and screenshots/ to /output (MAKEFUN_OUTPUT_DIR outside the grader),
// and writes dossier.json with the kit's vendored buildDossier. Every byte it writes depends only on the repository,
// so two runs produce identical output.
//
//   node serve.ts                              # try the guide at http://localhost:8080
//   MAKEFUN_OUTPUT_DIR=out node main.ts        # build the hand-in folder

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const OFFICIAL_COUNTS = { total: 55, platinum: 1, gold: 2, silver: 6, bronze: 46 };

type Trophy = { id: number; name: string; grade: string; guide: string; sources: { ref: number }[] };

/** Refuse to hand in a guide whose data lost a trophy, a grade or a cited guide. */
function checkTrophyData(file: string): void {
  const data = JSON.parse(readFileSync(file, 'utf8')) as { trophies: Trophy[] };
  const trophies = data.trophies;
  const problems: string[] = [];
  if (trophies.length !== OFFICIAL_COUNTS.total) problems.push(`expected 55 trophies, found ${trophies.length}`);
  for (const grade of ['platinum', 'gold', 'silver', 'bronze'] as const) {
    const n = trophies.filter((t) => t.grade === grade).length;
    if (n !== OFFICIAL_COUNTS[grade]) problems.push(`expected ${OFFICIAL_COUNTS[grade]} ${grade}, found ${n}`);
  }
  for (const t of trophies) {
    if (!t.guide?.trim()) problems.push(`${t.name}: blank guide`);
    if (!t.sources || t.sources.length < 2) problems.push(`${t.name}: fewer than 2 sources`);
  }
  if (problems.length) throw new Error(`trophies.json failed its checks:\n- ${problems.join('\n- ')}`);
}

checkTrophyData(join(repoRoot, 'app', 'data', 'trophies.json'));

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's caps: a 160 KiB text outline, at most 4 screenshots of 256 KiB, app/ within 993 entries and 48 MiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

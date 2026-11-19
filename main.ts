// Leonida Ledger: hands in the GTA VI trophy guide for the make.fun bounty gta6-trophy-guide-01 (Node 22, no deps).
// It sanity-checks app/data/trophies.json (55 trophies, each with a guide and at least two cited sources), copies
// app/ and screenshots/ into the output directory, and writes dossier.json with the kit's vendored buildDossier.
//
//   node serve.ts                          # run the guide locally on http://localhost:8080
//   MAKEFUN_OUTPUT_DIR=out node main.ts    # write the hand-in to ./out instead of /output

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

type Trophy = { name: string; guide?: string; sources?: { name: string; url: string; retrieved: string }[] };

function checkTrophyData(file: string): void {
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  const trophies: Trophy[] = Array.isArray(doc) ? doc : doc.trophies;
  const problems: string[] = [];
  if (trophies.length !== 55) problems.push(`expected 55 trophies, found ${trophies.length}`);
  for (const t of trophies) {
    if (!t.guide || !t.guide.trim()) problems.push(`${t.name}: blank guide`);
    if (!t.sources || t.sources.length < 2) problems.push(`${t.name}: fewer than 2 sources`);
  }
  if (problems.length) throw new Error(`trophies.json is not ready:\n  ${problems.join('\n  ')}`);
}

checkTrophyData(join(repoRoot, 'app', 'data', 'trophies.json'));

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's caps from the kit (text_max_bytes shapes the judge's outline; the rest refuse what the gate refuses).
const dossierLimits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};
writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, dossierLimits));
console.log(`Leonida Ledger written to ${outputDir}`);

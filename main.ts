// Leonida Ledger hand-in for make.fun's gta6-trophy-guide-01 bounty (Node 22, standard library plus the kit's
// vendored dossier builder). Steps: validate the trophy data, copy app/ and screenshots/ to the output folder,
// then write dossier.json there.
//
//   node serve.ts                          # try the guide at http://localhost:8080
//   MAKEFUN_OUTPUT_DIR=out node main.ts    # hand in to ./out (the grader uses /output)

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

type Source = { ref: number; name: string; url: string; retrieved: string };
type Step = { text: string; cite: number[] };
type Trophy = { name: string; guide?: string; steps?: Step[]; sources?: Source[] };

// Refuses to hand in a guide that breaks its own promises: 55 trophies, each with a guide, two or more dated
// sources, and every numbered step citing only sources that trophy lists.
function checkTrophyData(file: string): { trophies: number; steps: number } {
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  const trophies: Trophy[] = Array.isArray(doc) ? doc : doc.trophies;
  const problems: string[] = [];
  let steps = 0;
  if (trophies.length !== 55) problems.push(`expected 55 trophies, found ${trophies.length}`);
  for (const t of trophies) {
    if (!t.guide || !t.guide.trim()) problems.push(`${t.name}: blank guide`);
    const sources = t.sources ?? [];
    if (sources.length < 2) problems.push(`${t.name}: fewer than 2 sources`);
    if (sources.some((s) => !s.url || !s.retrieved)) problems.push(`${t.name}: a source lacks its link or date`);
    const refs = new Set(sources.map((s) => s.ref));
    for (const step of t.steps ?? []) {
      steps += 1;
      if (!step.cite?.length) problems.push(`${t.name}: uncited step "${step.text}"`);
      for (const ref of step.cite ?? []) if (!refs.has(ref)) problems.push(`${t.name}: step cites [${ref}] it does not list`);
    }
  }
  if (problems.length) throw new Error(`trophies.json is not ready:\n  ${problems.join('\n  ')}`);
  return { trophies: trophies.length, steps };
}

const checked = checkTrophyData(join(repoRoot, 'app', 'data', 'trophies.json'));

// Copies one folder of the repository (app/ or screenshots/) into the hand-in, creating it even when absent.
function copyIntoHandIn(folder: string): void {
  const from = join(repoRoot, folder);
  const to = join(outputDir, folder);
  mkdirSync(to, { recursive: true });
  if (existsSync(from)) cpSync(from, to, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyIntoHandIn('app');
copyIntoHandIn('screenshots');

// Limits the gate applies: the judge's text outline is capped at 160 KiB, at most 4 screenshots of 256 KiB each,
// and app/ may hold at most 993 entries and 48 MiB.
const handInLimits = {
  text_max_bytes: 160 * 1024,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
};
writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, handInLimits));
console.log(`Leonida Ledger written to ${outputDir}: ${checked.trophies} trophies, ${checked.steps} cited steps`);

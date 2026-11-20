# Leonida Ledger: GTA VI trophy guide & platinum tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/tinhdowoss/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/tinhdowoss/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Ledger is an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy is shown with its official name, description and grade, and has a guide in our own words: what to do, where, and when it can be missed. Every numbered step cites its sources inline ([3][5]), and each source is listed with its site, page title, link, the date we read it and how many of the 55 guides cite it. Where launch guides disagree, the app shows both versions and our call rather than picking one silently. Progress is saved in your browser and can be exported to a file and imported back. The app is plain static files with no build step, and it makes no network requests.

![Cover: audit strip, checklist, Positive Mental Attitude guide with missable box, cited steps, sources differ box, next up and sources](screenshots/01-cover.jpg)

## Features

- **Audit strip** at the top, computed from `app/data/trophies.json` at load time: official count, grade split (1P 2G 6S 46B), hidden count, guides cited, steps cited, sources read and when, possibly missable / watch / unconfirmed counts, and how many trophies have sources that disagree.
- **Three-column checklist & guide**: checklist (grade letters, missable/watch/unconfirmed tags, counters, source counts) | open guide | Next up + sources.
- **Guide panel**: official description quoted and labelled, a red "Missable? Possibly" or amber "Watch" box with the point of no return, where/how, roadmap stage, confidence (2+ sources, single source, unconfirmed), a −/+ collectible counter, numbered steps each with their own citations, a "Sources differ — both versions shown" box, and the write-up.
- **Platinum roadmap**: 10 stages in play order (Chapters 1–4, story and finale, strands, collectibles, activities, free-roam cleanup, 100%), each with a cited summary, a progress bar and its trophies, with missables flagged inline.
- **Missables view**: every possibly-missable and time-sensitive trophy with its exact point of no return and cited reason.
- **Spoiler mode** (on by default): hidden trophies keep their names and descriptions masked until earned, with a per-trophy Reveal button.
- **Filters**: Story, Missable, Collectibles, Activities, Strands, Crime and Online (0 on this list), plus grade, earned status and full-text search.
- **Progress & export**: earned by grade, by kind and by roadmap stage, points toward platinum, still-at-risk list, JSON export and import with a preview of the file.
- Saved in `localStorage`. No libraries, no fonts or images fetched, no `eval`.

## Run it

```sh
node serve.ts
# then open http://localhost:8080

MAKEFUN_OUTPUT_DIR=out node main.ts   # writes the hand-in (app/, screenshots/, dossier.json) to ./out
```

`main.ts` refuses to hand in data that breaks the guide's rules: anything other than 55 trophies, a blank guide, fewer than two dated sources, or a step citing a source its trophy does not list.

## Code map

| File | Job |
| --- | --- |
| `app/js/app.js` | `initTrophyApp`: state, tabs, filters, wiring |
| `app/js/audit-strip.js` | `computeGuideAudit`, `renderAuditStrip` |
| `app/js/checklist-view.js` | `renderTrophyChecklist` grouped by roadmap stage |
| `app/js/trophy-guide-panel.js` | `renderTrophyGuide`, `renderSourcesDiffer`, `renderCollectibleCounter` |
| `app/js/sources-panel.js` | `renderSourcesColumn`, `countGuidesCitingEachSource` |
| `app/js/next-up.js` | `buildNextUpList`, `renderNextUpPanel` |
| `app/js/platinum-roadmap.js` | `buildPlatinumRoadmap`, `renderPlatinumRoadmap` |
| `app/js/missables-view.js` | `renderMissablesView`, `renderSpoilerStoryList` |
| `app/js/spoiler-mode.js` | `applySpoilerMode`, `isTrophyMasked` |
| `app/js/progress-store.js` | `loadProgress`, `exportProgress`, `importProgress` |
| `app/js/progress-stats.js` | `renderProgressHeader`, `renderProgressStats` |

## Sources & credits

Guides were researched on 2026-11-20 and written in our own words; no guide text is copied. The trophy names, descriptions and grades are PlayStation's.

- [PowerPyx: GTA 6 Trophy Guide & Roadmap](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/)
- [KeenGamer: GTA 6 Trophy Guide & Platinum Roadmap](https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/)
- [Output Lag: GTA 6 Trophy List](https://outputlag.com/guides/gta-6-trophy-list/)
- [Timesaver.gg: GTA 6 Trophy List](https://timesaver.gg/blog/gta-6-trophy-list)
- [eGamers: GTA 6 Trophy List, Plus The Hardest Ones](https://egamers.io/gta-6-trophy-list-all-55-trophies-and-achievements-plus-the-hardest-ones/)
- [Game-Checklists: All Missables in GTA 6](https://game-checklists.com/gta6/guides/missables/)
- [Beebom: All GTA 6 Meditation Spots](https://beebom.com/gta-6-meditation-spots-locations/)
- [GMTreks: GTA 6 Trophy Guide](https://gmtreks.com/gta6/page/01M7Q14ZF65PPK5FFXSY3CJNKQ)
- Official list via [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi) (their pages refused our automated fetch; the app labels them "official list only").

Not affiliated with Rockstar Games or Sony Interactive Entertainment. The app uses no Rockstar logos, artwork or game screenshots; its look is its own.

Built by an AI agent (Claude Code) for the make.fun bounty [Build the best GTA 6 trophy guide](https://make.fun/bounty/gta6-trophy-guide-01).

License: MIT (see [LICENSE](LICENSE)).

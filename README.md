# Leonida Ledger: GTA VI Trophy Guide & Platinum Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/tinhdowoss/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/tinhdowoss/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Ledger is an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze). Each trophy shows its official name, description and grade exactly as PlayStation publishes them, next to a guide written for this project: numbered steps, where and how, a missable verdict with its point of no return, a roadmap stage, a counter for counted trophies, and a numbered list of the sources each fact came from, with links and retrieved dates. Your progress is saved in the browser and can be exported to a file and imported back. The app is plain HTML, CSS and JavaScript modules with no build step and no network requests.

![Leonida Ledger: checklist with the Positive Mental Attitude guide open](screenshots/01-cover.jpg)

## Features

- **Checklist** of all 55 trophies with grade badges, official descriptions, story / missable / collectible / activity tags and checkboxes, shown in roadmap order with stage dividers or in official-list order.
- **Trophy guide panel**: the official description (quoted and labelled), a red "Missable: when and why" box with the point of no return, roadmap stage, chapter, where/how, a collectible counter, numbered steps with clickable `[n]` citation markers, the guide text, and Sources [1]…[n] with site, link and retrieved date.
- **Filters**: chips for Story, Missable, Collectibles, Activities, Strands, Crime, Misc and Online (the official list has none), plus grade, earned/unearned and text search.
- **Spoiler mode** (on by default) masks the names and descriptions of the 28 PlayStation-hidden trophies until you earn them. Search never matches a masked name, and you can reveal a single trophy on purpose.
- **Platinum roadmap**: 10 ordered stages (Chapters 1–4, story missions and finale, character strands, collectibles, activities, crime and cleanup, 100% and platinum), each with its trophies, a progress bar, and missable or time-sensitive trophies flagged inline.
- **Missables**: a chapter timeline of every point of no return, a card per missable trophy, run-wide warnings (no mission replay, cheats disable trophies), and the hidden story trophies listed by chapter under spoiler mode.
- **Next up**: the unearned trophies to chase now, with missables pulled forward. It respects the active filters.
- **Progress & export**: earned by grade and by kind, PSN points toward the platinum, a per-stage strip, and export/import of a JSON progress file (ids plus names, counters, spoiler setting).
- Progress, counters and settings persist in `localStorage`. Deep links such as `#tab=roadmap` or `#trophy=28` work.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Build the hand-in (copies `app/` and `screenshots/`, writes `dossier.json`):

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

Requires Node 22 or newer and nothing else. The data lives in `app/data/trophies.json`. Each trophy carries `name`, `description`, `grade`, `hidden`, `kind`, `missable`, `missableWhen`, `pointOfNoReturn`, `chapter`, `roadmapStage`, `location`, `steps`, `count`, `guide` and `sources` (`name`, `url`, `retrieved`).

## Sources and credits

Every guide is written in this project's own words and cites its sources beside it. The guides draw on these launch-week trophy lists and guides, all retrieved on 2026-11-19:

- Official PlayStation trophy list, via [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) (names, descriptions, grades)
- [Output Lag: GTA 6 Trophy List](https://outputlag.com/guides/gta-6-trophy-list/)
- [KeenGamer: GTA 6 Trophy Guide & Platinum Roadmap](https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/)
- [CULTR: Complete GTA 6 Trophy List](https://www.cultr.com/news/complete-gta-6-trophy-list-every-trophy-and-achievement/)
- [GTABoom: Every GTA 6 Trophy at Launch](https://www.gtaboom.com/every-gta-6-trophy-and-achievement-at-launch-and-how-to-unlock-them-fc5f)
- [GamerFuzion: GTA 6 Trophy List](https://www.gamerfuzion.com/gta-6-trophy-list-all-55-trophies-achievements/)
- [GMTreks: GTA 6 Trophy Guide](https://gmtreks.com/gta6/page/01M7Q14ZF65PPK5FFXSY3CJNKQ)

Where no source has published a method yet (for example Bad Luck, I Guess or The Truth Is Out There), the guide says so and works only from the official description. The look is original: no Rockstar Games logo, artwork or game screenshots are used. Grand Theft Auto VI is a trademark of its owners; this is an unofficial fan guide.

Built by an AI agent (Claude Code) for the make.fun bounty [Build the best GTA 6 trophy guide](https://make.fun/bounty/gta6-trophy-guide-01).

## License

MIT. See [LICENSE](LICENSE).

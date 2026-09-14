# Validation and release limits

Build reviewed on 15 September 2026.

## Verified

- 46 automated tests pass: equipment uniqueness and slots, fusion gates, ascension exception, exclusions and mode rules, conditional effects, conservative screenshot parsing, backup validation, duplicate handling and IndexedDB round trips.
- TypeScript and production Vite build pass.
- Browser UI: manual card entry persists across reload, deletion works, demo produces three fighters and assigned gear, and phone-width layout has no horizontal overflow at 390 pixels.
- Actual browser Tesseract processing of a synthetic card image correctly recognised MK11 Scorpion, level 50 and fusion V; output remained a review draft and did not overwrite the collection. This fixture is not a real game screenshot.
- Offline service worker and locally served OCR assets are included. The in-app browser and automated Chrome tab showed a blank page when reloaded with the preview server stopped; offline reload has not passed acceptance. Registration now also handles an already-loaded document, but real Safari offline testing is still required.

## Real screenshot checks

36 game screenshots were supplied. Local OCR experiments used fighter, gear, Kameo and owned/locked transition grids. The browser upload flow was tested with three real images and produced review drafts without changing the saved collection. All 18 levels in the first fighter grid were read correctly; two fighter names remained unreadable in that browser run. A reviewed MK11 Scorpion was saved and persisted across reload.

The initial mixed-batch browser test misclassified the Kameo screen. The corrected Kameo-tab path was retested: all 18 drafts were Kameos, with 14 readable levels and four left blank. This is a limited acceptance sample, not an accuracy claim across all 36 screenshots. Mixed automatic Kameo detection has not yet been retested after its correction.

Grid fusion and ascension deliberately remain blank for user confirmation because valid-looking Roman OCR values were sometimes wrong. Locked cards are not automatically distinguished from unreadable cards; ownership must be checked in review. Partially visible edge cards and unsupported layouts may be missed. Krypt team-selection layouts have not passed acceptance. The name dictionary is larger than the verified combat catalog; identifying a name does not make its mechanics supported.

## Remaining limits

 Actual iPhone hardware, storage eviction and Home Screen behavior are untested. Standalone Playwright launch was blocked by the host sandbox; browser UI checks used the available browser automation instead.

Catalog coverage is deliberately limited. Sources include official rules and patch corrections plus selected card references linked in the catalog. Qualitative scoring weights are implementation choices, not measured damage or clear-time data. The search shortlists teams before evaluating equipment and can miss better combinations. It does not claim mathematical optimality.

Stage II exceptions are implemented for verified eligible entries. Remaining mode fusion/account gates and seasonal conditions need checking in game. Kameo support uses entered effects and progression, not a verified complete Kameo catalog. Talents provide conditional advice, not a complete allocation optimizer. No enemy-specific battle analysis is included.

## Research precedence

Official patch corrections take precedence over older mode guides. In particular, update 6.1 changed Krypt to one floor; update 7.3 documents Stage II Gold eligibility and fourth slots. Realm Klash tower defense uses a seasonal draft and is outside this owned-collection app. Source links and a rules version are retained in src/game.ts and displayed in Field notes.

Before relying on recommendations across a real collection, compare the supported catalog against the owned roster, verify missing cards and upgrades, and record real runs in each selected mode. Automated legality checks alone cannot establish faster clears.

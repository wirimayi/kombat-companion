# Simplified upload and team flow — 2026-09-15

## Changes
- Replaced the sidebar, draft editors and lengthy builder with a single upload → destination → team screen.
- Automatically saves confidently recognized identities with readable level/power ownership evidence, including names outside strategy coverage.
- Separately persists nullable scanned upgrades; conservative estimates exist only in the scoring projection.
- Deduplicates repeated screenshots; preserves previously entered fusion when the new scan cannot read it.
- Gear power crop excludes the equipment icon. Locked-card sample no longer turns icon shapes into ownership numbers.
- Compact results show three fighters and assigned equipment. Explanations, limits, saved cards and backups are collapsed.
- Legacy collections and version-1 backups remain usable. Version-2 backup includes the nullable scanned collection.

## Verification
- 53 tests pass, including seven new tests for automatic acceptance, locked/unreadable exclusion, duplicate merging, nullable persistence, conservative gear effects, complete unique-gear team generation and invalid backup values.
- Production build passes.
- Browser upload of IMG_6393, IMG_6403 and IMG_6420 accepted fighter, gear and Kameo types in one batch. No manual identity or Save action was required before generating a team.
- Initial test exposed gear-icon contamination. Narrowed power crop read all 18 gear power values correctly in the native-resolution diagnostic for IMG_6403. In IMG_6418, owned gear yielded values while 14 locked tiles yielded blank power.
- Browser then processed the remaining supplied gallery screenshots: final saved collection contains 153 fighters, 189 gear and 58 Kameos. This is an observed import count, not a measured recall/precision score.
- Collection survived browser reload; the UI exported a valid version-2 JSON with 400 scanned cards.
- With that collection, the Krypt result assigned three fighters and 12 unique pieces of equipment, plus a Kameo, without filling any fusion fields.

## Remaining limitations
- 74 of the 400 imported identities have strategy profiles. Remaining recognized identities are retained but excluded from ranking.
- Fusion/ascension badges are not reliably read. Unknown values stay null; lower-level fighter scoring is conservative. Missing fusion can substantially alter recommendations.
- Some names/levels and clipped columns are missed. All 400 individual identities and values have not been independently audited.
- On-quest text detection is best effort; availability can be corrected under saved cards.
- The five Krypt team-selection screenshots use a different layout and were not included in this gallery import.
- Exact bosses, modifiers, seasonal bonuses, fastest-clear claims and offline reopening are not verified.
- User screenshots and personal collection export remain local and are excluded from publication and distributable ZIPs.

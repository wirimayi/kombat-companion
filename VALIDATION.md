# Recommendation rebuild and release limits

Build reviewed on 15 September 2026.

## Verified

- 55 automated tests pass. New cases prove that a higher-level distraction cannot displace the reviewed MK11 core, the opening order is correct, gear is never reused, missing slots are not padded, and the Soaked plan is gated to manual Tower bosses.
- TypeScript and the production Vite build pass.
- The build contains the complete offline OCR assets and regenerated service worker.

## Recommendation changes

- Progression-first guesses are replaced by four reviewed strategy plans: MK11 pressure and rescue, Klassic Soak bosses, Kombat Cup control, and Strike Force rescue.
- Each plan fixes the starting order, fighter jobs, gear shortlist, and combat rotation. Missing planned gear leaves a visible open slot instead of being replaced by unrelated equipment.
- Tower recommendations distinguish regular floors from boss floors. The Soaked/Lightning plan is offered only for manual boss play; the Fire-pressure plan is limited to regular floors.
- Kameos are omitted from reviewed plans until their assist effects are known.
- Gallery OCR reads the Roman fusion badge and stores null when it cannot read it confidently.

## Remaining limits

The four reviewed plans cover the strongest verified cores in the current supported catalog. Other rosters still use the clearly labelled limited-catalog estimate.

Exact enemy modifiers, immunities, brutality requirements, and current event-tower bonuses are not inferred from a gallery screenshot. The user must select regular or boss and check the visible floor modifier. OCR can still miss clipped cards or an unclear fusion badge; unread values remain unconfirmed.

## Research precedence

Official patch corrections take precedence over older mode guides. In particular, update 6.1 changed Krypt to one floor; update 7.3 documents Stage II Gold eligibility and fourth slots. Realm Klash tower defense uses a seasonal draft and is outside this owned-collection app. Source links and a rules version are retained in src/game.ts and displayed in Field notes.

Personal screenshots and collection backups remain local and are excluded from the published site.

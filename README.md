# Kombat Companion

A free, local-first Mortal Kombat Mobile collection and team planner for phone browsers. Supports Towers, Krypt and Realm Klash offensive modes. No account connection, backend or paid API.

## Run locally

Requires Node.js 22 and npm.

```sh
npm ci
npm run setup:ocr
npm test
npm run build
npm run preview
```

Open the URL printed by Vite. Use the production preview to test offline features; development mode does not install the service worker. OCR assets are copied from installed packages, served by your own app, and processed on your device.

## Publish free on GitHub Pages

Create a public repository and upload the source, including `.github/workflows/pages.yml`. Do not upload `node_modules`, `work`, `outputs`, or any collection exports/screenshots. In repository Settings → Pages, choose GitHub Actions. Push to `main` or run the Publish companion workflow. The deploy job provides your public URL. Relative asset paths support repository subdirectories.

On iPhone, open the published HTTPS URL in Safari, then Share → Add to Home Screen. Open once online so the app shell is cached. Under Field notes, download recognition for offline use. Browser storage may be removed by the device: export regular backups. Safari and the installed Home Screen app may have separate storage; import a backup in the one you use.

## Collection and recommendations

Enter exact variants, levels, fusion and ascension; add gear and its fusion. Screenshots create editable drafts, never saved automatically. Confirm unreadable fields manually. Duplicate cards need an explicit update. Export/import previews support reviewed merging. Unavailable fighters are excluded. Demo mode never replaces your collection.

The versioned rules engine compares qualitative offensive and survival traits, team synergies and legal gear assignments. It is a bounded heuristic search, not a combat simulation or proof of the fastest possible team. It differentiates manual/auto play, named tower equipment bonuses and sustain-heavy modes. Kameo effects can be entered manually; talent advice is conditional rather than a complete talent preset.

The starter catalog contains 46 fighters and 33 equipment cards, not the full game. Unsupported identities are retained but excluded from scoring, with visible coverage warnings. Optional special/passive information improves context but does not reproduce exact combat statistics. Exact seasonal eligibility, all card values and actual speed rankings remain incomplete. See VALIDATION.md.

## Source layout

- `src/game.ts`: catalog, provenance, eligibility, equipment and recommendation engine.
- `src/storage.ts`: IndexedDB and strict versioned backup validation.
- `src/ocr.ts`: local Tesseract processing and conservative draft parser.
- `src/App.tsx`, `src/styles.css`: responsive collection and recommendation interface.
- `scripts/setup-ocr.mjs`, `scripts/service-worker.mjs`: self-hosted OCR and offline build.

Unofficial fan companion, unaffiliated with Warner Bros. or NetherRealm. Game names identify collection cards. No game artwork is bundled.

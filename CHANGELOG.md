## 3.0.0 — 2026-08-22

### Fixed (breaking)
- **`spa()` no longer reads the host machine's timezone.** It read the caller's `Date` with `getFullYear()`/`getHours()` and friends, which are the *host's* local components. That is coherent only while `options.timezone` happens to equal the host's own offset — which is what the default gives you, and essentially never true on a server computing for somewhere else.

  This file's own documented example, `spa(new Date('2025-06-21T12:00:00Z'), 40.7128, -74.006, { timezone: -4 })`, returned a solar zenith of **63.5 degrees in New York, 21.1 in UTC and 95.4 in Tokyo**. The last of those puts the sun below the horizon. Same inputs, three different answers, decided by where the process happened to run.

  A `Date` is an instant. `spa()` now treats it as one and derives the observer's wall-clock components from it using `options.timezone`, which is the pairing the reference C implementation expects. The answer is now the same on every host.

### Breaking change and how to migrate
If you were passing a `Date` built from **local** parts and relying on those parts being read as the observer's wall clock — `spa(new Date(2025, 5, 21, 12), lat, lng, { timezone: 0 })` to mean "noon in London" — that no longer works, and only ever worked when the process ran in the observer's zone.

State the instant instead:

```js
// before (worked only on a UTC machine)
spa(new Date(2025, 5, 21, 12), 51.5074, -0.1278, { timezone: 0 });

// after — say which moment you mean
spa(new Date('2025-06-21T12:00:00Z'), 51.5074, -0.1278, { timezone: 0 });

// or compute it from the observer's wall clock and offset
const at = new Date(Date.UTC(2025, 5, 21, 12) - tzHours * 3_600_000);
spa(at, lat, lng, { timezone: tzHours });
```

Callers who never passed `options.timezone`, and so were using the host offset by default, are unaffected: the new arithmetic is identical to the old local read in that case.

### Tests
The suite's 23 date literals were converted to explicit instants via an `atOffset` helper. Every original physics assertion — zenith 132.82, azimuth 339.38, sunrise 6.665 and the rest — passes unchanged, which is the evidence that the conversion preserved intent rather than moving the goalposts. The suite now passes identically under UTC, Asia/Tokyo, Pacific/Kiritimati, Etc/GMT+12 and Pacific/Auckland; previously it only passed on a host west of UTC.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.2] - 2026-05-30

### Changed
- Added `"type": "module"` to package.json per ADR-015 TypeScript source standard. The WASM compatibility issue from 2.0.1 is resolved: tsup now produces proper dual CJS/ESM dist files that Node resolves correctly via the exports map, so the package-level `type` field no longer conflicts with WASM module loading.
- Added `"./package.json"` exports entry for bundler compatibility.
- Added `"postbuild"` script to copy `dist/index.d.ts` to `dist/index.d.mts`.
- Adopted shared config packages (`@acamarata/tsconfig`, `@acamarata/eslint-config`, `@acamarata/prettier-config`).

## [2.0.1] - 2026-05-28

### Fixed
- Reverted `"type": "module"` addition that broke WASM module loading. Emscripten's `createSpaModule` factory uses CJS output conventions; adding `"type": "module"` made Node.js parse `wasm/spa-module.js` as ESM, causing `createSpaModule is not a function`. The package already ships proper `.mjs` and `.cjs` dist files via the exports map, so the package-level `type` field is not needed. A full ESM-native WASM build is planned for a future major version.

## [2.0.0] - 2026-05-28

### Added
- Initial release

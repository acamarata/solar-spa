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

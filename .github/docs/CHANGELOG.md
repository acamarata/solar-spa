# Changelog

## 2.0.0

Complete rewrite. The source is now TypeScript, compiled by tsup to dual CJS/ESM with generated declarations. The WASM binary and build pipeline are all new.

### Breaking Changes

- The default export is now an async function named `spa()` with a different signature. The old `spa(date, lat, lon, elev, temp, pressure, refraction)` positional API is replaced by `spa(date, lat, lon, options)` where options is an object.
- Return field `solar_noon` is now `suntransit` (matches the NREL SPA spec naming).
- Return field `azimuth` is now the navigational azimuth (eastward from north). The astronomical convention (westward from south) is available as `azimuth_astro`.
- New return fields: `azimuth_astro`, `eot`, `error_code`.
- Non-zero SPA error codes now throw an `Error` instead of returning silently.
- Invalid inputs (non-Date, non-finite coordinates, out-of-range values) now throw `TypeError` or `RangeError` before reaching the WASM layer.
- CJS entry point moved from `./solar-spa.js` to `./dist/index.cjs`.
- Minimum Node.js version is now 20.

### Added

- TypeScript source (`src/index.ts`, `src/types.ts`) with full type safety.
- Dual CJS/ESM output via tsup: `dist/index.cjs` and `dist/index.mjs`.
- Generated TypeScript declarations for both formats: `dist/index.d.ts` (CJS) and `dist/index.d.mts` (ESM).
- Input validation with descriptive `TypeError` and `RangeError` messages.
- `spaFormatted()` function that returns sunrise, sunset, and transit as `HH:MM:SS` strings. Returns `"N/A"` during polar day or polar night.
- `formatTime()` utility for converting fractional hours to time strings. Handles negative values and 24-hour overflow.
- `init()` function for optional eager WASM initialization. Retries on failure instead of caching a rejected promise.
- SPA function code constants (`SPA_ZA`, `SPA_ZA_INC`, `SPA_ZA_RTS`, `SPA_ALL`) exported as `const` types.
- `SpaFunctionCode` union type for the function option.
- Options object with named parameters: `timezone`, `elevation`, `pressure`, `temperature`, `delta_ut1`, `delta_t`, `slope`, `azm_rotation`, `atmos_refract`, `function`.
- Automatic timezone detection from the `Date` object when `timezone` is omitted.
- Named `OFFSET` constant for WASM struct byte offsets (replaces magic numbers).
- Test suite with 68 ESM assertions and 13 CJS assertions covering multiple locations, seasons, input validation, concurrent calls, boundary coordinates, polar regions, all function codes, and `formatTime` edge cases.
- 100-scenario validation suite (`validate.mjs`) covering 20 cities worldwide, boundary conditions, polar regions, time edge cases, all function codes, atmospheric variations, and historical dates from 2000 BCE to 6000 CE. Includes throughput benchmarks.
- GitHub Actions CI workflow (Node 20/22/24 matrix with type checking).

### Fixed

- `onRuntimeInitialized` race condition that caused the module to break after the first call. The v1 wrapper re-assigned the one-shot callback on every invocation, so only the first call ever resolved.
- WASM file path resolution failures in Webpack, Vite, and Next.js. The binary is now inlined as base64 via Emscripten's `SINGLE_FILE` flag, so there is no `.wasm` file to resolve at runtime.
- `cwrap` bindings are now created once during initialization, not on every call.
- Global `Module` object pollution. The Emscripten output is now modularized (`MODULARIZE=1`) and returns a factory function instead of mutating a global.
- `formatTime()` now returns `"N/A"` for negative values and wraps correctly at 24 hours.
- `init()` clears the pending promise on failure, allowing retry on subsequent calls.

### Changed

- Source rewritten in TypeScript, compiled by tsup to CJS + ESM with source maps.
- Recompiled WASM with Emscripten using `-O3 -flto`, `SINGLE_FILE`, `MODULARIZE`, `NO_FILESYSTEM`, and fixed 1MB memory. Output is ~60KB.
- C wrapper (`spa_wrapper.c`) extended to accept all SPA input parameters and return all output fields.
- Package exports map uses `types`-first ordering per TypeScript documentation.
- `sideEffects: false` declared for tree-shaking support.

### Removed

- `solar-spa.js` (old entry point).
- `lib/solar-spa.cjs` and `lib/solar-spa.mjs` (replaced by `dist/index.cjs` and `dist/index.mjs`).
- `index.d.ts` (hand-written declarations replaced by generated output in `dist/`).
- `spa.js` and `spa.wasm` (old Emscripten output, replaced by `wasm/spa-module.js`).
- `.npmignore` (replaced by the `files` field in `package.json`).

## 1.2.5

- Updated package.json repository field for npm listing.
- Updated README.

## 1.2.4

- Reverted bug fix from 1.2.1 that introduced a regression.

## 1.2.3

- Bug fix for `onRuntimeInitialized` callback timing.

## 1.2.2

- Rebuilt WASM targeting both web and Node.js environments.
- Removed dependency on `fs` module.

## 1.2.1

- Bug fix (reverted in 1.2.4).

## 1.2.0

- Directly linked WASM file to resolve path resolution bug.

## 1.1.0

- Added TypeScript declaration file.
- Added explicit WASM file path.

## 1.0.0

- Initial release. NREL SPA compiled to WebAssembly with a JavaScript wrapper.

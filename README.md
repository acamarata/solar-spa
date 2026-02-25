# solar-spa

[![npm version](https://img.shields.io/npm/v/solar-spa.svg)](https://www.npmjs.com/package/solar-spa)
[![CI](https://github.com/acamarata/solar-spa/actions/workflows/ci.yml/badge.svg)](https://github.com/acamarata/solar-spa/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/solar-spa.svg)](https://github.com/acamarata/solar-spa/blob/main/LICENSE)

NREL Solar Position Algorithm compiled to WebAssembly. Calculates solar zenith, azimuth, incidence angle, sunrise, sunset, solar noon, and equation of time for any location and date.

The algorithm is the [NREL SPA](https://midcdmz.nrel.gov/spa/) by Ibrahim Reda and Afshin Andreas, originally written in C. This package compiles the original C source to WASM via Emscripten and provides a TypeScript/JavaScript interface on top.

## Installation

```sh
npm install solar-spa
```

## Quick Start

```js
import { spa } from 'solar-spa';

const result = await spa(
  new Date(2025, 5, 21, 12, 0, 0),   // June 21, 2025 at noon
  40.7128,                             // latitude (NYC)
  -74.0060,                            // longitude
  { timezone: -4, elevation: 10 }      // EDT (UTC-4), 10m elevation
);

console.log(result.zenith);       // ~27   (degrees from vertical)
console.log(result.azimuth);      // ~179  (degrees from north)
console.log(result.sunrise);      // ~5.4  (fractional hours)
console.log(result.sunset);       // ~20.5 (fractional hours)
```

CommonJS works too:

```js
const { spa } = require('solar-spa');
```

## API

### `spa(date, latitude, longitude, options?)`

Returns a `Promise<SpaResult>` with raw numeric values.

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `date` | `Date` | Date and time for the calculation |
| `latitude` | `number` | Observer latitude, -90 to 90 (negative = south) |
| `longitude` | `number` | Observer longitude, -180 to 180 (negative = west) |
| `options` | `object` | Optional. See below |

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `timezone` | `number` | auto | Hours from UTC. Auto-detected from the Date object if omitted |
| `elevation` | `number` | `0` | Meters above sea level |
| `pressure` | `number` | `1013.25` | Atmospheric pressure in millibars |
| `temperature` | `number` | `15` | Temperature in Celsius |
| `delta_ut1` | `number` | `0` | UT1-UTC correction in seconds |
| `delta_t` | `number` | `67` | TT-UTC difference in seconds |
| `slope` | `number` | `0` | Surface slope in degrees |
| `azm_rotation` | `number` | `0` | Surface azimuth rotation in degrees |
| `atmos_refract` | `number` | `0.5667` | Atmospheric refraction in degrees |
| `function` | `number` | `3` | SPA function code (see below) |

**Result fields:**

| Field | Unit | Description |
| --- | --- | --- |
| `zenith` | degrees | Topocentric zenith angle |
| `azimuth` | degrees | Topocentric azimuth, eastward from north |
| `azimuth_astro` | degrees | Topocentric azimuth, westward from south |
| `incidence` | degrees | Surface incidence angle |
| `sunrise` | fractional hours | Local sunrise time |
| `sunset` | fractional hours | Local sunset time |
| `suntransit` | fractional hours | Solar noon |
| `sun_transit_alt` | degrees | Sun transit altitude |
| `eot` | minutes | Equation of time |
| `error_code` | integer | 0 on success |

### `spaFormatted(date, latitude, longitude, options?)`

Same as `spa()`, but `sunrise`, `sunset`, and `suntransit` are returned as `HH:MM:SS` strings. Returns `"N/A"` for these fields during polar day or polar night.

### `formatTime(hours)`

Converts fractional hours to an `HH:MM:SS` string. Returns `"N/A"` for non-finite or negative values (polar night/day scenarios).

### `init()`

Pre-initializes the WASM module. Optional. The module initializes automatically on the first `spa()` call. Useful if you want to pay the initialization cost at application startup rather than on the first calculation.

### Function Codes

| Constant | Value | Computes |
| --- | --- | --- |
| `SPA_ZA` | `0` | Zenith and azimuth |
| `SPA_ZA_INC` | `1` | Zenith, azimuth, and incidence |
| `SPA_ZA_RTS` | `2` | Zenith, azimuth, and rise/transit/set |
| `SPA_ALL` | `3` | All output values |

## Architecture

The package has three layers:

1. **C layer** (`src/spa.c`, `src/spa_wrapper.c`): The original NREL SPA algorithm with a thin wrapper that exposes a flat function signature suitable for WASM.

2. **WASM layer** (`wasm/spa-module.js`): Compiled with Emscripten using `-sSINGLE_FILE=1`, which inlines the WASM binary as base64. No external `.wasm` file to resolve. This eliminates the bundler path-resolution issues that plague most WASM packages.

3. **TypeScript layer** (`src/index.ts`, `src/types.ts`): Written in TypeScript and compiled by tsup to both CJS and native ESM with generated declaration files. Singleton WASM initialization, cached `cwrap` bindings, input validation, and named struct offset constants.

### Build Flags

The WASM binary is compiled with:

- `-O3 -flto`: Maximum optimization with link-time optimization
- `-sSINGLE_FILE=1`: WASM inlined as base64 (no file path resolution)
- `-sMODULARIZE=1`: No global `Module` pollution
- `-sNO_FILESYSTEM=1`: No filesystem API bundled (saves ~15KB)
- `-sINITIAL_MEMORY=1048576`: 1MB fixed memory (SPA needs very little)
- `-sASSERTIONS=0`: No debug assertions in production
- `-sENVIRONMENT='node,web,worker'`: Works in Node.js, browsers, and web workers

## Compatibility

Tested in:

- Node.js 20+
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Webpack 5
- Vite
- Next.js (both Pages and App Router)
- Web Workers

The `SINGLE_FILE` approach eliminates the `.wasm` file resolution problem that breaks most WASM packages in bundlers. There is no external binary to locate at runtime.

## TypeScript

Full type definitions are generated from the TypeScript source and included with the package. Import types directly:

```ts
import { spa, SPA_ALL } from 'solar-spa';
import type { SpaResult, SpaOptions } from 'solar-spa';
```

## Documentation

See the [Wiki](https://github.com/acamarata/solar-spa/wiki) for detailed documentation: API reference, architecture, performance, bundler compatibility, validation benchmarks, and more.

## Related

- [nrel-spa](https://github.com/acamarata/nrel-spa): Pure JavaScript port of the same algorithm. No WASM dependency, synchronous API. Better choice if you do not need WASM-level performance.
- [NREL SPA](https://midcdmz.nrel.gov/spa/): The original algorithm specification and C source.
- [pray-calc](https://github.com/acamarata/pray-calc): Islamic prayer time calculator built on nrel-spa.

## Acknowledgments

This package includes the Solar Position Algorithm (SPA) developed at the National Renewable Energy Laboratory (NREL) by Ibrahim Reda and Afshin Andreas. The C source files `spa.c` and `spa.h` are copyright Alliance for Sustainable Energy, LLC (2008-2011) and are distributed under the terms included in those files.

> Reda, I., Andreas, A. (2004). "Solar Position Algorithm for Solar Radiation Applications." *Solar Energy*, 76(5), 577-589. [doi:10.1016/j.solener.2003.12.003](https://doi.org/10.1016/j.solener.2003.12.003)

The original C source and an online calculator are available at [midcdmz.nrel.gov/spa](https://midcdmz.nrel.gov/spa/).

## License

MIT (wrapper, TypeScript source, and build tooling). The NREL SPA C source (`src/spa.c`, `src/spa.h`) is subject to its own terms; see the notice in those files.

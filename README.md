# solar-spa

[![npm version](https://img.shields.io/npm/v/solar-spa.svg)](https://www.npmjs.com/package/solar-spa)
[![CI](https://github.com/acamarata/solar-spa/actions/workflows/ci.yml/badge.svg)](https://github.com/acamarata/solar-spa/actions/workflows/ci.yml)
[![coverage](https://codecov.io/gh/acamarata/solar-spa/branch/main/graph/badge.svg)](https://codecov.io/gh/acamarata/solar-spa)
[![license](https://img.shields.io/npm/l/solar-spa.svg)](https://github.com/acamarata/solar-spa/blob/main/LICENSE)
[![wiki](https://img.shields.io/badge/docs-wiki-blue)](https://github.com/acamarata/solar-spa/wiki)

NREL Solar Position Algorithm compiled to WebAssembly. Calculates solar zenith, azimuth, incidence angle, sunrise, sunset, solar noon, and equation of time for any location and date. The WASM binary is inlined as base64, so there is no external `.wasm` file to locate. It works in Node.js, browsers, Webpack, Vite, Next.js, and web workers without configuration.

## Installation

```sh
npm install solar-spa
```

## Quick Start

```js
import { spa } from 'solar-spa';

const result = await spa(
  new Date(2025, 5, 21, 12, 0, 0), // June 21, 2025 at noon
  40.7128,                           // latitude (NYC)
  -74.0060,                          // longitude
  { timezone: -4, elevation: 10 }    // EDT (UTC-4), 10m elevation
);

console.log(result.zenith);   // ~27   (degrees from vertical)
console.log(result.sunrise);  // ~5.4  (fractional hours)
console.log(result.sunset);   // ~20.5 (fractional hours)
```

CommonJS also works:

```js
const { spa } = require('solar-spa');
```

## TypeScript

```ts
import { spa, SPA_ALL } from 'solar-spa';
import type { SpaResult, SpaOptions } from 'solar-spa';
```

## Documentation

See the [Wiki](https://github.com/acamarata/solar-spa/wiki) for the full API reference, architecture notes, build flags, bundler compatibility, and validation benchmarks.

## Related

- [nrel-spa](https://github.com/acamarata/nrel-spa): Pure JavaScript port of the same algorithm. Synchronous, no WASM dependency.
- [pray-calc](https://github.com/acamarata/pray-calc): Islamic prayer times built on nrel-spa.

## Acknowledgments

This package includes the Solar Position Algorithm (SPA) developed at the National Renewable Energy Laboratory (NREL) by Ibrahim Reda and Afshin Andreas. The C source files `spa.c` and `spa.h` are copyright Alliance for Sustainable Energy, LLC (2008-2011).

> Reda, I., Andreas, A. (2004). "Solar Position Algorithm for Solar Radiation Applications." *Solar Energy*, 76(5), 577-589.

## Telemetry

This package supports opt-in anonymous usage telemetry — off by default.
Enable: `ACAMARATA_TELEMETRY=1`. See [TELEMETRY.md](./TELEMETRY.md) for what is sent and how to disable.

## License

MIT (wrapper, TypeScript source, and build tooling). The NREL SPA C source (`src/spa.c`, `src/spa.h`) is subject to its own terms; see the notice in those files.

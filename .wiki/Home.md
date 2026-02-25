# solar-spa

NREL Solar Position Algorithm compiled to WebAssembly. Calculates solar zenith, azimuth, incidence angle, sunrise, sunset, solar noon, and equation of time for any location and date.

The algorithm is the [NREL SPA](https://midcdmz.nrel.gov/spa/) by Ibrahim Reda and Afshin Andreas, originally written in C. This package compiles the original C source to WASM via Emscripten and provides a TypeScript/JavaScript interface on top.

## Why WASM?

The SPA involves thousands of floating-point operations per call: trigonometric series, Julian date conversions, nutation corrections, and iterative sunrise/sunset bracketing. WASM executes these at near-native speed, which matters when computing positions for thousands of locations or running tight animation loops.

For single calls, the difference is negligible. See [Performance](Performance) for benchmarks.

## Pages

- [API Reference](API-Reference): Full function signatures, option fields, and return types.
- [Architecture](Architecture): How the three layers (C, WASM, JS) fit together and why each design choice was made.
- [Performance](Performance): Benchmarks, memory footprint, and optimization notes.
- [NREL SPA Algorithm](NREL-SPA-Algorithm): Background on the algorithm itself, its accuracy, and valid date range.
- [WebAssembly in npm Packages](WebAssembly-in-npm-Packages): Practical notes on shipping WASM in npm packages, common pitfalls, and how this package avoids them.
- [Bundler Compatibility](Bundler-Compatibility): Tested environments and configuration notes for Webpack, Vite, Next.js, and web workers.
- [Validation and Benchmarks](Validation-and-Benchmarks): Accuracy validation against NREL reference values and performance benchmarks.
- [Contributing](Contributing): How to build from source, run tests, and submit changes.
- [Changelog](https://github.com/acamarata/solar-spa/blob/main/CHANGELOG.md): Version history and breaking changes.

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

## License

MIT

---

[GitHub](https://github.com/acamarata/solar-spa) · [npm](https://www.npmjs.com/package/solar-spa) · [Changelog](https://github.com/acamarata/solar-spa/blob/main/CHANGELOG.md)

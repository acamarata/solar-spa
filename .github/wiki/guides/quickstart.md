# Quick Start

Five minutes from install to solar position.

## Install

```sh
npm install solar-spa
```

## Basic usage

```js
import { spa } from 'solar-spa';

const result = await spa(
  new Date('2025-06-21T12:00:00Z'),
  40.7128,   // latitude
  -74.0060,  // longitude
);

console.log(result.zenith);    // solar zenith angle in degrees
console.log(result.azimuth);   // solar azimuth in degrees
console.log(result.sunrise);   // fractional hours, e.g. 5.42
console.log(result.sunset);    // fractional hours, e.g. 20.58
```

The module initializes the WASM binary on the first call. Subsequent calls reuse the same module instance.

## Formatted output

```js
import { spaFormatted } from 'solar-spa';

const result = await spaFormatted(
  new Date('2025-06-21T12:00:00Z'),
  40.7128,
  -74.0060,
);

console.log(result.sunrise);    // "05:25:12"
console.log(result.sunset);     // "20:34:47"
console.log(result.suntransit); // "12:59:58"
```

## Options

```js
const result = await spa(date, lat, lon, {
  elevation: 100,        // metres above sea level
  pressure: 1013.25,     // millibars (default)
  temperature: 15,       // degrees Celsius (default)
  delta_t: 67,           // difference between UT1 and TT in seconds (default)
  slope: 30,             // surface slope in degrees (for incidence angle)
  azm_rotation: 10,      // surface azimuth rotation in degrees
});
```

## Eager initialization

Call `init()` at startup to avoid the first-call latency:

```js
import { init, spa } from 'solar-spa';

await init(); // WASM loads now, not on first spa() call
```

## Next steps

- [API Reference](../API-Reference) — full function signatures and return types
- [Architecture](../Architecture) — how the C/WASM/JS layers fit together
- [Advanced Guide](advanced) — batch calculations, custom options, timezone handling

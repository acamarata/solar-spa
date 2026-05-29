# Advanced Usage

Edge cases, batch processing, and environment-specific notes.

## Timezone handling

`spa()` accepts a `timezone` option as a UTC offset in hours. If omitted, it reads from the `Date` object's built-in UTC offset.

```js
// Explicit UTC offset (recommended for server-side code)
const result = await spa(date, lat, lon, { timezone: -5 }); // EST

// Implicit — inferred from Date.getTimezoneOffset()
const result = await spa(date, lat, lon);
```

On servers, the system timezone is typically UTC. Pass an explicit `timezone` value when computing local solar events.

## Batch calculations

The WASM module is initialized once and reused across calls. Batch work is fast because there is no re-initialization overhead.

```js
import { init, spa } from 'solar-spa';

await init();

const dates = Array.from({ length: 365 }, (_, i) => {
  const d = new Date('2025-01-01T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + i);
  return d;
});

const results = await Promise.all(
  dates.map(d => spa(d, 51.5074, -0.1278)), // London
);

const maxZenith = Math.min(...results.map(r => r.zenith));
console.log(`Lowest zenith (highest sun): ${maxZenith.toFixed(2)}°`);
```

## Polar scenarios

At high latitudes, sunrise or sunset may not occur. These fields return `NaN` in that case.

```js
import { spaFormatted } from 'solar-spa';

const result = await spaFormatted(
  new Date('2025-12-21T12:00:00Z'),
  89.0, // near North Pole
  0,
);

console.log(result.sunrise); // "N/A" — polar night
console.log(result.sunset);  // "N/A"
```

Use `isFinite(result.sunrise)` on the raw numeric result to detect polar conditions.

## Incidence angle calculation

The incidence angle (angle between solar beam and a tilted surface normal) requires slope and azimuth rotation inputs.

```js
const result = await spa(date, lat, lon, {
  slope: 35,         // surface tilt in degrees (0 = horizontal)
  azm_rotation: 0,   // surface azimuth deviation from south (degrees)
  function: 3,       // SPA_ALL — compute incidence angle
});

console.log(result.incidence); // degrees from surface normal
```

## Delta-T corrections

Delta-T (ΔT) is the difference between Terrestrial Time and Universal Time. The default (67 seconds) is accurate for dates near 2025. For historical or far-future dates, provide a more accurate value.

```js
// For 1900-01-01, ΔT ≈ -2.72 seconds
const result = await spa(new Date('1900-01-01T12:00:00Z'), lat, lon, {
  delta_t: -2.72,
});
```

See the USNO delta-T tables for values outside the 2000-2050 range.

## Error handling

`spa()` throws `TypeError` for invalid inputs and `RangeError` for out-of-bounds values.

```js
try {
  await spa(new Date('invalid'), 40, -74);
} catch (e) {
  if (e instanceof TypeError) {
    console.error('Invalid date');
  }
}
```

A non-zero `error_code` in the result indicates an internal SPA calculation error, which should not occur with valid inputs.

## Related pages

- [Performance](../Performance) — benchmarks and optimization
- [Bundler Compatibility](../Bundler-Compatibility) — Webpack, Vite, Next.js notes
- [API Reference](../API-Reference) — full parameter documentation

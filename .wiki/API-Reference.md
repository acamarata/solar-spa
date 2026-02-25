# API Reference

## `spa(date, latitude, longitude, options?)`

Returns a `Promise<SpaResult>` with raw numeric values.

### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `date` | `Date` | Date and time for the calculation |
| `latitude` | `number` | Observer latitude, -90 to 90 (negative = south) |
| `longitude` | `number` | Observer longitude, -180 to 180 (negative = west) |
| `options` | `object` | Optional. See below |

### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `timezone` | `number` | auto | Hours from UTC. Auto-detected from the Date object if omitted |
| `elevation` | `number` | `0` | Meters above sea level |
| `pressure` | `number` | `1013.25` | Atmospheric pressure in millibars |
| `temperature` | `number` | `15` | Temperature in Celsius |
| `delta_ut1` | `number` | `0` | UT1-UTC correction in seconds |
| `delta_t` | `number` | `67` | TT-UTC difference in seconds |
| `slope` | `number` | `0` | Surface slope in degrees from horizontal |
| `azm_rotation` | `number` | `0` | Surface azimuth rotation in degrees from south |
| `atmos_refract` | `number` | `0.5667` | Atmospheric refraction in degrees |
| `function` | `number` | `3` | SPA function code (see below) |

### Result Fields

| Field | Type | Unit | Description |
| --- | --- | --- | --- |
| `zenith` | `number` | degrees | Topocentric zenith angle (0 = directly overhead) |
| `azimuth` | `number` | degrees | Topocentric azimuth, eastward from north (navigational convention) |
| `azimuth_astro` | `number` | degrees | Topocentric azimuth, westward from south (astronomical convention) |
| `incidence` | `number` | degrees | Surface incidence angle |
| `sunrise` | `number` | fractional hours | Local sunrise time |
| `sunset` | `number` | fractional hours | Local sunset time |
| `suntransit` | `number` | fractional hours | Solar noon (sun transit) |
| `sun_transit_alt` | `number` | degrees | Sun altitude at transit |
| `eot` | `number` | minutes | Equation of time |
| `error_code` | `number` | integer | 0 on success |

### Timezone Auto-detection

When `timezone` is omitted, the value is derived from the `Date` object's local timezone offset:

```js
timezone = -(date.getTimezoneOffset() / 60)
```

This works correctly in most cases. Provide an explicit value when computing for a location whose timezone differs from the machine's local timezone.

### Error Handling

The SPA validates all inputs against physical bounds (latitude -90 to 90, timezone -18 to 18, etc.). If validation fails, `spa()` throws an `Error` with the SPA error code in the message:

```js
try {
  await spa(new Date(), 40, -74, { timezone: 100 });
} catch (e) {
  // "SPA: calculation failed (error code 8)"
}
```

A null result pointer (WASM memory allocation failure) also throws.

## `spaFormatted(date, latitude, longitude, options?)`

Same parameters and behavior as `spa()`. Returns a result object with the same fields, but `sunrise`, `sunset`, and `suntransit` are `HH:MM:SS` strings instead of fractional hours. During polar day or polar night, these strings are `"N/A"`:

```js
const result = await spaFormatted(
  new Date(2025, 5, 21, 12, 0, 0),
  40.7128, -74.006,
  { timezone: -4 }
);

console.log(result.sunrise);    // "05:25:12"
console.log(result.sunset);     // "20:30:42"
console.log(result.suntransit); // "12:57:54"
console.log(result.zenith);     // 27.08 (still a number)
```

## `formatTime(hours)`

Converts fractional hours to an `HH:MM:SS` string. Returns `"N/A"` for non-finite or negative values, which occur during polar day or polar night when sunrise or sunset does not happen. Values at or above 24 hours wrap to the next day (e.g., 24.5 becomes `"00:30:00"`).

```js
formatTime(6.5);       // "06:30:00"
formatTime(12);        // "12:00:00"
formatTime(Infinity);  // "N/A"
```

## `init()`

Pre-initializes the WASM module. Returns a `Promise<void>` that resolves when the module is ready.

This is optional. The module initializes automatically on the first `spa()` call. Use `init()` if you want to pay the initialization cost at application startup rather than on the first calculation.

```js
import { init, spa } from 'solar-spa';

// Somewhere during app bootstrap
await init();

// Later, this call has no initialization overhead
const result = await spa(new Date(), 40, -74);
```

Calling `init()` multiple times is safe. The second and subsequent calls return immediately.

## Function Codes

The `function` option controls which outputs the SPA computes. Lower codes skip the rise/transit/set and incidence calculations, which are the most expensive part.

| Constant | Value | Computes |
| --- | --- | --- |
| `SPA_ZA` | `0` | Zenith and azimuth only |
| `SPA_ZA_INC` | `1` | Zenith, azimuth, and incidence angle |
| `SPA_ZA_RTS` | `2` | Zenith, azimuth, and rise/transit/set times |
| `SPA_ALL` | `3` | All output values (default) |

```js
import { spa, SPA_ZA } from 'solar-spa';

// When you only need zenith and azimuth (fastest)
const result = await spa(new Date(), 40, -74, { function: SPA_ZA });
console.log(result.zenith, result.azimuth);
```

When using `SPA_ZA` or `SPA_ZA_INC`, the rise/transit/set fields will contain zeros.

## TypeScript

Full type definitions are included. Import types directly:

```ts
import { spa, SPA_ALL } from 'solar-spa';
import type { SpaResult, SpaOptions } from 'solar-spa';

const options: SpaOptions = {
  timezone: -4,
  elevation: 10,
  function: SPA_ALL,
};

const result: SpaResult = await spa(new Date(), 40.7128, -74.006, options);
```

---

[Home](Home) · [Architecture](Architecture) · [NREL SPA Algorithm](NREL-SPA-Algorithm) · [Changelog](https://github.com/acamarata/solar-spa/blob/main/CHANGELOG.md)

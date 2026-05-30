[**solar-spa v2.0.1**](../README.md)

***

[solar-spa](../README.md) / spa

# Function: spa()

> **spa**(`date`, `latitude`, `longitude`, `options?`): `Promise`\<[`SpaResult`](../interfaces/SpaResult.md)\>

Defined in: [index.ts:204](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/index.ts#L204)

Purpose: Compute solar position using the NREL SPA algorithm via WASM.
Inputs: date, latitude (-90..90), longitude (-180..180), optional SpaOptions
Outputs: Promise<SpaResult> with zenith, azimuth, incidence, sunrise/sunset/transit, eot
Constraints: WASM module is a singleton; first call incurs ~3-5 ms init cost.
  Pass explicit timezone for server-side code (system may be UTC, not local).
  Input validation runs before WASM call; invalid inputs throw before allocating.
SPORT: packages.md → solar-spa row

## Parameters

### date

`Date`

Date and time for the calculation

### latitude

`number`

Observer latitude in degrees (-90 to 90)

### longitude

`number`

Observer longitude in degrees (-180 to 180)

### options?

[`SpaOptions`](../interfaces/SpaOptions.md)

Optional observer and algorithm parameters (timezone, elevation, etc.)

## Returns

`Promise`\<[`SpaResult`](../interfaces/SpaResult.md)\>

Solar position result with all computed values

## Throws

If date is not a valid Date, or if latitude/longitude/option fields are not numbers

## Throws

If latitude/longitude are out of bounds, or if option fields are Infinity/NaN

## Throws

If WASM memory allocation fails or SPA returns a non-zero error code

## Example

```ts
import { spa } from 'solar-spa';
const result = await spa(new Date('2025-06-21T12:00:00Z'), 40.7128, -74.006, { timezone: -4 });
console.log(result.zenith);   // ~27 degrees
console.log(result.sunrise);  // ~5.4 fractional hours
```

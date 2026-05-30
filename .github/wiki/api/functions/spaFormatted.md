[**solar-spa v2.0.1**](../README.md)

***

[solar-spa](../README.md) / spaFormatted

# Function: spaFormatted()

> **spaFormatted**(`date`, `latitude`, `longitude`, `options?`): `Promise`\<[`SpaFormattedResult`](../interfaces/SpaFormattedResult.md)\>

Defined in: [index.ts:290](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/index.ts#L290)

Purpose: Compute solar position with time fields formatted as HH:MM:SS strings.
Inputs: same as spa(): date, latitude, longitude, options
Outputs: Promise<SpaFormattedResult>; sunrise/sunset/suntransit are strings, all other fields numbers
Constraints: Delegates to spa() internally; throws under the same conditions.
  "N/A" is returned for sunrise/sunset/suntransit during polar day or polar night.
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

Optional observer and algorithm parameters

## Returns

`Promise`\<[`SpaFormattedResult`](../interfaces/SpaFormattedResult.md)\>

Solar position result with sunrise, sunset, suntransit as HH:MM:SS strings

## Throws

If date is not a valid Date, or if latitude/longitude/option fields are not numbers

## Throws

If latitude/longitude are out of bounds, or if option fields are Infinity/NaN

## Throws

If WASM memory allocation fails or SPA returns a non-zero error code

## Example

```ts
import { spaFormatted } from 'solar-spa';
const result = await spaFormatted(new Date('2025-06-21T12:00:00Z'), 40.7128, -74.006, { timezone: -4 });
console.log(result.sunrise);    // "05:25:12"
console.log(result.suntransit); // "12:59:58"
console.log(result.sunset);     // "20:34:47"
```

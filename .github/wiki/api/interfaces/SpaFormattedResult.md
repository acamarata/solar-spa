[**solar-spa v2.0.1**](../README.md)

***

[solar-spa](../README.md) / SpaFormattedResult

# Interface: SpaFormattedResult

Defined in: [types.ts:65](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L65)

## Extends

- `Omit`\<[`SpaResult`](SpaResult.md), `"sunrise"` \| `"sunset"` \| `"suntransit"`\>

## Properties

### azimuth

> **azimuth**: `number`

Defined in: [types.ts:48](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L48)

Topocentric azimuth angle, eastward from north (navigational convention), in degrees.

#### Inherited from

[`SpaResult`](SpaResult.md).[`azimuth`](SpaResult.md#azimuth)

***

### azimuth\_astro

> **azimuth\_astro**: `number`

Defined in: [types.ts:46](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L46)

Topocentric azimuth angle, westward from south (astronomical convention), in degrees.

#### Inherited from

[`SpaResult`](SpaResult.md).[`azimuth_astro`](SpaResult.md#azimuth_astro)

***

### eot

> **eot**: `number`

Defined in: [types.ts:60](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L60)

Equation of time in minutes.

#### Inherited from

[`SpaResult`](SpaResult.md).[`eot`](SpaResult.md#eot)

***

### error\_code

> **error\_code**: `number`

Defined in: [types.ts:62](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L62)

SPA error code. Always 0 on a successful return (non-zero throws).

#### Inherited from

[`SpaResult`](SpaResult.md).[`error_code`](SpaResult.md#error_code)

***

### incidence

> **incidence**: `number`

Defined in: [types.ts:50](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L50)

Surface incidence angle in degrees.

#### Inherited from

[`SpaResult`](SpaResult.md).[`incidence`](SpaResult.md#incidence)

***

### sun\_transit\_alt

> **sun\_transit\_alt**: `number`

Defined in: [types.ts:58](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L58)

Sun transit altitude in degrees.

#### Inherited from

[`SpaResult`](SpaResult.md).[`sun_transit_alt`](SpaResult.md#sun_transit_alt)

***

### sunrise

> **sunrise**: `string`

Defined in: [types.ts:67](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L67)

Local sunrise time as HH:MM:SS string. "N/A" during polar day/night.

***

### sunset

> **sunset**: `string`

Defined in: [types.ts:69](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L69)

Local sunset time as HH:MM:SS string. "N/A" during polar day/night.

***

### suntransit

> **suntransit**: `string`

Defined in: [types.ts:71](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L71)

Local sun transit time as HH:MM:SS string. "N/A" during polar day/night.

***

### zenith

> **zenith**: `number`

Defined in: [types.ts:44](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L44)

Topocentric zenith angle in degrees.

#### Inherited from

[`SpaResult`](SpaResult.md).[`zenith`](SpaResult.md#zenith)

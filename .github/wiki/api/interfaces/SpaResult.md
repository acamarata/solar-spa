[**solar-spa v2.0.1**](../README.md)

***

[solar-spa](../README.md) / SpaResult

# Interface: SpaResult

Defined in: [types.ts:42](https://github.com/acamarata/solar-spa/blob/3c848806ab852464d76baf7e3fc0ca58f5e42fd9/src/types.ts#L42)

## Properties

### azimuth

> **azimuth**: `number`

Defined in: [types.ts:48](https://github.com/acamarata/solar-spa/blob/3c848806ab852464d76baf7e3fc0ca58f5e42fd9/src/types.ts#L48)

Topocentric azimuth angle, eastward from north (navigational convention), in degrees.

***

### azimuth\_astro

> **azimuth\_astro**: `number`

Defined in: [types.ts:46](https://github.com/acamarata/solar-spa/blob/3c848806ab852464d76baf7e3fc0ca58f5e42fd9/src/types.ts#L46)

Topocentric azimuth angle, westward from south (astronomical convention), in degrees.

***

### eot

> **eot**: `number`

Defined in: [types.ts:60](https://github.com/acamarata/solar-spa/blob/3c848806ab852464d76baf7e3fc0ca58f5e42fd9/src/types.ts#L60)

Equation of time in minutes.

***

### error\_code

> **error\_code**: `number`

Defined in: [types.ts:62](https://github.com/acamarata/solar-spa/blob/3c848806ab852464d76baf7e3fc0ca58f5e42fd9/src/types.ts#L62)

SPA error code. Always 0 on a successful return (non-zero throws).

***

### incidence

> **incidence**: `number`

Defined in: [types.ts:50](https://github.com/acamarata/solar-spa/blob/3c848806ab852464d76baf7e3fc0ca58f5e42fd9/src/types.ts#L50)

Surface incidence angle in degrees.

***

### sun\_transit\_alt

> **sun\_transit\_alt**: `number`

Defined in: [types.ts:58](https://github.com/acamarata/solar-spa/blob/3c848806ab852464d76baf7e3fc0ca58f5e42fd9/src/types.ts#L58)

Sun transit altitude in degrees.

***

### sunrise

> **sunrise**: `number`

Defined in: [types.ts:52](https://github.com/acamarata/solar-spa/blob/3c848806ab852464d76baf7e3fc0ca58f5e42fd9/src/types.ts#L52)

Local sunrise time as fractional hours.

***

### sunset

> **sunset**: `number`

Defined in: [types.ts:54](https://github.com/acamarata/solar-spa/blob/3c848806ab852464d76baf7e3fc0ca58f5e42fd9/src/types.ts#L54)

Local sunset time as fractional hours.

***

### suntransit

> **suntransit**: `number`

Defined in: [types.ts:56](https://github.com/acamarata/solar-spa/blob/3c848806ab852464d76baf7e3fc0ca58f5e42fd9/src/types.ts#L56)

Local sun transit time (solar noon) as fractional hours.

***

### zenith

> **zenith**: `number`

Defined in: [types.ts:44](https://github.com/acamarata/solar-spa/blob/3c848806ab852464d76baf7e3fc0ca58f5e42fd9/src/types.ts#L44)

Topocentric zenith angle in degrees.

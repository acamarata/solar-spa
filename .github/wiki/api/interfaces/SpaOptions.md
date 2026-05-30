[**solar-spa v2.0.1**](../README.md)

***

[solar-spa](../README.md) / SpaOptions

# Interface: SpaOptions

Defined in: [types.ts:16](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L16)

## Properties

### atmos\_refract?

> `optional` **atmos\_refract?**: `number`

Defined in: [types.ts:37](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L37)

Atmospheric refraction at sunrise/sunset in degrees. Default: 0.5667.

***

### azm\_rotation?

> `optional` **azm\_rotation?**: `number`

Defined in: [types.ts:35](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L35)

Surface azimuth rotation in degrees from south. Default: 0.

***

### delta\_t?

> `optional` **delta\_t?**: `number`

Defined in: [types.ts:31](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L31)

TT-UTC difference in seconds. Default: 67.

***

### delta\_ut1?

> `optional` **delta\_ut1?**: `number`

Defined in: [types.ts:29](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L29)

UT1-UTC correction in seconds. Default: 0.

***

### elevation?

> `optional` **elevation?**: `number`

Defined in: [types.ts:23](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L23)

Observer elevation in meters above sea level. Default: 0.

***

### function?

> `optional` **function?**: [`SpaFunctionCode`](../type-aliases/SpaFunctionCode.md)

Defined in: [types.ts:39](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L39)

SPA function code. Default: SPA_ALL (3).

***

### pressure?

> `optional` **pressure?**: `number`

Defined in: [types.ts:25](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L25)

Atmospheric pressure in millibars. Default: 1013.25.

***

### slope?

> `optional` **slope?**: `number`

Defined in: [types.ts:33](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L33)

Surface slope in degrees from horizontal. Default: 0.

***

### temperature?

> `optional` **temperature?**: `number`

Defined in: [types.ts:27](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L27)

Temperature in degrees Celsius. Default: 15.

***

### timezone?

> `optional` **timezone?**: `number`

Defined in: [types.ts:21](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/types.ts#L21)

Hours from UTC. If omitted, derived from the Date object's local offset.
For historical dates or DST transitions, pass an explicit value.

[**solar-spa v2.0.1**](../README.md)

***

[solar-spa](../README.md) / formatTime

# Function: formatTime()

> **formatTime**(`hours`): `string`

Defined in: [index.ts:113](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/index.ts#L113)

Purpose: Convert fractional hours to an HH:MM:SS string.
Inputs: hours, fractional hours (e.g. 6.5 for "06:30:00"); values ≥24 wrap
Outputs: "HH:MM:SS" string, or "N/A" for non-finite/negative inputs
Constraints: Non-finite and negative values occur during polar day/night;
  returning "N/A" lets callers display a sensible label without special-casing.
SPORT: packages.md → solar-spa row

## Parameters

### hours

`number`

Fractional hours (e.g. 6.5 for 06:30:00). Values >= 24 wrap.

## Returns

`string`

Formatted time string in HH:MM:SS, or "N/A" for invalid input.

## Example

```ts
formatTime(6.5)      // "06:30:00"
formatTime(12)       // "12:00:00"
formatTime(Infinity) // "N/A"
```

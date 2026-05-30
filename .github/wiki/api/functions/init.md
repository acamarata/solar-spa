[**solar-spa v2.0.1**](../README.md)

***

[solar-spa](../README.md) / init

# Function: init()

> **init**(): `Promise`\<`void`\>

Defined in: [index.ts:60](https://github.com/acamarata/solar-spa/blob/aa0161a82431adb93846e39b5278ac65de379dec/src/index.ts#L60)

Purpose: Pre-initialize the WASM module before the first spa() call.
Inputs: none
Outputs: Promise<void>; resolves when the module is ready
Constraints: Safe to call multiple times; subsequent calls return immediately.
  If init() fails, the next call retries (failed promise is discarded).
SPORT: packages.md → solar-spa row

## Returns

`Promise`\<`void`\>

Promise that resolves when the WASM module is initialized.

## Example

```ts
import { init, spa } from 'solar-spa';
await init(); // pay WASM startup cost at app boot
const result = await spa(new Date(), 40.7128, -74.0060); // no init overhead
```

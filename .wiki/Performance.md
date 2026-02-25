# Performance

## What WASM buys you

The SPA algorithm involves:

- Julian date conversion (integer and fractional components)
- Earth heliocentric longitude, latitude, and radius vector via trigonometric series (over 60 terms for longitude alone)
- Nutation in longitude and obliquity (63 terms each)
- Aberration correction
- Topocentric adjustments for observer position
- Atmospheric refraction correction
- Sunrise/sunset via iterative bisection (three full position calculations per call when computing rise/transit/set)

A single `SPA_ALL` call executes roughly 4,000 floating-point operations. WASM runs these at near-native speed because the code compiles to hardware-optimized floating-point instructions without JavaScript's JIT warm-up or type-checking overhead.

For a single call, the difference between WASM and a pure JavaScript implementation is small (both are fast enough). The gap widens with volume. Computing solar positions for 10,000 locations, or running a sun-tracking animation at 60fps, is where WASM execution speed becomes measurable.

## Initialization cost

The first `spa()` call pays a one-time initialization cost: decoding ~40KB of base64 WASM, compiling the module, and instantiating it. This takes approximately 5 to 15 milliseconds depending on the runtime and hardware.

Subsequent calls skip initialization entirely and go straight to the C function via the cached `cwrap` binding. Each call allocates an 80-byte struct, runs the computation, reads the result, and frees the struct. The per-call overhead from the JavaScript wrapper is negligible.

Use `init()` at application startup to pay the initialization cost early:

```js
import { init } from 'solar-spa';
await init();  // ~5-15ms, happens once
```

## Memory footprint

The WASM module uses 1MB of fixed memory (`INITIAL_MEMORY=1048576`). This includes:

- 64KB stack
- The compiled code segment
- Heap for `malloc`/`free` of result structs (80 bytes each, freed immediately after reading)

Memory growth is disabled (`ALLOW_MEMORY_GROWTH=0`). This means the ArrayBuffer backing WASM memory is never detached or reallocated, which avoids a class of subtle bugs in long-running applications and allows the engine to optimize memory access patterns.

1MB is conservative. SPA does not accumulate state. Each call allocates one struct, reads it, and frees it. The heap utilization at any point is a few hundred bytes at most.

## Function code optimization

Not all callers need every output. The `function` option controls how much work the SPA does:

| Code | Computation | Relative cost |
| --- | --- | --- |
| `SPA_ZA` (0) | Zenith and azimuth | ~1x |
| `SPA_ZA_INC` (1) | + incidence angle | ~1x (incidence is cheap) |
| `SPA_ZA_RTS` (2) | + rise/transit/set | ~3x (three position evaluations) |
| `SPA_ALL` (3) | All outputs | ~3x |

The sunrise/sunset calculation is the expensive part. It evaluates the full position algorithm three times (for transit, sunrise, and sunset). If you only need the current sun position, use `SPA_ZA` for a roughly 3x speed improvement.

## Build optimizations

The Emscripten build uses:

- `-O3`: Highest optimization level. Aggressive inlining, loop unrolling, vectorization.
- `-flto`: Link-time optimization. The compiler sees both `spa.c` and `spa_wrapper.c` as a single compilation unit, enabling cross-file inlining and dead code elimination.
- `-sASSERTIONS=0`: Strips all runtime assertions from the Emscripten glue code.
- `-sDISABLE_EXCEPTION_CATCHING=1`: Removes C++ exception handling support. SPA is pure C.
- `-sNO_FILESYSTEM=1`: Removes the virtual filesystem API (~15KB of JavaScript).
- `-sSTACK_SIZE=65536`: Reduces the stack from the default 5MB to 64KB. SPA is not recursive and uses minimal stack space.

These flags together produce a ~60KB output file, down from the ~150KB that a default Emscripten build would generate.

## When to use solar-spa vs nrel-spa

| Scenario | Recommended |
| --- | --- |
| Single position lookup (e.g., sunrise for today) | Either. Both are fast enough |
| Batch computation (hundreds or thousands of positions) | solar-spa (WASM) |
| Animation or real-time tracking | solar-spa (WASM) |
| Synchronous API required | [nrel-spa](https://github.com/acamarata/nrel-spa) (pure JS, sync) |
| Environments without WASM support | [nrel-spa](https://github.com/acamarata/nrel-spa) |
| Minimal dependency footprint | [nrel-spa](https://github.com/acamarata/nrel-spa) (zero deps, ~30KB) |

Both packages implement the same NREL algorithm and produce identical results within floating-point rounding tolerance.

For measured benchmark numbers, see [Validation and Benchmarks](Validation-and-Benchmarks).

---

[Home](Home) · [Architecture](Architecture) · [API Reference](API-Reference) · [Validation and Benchmarks](Validation-and-Benchmarks)

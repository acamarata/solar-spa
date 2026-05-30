# Bundle Size and Performance

## Bundle size

Measured from the published npm package (`solar-spa@2.0.1`).

| File | Raw | Gzipped | Notes |
| --- | --- | --- | --- |
| `dist/index.mjs` | 5.3 KB | ~2.1 KB | JS wrapper, ESM |
| `dist/index.cjs` | 6.0 KB | ~2.3 KB | JS wrapper, CommonJS |
| `wasm/spa-module.cjs` | 58.6 KB | ~38 KB | Emscripten output with WASM binary inlined as base64 |
| Total installed | ~65 KB | ~40 KB | JS + WASM combined |

The WASM binary is inlined as base64 in `spa-module.cjs` (SINGLE_FILE mode). No external `.wasm` file is needed at runtime. The base64 encoding adds ~33% overhead over the raw binary size; the decoded WASM is approximately 44 KB.

For comparison, [nrel-spa](https://github.com/acamarata/nrel-spa) (the pure JavaScript port) is ~8 KB gzipped with no WASM dependency.

## Call latency

Single-call timings from the validation suite (`validate.mjs`), measured on Apple M2, Node.js 22:

| Scenario | Time |
| --- | --- |
| First call (includes WASM init) | ~3-5 ms |
| Subsequent calls (module cached) | 20-250 µs |
| Fastest observed (simple zenith/azimuth) | ~20 µs |
| Typical city scenario | 50-150 µs |

The first call initializes the WASM module, which adds 3-5 ms of one-time overhead. All subsequent calls reuse the cached module instance. Call [`init()`](../api/init) at startup to move this cost out of request paths.

## WASM vs pure JS

| Scenario | solar-spa (WASM) | nrel-spa (pure JS) | Ratio |
| --- | --- | --- | --- |
| Single call | ~100 µs | ~250 µs | ~2.5x faster |
| Batch 1000 calls | ~80 ms | ~200 ms | ~2.5x faster |
| First call with init | ~3-5 ms | ~0 ms | WASM has cold start |

For single-call use cases the cold start dominates. Use `init()` at app startup when single-call latency matters.

## Accuracy

The WASM module compiles the unmodified NREL SPA C source. All 100 validation scenarios in `validate.mjs` pass against physically-derived reference values. See [Validation and Benchmarks](../Validation-and-Benchmarks) for the full scenario table.

---

[Home](../Home) · [Performance](../Performance) · [Validation and Benchmarks](../Validation-and-Benchmarks)

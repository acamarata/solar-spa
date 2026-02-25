# Architecture

solar-spa has three layers. Each solves a specific problem.

## Layer 1: C (NREL SPA)

**Files:** `src/spa.c`, `src/spa.h`, `src/spa_wrapper.c`

The core algorithm is the [NREL Solar Position Algorithm](https://midcdmz.nrel.gov/spa/) by Ibrahim Reda and Afshin Andreas. It is a direct C implementation of the algorithm described in the paper "Solar Position Algorithm for Solar Radiation Applications" (Solar Energy, Vol. 76, Issue 5, 2004, pp. 577-589). The code is unmodified from the NREL distribution.

`spa_wrapper.c` is a thin adapter. The original `spa_calculate()` function takes a pointer to a `spa_data` struct with 30+ fields. That struct layout is not accessible from JavaScript via Emscripten's `cwrap()`. The wrapper provides a flat function signature that accepts each input as a separate argument, calls `spa_calculate()`, and copies the output fields into a compact result struct allocated on the heap.

The result struct occupies 80 bytes in memory: nine `double` fields (72 bytes) followed by one `int` (4 bytes), plus 4 bytes of trailing padding for struct alignment. The caller reads the fields by offset using `getValue()` and then calls `spa_free_result()` to release the allocation.

This design avoids the complexity of passing structs across the WASM boundary. The flat signature maps directly to `cwrap()` type arrays, and reading by fixed byte offset is the fastest way to extract results from WASM memory.

## Layer 2: WASM (Emscripten output)

**Files:** `wasm/spa-module.js`

The C source is compiled with Emscripten to produce a single JavaScript file that contains the WASM binary encoded as base64. No separate `.wasm` file exists.

### Build flags

| Flag | Purpose |
| --- | --- |
| `-O3 -flto` | Maximum optimization with link-time optimization. The compiler inlines across translation units and eliminates dead code |
| `--no-entry` | No `main()` function exists. The module exposes only the exported wrapper functions |
| `-sSINGLE_FILE=1` | Inlines the WASM binary as a base64 string inside the JavaScript file. Eliminates the `.wasm` file entirely |
| `-sMODULARIZE=1` | Wraps the output in a factory function (`createSpaModule()`) instead of executing immediately. Prevents global `Module` pollution |
| `-sEXPORT_NAME=createSpaModule` | Names the factory function |
| `-sEXPORTED_FUNCTIONS` | Exposes `_spa_calculate_wrapper`, `_spa_free_result`, `_malloc`, and `_free` to JavaScript |
| `-sEXPORTED_RUNTIME_METHODS` | Makes `cwrap` and `getValue` available on the module instance |
| `-sNO_FILESYSTEM=1` | Excludes the virtual filesystem API. SPA does not read files. Saves ~15KB |
| `-sINITIAL_MEMORY=1048576` | 1MB fixed memory. SPA allocates one 80-byte struct per call, so this is more than sufficient |
| `-sALLOW_MEMORY_GROWTH=0` | Disables dynamic memory growth. Fixed memory avoids the overhead of growable ArrayBuffers and detached buffer checks |
| `-sSTACK_SIZE=65536` | 64KB stack. Default is 5MB, which is wasteful for a pure computation |
| `-sENVIRONMENT='node,web,worker'` | Includes runtime support for Node.js, browsers, and web workers |
| `-sASSERTIONS=0` | Removes debug assertions. Smaller output, no runtime checks |
| `-sDISABLE_EXCEPTION_CATCHING=1` | Disables C++ exception support. SPA is plain C, so this strips dead code |
| `-sWASM_BIGINT=0` | Disables BigInt integration for 64-bit integers. SPA uses only doubles and 32-bit ints |

The `SINGLE_FILE` flag is the critical one. Most WASM packages ship a separate `.wasm` file and resolve its path at runtime using `__dirname`, `import.meta.url`, or `URL` constructors. This breaks in bundlers (Webpack rewrites paths), edge runtimes (no filesystem), and testing environments (different module resolution). By inlining the binary, the module is self-contained. It works anywhere JavaScript runs.

The output is ~60KB. The base64-encoded WASM accounts for most of that. The JavaScript glue code is minimal because we disabled the filesystem, exception handling, and assertions.

### Why MODULARIZE?

Without `MODULARIZE`, Emscripten emits code that creates or mutates a global `Module` object. If two packages in the same application use Emscripten, they clobber each other's `Module`. With `MODULARIZE`, each call to `createSpaModule()` returns an independent instance. solar-spa creates exactly one instance (the singleton) and caches it.

## Layer 3: TypeScript wrapper

**Source:** `src/index.ts`, `src/types.ts`
**Output:** `dist/index.cjs`, `dist/index.mjs`, `dist/index.d.ts` (CJS), `dist/index.d.mts` (ESM)

The wrapper is written in TypeScript and compiled by [tsup](https://tsup.egoist.dev/) to both CJS and native ESM, with generated declaration files for each format. The source handles four concerns: initialization, input validation, calling convention, and struct reading.

### Singleton initialization

The WASM module initializes once. A module-level variable `_module` holds the cached instance. A second variable `_pending` holds the in-flight initialization promise to prevent duplicate init when multiple `spa()` calls arrive before the first init completes. If initialization fails, `_pending` is cleared so the next call retries.

```text
spa() called
  |-> init() called
        |-- _module exists? Return immediately
        |-- _pending exists? Return existing promise
        |-- Neither? Call createSpaModule(), cache promise in _pending
             |-- On resolve: cache module in _module, cache cwrap bindings, clear _pending
             |-- On reject: clear _pending, re-throw (allows retry)
```

The `cwrap()` bindings for `spa_calculate_wrapper` and `spa_free_result` are created once during initialization and stored in `_calculate` and `_free`. This avoids the overhead of re-wrapping on every call.

### Input validation

Before reaching the WASM layer, `spa()` validates that `date` is a valid `Date` object, that `latitude` and `longitude` are finite numbers within their valid ranges, and throws `TypeError` or `RangeError` with a clear message. The C layer performs its own validation and returns error codes, but the TypeScript validation provides better developer experience with descriptive error types.

### Struct offsets

The byte offsets for reading the result struct are stored in a named constant object (`OFFSET`) rather than as magic numbers. This makes the layout self-documenting and reduces the risk of an offset error when the struct is modified.

### Dual CJS/ESM

tsup compiles the TypeScript source to both CJS (`.cjs`) and native ESM (`.mjs`). The ESM build uses a `createRequire` shim (injected via tsup's banner option) to load the Emscripten WASM module, which is CJS. The CJS build uses native `require()`.

Both builds share the same WASM singleton within a single Node.js process because CJS module caching ensures the Emscripten module is loaded only once regardless of which entry point is used.

The `package.json` exports map routes `require()` to the CJS file and `import` to the ESM file, with per-format TypeScript declaration files:

```json
{
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.cjs"
      }
    }
  }
}
```

## File layout

```text
solar-spa/
|-- src/
|   |-- index.ts          # Main implementation (TypeScript)
|   |-- types.ts           # Interfaces, constants, WASM module type
|   |-- spa.c              # NREL SPA algorithm (unmodified)
|   |-- spa.h              # NREL SPA header (unmodified)
|   |-- spa_wrapper.c      # Flat wrapper for WASM boundary
|-- wasm/
|   |-- spa-module.js      # Compiled output (WASM inlined as base64)
|-- dist/                   # Generated by tsup
|   |-- index.cjs           # CommonJS output
|   |-- index.mjs           # ESM output
|   |-- index.d.ts          # CJS declarations
|   |-- index.d.mts         # ESM declarations
|-- test.mjs                # ESM test suite
|-- test-cjs.cjs            # CJS smoke test
|-- tsup.config.ts          # Build configuration
|-- tsconfig.json            # TypeScript configuration
|-- package.json
|-- CHANGELOG.md
|-- README.md
|-- LICENSE
```

Published files (the `files` field in `package.json`): `dist/`, `wasm/`, `README.md`, `CHANGELOG.md`, `LICENSE`.

Source files (`src/`, `tsup.config.ts`, `tsconfig.json`) are not published. They are in the repository for building from source but are not needed at runtime.

---

[Home](Home) · [API Reference](API-Reference) · [Performance](Performance) · [Contributing](Contributing)

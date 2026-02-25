# WebAssembly in npm Packages

Shipping WASM inside an npm package is surprisingly difficult. This page documents the common problems and how solar-spa avoids them.

## The core problem: file resolution

A typical Emscripten build produces two files: a `.js` loader and a `.wasm` binary. At runtime, the JavaScript loader must locate the `.wasm` file to fetch and compile it. Emscripten's default behavior is to construct a URL or file path relative to the JavaScript file's location.

This breaks in almost every real-world environment:

**Node.js CommonJS:** Works by default. `__dirname` resolves correctly, and `fs.readFileSync` loads the binary. This is the only environment where the default works.

**Node.js ESM:** `__dirname` is not defined in ES modules. Emscripten's loader either crashes or falls back to a relative URL that does not resolve.

**Webpack:** Rewrites `require()` calls and moves files to the output bundle. The `.wasm` file might end up at a completely different path than the JavaScript expects. Webpack 5 has a `webassembly/async` experiment, but it does not help with Emscripten-generated loaders.

**Vite:** Serves files through its dev server with transformed URLs. The `.wasm` file's path at build time does not match its URL at runtime.

**Next.js (Pages Router):** Bundles server code with Webpack. The `.wasm` file needs to be copied to the correct output directory, which varies between `next build`, `next dev`, and `next export`.

**Next.js (App Router):** The server component runtime environment has different file resolution behavior than the pages router. A `.wasm` path that works in pages may not work in app.

**Web Workers:** No access to `__dirname`. The `import.meta.url` base may differ from the main thread.

**Cloudflare Workers / Edge runtimes:** No filesystem. No Node.js built-ins. WASM must be imported as an ES module binding or provided inline.

## The SINGLE_FILE solution

Emscripten's `-sSINGLE_FILE=1` flag eliminates the problem entirely. Instead of writing a separate `.wasm` file, the compiler encodes the WASM binary as a base64 string inside the JavaScript file. At runtime, the loader decodes the string to an `ArrayBuffer` and passes it to `WebAssembly.instantiate()`.

One file. No paths to resolve. No file to fetch. It works everywhere JavaScript runs.

The tradeoff is size: base64 encoding adds ~33% overhead. A 30KB WASM binary becomes ~40KB of base64 text inside the JavaScript file. For solar-spa, the total output is ~60KB. This is acceptable for a computational library, and considerably smaller than the debugging headaches it prevents.

## Other approaches and why they fall short

### Manual `locateFile` override

Emscripten supports a `locateFile` callback that lets the consumer specify where to find the `.wasm` file:

```js
const Module = await createModule({
  locateFile: (path) => '/static/wasm/' + path
});
```

This works but pushes the problem onto every consumer. Each bundler and deployment environment needs a different `locateFile` implementation. Library authors cannot control how their package is bundled.

### Webpack `file-loader` or `asset/resource`

Webpack can be configured to copy `.wasm` files to the output directory and rewrite the URL:

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      { test: /\.wasm$/, type: 'asset/resource' }
    ]
  }
};
```

This works for Webpack but requires the consumer to modify their build configuration. It does nothing for Vite, Node.js, or non-bundled environments.

### Vite `?url` imports

Vite can import a WASM file as a URL:

```js
import wasmUrl from './spa.wasm?url';
```

This is Vite-specific syntax and does not work in any other environment.

### `import.meta.url`-based resolution

Some packages use `new URL('./spa.wasm', import.meta.url)` to resolve the WASM file relative to the JavaScript module. This works in browsers with native ES modules and in Node.js 20+ with ESM. It does not work in CommonJS, in older Node.js versions, or when bundlers transform the URL.

## MODULARIZE prevents global pollution

Without the `-sMODULARIZE=1` flag, Emscripten emits code that creates or mutates a global `Module` object. If two Emscripten-based packages exist in the same application, they overwrite each other's `Module`.

With `MODULARIZE`, the output is a factory function. Each call returns an independent instance. solar-spa calls the factory once and caches the result:

```ts
let _module: SpaWasmModule | null = null;
let _pending: Promise<void> | null = null;

export function init(): Promise<void> {
  if (_module) return Promise.resolve();
  if (_pending) return _pending;
  _pending = createSpaModule().then((mod) => {
    _module = mod;
    _pending = null;
  }).catch((err) => {
    _pending = null; // Allow retry on next call
    throw err;
  });
  return _pending;
}
```

## Other WASM packaging strategies

### wasm-pack (Rust)

The Rust ecosystem uses `wasm-pack`, which generates JavaScript bindings from Rust code. It produces `pkg/` directories with `.wasm` files and JavaScript glue. The same file resolution problems apply, though `wasm-pack` supports a `--target bundler` mode that assumes Webpack-compatible resolution.

### AssemblyScript

AssemblyScript compiles TypeScript-like code to WASM. It has its own loader that suffers from the same path resolution issues. The community recommendation is to use `fetch()` in browsers and `fs.readFileSync()` in Node.js, with the consumer responsible for the correct path.

### Inline approach (what solar-spa does)

For small to medium WASM binaries (under a few hundred KB), inlining as base64 is the most practical approach. It trades a 33% size increase for universal compatibility. The tradeoff stops making sense for large binaries (several MB), where the base64 overhead and parsing cost become significant.

## Summary

| Approach | Universal? | Consumer config? | Size overhead |
| --- | --- | --- | --- |
| Separate `.wasm` + default resolution | No | No | None |
| `locateFile` callback | Yes* | Yes (per-bundler) | None |
| Bundler-specific config | Per-bundler | Yes | None |
| `import.meta.url` | Partial | No | None |
| **SINGLE_FILE (base64 inline)** | **Yes** | **No** | **~33%** |

solar-spa uses the last approach. It works in every tested environment without any consumer configuration.

---

[Home](Home) · [Architecture](Architecture) · [Bundler Compatibility](Bundler-Compatibility)

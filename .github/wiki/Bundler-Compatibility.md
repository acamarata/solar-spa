# Bundler Compatibility

solar-spa works out of the box in every tested environment. No special configuration is required.

## How it works

The WASM binary is inlined as base64 inside `wasm/spa-module.js` (compiled with Emscripten's `SINGLE_FILE` flag). There is no external `.wasm` file to resolve, fetch, or copy. The package is just JavaScript files, and every bundler knows how to handle JavaScript. See [WebAssembly in npm Packages](WebAssembly-in-npm-Packages) for a deeper discussion of why this approach works.

## Tested environments

### Node.js (18+)

Both ES module and CommonJS imports work:

```js
// ESM
import { spa } from 'solar-spa';

// CommonJS
const { spa } = require('solar-spa');
```

The `package.json` exports map routes `import` to `dist/index.mjs` and `require()` to `dist/index.cjs`. Full TypeScript declarations are provided for both formats.

### Webpack 5

No configuration needed. Webpack resolves the package through the exports map and bundles the JavaScript files normally. The base64-encoded WASM is just a string literal inside the bundle.

```js
// webpack project
import { spa } from 'solar-spa';
const result = await spa(new Date(), 40.7128, -74.006);
```

If your Webpack config includes rules for `.wasm` files, they will not interfere because solar-spa does not import or reference any `.wasm` files.

### Vite

Works without configuration. Vite handles the CJS-to-ESM interop through its pre-bundling step (esbuild), and the inlined WASM is transparent to the build pipeline.

```js
// vite project
import { spa } from 'solar-spa';
```

### Next.js (Pages Router)

Works in both API routes (server-side) and `getServerSideProps`. The WASM initializes on the server without filesystem access issues because the binary is inlined.

```js
// pages/api/sun.js
import { spa } from 'solar-spa';

export default async function handler(req, res) {
  const result = await spa(new Date(), 40.7128, -74.006, { timezone: -4 });
  res.json(result);
}
```

### Next.js (App Router)

Works in server components, route handlers, and middleware. The same inlining approach avoids the edge runtime file resolution problems that affect packages with separate `.wasm` files.

```js
// app/api/sun/route.js
import { spa } from 'solar-spa';

export async function GET() {
  const result = await spa(new Date(), 40.7128, -74.006, { timezone: -4 });
  return Response.json(result);
}
```

### Browser (direct)

If you are not using a bundler, use a CDN that provides ESM builds:

```html
<script type="module">
  import { spa } from 'https://esm.sh/solar-spa';
  const result = await spa(new Date(), 40.7128, -74.006);
  console.log(result.zenith);
</script>
```

### Web Workers

The Emscripten output includes `worker` in its environment list. WASM initialization works inside a Web Worker without modification:

```js
// worker.js
import { spa } from 'solar-spa';

self.addEventListener('message', async (event) => {
  const { date, lat, lon } = event.data;
  const result = await spa(new Date(date), lat, lon);
  self.postMessage(result);
});
```

## Common questions

### Do I need to configure `wasm` asset handling in my bundler?

No. There is no `.wasm` file in the package. The binary is a base64 string inside a `.js` file.

### Will this work with tree-shaking?

The package exports individual named functions. Bundlers that support tree-shaking will include only the functions you import. However, the WASM module is initialized as a whole, so the binary size is fixed regardless of which functions you use.

### Is there a browser-only build?

The same build works in both Node.js and browsers. The Emscripten output detects the environment at runtime (`ENVIRONMENT='node,web,worker'`).

### What about Content Security Policy (CSP)?

The WASM binary is decoded from base64 and compiled via `WebAssembly.instantiate()`. If your CSP restricts `wasm-eval` or `wasm-unsafe-eval`, you will need to add the appropriate directive. This is a general WASM requirement, not specific to this package.

### What is the minimum browser version?

Any browser that supports WebAssembly: Chrome 57+, Firefox 52+, Safari 11+, Edge 16+. This covers all browsers released since 2017.

---

[Home](Home) · [WebAssembly in npm Packages](WebAssembly-in-npm-Packages) · [Architecture](Architecture)

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  target: 'es2020',
  platform: 'node',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs',
    };
  },
  banner({ format }) {
    if (format === 'esm') {
      return {
        js: `import { createRequire as __cr } from 'node:module';\nconst __require = __cr(import.meta.url);`,
      };
    }
    return {};
  },
  // The WASM module is Emscripten CJS output, keep it external.
  external: ['../wasm/spa-module.js'],
});

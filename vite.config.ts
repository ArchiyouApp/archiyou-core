import { resolve } from 'path';
import { defineConfig } from "vite";

import dts from "vite-plugin-dts";
import { nodePolyfills } from 'vite-plugin-node-polyfills' // For node -> browser compatibility
import { nodeResolve } from '@rollup/plugin-node-resolve' // to fix problems with crypto.getRandomValues() in chroma

import { viteStaticCopy } from 'vite-plugin-static-copy'; // see: https://www.npmjs.com/package/vite-plugin-static-copy

//import wasm from 'vite-plugin-wasm'
//import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  build: {
    minify: false, // diable minification for debug
    lib: 
    {
      entry: resolve(__dirname, 'src/internal.ts'),
      name: "archiyou-core",
      // fileName: (format) => `archiyou-core.${format}.js`,
      fileName: 'archiyou-core',
      formats: ["es"],
    },
    rollupOptions: 
    {
      external: [
          'fs', // IMPORTANT: exclude fs from bundle, so it we can actually use it in node
      ], 
      output: 
      {
        globals: {
          // Define global variables for external dependencies
        } 
      },
    }
  },
  plugins: [
        //wasm(), // Not used for now
        //topLevelAwait(), // Not used for now
        viteStaticCopy({
          targets: [
            { src: 'src/wasm/*', dest: 'wasm/' }, // wasm is in dist folder
          ]
        }),
        dts({
            insertTypesEntry: true, // Ensures "types" entry in package.json
            outDir: "dist",      // Outputs .d.ts files to dist/
        }),
        nodePolyfills({ include: ['url','path','tty','os'] }),  // Add node library polyfills to keep guillotine packer module happy
        nodeResolve({ exportConditions: ['node'], preferBuiltins: true })
    ]
});
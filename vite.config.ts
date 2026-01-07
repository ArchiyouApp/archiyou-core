import { resolve } from 'path';
import { defineConfig } from "vite";

import dts from "vite-plugin-dts";

import commonjs from '@rollup/plugin-commonjs';
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
      name: "archiyou",
      // fileName: (format) => `archiyou-core.${format}.js`,
      fileName: 'archiyou',
      formats: ["es"],
    },
    rollupOptions: 
    {
      external: [
          // don't include any of these node functions
          'fs', // IMPORTANT: exclude fs from bundle, so it we can actually use it in node
          'process', // Don't let Rollup polyfill process
          'unenv/node/process', // Fix for OpenCascade WASM module import issue
          'unenv/node/buffer',
          'unenv/node/timers',
          'unenv/node/url',
          'unenv/node/path',
          'unenv/node/util', // used by guillotine-packer
          'unenv/node/tty', // ^
          'unenv/node/os', // ^
          'unenv/polyfill/globalthis', // raf
          'unenv/node/crypto', // Script.ts
          'unenv/npm/node-fetch', // Services.ts - install this seperately in node project
          'unenv/npm/form-data', // Services.ts - install this seperately in node project
          // optional dependencies tied to specific functions
          'write-excel-file', // Externalize write-excel-file - used in Table.ts for Excel export
          'file-saver', // Externalize file-saver (write-excel-file dependency)
          'jspdf', // Externalize jsPDF - optional PDF export feature
          'jspdf-autotable', // Externalize jsPDF autotable - optional PDF table feature
          'svg2pdf.js', // Externalize svg2pdf - optional PDF SVG rendering
          'jsdom', // Externalize jsdom - Node.js DOM parser for PDF export
          'googleapis',
          'google-spreadsheet',
          // Add WASM files as external to prevent Rollup from processing them
          /\.wasm$/,
          /archiyou-opencascade\.js$/,
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
        nodeResolve({ 
          exportConditions: ['node'], 
          preferBuiltins: true,
        }),
        commonjs({
          include: [
            // needed to get old CommonJS dependencies modules working
            /node_modules\/ndarray/,
            /node_modules\/ndarray-ops/,
            /node_modules\/ndarray-pixels/,
            /node_modules\/iota-array/,
            /node_modules\/is-buffer/,
            /node_modules\/cwise-compiler/,
            /node_modules\/uniq/,
          ],
          transformMixedEsModules: true,
          defaultIsModuleExports: 'auto',
          requireReturnsDefault: 'namespace',
          esmExternals: true,
        }), // Add this to handle CommonJS modules
        viteStaticCopy({
          targets: [
            { src: 'src/wasm/*', dest: 'wasm/' }, // wasm is in dist folder
          ]
        }),
        dts({
            insertTypesEntry: true, // Ensures "types" entry in package.json
            outDir: "dist",      // Outputs .d.ts files to dist/
        }),
        nodePolyfills({ include: ['url','path','tty','os'] }),  // For node -> browser compatibility
    ]
});
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
      // fileName: (format) => `archiyou.${format}.js`,
      fileName: 'archiyou',
      formats: ["es"], // only ES for sanity
    },
    rollupOptions: 
    {
      external: [
          // don't include any of these Node functions
          'fs', 
          'process', 
          'unenv/node/process',
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
          // Install these to enable this functionality
          'write-excel-file', // Externalize write-excel-file - used in Table.ts for Excel export
          'file-saver', // Externalize file-saver (write-excel-file dependency)
          // PDF
          'jspdf', // Externalize jsPDF - optional PDF export feature
          'jspdf-autotable', // Externalize jsPDF autotable - optional PDF table feature
          'svg2pdf.js', // Externalize svg2pdf - optional PDF SVG rendering
          'jsdom', // Externalize jsdom - Node.js DOM parser for PDF export
          // Google integration
          'googleapis',
          'google-spreadsheet',
          // Add WASM files as external to prevent Rollup from processing them
          /\.wasm$/,
          /archiyou-opencascade\.js$/,
      ], 
      output: 
      {
        globals: {},
        // Don't hash WASM-related files
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.wasm')) {
            return 'wasm/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        // Preserve module structure for WASM loaders
        preserveModules: false,
        // Don't inline assets
        inlineDynamicImports: false,
      },
    },
    assetsInlineLimit: 0, // Don't inline any assets as base64
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
          // Don't transform OpenCascade files
          exclude: [
            /archiyou-opencascade/,
            /wasm/,
          ],
        }), // Add this to handle CommonJS modules
        viteStaticCopy({
          targets: [
            { 
              src: 'src/wasm/*.*', 
              dest: 'wasm/', // wasm is in dist folder
              transform: (contents) => contents, // don't do anything
            }
          ]
        }),
        dts({
            insertTypesEntry: true, // Ensures "types" entry in package.json
            outDir: "dist",      // Outputs .d.ts files to dist/
        }),
        nodePolyfills({ include: ['url','path','tty','os'] }),  // For node -> browser compatibility
    ],

    optimizeDeps: {
      exclude: [
        'archiyou-opencascade',
      ],
  },
});
import { resolve } from 'path';
import { defineConfig } from "vite";

import dts from "vite-plugin-dts";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { nodeResolve } from '@rollup/plugin-node-resolve' // to fix problems with crypto.getRandomValues() in chroma

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

      ], // Add dependencies here if needed
      output: 
      {
        globals: {} // Define global variables for external dependencies
      },
    }
  },
  plugins: [
        dts({
            insertTypesEntry: true, // Ensures "types" entry in package.json
            outDir: "dist",      // Outputs .d.ts files to dist/
        }),
        nodePolyfills({ include: ['url','fs', 'path','tty', 'os'] }),  // Add node library polyfills to keep guillotine packer module happy
        nodeResolve({ exportConditions: ['node'] })
    ]
});
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/internal.ts"],
  format: ["esm"], // Build for commonJS and ESmodules
  sourcemap: true,
  clean: true,
  bundle: true,
  noExternal: [ /(.*)/ ], // Do not externalize any dependencies: see: https://github.com/egoist/tsup/issues/619
  dts: true, // Generate declaration file (.d.ts)
  shims: true,
  minify: false, // for debug
  splitting: false,
  skipNodeModulesBundle: true,
  plugins: [

  ],
  loader: { 
    '.wasm': 'binary' 
  }
});
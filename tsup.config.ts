import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/internal.ts"],
  format: ["cjs", "esm"], // Build for commonJS and ESmodules
  dts: true, // Generate declaration file (.d.ts)
  splitting: false,
  sourcemap: true,
  clean: true,
  minifySyntax: true,
  plugins: [

  ],
  loader: { 
    '.wasm': 'binary' 
  }
});
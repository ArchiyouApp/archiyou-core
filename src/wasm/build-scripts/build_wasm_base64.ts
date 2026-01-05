/**
 *  build-wasm.ts
 *  Builds the Rust WASM module and inlines it as a Base64 string into a TypeScript file.
 *  Requirements:
 *      - Please make sure you have csgrs Rust git submodule in lib/csgrs folder. 
 * 
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(path.dirname('.')); // from root dir
const OUTPUT_TS_PATH = path.join(ROOT_DIR, 'src', 'wasm', 'archiyou-opencascade-wasm.ts');
const WASM_DIR = path.join(ROOT_DIR, './src/wasm');
const WASM_FILE_NAME = 'archiyou-opencascade.wasm';

// 1. Read the generated .wasm file
const wasmPath = path.join(WASM_DIR, WASM_FILE_NAME); // check your actual filename in temp-wasm
const wasmBuffer = fs.readFileSync(wasmPath);

// 2. Convert to Base64
const base64Wasm = wasmBuffer.toString('base64');

// 3. Generate the TypeScript file
const tsContent = `// This file is auto-generated, and used to load WASM directly from base64 string. Do not edit.
export const WASM_BASE64 = "${base64Wasm}";
`;

fs.writeFileSync(OUTPUT_TS_PATH, tsContent);

console.log(`✅ WASM inlined into ${OUTPUT_TS_PATH} (${(wasmBuffer.length / 1024).toFixed(2)} KB)`);
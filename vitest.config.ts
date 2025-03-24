/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,  // Enable global test functions like `test` and `expect`
    environment: 'node',  // Choose 'jsdom' if you're testing frontend code
    include: ['tests/**/*.test.ts'], // Specifies where to find test files
    testTimeout: 10000, // a bit longer for big geometry operations
  },
});
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,  // Disable, otherwise we get a lot of warnings during coding anyway
    environment: 'node',  // Choose 'jsdom' if you're testing frontend code
    include: ['tests/**/*.test.ts'], // Specifies where to find test files
    testTimeout: 10000, // a bit longer for big geometry operations
    coverage: {
        provider: 'v8', // Use c8 for coverage reporting
        reporter: ['text', 'lcov'], // 'text' shows in terminal, 'lcov' generates an HTML report
        include: ['src/**/*.ts'], // Include only source files for coverage
        exclude: ['tests/**', 'node_modules/**'], // Exclude test files and dependencies
      },
  },
  
});
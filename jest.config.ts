/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: ['<rootDir>/**/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
    'window' : {}
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    'archiyou-opencascade\.wasm' : '<rootDir>/libs/archiyou-opencascade/index.js'
  },
};
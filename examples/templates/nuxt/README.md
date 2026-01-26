# Nuxt Minimal Starter for Archiyou module

This is the basic nuxt3 starter template generated like described here: https://nuxt.com/docs/getting-started/installation

## Settings to be able to load wasm files from archiyou module

See nuxt.config.ts:

```ts
assetsInclude: 
    ['**/*.wasm'], // fix for able to load .wasm files
```

## Setup

Make sure to install dependencies:

```bash
# pnpm
pnpm install

# npm
npm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# pnpm
pnpm dev
# npm
npm run dev
# yarn
yarn dev
# bun
bun run dev
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

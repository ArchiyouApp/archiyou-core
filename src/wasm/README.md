# archiyou-opencascade

Archiyou's custom libcascade WASM build.

## Build

Install and start Docker, then run:

```sh
pnpm build:wasm
```

[`libcascade.config.ts`](../../libcascade.config.ts) is the build source of truth.
`pnpm detect:wasm` reports OCCT symbols used by the source; `pnpm check:wasm`
checks that those symbols are present in the curated binding list.

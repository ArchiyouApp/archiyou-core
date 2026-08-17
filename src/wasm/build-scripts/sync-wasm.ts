import { copyFile } from 'node:fs/promises';
import path from 'node:path';

const names = ['archiyou-opencascade'];
const extensions = ['.js', '.wasm', '.d.ts'];

await Promise.all(
  names.flatMap((name) =>
    extensions.map((extension) => {
      const file = `${name}${extension}`;
      return copyFile(path.join('dist', file), path.join('src', 'wasm', file));
    }),
  ),
);

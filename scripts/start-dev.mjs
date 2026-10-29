import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const pkg = require.resolve('vite/package.json');
const bin = path.join(path.dirname(pkg), 'bin', 'vite.js');
const child = spawn(process.execPath, [bin], {
  stdio: 'inherit',
  env: process.env,
});
child.on('exit', (code) => process.exit(code ?? 1));

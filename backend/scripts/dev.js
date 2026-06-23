require('./load-env');

const { spawn } = require('child_process');
const path = require('path');

const bin = require.resolve('ts-node-dev/lib/bin');
const child = spawn(
  process.execPath,
  [bin, '--respawn', '--transpile-only', 'src/server.ts'],
  {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: process.env,
  }
);

child.on('exit', (code) => process.exit(code ?? 0));

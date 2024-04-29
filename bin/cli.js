#!/usr/bin/env node

const { execSync } = require("child_process");
const { resolve } = require("path");

const [
  ,,
  command,
  ...args
] = process.argv;
const scriptsPath = resolve(__dirname, '../scripts');

if (command === 'start') {
  execSync(`npx --yes ts-node ${scriptsPath}/startup.ts ${args.join(' ')}`, { stdio: 'inherit' });
} else if (command === 'add') {
  execSync(`npx --yes ts-node ${scriptsPath}/add.ts ${args.join(' ')}`, { stdio: 'inherit' });
} else {
  console.log(`Unknown command: ${command}`);
  process.exit(1);
}

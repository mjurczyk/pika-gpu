import { pathExistsSync, readJsonSync, writeJsonSync } from 'fs-extra';
import path from 'path';
import { cwd } from 'process';
import { downloadDependency } from './utils';

console.info('pika-gpu', 'setting up environment');

const comfyPath = path.resolve(cwd(), 'comfy-ui');
const [
  , ,
  dependencyType,
  dependencyName,
  dependencyDownloadURL
] = process.argv;

const ensureComfy = async () => {
  if (!pathExistsSync(`${comfyPath}/.git`)) {
    console.info('pika-gpu', 'comfy-ui not found', 'run npm run start');

    return;
  }
};

const addToStack = async () => {
  console.info('pika-gpu', 'checking stack');

  let stackFile;
  const stackFilePath = path.resolve(cwd(), 'stack.json');

  try {
    stackFile = readJsonSync(stackFilePath);
  } catch (error) {
    console.info('pika-gpu', 'stack.json not found or corrupted');

    throw new Error('failed');
  }

  const allowedDependencyTypes = Object.keys(stackFile);

  if (!allowedDependencyTypes.includes(dependencyType)) {
    console.info('pika-gpu', 'invalid dependency type', 'use one of', allowedDependencyTypes.join(', '));

    throw new Error('failed');
  }

  if (stackFile[dependencyType][dependencyName]) {
    console.info('pika-gpu', 'dependency with this name already exists');

    return;
  }

  if (Object.keys(stackFile[dependencyType]).includes(dependencyName)) {
    console.info('pika-gpu', 'dependency with this name already exists');

    return;
  }

  if (Object.values(stackFile[dependencyType]).includes(dependencyDownloadURL)) {
    const [currentName, _] = Object.entries(stackFile[dependencyType]).find(([_, url]) => url === dependencyDownloadURL)!;

    console.info('pika-gpu', `dependency already installed as "${currentName}"`);

    return;
  }

  await downloadDependency(dependencyType, dependencyName, dependencyDownloadURL);

  console.info('pika-gpu', 'adding the dependency');

  stackFile[dependencyType][dependencyName] = dependencyDownloadURL;

  writeJsonSync(stackFilePath, stackFile, { spaces: 2 });

  console.info('pika-gpu', 'success');
};

(async () => {
  await ensureComfy();
  await addToStack();
})();
import { execSync } from 'child_process';
import { ensureDirSync, existsSync, pathExistsSync, readFileSync, readJsonSync } from 'fs-extra';
import path from 'path';
import { cwd } from 'process';
import { downloadDependency } from './utils';

console.info('pika-gpu', 'setting up environment');

const comfyPath = path.resolve(cwd(), 'comfy-ui');
const comfyLockHash = readFileSync(
  path.resolve(cwd(), './comfy.lock'),
  'utf-8'
);

let usePython3 = false;
let isFirstRun = false;

const exec = (command: string) => {
  execSync(command, { stdio: 'inherit' });
};

const ensurePython = async () => {
  let noPython = true;

  try {
    execSync('python3 --version');

    usePython3 = true;
    noPython = false;
  } catch (error) {
    console.info('pika-gpu', 'python3 not found');
  }

  try {
    execSync('python --version');

    noPython = false;
  } catch (error) {
    console.info('pika-gpu', 'python not found');
  }

  if (noPython) {
    throw new Error('failed');
  }
};

const ensureGit = async () => {
  exec('git --version');
};

const ensureComfy = async () => {
  if (pathExistsSync(comfyPath) && pathExistsSync(`${comfyPath}/.git`)) {
    console.info('pika-gpu', 'comfy-ui found');

    return;
  }

  isFirstRun = true;

  console.info('pika-gpu', 'attempting to clone https://github.com/comfyanonymous/ComfyUI');

  try {
    ensureDirSync(`${comfyPath}`);

    exec(`git clone git@github.com:comfyanonymous/ComfyUI.git ${comfyPath}`);
  } catch (error) {
    console.info('pika-gpu', 'failed to clone ComfyUI');
    console.info('pika-gpu', error);

    console.info('pika-gpu', 'make sure git is installed');
    console.info('pika-gpu', 'make sure githug is authenticated');
  }

  console.info('pika-gpu', 'comfy cloned');

  console.info('pika-gpu', 'use specific comfy.lock version');

  try {
    exec(`cd ${comfyPath} && git reset --hard ${comfyLockHash}`);
  } catch (error) {
    console.info('pika-gpu', 'failed to rollback to comfy.lock hash');

    throw new Error('failed');
  }

  console.info('pika-gpu', `now using comfy.lock ${comfyLockHash}`);

  console.info('pika-gpu', 'apply comfy manager');

  try {
    exec(`cd ${comfyPath}/custom_nodes && git clone https://github.com/ltdrdata/ComfyUI-Manager.git`);
  
    exec(`cd ${comfyPath}/custom_nodes/ComfyUI-Manager && ${usePython3 ? 'pip3' : 'pip'} install -r requirements.txt`);
  } catch (error) {
    console.info('pika-gpu', 'failed to apply comfy manager');

    throw new Error('failed');
  }
};

const ensureComfyDependencies = async () => {
  console.info('pika-gpu', 'installing comfy dependencies (if want to scope them, make sure conda is enabled)');

  try {
    exec(`pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu121`);

    exec(`cd ${comfyPath} && ${usePython3 ? 'pip3' : 'pip'} install -r requirements.txt`);
  } catch (error) {
    console.info('pika-gpu', 'failed to install comfy dependencies');
    console.info('pika-gpu', error);

    console.info('pika-gpu', 'missing python?', 'sudo apt install python3 && alias python=python3');
    console.info('pika-gpu', 'missing pip?', 'sudo apt install pip3 && alias pip=pip3');

    throw new Error('failed');
  }

  console.info('pika-gpu', 'installed');
};

const ensureStack = async () => {
  let stackFile;

  try {
    stackFile = readJsonSync(path.resolve(cwd(), 'stack.json'));
  } catch (error) {
    console.info('pika-gpu', 'stack.json not found');

    return;
  }

  console.info('pika-gpu', 'installing stack dependencies');
  console.info('pika-gpu', `found ${Object.keys(stackFile).length} dependencies`);

  try {
    for (let dependencyType of Object.keys(stackFile)) {
      for (let [dependencyName, dependencyUrl] of Object.entries(stackFile[dependencyType])) {
        await downloadDependency(dependencyType, dependencyName, dependencyUrl as string);
      }
    }
  } catch (error) {
    console.info('pika-gpu', 'failed to install stack dependencies');

    throw new Error('failed');
  }
};

const run = async () => {
  exec(`cd ${comfyPath} && ${usePython3 ? 'python3' : 'python'} main.py`);
};

const showWelcome = async () => {
  let stackFile;

  try {
    stackFile = readJsonSync(path.resolve(cwd(), 'stack.json'));
  } catch (error) {
    console.info('pika-gpu', 'stack.json not found');

    return;
  }

  console.info(`
   ______ _ _              ______ ______  _     _ 
  (_____ (_) |            / _____|_____ \| |   | |
   _____) )| |  _ ____   | /  ___ _____) ) |   | |
  |  ____/ | | / ) _  |  | | (___)  ____/| |   | |
  | |    | | |< ( ( | |  | \____/| |     | |___| |
  |_|    |_|_| \_)_||_|   \_____/|_|      \______|
  ready!

  Use the following to add new models / loras / controlnets to the stack:

  npm run add <dependencyType> <dependencyName> <dependencyDownloadURL>

  Allowed dependency types: ${Object.keys(stackFile).join(', ')}

  Use the following to start ComfyUI API:

  npm start

  Enjoy!
`);

};

(async () => {
  await ensureGit();
  await ensurePython();
  await ensureComfy();
  await ensureComfyDependencies();
  await ensureStack();

  if (!isFirstRun) {
    await run();
  } else {
    if (process.argv.includes('--quick-start')) {
      exec('npm run add checkpoints v1-5-pruned-emaonly.ckpt https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.ckpt?download=true');
    }

    await showWelcome();
  }
})();

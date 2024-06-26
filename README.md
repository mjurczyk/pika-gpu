# Ultra-light Deployment & Versioning for your AI stack

Set countless GPUs on fire in less than 10 seconds with managed SD dependencies.

![lesgo](https://github.com/mjurczyk/pika-gpu/assets/9549760/eee09fd3-b619-42c8-827f-aa09fe1ada54)

```bash
npm i -g pika-gpu
pika-gpu start
```

Or, quick start (this will automatically download 4GB SD1.5 model for default ComfyUI workflow):

```bash
npm i -g pika-gpu
pika-gpu start --quick-start
```

# Details

Add your models and their download URLs from [huggingface.co](https://huggingface.co/) to `stack.json`, or add them using:

```bash
# pika-gpu add -- [type] [name] [download-url]

pika-gpu add loras 360-Diffusion-LoRA-sd-v1-5 https://huggingface.co/ProGamerGov/360-Diffusion-LoRA-sd-v1-5/resolve/main/360Diffusion_v1.safetensors?download=true
```

Commit stack.json.

# Prerequisites & Setup

You will need the following on the machine:

```txt
- git (any)
- python (python2 or python3)
- node (v18 or newer)
```

On Windows you can download all of these using GUI and browser, on Linux / Mac consider using `brew`, `apt-get`, or your-system equivalent.

Optional: Dependency management scripts install various Python dependencies, so if you want these scoped to a virtual environment - make sure to use conda.

---

# Testing

Responsible for the backend of [env-ai.vercel.app](https://env-ai.vercel.app/).

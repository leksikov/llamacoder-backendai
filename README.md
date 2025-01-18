<a href="https://www.llamacoder.io">
  <img alt="Llama Coder" src="./public/og-image.png">
  <h1 align="center">Llama Coder</h1>
</a>

<p align="center">
  An open source Claude Artifacts – generate small apps with one prompt. Powered by Llama 3 on Together.ai or Backend.AI.
</p>

## Tech stack

- [Llama 3.1 405B](https://ai.meta.com/blog/meta-llama-3-1/) from Meta for the LLM
- [Together AI](https://dub.sh/together-ai/?utm_source=example-app&utm_medium=llamacoder&utm_campaign=llamacoder-app-signup) or [Backend.AI](https://backend.ai) for LLM inference
  - Together AI: meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo
  - Backend.AI: Llama-3.2-11B-Vision-Instruct on asia03 endpoint
- [Sandpack](https://sandpack.codesandbox.io/) for the code sandbox
- Next.js app router with Tailwind
- Helicone for observability (when using Together AI)
- Plausible for website analytics

## Cloning & running

1. Clone the repo: `git clone https://github.com/Nutlope/llamacoder`
2. Create a `.env` file and add your API keys:
   ```env
   # Choose your provider
   MODEL_PROVIDER=togetherai  # or backendai

   # If using Together AI
   TOGETHER_API_KEY=your-together-ai-key
   HELICONE_API_KEY=your-helicone-key  # optional

   # If using Backend.AI
   BACKEND_AI_ENDPOINT=https://llama-vision-11b.asia03.app.backend.ai/
   BACKEND_AI_API_KEY=your-backend-ai-key
   MODEL_NAME=Llama-3.2-11B-Vision-Instruct
   ```
3. Run `npm install` and `npm run dev` to install dependencies and run locally

## Features

- **Multi-Provider Support**: Switch between Together AI (8B model) and Backend.AI (11B model) for LLM inference
- **Streaming Chat**: Real-time streaming of LLM responses with robust error handling
- **Code Generation**: Generate and execute code in real-time using Sandpack
- **Modern UI**: Clean and responsive interface built with Next.js and Tailwind

## Contributing

For contributing to the repo, please see the [contributing guide](./CONTRIBUTING.md)

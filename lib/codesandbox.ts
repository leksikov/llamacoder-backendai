import { CodeSandbox } from "@codesandbox/sdk";

let sdk: CodeSandbox | null = null;

export function getCodeSandboxClient() {
  if (!sdk) {
    if (!process.env.CSB_API_KEY) {
      throw new Error("CodeSandbox API key not found");
    }
    sdk = new CodeSandbox(process.env.CSB_API_KEY);
  }
  return sdk;
}

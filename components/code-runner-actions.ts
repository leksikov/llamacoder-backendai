"use server";

import { getCodeSandboxClient } from "@/lib/codesandbox";

export async function runPythonCode(code: string) {
  const sdk = getCodeSandboxClient();
  const sandbox = await sdk.sandbox.create();
  const result = await sandbox.shells.python.run(code);

  sandbox.disconnect();

  return result.output;
}

export async function runJavaScriptCode(code: string) {
  const sdk = getCodeSandboxClient();
  const sandbox = await sdk.sandbox.create();
  const result = await sandbox.shells.js.run(code);

  sandbox.disconnect();

  return result.output;
}

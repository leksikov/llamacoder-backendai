import {
  runJavaScriptCode,
  runPythonCode,
} from "@/components/code-runner-actions";
import CodeRunnerServerAction from "@/components/code-runner-server-action";
import CodeRunnerReact from "./code-runner-react";

export default function CodeRunner({
  language,
  code,
}: {
  language: string;
  code: string;
}) {
  // For now, use React runner for all code to avoid server-side crypto issues
  return <CodeRunnerReact code={code} />;
}

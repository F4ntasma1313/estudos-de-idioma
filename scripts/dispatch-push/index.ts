import { dispatchReminders } from "../../src/services/push/index";

dispatchReminders().then((report) => { process.stdout.write(`${JSON.stringify(report)}\n`); })
  .catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.message : "Push dispatch failed"}\n`); process.exitCode = 1; });

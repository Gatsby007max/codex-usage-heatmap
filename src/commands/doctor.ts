import os from "node:os";

import { scanUsage } from "../core/scan.js";
import { resolveCodexHome } from "../core/paths.js";
import { safeDiagnosticPath } from "../core/privacy.js";
import { renderHumanScanSummary } from "./scan.js";
import { scanOptionsFromCommand } from "./shared.js";

export async function runDoctorCommand(options: Record<string, unknown>): Promise<void> {
  const scanOptions = scanOptionsFromCommand(options);
  const result = await scanUsage(scanOptions);
  const lines = [
    "Codex Usage Heatmap Doctor",
    `Node version: ${process.version}`,
    `Platform: ${os.platform()} ${os.arch()}`,
    `Resolved CODEX_HOME: ${safeDiagnosticPath(resolveCodexHome(), scanOptions.includePaths)}`,
    "",
    renderHumanScanSummary(result.summary, result.dailyUsage).trimEnd()
  ];

  process.stdout.write(`${lines.join("\n")}\n`);
}

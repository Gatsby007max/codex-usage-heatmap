import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CliError } from "./shared.js";

const skillRelativePath = path.join(".agents", "skills", "codex-usage-heatmap");

async function exists(inputPath: string): Promise<boolean> {
  try {
    await fs.access(inputPath);
    return true;
  } catch {
    return false;
  }
}

async function findSourceSkill(): Promise<string> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(process.cwd(), skillRelativePath),
    path.join(here, "..", skillRelativePath),
    path.join(here, "..", "..", skillRelativePath)
  ];

  for (const candidate of candidates) {
    if (await exists(path.join(candidate, "SKILL.md"))) {
      return candidate;
    }
  }

  throw new CliError("Included skill files were not found.");
}

export async function runSkillInstallCommand(options: Record<string, unknown>): Promise<void> {
  const scope = typeof options.scope === "string" ? options.scope : "repo";
  if (!["repo", "user"].includes(scope)) {
    throw new CliError("Scope must be repo or user.");
  }

  const source = await findSourceSkill();
  const destination =
    scope === "repo"
      ? path.join(process.cwd(), skillRelativePath)
      : path.join(os.homedir(), ".agents", "skills", "codex-usage-heatmap");
  const force = Boolean(options.force);

  if (path.resolve(source) === path.resolve(destination)) {
    process.stdout.write("Skill is already installed in this repository.\n");
    return;
  }

  if ((await exists(destination)) && !force) {
    process.stdout.write("Skill already exists. Pass --force to overwrite it.\n");
    return;
  }

  if (force && (await exists(destination))) {
    await fs.rm(destination, { recursive: true, force: true });
  }

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(source, destination, { recursive: true });
  process.stdout.write(`Skill installed for ${scope} scope.\n`);
}

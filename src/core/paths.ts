import os from "node:os";
import path from "node:path";

export function expandHome(inputPath: string): string {
  if (inputPath === "~") {
    return os.homedir();
  }
  if (inputPath.startsWith("~/")) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  return inputPath;
}

export function resolveCodexHome(): string {
  return process.env.CODEX_HOME ? expandHome(process.env.CODEX_HOME) : path.join(os.homedir(), ".codex");
}

export function defaultDiscoveryCandidates(): string[] {
  const codexHome = resolveCodexHome();
  const candidates = new Set<string>();

  if (process.env.CODEX_HOME) {
    candidates.add(path.join(codexHome, "history.jsonl"));
  }

  candidates.add(path.join(os.homedir(), ".codex", "history.jsonl"));
  candidates.add(path.join(os.homedir(), ".codex", "sessions", "**", "*.jsonl"));
  candidates.add(path.join(os.homedir(), ".codex", "**", "*.jsonl"));

  return [...candidates];
}

export function toAbsolutePath(inputPath: string, cwd = process.cwd()): string {
  const expanded = expandHome(inputPath);
  return path.isAbsolute(expanded) ? expanded : path.resolve(cwd, expanded);
}

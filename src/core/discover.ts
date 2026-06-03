import fs from "node:fs/promises";
import path from "node:path";

import fg from "fast-glob";

import { DEFAULT_MAX_FILE_SIZE_MB } from "../config/defaults.js";
import type { DiscoveredFile, DiscoveryResult } from "../types.js";
import { defaultDiscoveryCandidates, toAbsolutePath } from "./paths.js";
import { isJsonlPath, isSensitivePath, safeDiagnosticPath } from "./privacy.js";

export class SourceNotReadableError extends Error {
  readonly exitCode = 2;

  constructor(source: string) {
    super(`Source path is not readable: ${source}`);
    this.name = "SourceNotReadableError";
  }
}

interface DiscoverOptions {
  source?: string;
  maxFileSizeMb?: number;
  includePaths?: boolean;
  cwd?: string;
}

async function pathExists(inputPath: string): Promise<boolean> {
  try {
    await fs.access(inputPath);
    return true;
  } catch {
    return false;
  }
}

async function buildPatterns(options: DiscoverOptions): Promise<string[]> {
  const source = options.source ?? "auto";

  if (source === "auto") {
    return defaultDiscoveryCandidates();
  }

  const absoluteSource = toAbsolutePath(source, options.cwd);
  if (!(await pathExists(absoluteSource))) {
    throw new SourceNotReadableError(source);
  }

  const stat = await fs.stat(absoluteSource);
  if (stat.isDirectory()) {
    return [path.join(absoluteSource, "**", "*.jsonl")];
  }

  return [absoluteSource];
}

export async function discoverLogFiles(options: DiscoverOptions = {}): Promise<DiscoveryResult> {
  const patterns = await buildPatterns(options);
  const maxBytes = (options.maxFileSizeMb ?? DEFAULT_MAX_FILE_SIZE_MB) * 1024 * 1024;
  const warnings: string[] = [];
  const seen = new Set<string>();
  const files: DiscoveredFile[] = [];
  let skippedSensitiveFiles = 0;
  let foundJsonlFiles = 0;

  for (const pattern of patterns) {
    const matches = await fg(pattern, {
      absolute: true,
      dot: true,
      onlyFiles: true,
      unique: true,
      suppressErrors: true
    });

    const directMatches = matches.length > 0 ? matches : isJsonlPath(pattern) && (await pathExists(pattern)) ? [pattern] : [];

    for (const match of directMatches) {
      if (seen.has(match)) {
        continue;
      }
      seen.add(match);

      if (!isJsonlPath(match)) {
        continue;
      }

      foundJsonlFiles += 1;

      if (isSensitivePath(match)) {
        skippedSensitiveFiles += 1;
        warnings.push("Skipped sensitive file.");
        continue;
      }

      try {
        const stat = await fs.stat(match);
        if (!stat.isFile()) {
          continue;
        }
        if (stat.size > maxBytes) {
          warnings.push(`Skipped large JSONL file: ${safeDiagnosticPath(match, options.includePaths)}.`);
          continue;
        }
        files.push({ path: match, size: stat.size, mtime: stat.mtime });
      } catch {
        warnings.push(`Skipped unreadable JSONL file: ${safeDiagnosticPath(match, options.includePaths)}.`);
      }
    }
  }

  files.sort((a, b) => a.path.localeCompare(b.path));

  return {
    checkedPaths: patterns.length,
    files,
    foundJsonlFiles,
    skippedSensitiveFiles,
    readableFiles: files.length,
    warnings
  };
}

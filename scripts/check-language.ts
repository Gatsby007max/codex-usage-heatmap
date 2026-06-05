import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface LanguageViolation {
  file: string;
  line: number;
  column: number;
}

const japanesePattern = /[\u3040-\u30ff\u3400-\u9fff]/u;
const ignoredDirectories = new Set([
  "node_modules",
  "dist",
  "coverage",
  ".git",
  "tmp",
  ".turbo",
  ".cache"
]);
const ignoredFiles = new Set(["pnpm-lock.yaml", "package-lock.json", "yarn.lock"]);
const textExtensions = new Set([
  ".md",
  ".ts",
  ".tsx",
  ".js",
  ".cjs",
  ".mjs",
  ".json",
  ".jsonl",
  ".yml",
  ".yaml",
  ".css",
  ".html",
  ".svg",
  ".sh",
  ".swift",
  ".plist",
  ".txt"
]);

async function listFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".github" && entry.name !== ".agents") {
      if (entry.name !== ".gitignore") {
        continue;
      }
    }

    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        continue;
      }
      files.push(...(await listFiles(fullPath)));
    } else if (entry.isFile()) {
      if (ignoredFiles.has(entry.name)) {
        continue;
      }
      const ext = path.extname(entry.name);
      if (textExtensions.has(ext) || entry.name === ".gitignore" || entry.name === "LICENSE") {
        files.push(fullPath);
      }
    }
  }

  return files;
}

export async function findLanguageViolations(root: string): Promise<LanguageViolation[]> {
  const files = await listFiles(root);
  const violations: LanguageViolation[] = [];

  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    const lines = text.split(/\r?\n/);
    for (const [lineIndex, line] of lines.entries()) {
      const match = japanesePattern.exec(line);
      if (match?.index !== undefined) {
        violations.push({
          file: path.relative(root, file),
          line: lineIndex + 1,
          column: match.index + 1
        });
      }
    }
  }

  return violations;
}

async function main(): Promise<void> {
  const root = process.cwd();
  const violations = await findLanguageViolations(root);
  if (violations.length === 0) {
    process.stdout.write("Language check passed.\n");
    return;
  }

  for (const violation of violations) {
    process.stderr.write(`${violation.file}:${violation.line}:${violation.column}: Japanese or CJK character found.\n`);
  }
  process.exitCode = 1;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  await main();
}

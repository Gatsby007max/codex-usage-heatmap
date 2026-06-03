import path from "node:path";

import { shortHash } from "./hash.js";

const sensitivePathParts = [
  "auth.json",
  ".env",
  "cookie",
  "cookies",
  "credential",
  "credentials",
  "private-key",
  "private_key",
  "id_rsa",
  "id_ed25519",
  "token",
  "tokens",
  "secret",
  "secrets",
  "config.toml",
  "keychain",
  "sensitive"
];

const secretValuePatterns = [
  /sk-[A-Za-z0-9_-]{8,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /refresh[_-]?token/i,
  /access[_-]?token/i,
  /api[_-]?key/i,
  /client[_-]?secret/i
];

export function isSensitivePath(filePath: string): boolean {
  const normalized = filePath.toLowerCase();
  const base = path.basename(normalized);
  return sensitivePathParts.some((part) => base === part || normalized.includes(`/${part}`));
}

export function isJsonlPath(filePath: string): boolean {
  return path.extname(filePath).toLowerCase() === ".jsonl";
}

export function redactPath(filePath: string, includePaths = false): string {
  if (includePaths) {
    return filePath;
  }
  return `source:${shortHash([filePath])}`;
}

export function safeDiagnosticPath(filePath: string, includePaths = false): string {
  if (includePaths) {
    return filePath;
  }
  return "redacted path";
}

export function containsSecretLikeText(value: string): boolean {
  return secretValuePatterns.some((pattern) => pattern.test(value));
}

export function sanitizeWarning(message: string): string {
  if (containsSecretLikeText(message)) {
    return "A diagnostic message was redacted because it looked sensitive.";
  }
  return message.replace(/\/[^\s"']+/g, "redacted path");
}

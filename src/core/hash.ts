import { createHash } from "node:crypto";

export function stableHash(parts: unknown[]): string {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(JSON.stringify(part));
    hash.update("\n");
  }
  return hash.digest("hex");
}

export function shortHash(parts: unknown[]): string {
  return stableHash(parts).slice(0, 12);
}

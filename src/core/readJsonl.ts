import fs from "node:fs";
import readline from "node:readline";

export interface JsonlRecord {
  line: number;
  record: unknown;
}

export interface JsonlReadResult {
  records: JsonlRecord[];
  parsedLines: number;
  malformedLines: number;
}

export async function readJsonlFile(filePath: string): Promise<JsonlReadResult> {
  const records: JsonlRecord[] = [];
  let parsedLines = 0;
  let malformedLines = 0;
  let lineNumber = 0;

  const input = fs.createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({
    input,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    lineNumber += 1;
    if (!line.trim()) {
      continue;
    }

    try {
      const record = JSON.parse(line) as unknown;
      records.push({ line: lineNumber, record });
      parsedLines += 1;
    } catch {
      malformedLines += 1;
    }
  }

  return { records, parsedLines, malformedLines };
}

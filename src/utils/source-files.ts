import type { ScannedFile } from "../infrastructure/repository-scanner.js";

export const SOURCE_EXTENSIONS: ReadonlySet<string> = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

export function isSourceFile(file: ScannedFile): boolean {
  return SOURCE_EXTENSIONS.has(file.extension);
}

import path from "node:path";
import type { RepositoryScan, ScannedFile } from "../infrastructure/repository-scanner.js";
import type { DeadCodeResult, LargeFile } from "../types/dead-code.js";
import { isSourceFile } from "../utils/source-files.js";
import { extractImportSpecifiers } from "../utils/imports.js";

export interface DeadCodeOptions {
  largeFileLines: number;
  largeFileBytes: number;
}

const DEFAULT_OPTIONS: DeadCodeOptions = {
  largeFileLines: 400,
  largeFileBytes: 100_000,
};

const RESOLVE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const ENTRYPOINT_REGEX = /(^|\/)(index|main)\.(t|j)sx?$/;

export class DeadCodeAnalyzer {
  constructor(private readonly options: DeadCodeOptions = DEFAULT_OPTIONS) {}

  analyze(scan: RepositoryScan): DeadCodeResult {
    const sources = scan.files.filter(isSourceFile);
    const sourcePaths = new Set(sources.map((file) => file.relativePath));

    const imported = new Set<string>();
    const importsOutgoing = new Set<string>();

    for (const file of sources) {
      for (const specifier of extractImportSpecifiers(file.content)) {
        if (!specifier.startsWith(".")) continue;
        const target = this.resolve(file.relativePath, specifier, sourcePaths);
        if (target) {
          imported.add(target);
          importsOutgoing.add(file.relativePath);
        }
      }
    }

    const unusedFiles = sources
      .filter((file) => !imported.has(file.relativePath))
      .filter((file) => !ENTRYPOINT_REGEX.test(file.relativePath))
      .map((file) => file.relativePath);

    const orphanFiles = sources
      .filter(
        (file) =>
          !imported.has(file.relativePath) &&
          !importsOutgoing.has(file.relativePath) &&
          !ENTRYPOINT_REGEX.test(file.relativePath),
      )
      .map((file) => file.relativePath);

    return {
      unusedFiles,
      orphanFiles,
      emptyDirectories: this.findEmptyDirectories(scan),
      largeFiles: this.findLargeFiles(sources),
    };
  }

  private findEmptyDirectories(scan: RepositoryScan): string[] {
    return scan.directories
      .filter(
        (directory) =>
          directory.relativePath.length > 0 &&
          directory.fileCount === 0 &&
          directory.subdirectoryCount === 0,
      )
      .map((directory) => directory.relativePath);
  }

  private findLargeFiles(sources: ScannedFile[]): LargeFile[] {
    return sources
      .filter(
        (file) =>
          file.lines > this.options.largeFileLines ||
          file.size > this.options.largeFileBytes,
      )
      .map((file) => ({
        path: file.relativePath,
        lines: file.lines,
        size: file.size,
      }));
  }

  private resolve(
    importerPath: string,
    specifier: string,
    sourcePaths: Set<string>,
  ): string | null {
    const base = path.posix.normalize(
      path.posix.join(path.posix.dirname(importerPath), specifier),
    );
    for (const candidate of this.candidates(base)) {
      if (sourcePaths.has(candidate)) return candidate;
    }
    return null;
  }

  private candidates(base: string): string[] {
    const withoutJs = base.replace(/\.(js|jsx|mjs|cjs)$/, "");
    const candidates = [base];
    for (const extension of RESOLVE_EXTENSIONS) {
      candidates.push(withoutJs + extension);
      candidates.push(base + extension);
      candidates.push(path.posix.join(base, `index${extension}`));
    }
    return candidates;
  }
}

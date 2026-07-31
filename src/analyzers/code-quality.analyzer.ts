import type { RepositoryScan, ScannedFile } from "../infrastructure/repository-scanner.js";
import type { CodeQualityResult, FileLength } from "../types/code-quality.js";
import { isSourceFile } from "../utils/source-files.js";

export interface CodeQualityOptions {
  largeFunctionLines: number;
  maxFolderDepth: number;
  maxWarnings: number;
}

const DEFAULT_OPTIONS: CodeQualityOptions = {
  largeFunctionLines: 50,
  maxFolderDepth: 5,
  maxWarnings: 25,
};

const FUNCTION_START_REGEX =
  /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)|^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::[^=]+)?=>\s*\{/;

export class CodeQualityAnalyzer {
  constructor(private readonly options: CodeQualityOptions = DEFAULT_OPTIONS) {}

  analyze(scan: RepositoryScan): CodeQualityResult {
    const sources = scan.files.filter(isSourceFile);

    const totalLines = sources.reduce((sum, file) => sum + file.lines, 0);
    const averageFileLength =
      sources.length === 0 ? 0 : Math.round(totalLines / sources.length);

    const largeFunctionWarnings = this.findLargeFunctions(sources);
    const deepFolderWarnings = this.findDeepFolders(scan);
    const namingWarnings = this.findNamingIssues(sources);

    return {
      averageFileLength,
      largestFile: this.selectByLines(sources, (a, b) => b.lines - a.lines),
      smallestFile: this.selectByLines(sources, (a, b) => a.lines - b.lines),
      largeFunctionWarnings,
      deepFolderWarnings,
      namingWarnings,
      recommendations: this.buildRecommendations({
        largeFunctionWarnings,
        deepFolderWarnings,
        namingWarnings,
      }),
    };
  }

  private selectByLines(
    sources: ScannedFile[],
    compare: (a: ScannedFile, b: ScannedFile) => number,
  ): FileLength | null {
    const [first] = [...sources].sort(compare);
    return first ? { path: first.relativePath, lines: first.lines } : null;
  }

  private findLargeFunctions(sources: ScannedFile[]): string[] {
    const warnings: string[] = [];
    for (const file of sources) {
      for (const large of this.largeFunctionsIn(file)) {
        warnings.push(large);
        if (warnings.length >= this.options.maxWarnings) return warnings;
      }
    }
    return warnings;
  }

  private largeFunctionsIn(file: ScannedFile): string[] {
    const lines = file.content.split(/\r\n|\r|\n/);
    const warnings: string[] = [];

    for (let index = 0; index < lines.length; index += 1) {
      const match = FUNCTION_START_REGEX.exec(lines[index] ?? "");
      if (!match) continue;

      const name = match[1] ?? match[2] ?? "anonymous";
      const length = this.blockLength(lines, index);
      if (length > this.options.largeFunctionLines) {
        warnings.push(`${file.relativePath}: '${name}' is ~${length} lines.`);
      }
    }
    return warnings;
  }

  private blockLength(lines: string[], startIndex: number): number {
    let balance = 0;
    let opened = false;

    for (let index = startIndex; index < lines.length; index += 1) {
      for (const char of lines[index] ?? "") {
        if (char === "{") {
          balance += 1;
          opened = true;
        } else if (char === "}") {
          balance -= 1;
        }
      }
      if (opened && balance <= 0) return index - startIndex + 1;
    }
    return lines.length - startIndex;
  }

  private findDeepFolders(scan: RepositoryScan): string[] {
    return scan.directories
      .filter((directory) => directory.depth > this.options.maxFolderDepth)
      .map(
        (directory) =>
          `${directory.relativePath} is nested ${directory.depth} levels deep.`,
      )
      .slice(0, this.options.maxWarnings);
  }

  private findNamingIssues(sources: ScannedFile[]): string[] {
    return sources
      .filter((file) => /\s/.test(file.name) || /[^A-Za-z0-9._-]/.test(file.name))
      .map((file) => `${file.relativePath} uses a non-standard file name.`)
      .slice(0, this.options.maxWarnings);
  }

  private buildRecommendations(input: {
    largeFunctionWarnings: string[];
    deepFolderWarnings: string[];
    namingWarnings: string[];
  }): string[] {
    const recommendations: string[] = [];

    if (input.largeFunctionWarnings.length > 0) {
      recommendations.push("Break down large functions into smaller units.");
    }
    if (input.deepFolderWarnings.length > 0) {
      recommendations.push("Flatten deeply nested folders to improve navigation.");
    }
    if (input.namingWarnings.length > 0) {
      recommendations.push("Rename files to follow a consistent naming convention.");
    }

    return recommendations;
  }
}

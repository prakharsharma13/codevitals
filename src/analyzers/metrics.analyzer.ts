import path from "node:path";
import type { FileSystem } from "../infrastructure/filesystem.js";
import type { RepositoryMetrics } from "../types/metrics.js";

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
]);

interface WalkTotals {
  files: number;
  directories: number;
  lines: number;
  bytes: number;
}

export class MetricsAnalyzer {
  constructor(private readonly fileSystem: FileSystem) {}

  async analyze(repositoryPath: string): Promise<RepositoryMetrics> {
    const totals: WalkTotals = { files: 0, directories: 0, lines: 0, bytes: 0 };
    await this.walk(repositoryPath, totals);

    const averageFileSize =
      totals.files === 0 ? 0 : Math.round(totals.bytes / totals.files);

    return {
      totalFiles: totals.files,
      totalDirectories: totals.directories,
      totalLines: totals.lines,
      averageFileSize,
    };
  }

  private async walk(dirPath: string, totals: WalkTotals): Promise<void> {
    const entries = await this.fileSystem.readDirectory(dirPath);

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) continue;
        totals.directories += 1;
        await this.walk(entryPath, totals);
      } else if (entry.isFile()) {
        totals.files += 1;
        const stats = await this.fileSystem.getFileStats(entryPath);
        totals.bytes += stats.size;
        totals.lines += await this.countLines(entryPath);
      }
    }
  }

  private async countLines(filePath: string): Promise<number> {
    const content = await this.fileSystem.readTextFile(filePath);
    if (content.length === 0) return 0;
    return content.split(/\r\n|\r|\n/).length;
  }
}

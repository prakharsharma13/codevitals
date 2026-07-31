import path from "node:path";
import type { FileSystem } from "./filesystem.js";
import { IGNORED_DIRECTORIES } from "../constants/ignored-directories.js";

const MAX_CONTENT_BYTES = 1_000_000;

const BINARY_EXTENSIONS: ReadonlySet<string> = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp", ".svg",
  ".pdf", ".zip", ".gz", ".tar", ".exe", ".dll", ".node",
  ".woff", ".woff2", ".ttf", ".eot", ".mp3", ".mp4", ".wasm",
]);

export interface ScannedFile {
  absolutePath: string;
  relativePath: string;
  name: string;
  extension: string;
  size: number;
  lines: number;
  content: string;
}

export interface ScannedDirectory {
  relativePath: string;
  depth: number;
  fileCount: number;
  subdirectoryCount: number;
}

export interface RepositoryScan {
  files: ScannedFile[];
  directories: ScannedDirectory[];
}

export class RepositoryScanner {
  constructor(private readonly fileSystem: FileSystem) {}

  async scan(repositoryPath: string): Promise<RepositoryScan> {
    const files: ScannedFile[] = [];
    const directories: ScannedDirectory[] = [];
    await this.walk(repositoryPath, repositoryPath, 0, files, directories);
    return { files, directories };
  }

  private async walk(
    root: string,
    dir: string,
    depth: number,
    files: ScannedFile[],
    directories: ScannedDirectory[],
  ): Promise<void> {
    const entries = await this.fileSystem.readDirectory(dir);

    let fileCount = 0;
    let subdirectoryCount = 0;

    for (const entry of entries) {
      const absolutePath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) continue;
        subdirectoryCount += 1;
        await this.walk(root, absolutePath, depth + 1, files, directories);
      } else if (entry.isFile()) {
        fileCount += 1;
        files.push(await this.readFile(root, absolutePath, entry.name));
      }
    }

    directories.push({
      relativePath: this.toRelative(root, dir),
      depth,
      fileCount,
      subdirectoryCount,
    });
  }

  private async readFile(
    root: string,
    absolutePath: string,
    name: string,
  ): Promise<ScannedFile> {
    const stats = await this.fileSystem.getFileStats(absolutePath);
    const extension = path.extname(name).toLowerCase();
    const readable =
      !BINARY_EXTENSIONS.has(extension) && stats.size <= MAX_CONTENT_BYTES;
    const content = readable ? await this.safeRead(absolutePath) : "";

    return {
      absolutePath,
      relativePath: this.toRelative(root, absolutePath),
      name,
      extension,
      size: stats.size,
      lines: content.length === 0 ? 0 : content.split(/\r\n|\r|\n/).length,
      content,
    };
  }

  private async safeRead(absolutePath: string): Promise<string> {
    try {
      return await this.fileSystem.readTextFile(absolutePath);
    } catch {
      return "";
    }
  }

  private toRelative(root: string, target: string): string {
    return path.relative(root, target).split(path.sep).join("/");
  }
}

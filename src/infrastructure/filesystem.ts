import { readFile, readdir, stat } from "node:fs/promises";
import type { Dirent, Stats } from "node:fs";

export class FileSystem {
  async readTextFile(path: string): Promise<string> {
    return readFile(path, "utf-8");
  }

  async readDirectory(path: string): Promise<Dirent[]> {
    return readdir(path, { withFileTypes: true });
  }

  async getFileStats(path: string): Promise<Stats> {
    return stat(path);
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  }
}

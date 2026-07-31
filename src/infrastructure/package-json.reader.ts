import path from "node:path";
import type { FileSystem } from "./filesystem.js";
import type { PackageJson } from "../types/package-json.js";

export class PackageJsonReader {
  constructor(private readonly fileSystem: FileSystem) {}

  async read(repositoryPath: string): Promise<PackageJson> {
    const packageJsonPath = path.join(repositoryPath, "package.json");
    const content = await this.fileSystem.readTextFile(packageJsonPath);
    return JSON.parse(content) as PackageJson;
  }
}

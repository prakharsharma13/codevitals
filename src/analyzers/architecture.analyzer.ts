import path from "node:path";
import type { FileSystem } from "../infrastructure/filesystem.js";
import type { PackageJson } from "../types/package-json.js";
import type { ArchitectureAnalysisResult } from "../types/architecture.js";

const TEST_PACKAGES = ["jest", "vitest", "@playwright/test", "cypress"];

export class ArchitectureAnalyzer {
  constructor(private readonly fileSystem: FileSystem) {}

  async analyze(
    repositoryPath: string,
    packageJson: PackageJson,
  ): Promise<ArchitectureAnalysisResult> {
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const [packageManager, language, hasDocker, hasCI, isMonorepo] =
      await Promise.all([
        this.detectPackageManager(repositoryPath),
        this.detectLanguage(repositoryPath, dependencies),
        this.detectDocker(repositoryPath),
        this.detectCI(repositoryPath),
        this.detectMonorepo(repositoryPath, packageJson),
      ]);

    return {
      projectType: this.detectProjectType(dependencies, isMonorepo),
      packageManager,
      language,
      hasDocker,
      hasCI,
      hasTests: this.detectTests(dependencies),
    };
  }

  private detectProjectType(
    dependencies: Record<string, string>,
    isMonorepo: boolean,
  ): string {
    if (isMonorepo) return "Monorepo";
    if ("next" in dependencies) return "Next.js";
    if ("react" in dependencies) return "React";
    if ("express" in dependencies) return "Express";
    return "Node";
  }

  private async detectPackageManager(repositoryPath: string): Promise<string> {
    if (await this.exists(repositoryPath, "bun.lockb")) return "bun";
    if (await this.exists(repositoryPath, "pnpm-lock.yaml")) return "pnpm";
    if (await this.exists(repositoryPath, "yarn.lock")) return "yarn";
    if (await this.exists(repositoryPath, "package-lock.json")) return "npm";
    return "unknown";
  }

  private async detectLanguage(
    repositoryPath: string,
    dependencies: Record<string, string>,
  ): Promise<string> {
    const hasTypeScript =
      "typescript" in dependencies ||
      (await this.exists(repositoryPath, "tsconfig.json"));
    return hasTypeScript ? "TypeScript" : "JavaScript";
  }

  private async detectDocker(repositoryPath: string): Promise<boolean> {
    return this.anyExists(repositoryPath, [
      "Dockerfile",
      "docker-compose.yml",
      "docker-compose.yaml",
      "compose.yaml",
    ]);
  }

  private async detectCI(repositoryPath: string): Promise<boolean> {
    return this.anyExists(repositoryPath, [
      ".github/workflows",
      ".gitlab-ci.yml",
      "azure-pipelines.yml",
    ]);
  }

  private detectTests(dependencies: Record<string, string>): boolean {
    return TEST_PACKAGES.some((pkg) => pkg in dependencies);
  }

  private async detectMonorepo(
    repositoryPath: string,
    packageJson: PackageJson,
  ): Promise<boolean> {
    if (packageJson.workspaces !== undefined) return true;
    return this.anyExists(repositoryPath, ["pnpm-workspace.yaml", "lerna.json"]);
  }

  private async anyExists(
    repositoryPath: string,
    relativePaths: string[],
  ): Promise<boolean> {
    for (const relativePath of relativePaths) {
      if (await this.exists(repositoryPath, relativePath)) return true;
    }
    return false;
  }

  private async exists(
    repositoryPath: string,
    relativePath: string,
  ): Promise<boolean> {
    return this.fileSystem.fileExists(path.join(repositoryPath, relativePath));
  }
}

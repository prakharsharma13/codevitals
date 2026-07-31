import type { RepositoryScan } from "../infrastructure/repository-scanner.js";
import type { PackageJson } from "../types/package-json.js";
import type {
  DependencyHealthResult,
  DependencyIssue,
} from "../types/dependency-health.js";
import { isSourceFile } from "../utils/source-files.js";
import { extractImportSpecifiers, toPackageRoot } from "../utils/imports.js";

const LARGE_DEPENDENCY_COUNT = 100;
const SUSPICIOUS_VERSIONS: ReadonlySet<string> = new Set(["*", "x", "latest"]);

export class DependencyHealthAnalyzer {
  analyze(packageJson: PackageJson, scan: RepositoryScan): DependencyHealthResult {
    const dependencies = packageJson.dependencies ?? {};
    const devDependencies = packageJson.devDependencies ?? {};
    const totalDependencies =
      Object.keys(dependencies).length + Object.keys(devDependencies).length;

    const duplicateDependencies = Object.keys(dependencies).filter(
      (name) => name in devDependencies,
    );
    const outdatedDependencies = this.findVersionIssues({
      ...devDependencies,
      ...dependencies,
    });
    const unusedDependencies = this.findUnused(dependencies, scan);

    const healthScore = this.score({
      totalDependencies,
      duplicateDependencies,
      outdatedDependencies,
      unusedDependencies,
    });

    return {
      outdatedDependencies,
      unusedDependencies,
      duplicateDependencies,
      totalDependencies,
      healthScore,
      recommendations: this.buildRecommendations({
        totalDependencies,
        duplicateDependencies,
        outdatedDependencies,
        unusedDependencies,
      }),
    };
  }

  private findVersionIssues(all: Record<string, string>): DependencyIssue[] {
    const issues: DependencyIssue[] = [];
    for (const [name, version] of Object.entries(all)) {
      if (version.trim().length === 0) {
        issues.push({ name, version, reason: "missing version" });
      } else if (SUSPICIOUS_VERSIONS.has(version.trim().toLowerCase())) {
        issues.push({ name, version, reason: "unpinned version" });
      }
    }
    return issues;
  }

  private findUnused(
    dependencies: Record<string, string>,
    scan: RepositoryScan,
  ): string[] {
    const importedRoots = this.collectImportedRoots(scan);
    return Object.keys(dependencies).filter((name) => !importedRoots.has(name));
  }

  private collectImportedRoots(scan: RepositoryScan): Set<string> {
    const roots = new Set<string>();
    for (const file of scan.files) {
      if (!isSourceFile(file)) continue;
      for (const specifier of extractImportSpecifiers(file.content)) {
        const root = toPackageRoot(specifier);
        if (root) roots.add(root);
      }
    }
    return roots;
  }

  private score(input: {
    totalDependencies: number;
    duplicateDependencies: string[];
    outdatedDependencies: DependencyIssue[];
    unusedDependencies: string[];
  }): number {
    let score = 100;
    score -= Math.min(30, input.duplicateDependencies.length * 10);
    score -= Math.min(25, input.outdatedDependencies.length * 5);
    score -= Math.min(25, input.unusedDependencies.length * 5);
    if (input.totalDependencies > LARGE_DEPENDENCY_COUNT) score -= 15;
    return Math.max(0, score);
  }

  private buildRecommendations(input: {
    totalDependencies: number;
    duplicateDependencies: string[];
    outdatedDependencies: DependencyIssue[];
    unusedDependencies: string[];
  }): string[] {
    const recommendations: string[] = [];

    if (input.duplicateDependencies.length > 0) {
      recommendations.push(
        `Remove ${input.duplicateDependencies.length} package(s) declared in both dependencies and devDependencies.`,
      );
    }
    if (input.unusedDependencies.length > 0) {
      recommendations.push(
        `Review ${input.unusedDependencies.length} potentially unused dependency(ies).`,
      );
    }
    if (input.outdatedDependencies.length > 0) {
      recommendations.push(
        `Pin ${input.outdatedDependencies.length} dependency(ies) with missing or unpinned versions.`,
      );
    }
    if (input.totalDependencies > LARGE_DEPENDENCY_COUNT) {
      recommendations.push(
        "Consider reducing the total dependency count to lower maintenance risk.",
      );
    }

    return recommendations;
  }
}

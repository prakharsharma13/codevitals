import type { PackageJson } from "../types/package-json.js";
import type { DependencyAnalysisResult } from "../types/repository-analysis.js";

export class DependencyAnalyzer {
  analyze(packageJson: PackageJson): DependencyAnalysisResult {
    return {
      dependencyCount: Object.keys(packageJson.dependencies ?? {}).length,
      devDependencyCount: Object.keys(packageJson.devDependencies ?? {}).length,
    };
  }
}

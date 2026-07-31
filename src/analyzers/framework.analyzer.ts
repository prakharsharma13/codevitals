import type { PackageJson } from "../types/package-json.js";
import type { FrameworkAnalysisResult } from "../types/repository-analysis.js";

const FRAMEWORK_BY_PACKAGE: ReadonlyArray<[string, string]> = [
  ["next", "Next.js"],
  ["react", "React"],
  ["vue", "Vue"],
  ["@angular/core", "Angular"],
  ["express", "Express"],
];

export class FrameworkAnalyzer {
  analyze(packageJson: PackageJson): FrameworkAnalysisResult {
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    for (const [packageName, framework] of FRAMEWORK_BY_PACKAGE) {
      if (packageName in dependencies) {
        return { framework };
      }
    }

    return { framework: "Unknown" };
  }
}

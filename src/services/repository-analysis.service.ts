import type { PackageJsonReader } from "../infrastructure/package-json.reader.js";
import type { DependencyAnalyzer } from "../analyzers/dependency.analyzer.js";
import type { FrameworkAnalyzer } from "../analyzers/framework.analyzer.js";
import type { GitAnalyzer } from "../analyzers/git.analyzer.js";
import type { MetricsAnalyzer } from "../analyzers/metrics.analyzer.js";
import type { ArchitectureAnalyzer } from "../analyzers/architecture.analyzer.js";
import type { RepositoryAnalysisResult } from "../types/repository-analysis.js";

export class RepositoryAnalysisService {
  constructor(
    private readonly packageJsonReader: PackageJsonReader,
    private readonly dependencyAnalyzer: DependencyAnalyzer,
    private readonly frameworkAnalyzer: FrameworkAnalyzer,
    private readonly gitAnalyzer: GitAnalyzer,
    private readonly metricsAnalyzer: MetricsAnalyzer,
    private readonly architectureAnalyzer: ArchitectureAnalyzer,
  ) {}

  async analyze(repositoryPath: string): Promise<RepositoryAnalysisResult> {
    const packageJson = await this.packageJsonReader.read(repositoryPath);

    const [git, metrics, architecture] = await Promise.all([
      this.gitAnalyzer.analyze(repositoryPath),
      this.metricsAnalyzer.analyze(repositoryPath),
      this.architectureAnalyzer.analyze(repositoryPath, packageJson),
    ]);

    return {
      ...this.dependencyAnalyzer.analyze(packageJson),
      ...this.frameworkAnalyzer.analyze(packageJson),
      ...git,
      ...metrics,
      ...architecture,
    };
  }
}

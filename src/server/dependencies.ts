import { FileSystem } from "../infrastructure/filesystem.js";
import { PackageJsonReader } from "../infrastructure/package-json.reader.js";
import { GitClient } from "../infrastructure/git.client.js";
import { RepositoryScanner } from "../infrastructure/repository-scanner.js";
import { DependencyAnalyzer } from "../analyzers/dependency.analyzer.js";
import { FrameworkAnalyzer } from "../analyzers/framework.analyzer.js";
import { GitAnalyzer } from "../analyzers/git.analyzer.js";
import { MetricsAnalyzer } from "../analyzers/metrics.analyzer.js";
import { ArchitectureAnalyzer } from "../analyzers/architecture.analyzer.js";
import { SecurityAnalyzer } from "../analyzers/security.analyzer.js";
import { DependencyHealthAnalyzer } from "../analyzers/dependency-health.analyzer.js";
import { DeadCodeAnalyzer } from "../analyzers/dead-code.analyzer.js";
import { CodeQualityAnalyzer } from "../analyzers/code-quality.analyzer.js";
import { RepositoryAnalysisService } from "../services/repository-analysis.service.js";
import { HealthScoreCalculator } from "../services/health-score.calculator.js";
import { RepositoryHealthService } from "../services/repository-health.service.js";
import { RepositorySummaryService } from "../services/repository-summary.service.js";

export interface AppDependencies {
  repositoryHealthService: RepositoryHealthService;
  repositorySummaryService: RepositorySummaryService;
}

export function createDependencies(): AppDependencies {
  const fileSystem = new FileSystem();
  const packageJsonReader = new PackageJsonReader(fileSystem);
  const gitClient = new GitClient();
  const repositoryScanner = new RepositoryScanner(fileSystem);

  const dependencyAnalyzer = new DependencyAnalyzer();
  const frameworkAnalyzer = new FrameworkAnalyzer();
  const gitAnalyzer = new GitAnalyzer(gitClient);
  const metricsAnalyzer = new MetricsAnalyzer(fileSystem);
  const architectureAnalyzer = new ArchitectureAnalyzer(fileSystem);
  const securityAnalyzer = new SecurityAnalyzer();
  const dependencyHealthAnalyzer = new DependencyHealthAnalyzer();
  const deadCodeAnalyzer = new DeadCodeAnalyzer();
  const codeQualityAnalyzer = new CodeQualityAnalyzer();

  const repositoryAnalysisService = new RepositoryAnalysisService(
    packageJsonReader,
    dependencyAnalyzer,
    frameworkAnalyzer,
    gitAnalyzer,
    metricsAnalyzer,
    architectureAnalyzer,
  );

  const repositoryHealthService = new RepositoryHealthService(
    repositoryAnalysisService,
    repositoryScanner,
    packageJsonReader,
    securityAnalyzer,
    dependencyHealthAnalyzer,
    deadCodeAnalyzer,
    codeQualityAnalyzer,
    new HealthScoreCalculator(),
  );

  const repositorySummaryService = new RepositorySummaryService();

  return { repositoryHealthService, repositorySummaryService };
}

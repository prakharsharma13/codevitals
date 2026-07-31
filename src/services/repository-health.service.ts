import type { RepositoryAnalysisService } from "./repository-analysis.service.js";
import type { HealthScoreCalculator } from "./health-score.calculator.js";
import type { RepositoryScanner } from "../infrastructure/repository-scanner.js";
import type { PackageJsonReader } from "../infrastructure/package-json.reader.js";
import type { SecurityAnalyzer } from "../analyzers/security.analyzer.js";
import type { DependencyHealthAnalyzer } from "../analyzers/dependency-health.analyzer.js";
import type { DeadCodeAnalyzer } from "../analyzers/dead-code.analyzer.js";
import type { CodeQualityAnalyzer } from "../analyzers/code-quality.analyzer.js";
import type { RepositoryEvaluation } from "../types/repository-evaluation.js";

export class RepositoryHealthService {
  constructor(
    private readonly repositoryAnalysisService: RepositoryAnalysisService,
    private readonly repositoryScanner: RepositoryScanner,
    private readonly packageJsonReader: PackageJsonReader,
    private readonly securityAnalyzer: SecurityAnalyzer,
    private readonly dependencyHealthAnalyzer: DependencyHealthAnalyzer,
    private readonly deadCodeAnalyzer: DeadCodeAnalyzer,
    private readonly codeQualityAnalyzer: CodeQualityAnalyzer,
    private readonly scoreCalculator: HealthScoreCalculator,
  ) {}

  async evaluate(repositoryPath: string): Promise<RepositoryEvaluation> {
    const [analysis, scan, packageJson] = await Promise.all([
      this.repositoryAnalysisService.analyze(repositoryPath),
      this.repositoryScanner.scan(repositoryPath),
      this.packageJsonReader.read(repositoryPath),
    ]);

    const security = this.securityAnalyzer.analyze(scan);
    const dependencyHealth = this.dependencyHealthAnalyzer.analyze(packageJson, scan);
    const deadCode = this.deadCodeAnalyzer.analyze(scan);
    const codeQuality = this.codeQualityAnalyzer.analyze(scan);

    const health = this.scoreCalculator.calculate({
      analysis,
      security,
      dependencyHealth,
      deadCode,
      codeQuality,
    });

    return { analysis, security, dependencyHealth, deadCode, codeQuality, health };
  }
}

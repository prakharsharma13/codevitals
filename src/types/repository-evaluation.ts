import type { RepositoryAnalysisResult } from "./repository-analysis.js";
import type { SecurityAnalysisResult } from "./security-analysis.js";
import type { DependencyHealthResult } from "./dependency-health.js";
import type { DeadCodeResult } from "./dead-code.js";
import type { CodeQualityResult } from "./code-quality.js";
import type { RepositoryHealthScore } from "./health-score.js";

export interface RepositoryEvaluation {
  analysis: RepositoryAnalysisResult;
  security: SecurityAnalysisResult;
  dependencyHealth: DependencyHealthResult;
  deadCode: DeadCodeResult;
  codeQuality: CodeQualityResult;
  health: RepositoryHealthScore;
}

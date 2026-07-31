import type { RepositoryAnalysisResult } from "../types/repository-analysis.js";
import type { SecurityAnalysisResult } from "../types/security-analysis.js";
import type { DependencyHealthResult } from "../types/dependency-health.js";
import type { DeadCodeResult } from "../types/dead-code.js";
import type { CodeQualityResult } from "../types/code-quality.js";
import type { RepositoryHealthScore } from "../types/health-score.js";

export interface HealthScoreInput {
  analysis: RepositoryAnalysisResult;
  security: SecurityAnalysisResult;
  dependencyHealth: DependencyHealthResult;
  deadCode: DeadCodeResult;
  codeQuality: CodeQualityResult;
}

const WEIGHTS = {
  security: 0.3,
  architecture: 0.2,
  dependency: 0.2,
  maintainability: 0.2,
  metrics: 0.1,
} as const;

export class HealthScoreCalculator {
  calculate(input: HealthScoreInput): RepositoryHealthScore {
    const securityScore = this.securityScore(input.security);
    const dependencyScore = this.clamp(input.dependencyHealth.healthScore);
    const maintainabilityScore = this.maintainabilityScore(
      input.codeQuality,
      input.deadCode,
    );
    const architectureScore = this.architectureScore(input.analysis);
    const metricsScore = this.metricsScore(input.analysis);

    const overallScore = Math.round(
      securityScore * WEIGHTS.security +
        architectureScore * WEIGHTS.architecture +
        dependencyScore * WEIGHTS.dependency +
        maintainabilityScore * WEIGHTS.maintainability +
        metricsScore * WEIGHTS.metrics,
    );

    return {
      overallScore,
      securityScore,
      dependencyScore,
      maintainabilityScore,
      architectureScore,
      summary: `Repository health: ${this.grade(overallScore)} (${overallScore}/100).`,
      recommendations: this.mergeRecommendations(input),
    };
  }

  private securityScore(security: SecurityAnalysisResult): number {
    let score = 100;
    if (!security.hasGitIgnore) score -= 20;
    if (security.hasEnvFile && !security.ignoredEnv) score -= 30;
    score -= Math.min(40, security.secretCount * 20);
    score -= Math.min(20, security.sensitiveFiles.length * 10);
    return this.clamp(score);
  }

  private maintainabilityScore(
    codeQuality: CodeQualityResult,
    deadCode: DeadCodeResult,
  ): number {
    let score = 100;
    score -= Math.min(30, deadCode.largeFiles.length * 5);
    score -= Math.min(20, codeQuality.largeFunctionWarnings.length * 4);
    score -= Math.min(15, codeQuality.deepFolderWarnings.length * 5);
    score -= Math.min(15, deadCode.unusedFiles.length * 3);
    score -= Math.min(10, codeQuality.namingWarnings.length * 2);
    return this.clamp(score);
  }

  private architectureScore(analysis: RepositoryAnalysisResult): number {
    let score = 0;
    score += analysis.hasTests ? 25 : 0;
    score += analysis.hasCI ? 20 : 0;
    score += analysis.hasDocker ? 15 : 0;
    score += analysis.language === "TypeScript" ? 20 : 10;
    score += analysis.packageManager !== "unknown" ? 10 : 0;
    score += analysis.projectType !== "Node" ? 10 : 5;
    return this.clamp(score);
  }

  private metricsScore(analysis: RepositoryAnalysisResult): number {
    let score = 100;
    if (analysis.totalFiles === 0) score -= 50;
    if (analysis.totalLines === 0) score -= 20;
    if (analysis.averageFileSize > 50_000) score -= 20;
    else if (analysis.averageFileSize > 20_000) score -= 10;
    return this.clamp(score);
  }

  private mergeRecommendations(input: HealthScoreInput): string[] {
    return [
      ...input.security.recommendations,
      ...input.dependencyHealth.recommendations,
      ...input.codeQuality.recommendations,
    ];
  }

  private grade(score: number): string {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Poor";
  }

  private clamp(score: number): number {
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

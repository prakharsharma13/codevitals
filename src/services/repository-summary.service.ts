import type { RepositoryEvaluation } from "../types/repository-evaluation.js";
import type { RepositorySummary } from "../types/repository-summary.js";

export class RepositorySummaryService {
  generate(evaluation: RepositoryEvaluation): RepositorySummary {
    return {
      strengths: this.strengths(evaluation),
      weaknesses: this.weaknesses(evaluation),
      warnings: this.warnings(evaluation),
      quickWins: this.quickWins(evaluation),
      overallSummary: this.overallSummary(evaluation),
    };
  }

  private strengths(evaluation: RepositoryEvaluation): string[] {
    const { analysis, security } = evaluation;
    const strengths: string[] = [];

    if (analysis.language === "TypeScript") strengths.push("Uses TypeScript.");
    if (analysis.projectType !== "Node") {
      strengths.push(`Uses ${analysis.projectType} architecture.`);
    }
    if (analysis.hasTests) strengths.push("Has a test setup.");
    if (analysis.hasCI) strengths.push("Continuous integration is configured.");
    if (analysis.hasDocker) strengths.push("Docker support is present.");
    if (security.riskLevel === "Low") strengths.push("Security risk is Low.");
    if (evaluation.dependencyHealth.healthScore >= 80) {
      strengths.push("Good dependency management.");
    }

    return strengths;
  }

  private weaknesses(evaluation: RepositoryEvaluation): string[] {
    const { analysis, security } = evaluation;
    const weaknesses: string[] = [];

    if (!analysis.hasTests) weaknesses.push("No test setup detected.");
    if (!analysis.hasCI) weaknesses.push("CI/CD pipeline not configured.");
    if (!analysis.hasDocker) weaknesses.push("Missing Docker support.");
    if (security.riskLevel === "High") weaknesses.push("Security risk is High.");
    if (evaluation.health.maintainabilityScore < 60) {
      weaknesses.push("Maintainability needs improvement.");
    }

    return weaknesses;
  }

  private warnings(evaluation: RepositoryEvaluation): string[] {
    const { security, dependencyHealth, deadCode } = evaluation;
    const warnings: string[] = [];

    if (security.hasSecrets) {
      warnings.push(`${security.secretCount} hardcoded secret(s) detected.`);
    }
    if (security.hasEnvFile && !security.ignoredEnv) {
      warnings.push(".env file is not ignored by git.");
    }
    if (dependencyHealth.unusedDependencies.length > 0) {
      warnings.push(
        `${dependencyHealth.unusedDependencies.length} unused dependencies detected.`,
      );
    }
    if (deadCode.largeFiles.length > 0) {
      warnings.push(`${deadCode.largeFiles.length} very large files found.`);
    }
    if (deadCode.unusedFiles.length > 0) {
      warnings.push(`${deadCode.unusedFiles.length} unused files found.`);
    }

    return warnings;
  }

  private quickWins(evaluation: RepositoryEvaluation): string[] {
    const { analysis, security, dependencyHealth } = evaluation;
    const quickWins: string[] = [];

    if (security.hasEnvFile && !security.ignoredEnv) {
      quickWins.push("Add .env to .gitignore.");
    }
    if (!analysis.hasDocker) quickWins.push("Add a Dockerfile.");
    if (!analysis.hasCI) quickWins.push("Add a CI workflow.");
    if (dependencyHealth.duplicateDependencies.length > 0) {
      quickWins.push("Remove duplicate dependencies.");
    }

    return quickWins;
  }

  private overallSummary(evaluation: RepositoryEvaluation): string {
    const { health, security } = evaluation;
    return `Repository scored ${health.overallScore}/100. Security risk is ${security.riskLevel}.`;
  }
}

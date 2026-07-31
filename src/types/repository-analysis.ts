import type { GitAnalysisResult } from "./git-analysis.js";
import type { RepositoryMetrics } from "./metrics.js";
import type { ArchitectureAnalysisResult } from "./architecture.js";

export interface DependencyAnalysisResult {
  dependencyCount: number;
  devDependencyCount: number;
}

export interface FrameworkAnalysisResult {
  framework: string;
}

export interface RepositoryAnalysisResult
  extends DependencyAnalysisResult,
    FrameworkAnalysisResult,
    GitAnalysisResult,
    RepositoryMetrics,
    ArchitectureAnalysisResult {}

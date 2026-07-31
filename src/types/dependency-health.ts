export interface DependencyIssue {
  name: string;
  version: string;
  reason: string;
}

export interface DependencyHealthResult {
  outdatedDependencies: DependencyIssue[];
  unusedDependencies: string[];
  duplicateDependencies: string[];
  totalDependencies: number;
  healthScore: number;
  recommendations: string[];
}

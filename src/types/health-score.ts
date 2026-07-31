export interface RepositoryHealthScore {
  overallScore: number;
  securityScore: number;
  dependencyScore: number;
  maintainabilityScore: number;
  architectureScore: number;
  summary: string;
  recommendations: string[];
}

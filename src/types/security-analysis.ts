export type SecurityRiskLevel = "Low" | "Medium" | "High";

export interface SecurityAnalysisResult {
  hasSecrets: boolean;
  secretCount: number;
  hasEnvFile: boolean;
  hasGitIgnore: boolean;
  ignoredEnv: boolean;
  sensitiveFiles: string[];
  riskLevel: SecurityRiskLevel;
  recommendations: string[];
}

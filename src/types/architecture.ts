export interface ArchitectureAnalysisResult {
  projectType: string;
  packageManager: string;
  language: string;
  hasDocker: boolean;
  hasCI: boolean;
  hasTests: boolean;
}

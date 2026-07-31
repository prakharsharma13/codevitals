export interface GitAnalysisResult {
  isGitRepository: boolean;
  branch: string | null;
  lastCommit: string | null;
  commitCount: number;
  remoteUrl: string | null;
}

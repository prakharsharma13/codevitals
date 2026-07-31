import type { GitClient } from "../infrastructure/git.client.js";
import type { GitAnalysisResult } from "../types/git-analysis.js";

export class GitAnalyzer {
  constructor(private readonly gitClient: GitClient) {}

  async analyze(repositoryPath: string): Promise<GitAnalysisResult> {
    const isGitRepository = await this.gitClient.isGitRepository(repositoryPath);

    if (!isGitRepository) {
      return {
        isGitRepository: false,
        branch: null,
        lastCommit: null,
        commitCount: 0,
        remoteUrl: null,
      };
    }

    const [branch, lastCommit, commitCount, remoteUrl] = await Promise.all([
      this.gitClient.getCurrentBranch(repositoryPath),
      this.gitClient.getLastCommit(repositoryPath),
      this.gitClient.getCommitCount(repositoryPath),
      this.gitClient.getRemoteUrl(repositoryPath),
    ]);

    return { isGitRepository, branch, lastCommit, commitCount, remoteUrl };
  }
}

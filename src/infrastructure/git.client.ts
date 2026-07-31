import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export class GitClient {
  async isGitRepository(repositoryPath: string): Promise<boolean> {
    try {
      const output = await this.run(repositoryPath, [
        "rev-parse",
        "--is-inside-work-tree",
      ]);
      return output === "true";
    } catch {
      return false;
    }
  }

  async getCurrentBranch(repositoryPath: string): Promise<string> {
    return this.run(repositoryPath, ["rev-parse", "--abbrev-ref", "HEAD"]);
  }

  async getLastCommit(repositoryPath: string): Promise<string> {
    return this.run(repositoryPath, ["log", "-1", "--pretty=%H %s"]);
  }

  async getCommitCount(repositoryPath: string): Promise<number> {
    const output = await this.run(repositoryPath, ["rev-list", "--count", "HEAD"]);
    return Number.parseInt(output, 10);
  }

  async getRemoteUrl(repositoryPath: string): Promise<string | null> {
    try {
      return await this.run(repositoryPath, [
        "config",
        "--get",
        "remote.origin.url",
      ]);
    } catch {
      return null;
    }
  }

  private async run(repositoryPath: string, args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync("git", args, {
        cwd: repositoryPath,
      });
      return stdout.trim();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`git ${args.join(" ")} failed: ${message}`);
    }
  }
}

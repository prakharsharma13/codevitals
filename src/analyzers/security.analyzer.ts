import type { RepositoryScan, ScannedFile } from "../infrastructure/repository-scanner.js";
import type {
  SecurityAnalysisResult,
  SecurityRiskLevel,
} from "../types/security-analysis.js";
import { isSourceFile } from "../utils/source-files.js";

const SECRET_REGEX =
  /\b(API_?KEY|SECRET|TOKEN|PASSWORD|PRIVATE_?KEY|JWT_?SECRET|ACCESS_?KEY)[A-Z0-9_]*\s*[:=]\s*['"`][^'"`\n]{4,}['"`]/gi;

const SENSITIVE_FILE_PATTERNS: RegExp[] = [
  /\.pem$/i,
  /\.key$/i,
  /\.ppk$/i,
  /(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/i,
  /(^|\/)\.?aws\/credentials$/i,
  /firebase-adminsdk.*\.json$/i,
  /service-?account.*\.json$/i,
  /(^|\/)serviceAccountKey\.json$/i,
];

export class SecurityAnalyzer {
  analyze(scan: RepositoryScan): SecurityAnalysisResult {
    const sensitiveFiles = scan.files
      .filter((file) => this.isSensitiveFile(file.relativePath))
      .map((file) => file.relativePath);

    const hasEnvFile = scan.files.some((file) => this.isEnvFile(file.name));
    const gitIgnore = scan.files.find((file) => file.name === ".gitignore");
    const hasGitIgnore = gitIgnore !== undefined;
    const ignoredEnv = hasGitIgnore ? this.isEnvIgnored(gitIgnore.content) : false;
    const secretCount = this.countSecrets(scan.files);
    const hasSecrets = secretCount > 0;

    const riskLevel = this.resolveRiskLevel({
      secretCount,
      sensitiveFiles,
      hasEnvFile,
      ignoredEnv,
      hasGitIgnore,
    });

    return {
      hasSecrets,
      secretCount,
      hasEnvFile,
      hasGitIgnore,
      ignoredEnv,
      sensitiveFiles,
      riskLevel,
      recommendations: this.buildRecommendations({
        hasSecrets,
        secretCount,
        sensitiveFiles,
        hasEnvFile,
        ignoredEnv,
        hasGitIgnore,
      }),
    };
  }

  private isEnvFile(name: string): boolean {
    return name === ".env" || name.startsWith(".env.");
  }

  private isSensitiveFile(relativePath: string): boolean {
    return SENSITIVE_FILE_PATTERNS.some((pattern) => pattern.test(relativePath));
  }

  private isEnvIgnored(gitIgnoreContent: string): boolean {
    return gitIgnoreContent.split(/\r\n|\r|\n/).some((line) => {
      const rule = line.trim();
      if (rule.length === 0 || rule.startsWith("#")) return false;
      return rule === ".env" || rule.startsWith(".env") || rule === "*.env";
    });
  }

  private countSecrets(files: ScannedFile[]): number {
    let count = 0;
    for (const file of files) {
      if (!isSourceFile(file)) continue;
      const matches = file.content.match(SECRET_REGEX);
      if (matches) count += matches.length;
    }
    return count;
  }

  private resolveRiskLevel(input: {
    secretCount: number;
    sensitiveFiles: string[];
    hasEnvFile: boolean;
    ignoredEnv: boolean;
    hasGitIgnore: boolean;
  }): SecurityRiskLevel {
    const exposedEnv = input.hasEnvFile && !input.ignoredEnv;
    if (input.secretCount > 0 || input.sensitiveFiles.length > 0 || exposedEnv) {
      return "High";
    }
    if (!input.hasGitIgnore) return "Medium";
    return "Low";
  }

  private buildRecommendations(input: {
    hasSecrets: boolean;
    secretCount: number;
    sensitiveFiles: string[];
    hasEnvFile: boolean;
    ignoredEnv: boolean;
    hasGitIgnore: boolean;
  }): string[] {
    const recommendations: string[] = [];

    if (input.hasSecrets) {
      recommendations.push(
        `Move ${input.secretCount} hardcoded secret(s) into environment variables.`,
      );
    }
    if (input.sensitiveFiles.length > 0) {
      recommendations.push(
        `Remove ${input.sensitiveFiles.length} sensitive credential file(s) from the repository.`,
      );
    }
    if (!input.hasGitIgnore) {
      recommendations.push("Add a .gitignore file.");
    }
    if (input.hasEnvFile && !input.ignoredEnv) {
      recommendations.push("Add .env to .gitignore so secrets are not committed.");
    }

    return recommendations;
  }
}

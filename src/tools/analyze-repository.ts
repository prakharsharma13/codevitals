import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RepositoryHealthService } from "../services/repository-health.service.js";
import type { RepositorySummaryService } from "../services/repository-summary.service.js";

export function registerAnalyzeRepositoryTool(
  server: McpServer,
  repositoryHealthService: RepositoryHealthService,
  repositorySummaryService: RepositorySummaryService,
) {
  server.registerTool(
    "analyze_repository",
    {
      title: "Analyze Repository",
      description:
        "Analyzes a repository and returns metadata, a health score, and a summary.",
      inputSchema: {
        repositoryPath: z
          .string()
          .min(1)
          .describe("Absolute path to the repository to analyze."),
      },
    },
    async ({ repositoryPath }) => {
      try {
        const evaluation = await repositoryHealthService.evaluate(repositoryPath);
        const summary = repositorySummaryService.generate(evaluation);

        const response = {
          analysis: evaluation.analysis,
          health: evaluation.health,
          summary,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to analyze repository "${repositoryPath}": ${message}`,
            },
          ],
        };
      }
    },
  );
}

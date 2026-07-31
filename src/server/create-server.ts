import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerHealthCheckTool } from "../tools/health-check.js";
import { registerAnalyzeRepositoryTool } from "../tools/analyze-repository.js";
import { createDependencies } from "./dependencies.js";
import { SERVER_NAME, SERVER_VERSION } from "../constants/app.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  const { repositoryHealthService, repositorySummaryService } =
    createDependencies();

  registerHealthCheckTool(server);
  registerAnalyzeRepositoryTool(
    server,
    repositoryHealthService,
    repositorySummaryService,
  );

  return server;
}

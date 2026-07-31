import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HealthCheckService } from "../services/health-check.service.js";

export function registerHealthCheckTool(server: McpServer) {
  const healthCheckService = new HealthCheckService();

  server.registerTool(
    "health_check",
    {
      title: "Health Check",
      description: "Checks whether the CodeVitals MCP server is running.",
      inputSchema: {},
    },
    async () => {
      const result = healthCheckService.getStatus();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );
}

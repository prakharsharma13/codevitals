import { SystemInfo } from "../infrastructure/system-info.js";
import { SERVER_VERSION } from "../constants/app.js";

export class HealthCheckService {
  private systemInfo = new SystemInfo();

  getStatus() {
    return {
      status: "healthy",
      version: SERVER_VERSION,
      nodeVersion: this.systemInfo.getNodeVersion(),
      platform: this.systemInfo.getPlatform(),
      message: "CodeVitals MCP Server is running successfully.",
    };
  }
}

#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server/create-server.js";

const server = createServer();
const transport = new StdioServerTransport();

await server.connect(transport);

console.error("CodeVitals MCP server running.");

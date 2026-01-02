import { BaseAgent } from "./BaseAgent.js";
import { ContextCacheConfig } from "./ContextCacheConfig.js";
import { McpTool } from "./McpTool.js";

/**
 * App Class - Central Infrastructure for Agent Workflows
 * Wraps a root agent and handles operational concerns like caching and lifecycle management.
 */
export class App {
  private name: string;
  private rootAgent: BaseAgent;
  private contextCacheConfig?: ContextCacheConfig;
  private mcpServers?: string[];

  constructor(options: {
    name: string;
    rootAgent: BaseAgent;
    contextCacheConfig?: ContextCacheConfig;
    mcpServers?: string[];
  }) {
    this.name = options.name;
    this.rootAgent = options.rootAgent;
    this.contextCacheConfig = options.contextCacheConfig;
    this.mcpServers = options.mcpServers;
  }

  /**
   * Initializes the application and the root agent.
   */
  public async run() {
    console.log(`🚀 [App: ${this.name}] Launching Zyeuté workflow...`);

    // In a real implementation with Gemini SDK, we would configure caching here using
    // this.contextCacheConfig

    // Discover and register MCP tools
    if (this.mcpServers && this.mcpServers.length > 0) {
      try {
        await this.discoverTools();
      } catch (mcpErr) {
        console.error(
          `❌ [App: ${this.name}] Fatal error during tool discovery:`,
          mcpErr,
        );
      }
    }

    await this.rootAgent.start();
  }

  /**
   * Discovers tools from MCP servers and registers them
   */
  private async discoverTools() {
    console.log(
      `🔍 [App: ${this.name}] Discovering tools from ${this.mcpServers?.length} servers...`,
    );

    // In a real implementation with Gemini SDK, we would configure caching here

    if (!this.mcpServers) return;

    for (const serverUrl of this.mcpServers) {
      try {
        console.log(
          `📡 [App: ${this.name}] Connecting to MCP server:`,
          typeof serverUrl,
          serverUrl,
        );

        if (typeof serverUrl !== "string") {
          console.error(
            `❌ [App: ${this.name}] serverUrl is not a string:`,
            serverUrl,
          );
          continue;
        }

        // Note: We use dynamic import to avoid issues if the package is being installed
        const { Client } =
          await import("@modelcontextprotocol/sdk/client/index.js");
        const { StreamableHTTPClientTransport } =
          await import("@modelcontextprotocol/sdk/client/streamableHttp.js");

        const transport = new StreamableHTTPClientTransport(new URL(serverUrl));

        const client = new Client(
          {
            name: "ZyeuteKernelNode",
            version: "1.0.0",
          },
          {
            capabilities: {
              tools: {},
            },
          },
        );

        await client.connect(transport);

        let tools: any[] = [];
        try {
          const result = await client.listTools();
          tools = result.tools;
          console.log(
            `🛠️ [App: ${this.name}] Discovered ${tools.length} tools from ${serverUrl}`,
          );
        } catch (err: any) {
          console.warn(
            `⚠️ [App: ${this.name}] SDK validation failed, attempting raw request...`,
            err.message,
          );
          // Fallback: Send raw request to bypass SDK schema validation
          try {
            // Import Zod-based schema definitions or create a loose one
            const { z } = await import("zod");
            const LooseSchema = z.object({}).passthrough();

            const rawResult = await client.request(
              { method: "tools/list" },
              LooseSchema,
            );
            tools = (rawResult as any).tools || [];
            console.log(
              `🛠️ [App: ${this.name}] Manually discovered ${tools.length} tools (raw override)`,
            );
          } catch (fallbackErr) {
            console.error(`❌Raw fallback failed:`, fallbackErr);
          }
        }

        for (const tool of tools) {
          // Adapt MCP tool to our internal McpTool interface
          this.rootAgent.registerTool({
            name: tool.name,
            description: tool.description || "",
            inputSchema: tool.inputSchema as any,
            server: serverUrl,
            execute: async (args: any) => {
              return await client.callTool({
                name: tool.name,
                arguments: args,
              });
            },
          });
        }
      } catch (error) {
        console.error(
          `❌ [App: ${this.name}] Failed to discover tools from ${serverUrl}:`,
          error,
        );
      }
    }
  }

  /**
   * Gracefully shuts down the application and the root agent.
   */
  public async stop() {
    console.log(`🛑 [App: ${this.name}] Shutting down...`);
    await this.rootAgent.stop();
  }
}

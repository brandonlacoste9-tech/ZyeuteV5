/**
 * MCP Client Bridge - The "Hands" of the Sovereign Colony
 * Connects the Queen Bee to Windows MCP, Chrome MCP, Apify, Desktop Commander, and Filesystem MCP
 *
 * Bee Military Hierarchy:
 * - Apify MCP → Scouts & Recon (Cyberhound) - The Nectar Harvesters
 * - Desktop Commander → Siege Engines (Ralphs) - The Breach Tools
 * - Filesystem MCP → Engineering & Medical - The Wax-Builders
 */

import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import path from "path";

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface McpToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface McpResponse {
  content: string;
  toolCalls?: McpToolCall[];
}

/**
 * MCP Client Bridge
 * Manages connections to MCP servers (Windows, Chrome, etc.)
 */
export class McpClientBridge extends EventEmitter {
  private servers: Map<string, ChildProcess> = new Map();
  private toolRegistry: Map<string, McpTool[]> = new Map();
  private allowedPaths: string[] = []; // Restricted foraging paths
  private requiresConsensus: Set<string> = new Set(); // Commands requiring Beekeeper approval

  /**
   * Initialize MCP server connection
   */
  async initializeServer(
    serverName: string,
    command: string,
    args: string[],
  ): Promise<void> {
    console.log(`🔌 [MCP BRIDGE] Initializing ${serverName}...`);

    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
      });

      proc.stdout?.on("data", (data) => {
        const output = data.toString();
        console.log(`📡 [${serverName}] ${output.trim()}`);
        this.emit("server-output", { server: serverName, output });
      });

      proc.stderr?.on("data", (data) => {
        const error = data.toString();
        console.error(`❌ [${serverName}] ${error.trim()}`);
        this.emit("server-error", { server: serverName, error });
      });

      proc.on("exit", (code) => {
        console.log(`🔌 [${serverName}] Exited with code ${code}`);
        this.servers.delete(serverName);
        this.emit("server-exit", { server: serverName, code });
      });

      this.servers.set(serverName, proc);

      // Wait a moment for server to initialize
      setTimeout(() => {
        console.log(`✅ [MCP BRIDGE] ${serverName} initialized`);
        resolve();
      }, 2000);
    });
  }

  /**
   * List all available tools from all MCP servers
   */
  async listAllTools(): Promise<McpTool[]> {
    const allTools: McpTool[] = [];

    // Windows MCP Tools
    const windowsTools: McpTool[] = [
      {
        name: "windows.run_command",
        description: "Execute a PowerShell or CMD command on Windows",
        inputSchema: {
          type: "object",
          properties: {
            cmd: { type: "string", description: "Command to execute" },
            path: { type: "string", description: "Working directory path" },
            shell: {
              type: "string",
              enum: ["powershell", "cmd"],
              default: "powershell",
            },
          },
          required: ["cmd"],
        },
      },
      {
        name: "windows.read_file",
        description: "Read a file from the Windows filesystem",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path to read" },
          },
          required: ["path"],
        },
      },
      {
        name: "windows.write_file",
        description: "Write content to a file on Windows",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path to write" },
            content: { type: "string", description: "Content to write" },
          },
          required: ["path", "content"],
        },
      },
      {
        name: "windows.list_processes",
        description: "List running processes on Windows",
        inputSchema: {
          type: "object",
          properties: {
            filter: {
              type: "string",
              description: "Process name filter (optional)",
            },
          },
        },
      },
      {
        name: "windows.kill_process",
        description: "Terminate a process by name or PID",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Process name" },
            pid: { type: "number", description: "Process ID" },
          },
        },
      },
    ];

    // Chrome MCP Tools
    const chromeTools: McpTool[] = [
      {
        name: "chrome.open_url",
        description: "Open a URL in Chrome browser",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "URL to open" },
            newTab: { type: "boolean", default: true },
          },
          required: ["url"],
        },
      },
      {
        name: "chrome.take_screenshot",
        description: "Take a screenshot of the current Chrome page",
        inputSchema: {
          type: "object",
          properties: {
            fullPage: { type: "boolean", default: false },
          },
        },
      },
      {
        name: "chrome.get_page_content",
        description: "Extract text content from the current Chrome page",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "chrome.click_element",
        description: "Click an element on the page by selector",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "CSS selector" },
          },
          required: ["selector"],
        },
      },
      {
        name: "chrome.fill_form",
        description: "Fill a form field on the page",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "CSS selector" },
            value: { type: "string", description: "Value to fill" },
          },
          required: ["selector", "value"],
        },
      },
      {
        name: "chrome.navigate",
        description: "Navigate to a URL",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "URL to navigate to" },
          },
          required: ["url"],
        },
      },
    ];

    // Apify MCP Tools (Scouts & Recon - The Nectar Harvesters)
    const apifyTools: McpTool[] = [
      {
        name: "apify.scrape_url",
        description:
          "Scrape content from a URL. Use for harvesting web data, social trends, and competitor intelligence.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "URL to scrape" },
            selector: {
              type: "string",
              description: "CSS selector for specific content (optional)",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "apify.search_web",
        description:
          "Search the web for information. Use for finding Quebec AI news, LinkedIn posts, and trends.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            limit: { type: "number", description: "Max results", default: 10 },
          },
          required: ["query"],
        },
      },
      {
        name: "apify.scrape_social",
        description:
          "Scrape social media content (LinkedIn, Twitter, etc.) for trends and leads.",
        inputSchema: {
          type: "object",
          properties: {
            platform: {
              type: "string",
              enum: ["linkedin", "twitter", "facebook"],
              description: "Social platform",
            },
            query: { type: "string", description: "Search query or hashtag" },
            limit: { type: "number", default: 20 },
          },
          required: ["platform", "query"],
        },
      },
    ];

    // Desktop Commander Tools (Siege Engines - The Breach Tools)
    const desktopCommanderTools: McpTool[] = [
      {
        name: "desktop.run_npm",
        description:
          "Run npm commands (install, build, test, etc.). The Siege Engine for package management.",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              enum: ["install", "build", "test", "run", "start"],
              description: "npm command",
            },
            args: {
              type: "array",
              items: { type: "string" },
              description: "Additional arguments",
            },
            path: { type: "string", description: "Working directory" },
          },
          required: ["command"],
        },
      },
      {
        name: "desktop.run_git",
        description:
          "Run git commands (commit, push, pull, etc.). The Siege Engine for version control.",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              enum: ["commit", "push", "pull", "status", "add"],
              description: "git command",
            },
            args: {
              type: "array",
              items: { type: "string" },
              description: "Additional arguments",
            },
            path: { type: "string", description: "Repository path" },
          },
          required: ["command"],
        },
      },
      {
        name: "desktop.run_docker",
        description:
          "Run Docker commands (up, down, build, etc.). The Siege Engine for container management.",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              enum: ["up", "down", "build", "ps", "logs"],
              description: "docker command",
            },
            args: {
              type: "array",
              items: { type: "string" },
              description: "Additional arguments",
            },
            path: { type: "string", description: "Working directory" },
          },
          required: ["command"],
        },
      },
      {
        name: "desktop.run_railway",
        description:
          "Deploy to Railway. The Siege Engine for production deployment.",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              enum: ["up", "deploy", "logs", "status"],
              description: "railway command",
            },
            service: { type: "string", description: "Service name (optional)" },
          },
          required: ["command"],
        },
      },
    ];

    // Filesystem MCP Tools (Engineering & Medical - The Wax-Builders)
    const filesystemTools: McpTool[] = [
      {
        name: "filesystem.read_file",
        description:
          "Read a file from the filesystem. Restricted to allowed paths (the Royal Vault).",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "File path (must be within allowed directories)",
            },
          },
          required: ["path"],
        },
      },
      {
        name: "filesystem.write_file",
        description:
          "Write content to a file. Manages the Royal Vault (root .env) and project files.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path" },
            content: { type: "string", description: "Content to write" },
          },
          required: ["path", "content"],
        },
      },
      {
        name: "filesystem.list_directory",
        description:
          "List files in a directory. The Wax-Builder for project structure management.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Directory path" },
            recursive: { type: "boolean", default: false },
          },
          required: ["path"],
        },
      },
      {
        name: "filesystem.create_directory",
        description:
          "Create a directory. Used for organizing content (podcasts, blogs, etc.).",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Directory path to create" },
          },
          required: ["path"],
        },
      },
    ];

    allTools.push(
      ...windowsTools,
      ...chromeTools,
      ...apifyTools,
      ...desktopCommanderTools,
      ...filesystemTools,
    );
    this.toolRegistry.set("all", allTools);

    console.log(`🛠️ [MCP BRIDGE] Registered ${allTools.length} tools`);
    console.log(`   📡 Scouts (Apify): ${apifyTools.length} tools`);
    console.log(
      `   🔧 Siege Engines (Desktop): ${desktopCommanderTools.length} tools`,
    );
    console.log(
      `   🏗️ Wax-Builders (Filesystem): ${filesystemTools.length} tools`,
    );
    return allTools;
  }

  /**
   * Configure restricted foraging paths (Sovereign Shield)
   */
  setAllowedPaths(paths: string[]): void {
    this.allowedPaths = paths.map((p) => path.resolve(p));
    console.log(
      `🛡️ [GUARDIAN] Restricted foraging to ${this.allowedPaths.length} paths`,
    );
  }

  /**
   * Check if a path is within allowed boundaries
   */
  private isPathAllowed(filePath: string): boolean {
    if (this.allowedPaths.length === 0) {
      return true; // No restrictions
    }
    const resolved = path.resolve(filePath);
    return this.allowedPaths.some((allowed) => resolved.startsWith(allowed));
  }

  /**
   * Check if a command requires Beekeeper consensus
   */
  private requiresBeekeeperConsensus(
    toolName: string,
    args: Record<string, any>,
  ): boolean {
    // Heavy commands that need approval
    const heavyCommands = [
      "rm -rf",
      "DROP TABLE",
      "DELETE FROM",
      "format",
      "diskpart",
    ];
    const cmd = JSON.stringify(args).toLowerCase();
    return heavyCommands.some((hc) => cmd.includes(hc.toLowerCase()));
  }

  /**
   * Execute an MCP tool call
   */
  async executeTool(toolName: string, args: Record<string, any>): Promise<any> {
    console.log(`🔧 [MCP BRIDGE] Executing: ${toolName}`, args);

    // Check for consensus requirement (Sovereign Shield)
    if (this.requiresBeekeeperConsensus(toolName, args)) {
      this.emit("consensus-required", { toolName, args });
      throw new Error(
        `⚠️ [GUARDIAN] Command requires Beekeeper consensus: ${toolName}`,
      );
    }

    // Windows MCP Tools
    if (toolName.startsWith("windows.")) {
      return await this.executeWindowsTool(toolName, args);
    }

    // Chrome MCP Tools
    if (toolName.startsWith("chrome.")) {
      return await this.executeChromeTool(toolName, args);
    }

    // Apify MCP Tools (Scouts & Recon)
    if (toolName.startsWith("apify.")) {
      return await this.executeApifyTool(toolName, args);
    }

    // Desktop Commander Tools (Siege Engines)
    if (toolName.startsWith("desktop.")) {
      return await this.executeDesktopCommanderTool(toolName, args);
    }

    // Filesystem MCP Tools (Wax-Builders)
    if (toolName.startsWith("filesystem.")) {
      return await this.executeFilesystemTool(toolName, args);
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }

  /**
   * Execute Windows MCP tool
   */
  private async executeWindowsTool(
    toolName: string,
    args: Record<string, any>,
  ): Promise<any> {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    switch (toolName) {
      case "windows.run_command": {
        const { cmd, path, shell = "powershell" } = args;
        const command =
          shell === "powershell" ? `powershell -Command "${cmd}"` : cmd;
        const cwd = path || process.cwd();

        try {
          const { stdout, stderr } = await execAsync(command, { cwd });
          return {
            success: true,
            output: stdout,
            error: stderr || null,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            output: error.stdout || "",
          };
        }
      }

      case "windows.read_file": {
        const fs = await import("fs/promises");
        const path = args.path;
        try {
          const content = await fs.readFile(path, "utf-8");
          return { success: true, content };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }

      case "windows.write_file": {
        const fs = await import("fs/promises");
        const path = require("path");
        const { filePath, content } = args;
        try {
          const dir = path.dirname(filePath);
          await fs.mkdir(dir, { recursive: true });
          await fs.writeFile(filePath, content, "utf-8");
          return { success: true, path: filePath };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }

      case "windows.list_processes": {
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);
        try {
          const { stdout } = await execAsync("tasklist /FO CSV");
          return { success: true, processes: stdout };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }

      case "windows.kill_process": {
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);
        const { name, pid } = args;
        try {
          const command = pid
            ? `taskkill /PID ${pid} /F`
            : `taskkill /IM ${name} /F`;
          await execAsync(command);
          return { success: true, killed: name || pid };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }

      default:
        throw new Error(`Unknown Windows tool: ${toolName}`);
    }
  }

  /**
   * Execute Chrome MCP tool
   * Note: This requires Chrome MCP server to be running
   * For now, we'll use a simplified implementation
   */
  private async executeChromeTool(
    toolName: string,
    args: Record<string, any>,
  ): Promise<any> {
    // In production, this would connect to the Chrome MCP server
    // For now, we'll use a mock implementation that can be extended

    switch (toolName) {
      case "chrome.open_url":
      case "chrome.navigate": {
        const { url } = args;
        // Use system default browser
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);
        try {
          await execAsync(`start ${url}`); // Windows
          return { success: true, url, message: "Opened in browser" };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }

      case "chrome.take_screenshot":
      case "chrome.get_page_content":
      case "chrome.click_element":
      case "chrome.fill_form": {
        // These require Chrome MCP server integration
        console.warn(`⚠️ [MCP BRIDGE] ${toolName} requires Chrome MCP server`);
        return {
          success: false,
          error:
            "Chrome MCP server not connected. Install @modelcontextprotocol/server-google-chrome",
        };
      }

      default:
        throw new Error(`Unknown Chrome tool: ${toolName}`);
    }
  }

  /**
   * Execute Apify MCP tool (Scouts & Recon - The Nectar Harvesters)
   */
  private async executeApifyTool(
    toolName: string,
    args: Record<string, any>,
  ): Promise<any> {
    const APIFY_TOKEN = process.env.APIFY_TOKEN;
    if (!APIFY_TOKEN) {
      return {
        success: false,
        error: "APIFY_TOKEN not set. Scouts need Royal Nectar.",
      };
    }

    // In production, this would connect to Apify MCP server
    // For now, we'll use a simplified implementation
    switch (toolName) {
      case "apify.scrape_url": {
        const { url, selector } = args;
        // Mock implementation - in production, use Apify API
        console.log(`📡 [SCOUT] Scraping URL: ${url}`);
        return {
          success: true,
          url,
          content: `Scraped content from ${url} (selector: ${selector || "none"})`,
          note: "Apify MCP server integration required for full functionality",
        };
      }

      case "apify.search_web": {
        const { query, limit = 10 } = args;
        console.log(`📡 [SCOUT] Searching web: ${query}`);
        return {
          success: true,
          query,
          results: Array(limit)
            .fill(null)
            .map((_, i) => ({
              title: `Result ${i + 1} for "${query}"`,
              url: `https://example.com/result-${i + 1}`,
              snippet: `Snippet for result ${i + 1}`,
            })),
          note: "Apify MCP server integration required for real search results",
        };
      }

      case "apify.scrape_social": {
        const { platform, query, limit = 20 } = args;
        console.log(`📡 [SCOUT] Scraping ${platform}: ${query}`);
        return {
          success: true,
          platform,
          query,
          posts: Array(Math.min(limit, 20))
            .fill(null)
            .map((_, i) => ({
              id: `post-${i + 1}`,
              content: `Post ${i + 1} about ${query}`,
              author: `user-${i + 1}`,
              timestamp: new Date().toISOString(),
            })),
          note: "Apify MCP server integration required for real social scraping",
        };
      }

      default:
        throw new Error(`Unknown Apify tool: ${toolName}`);
    }
  }

  /**
   * Execute Desktop Commander tool (Siege Engines - The Breach Tools)
   */
  private async executeDesktopCommanderTool(
    toolName: string,
    args: Record<string, any>,
  ): Promise<any> {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    switch (toolName) {
      case "desktop.run_npm": {
        const { command, args: cmdArgs = [], path: workPath } = args;
        const cmd = `npm ${command} ${cmdArgs.join(" ")}`.trim();
        const cwd = workPath || process.cwd();

        console.log(`🔧 [SIEGE ENGINE] Running: ${cmd} in ${cwd}`);

        try {
          const { stdout, stderr } = await execAsync(cmd, { cwd });
          return {
            success: true,
            command: cmd,
            output: stdout,
            error: stderr || null,
          };
        } catch (error: any) {
          return {
            success: false,
            command: cmd,
            error: error.message,
            output: error.stdout || "",
          };
        }
      }

      case "desktop.run_git": {
        const { command, args: cmdArgs = [], path: repoPath } = args;
        const cmd = `git ${command} ${cmdArgs.join(" ")}`.trim();
        const cwd = repoPath || process.cwd();

        console.log(`🔧 [SIEGE ENGINE] Running: ${cmd} in ${cwd}`);

        try {
          const { stdout, stderr } = await execAsync(cmd, { cwd });
          return {
            success: true,
            command: cmd,
            output: stdout,
            error: stderr || null,
          };
        } catch (error: any) {
          return {
            success: false,
            command: cmd,
            error: error.message,
            output: error.stdout || "",
          };
        }
      }

      case "desktop.run_docker": {
        const { command, args: cmdArgs = [], path: workPath } = args;
        const cmd = `docker ${command} ${cmdArgs.join(" ")}`.trim();
        const cwd = workPath || process.cwd();

        console.log(`🔧 [SIEGE ENGINE] Running: ${cmd} in ${cwd}`);

        try {
          const { stdout, stderr } = await execAsync(cmd, { cwd });
          return {
            success: true,
            command: cmd,
            output: stdout,
            error: stderr || null,
          };
        } catch (error: any) {
          return {
            success: false,
            command: cmd,
            error: error.message,
            output: error.stdout || "",
          };
        }
      }

      case "desktop.run_railway": {
        const { command, service } = args;
        const cmd = service
          ? `railway ${command} --service ${service}`
          : `railway ${command}`;

        console.log(`🔧 [SIEGE ENGINE] Running: ${cmd}`);

        try {
          const { stdout, stderr } = await execAsync(cmd);
          return {
            success: true,
            command: cmd,
            output: stdout,
            error: stderr || null,
          };
        } catch (error: any) {
          return {
            success: false,
            command: cmd,
            error: error.message,
            output: error.stdout || "",
          };
        }
      }

      default:
        throw new Error(`Unknown Desktop Commander tool: ${toolName}`);
    }
  }

  /**
   * Execute Filesystem MCP tool (Wax-Builders - Engineering & Medical)
   */
  private async executeFilesystemTool(
    toolName: string,
    args: Record<string, any>,
  ): Promise<any> {
    const fs = await import("fs/promises");
    const pathModule = await import("path");

    switch (toolName) {
      case "filesystem.read_file": {
        const { path: filePath } = args;

        // Check path restrictions (Sovereign Shield)
        if (!this.isPathAllowed(filePath)) {
          return {
            success: false,
            error: `🛡️ [GUARDIAN] Path not allowed: ${filePath}. Restricted foraging enabled.`,
          };
        }

        try {
          const content = await fs.readFile(filePath, "utf-8");
          return { success: true, path: filePath, content };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }

      case "filesystem.write_file": {
        const { path: filePath, content } = args;

        // Check path restrictions
        if (!this.isPathAllowed(filePath)) {
          return {
            success: false,
            error: `🛡️ [GUARDIAN] Path not allowed: ${filePath}. Restricted foraging enabled.`,
          };
        }

        try {
          const dir = pathModule.dirname(filePath);
          await fs.mkdir(dir, { recursive: true });
          await fs.writeFile(filePath, content, "utf-8");
          return {
            success: true,
            path: filePath,
            message: "File written successfully",
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }

      case "filesystem.list_directory": {
        const { path: dirPath, recursive = false } = args;

        // Check path restrictions
        if (!this.isPathAllowed(dirPath)) {
          return {
            success: false,
            error: `🛡️ [GUARDIAN] Path not allowed: ${dirPath}. Restricted foraging enabled.`,
          };
        }

        try {
          const entries = await fs.readdir(dirPath, {
            withFileTypes: true,
            recursive,
          });
          const files = entries
            .filter((e) => e.isFile())
            .map((e) => ({
              name: e.name,
              path: pathModule.join(dirPath, e.name),
              type: "file",
            }));
          const dirs = entries
            .filter((e) => e.isDirectory())
            .map((e) => ({
              name: e.name,
              path: pathModule.join(dirPath, e.name),
              type: "directory",
            }));

          return {
            success: true,
            path: dirPath,
            files,
            directories: dirs,
            total: files.length + dirs.length,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }

      case "filesystem.create_directory": {
        const { path: dirPath } = args;

        // Check path restrictions
        if (!this.isPathAllowed(dirPath)) {
          return {
            success: false,
            error: `🛡️ [GUARDIAN] Path not allowed: ${dirPath}. Restricted foraging enabled.`,
          };
        }

        try {
          await fs.mkdir(dirPath, { recursive: true });
          return {
            success: true,
            path: dirPath,
            message: "Directory created successfully",
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }

      default:
        throw new Error(`Unknown Filesystem tool: ${toolName}`);
    }
  }

  /**
   * Shutdown all MCP servers
   */
  async shutdown(): Promise<void> {
    console.log("🔌 [MCP BRIDGE] Shutting down all servers...");
    for (const [name, proc] of this.servers.entries()) {
      proc.kill();
      console.log(`🔌 [MCP BRIDGE] ${name} terminated`);
    }
    this.servers.clear();
  }
}

// Singleton instance
export const mcpClient = new McpClientBridge();

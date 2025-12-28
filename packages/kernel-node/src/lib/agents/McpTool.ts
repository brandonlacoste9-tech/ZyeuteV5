/**
 * Model Context Protocol (MCP) Tool Definition
 * Aligning with Vertex AI Agent Builder "Tools and Data" layer
 */
export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  /** The server/origin of this tool */
  server?: string;
}

/**
 * Executes an MCP tool call
 */
export interface McpToolExecution {
  call(args: any): Promise<any>;
}

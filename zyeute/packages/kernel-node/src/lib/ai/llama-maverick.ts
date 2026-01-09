/**
 * Llama 4 Maverick Tool Loop - The "SWAT" Tier Logic
 * Multi-turn reasoning with tool execution for sovereign high-reasoning tasks
 */

import { mcpClient } from "../mcp/client-bridge.js";
import type { McpTool } from "../mcp/client-bridge.js";

export interface LlamaToolLoopStep {
  reasoning: string;
  toolCall?: {
    name: string;
    arguments: Record<string, any>;
    result?: any;
  };
  iteration: number;
}

export interface LlamaToolLoopOptions {
  prompt: string;
  tools: McpTool[];
  onStep?: (step: LlamaToolLoopStep) => void;
  maxIterations?: number;
  temperature?: number;
}

export interface LlamaToolLoopResult {
  finalResponse: string;
  steps: LlamaToolLoopStep[];
  iterations: number;
  toolCalls: number;
  success: boolean;
}

/**
 * Llama 4 Maverick Tool Loop
 * Executes multi-turn reasoning with tool calling
 * Uses the llama-stack server running on localhost:8321
 */
export async function llamaToolLoop(
  options: LlamaToolLoopOptions,
): Promise<LlamaToolLoopResult> {
  const {
    prompt,
    tools,
    onStep,
    maxIterations = 10,
    temperature = 0.7,
  } = options;

  console.log("🦙 [MAVERICK] Starting sovereign reasoning loop...");
  console.log(`📋 [MAVERICK] Prompt: ${prompt}`);
  console.log(`🛠️ [MAVERICK] Available tools: ${tools.length}`);

  const steps: LlamaToolLoopStep[] = [];
  let iteration = 0;
  let toolCalls = 0;
  const conversationHistory: Array<{ role: string; content: string }> = [
    { role: "user", content: prompt },
  ];

  // Convert MCP tools to OpenAI format
  const openAITools = tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));

  while (iteration < maxIterations) {
    iteration++;
    console.log(`\n🔄 [MAVERICK] Iteration ${iteration}/${maxIterations}`);

    try {
      // Call Llama 4 Maverick via llama-stack
      const response = await callLlamaMaverick({
        messages: conversationHistory,
        tools: openAITools,
        temperature,
      });

      const message = response.choices[0].message;
      const content = message.content || "";
      const toolCallsInResponse = message.tool_calls || [];

      // Add assistant message to history
      conversationHistory.push({
        role: "assistant",
        content: content || JSON.stringify({ tool_calls: toolCallsInResponse }),
      });

      // If no tool calls, we have final response
      if (toolCallsInResponse.length === 0 && content) {
        console.log(`✅ [MAVERICK] Final response received`);
        const step: LlamaToolLoopStep = {
          reasoning: content,
          iteration,
        };
        steps.push(step);
        if (onStep) onStep(step);

        return {
          finalResponse: content,
          steps,
          iterations: iteration,
          toolCalls,
          success: true,
        };
      }

      // Execute tool calls
      if (toolCallsInResponse.length > 0) {
        console.log(
          `🔧 [MAVERICK] Executing ${toolCallsInResponse.length} tool call(s)`,
        );

        const toolResults: Array<{
          role: string;
          tool_call_id: string;
          name: string;
          content: string;
        }> = [];

        for (const toolCall of toolCallsInResponse) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

          console.log(`  → [MAVERICK] Tool: ${toolName}`, toolArgs);

          try {
            // Execute tool via MCP bridge
            const toolResult = await mcpClient.executeTool(toolName, toolArgs);
            toolCalls++;

            const resultContent = JSON.stringify(toolResult);

            toolResults.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: toolName,
              content: resultContent,
            });

            // Log step
            const step: LlamaToolLoopStep = {
              reasoning: `Executed ${toolName}`,
              toolCall: {
                name: toolName,
                arguments: toolArgs,
                result: toolResult,
              },
              iteration,
            };
            steps.push(step);
            if (onStep) onStep(step);
          } catch (error: any) {
            console.error(
              `❌ [MAVERICK] Tool execution error: ${error.message}`,
            );
            toolResults.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: toolName,
              content: JSON.stringify({ error: error.message }),
            });
          }
        }

        // Add tool results to conversation
        conversationHistory.push(...toolResults);
      }
    } catch (error: any) {
      console.error(`❌ [MAVERICK] Error in iteration ${iteration}:`, error);
      return {
        finalResponse: `Error: ${error.message}`,
        steps,
        iterations: iteration,
        toolCalls,
        success: false,
      };
    }
  }

  // Max iterations reached
  console.warn(`⚠️ [MAVERICK] Max iterations (${maxIterations}) reached`);
  const lastMessage = conversationHistory[conversationHistory.length - 1];
  return {
    finalResponse: lastMessage?.content || "Max iterations reached",
    steps,
    iterations: iteration,
    toolCalls,
    success: false,
  };
}

/**
 * Call Llama 4 Maverick via llama-stack HTTP API
 */
async function callLlamaMaverick(options: {
  messages: Array<{ role: string; content: string }>;
  tools?: any[];
  temperature?: number;
}): Promise<any> {
  const LLAMA_STACK_URL =
    process.env.LLAMA_STACK_URL || "http://localhost:8321";
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY not set. Llama 4 Maverick requires Groq API key.",
    );
  }

  const payload: any = {
    model: "meta-llama/llama-4-maverick-17b-128e-instruct",
    messages: options.messages,
    temperature: options.temperature || 0.7,
  };

  if (options.tools && options.tools.length > 0) {
    payload.tools = options.tools;
    payload.tool_choice = "auto";
  }

  const response = await fetch(`${LLAMA_STACK_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Llama API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

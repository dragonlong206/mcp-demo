import { callLLM } from "../llm/openai.js";
import { toOpenAITools } from "./toolRegistry.js";
import { executeTool } from "./executor.js";
import { buildInitialContext, enrichConversationWithToolResult } from "./context.js";

export async function runMCP(userInput) {
  const context = buildInitialContext({ userId: "anonymous", locale: "vi-VN", appState: { environment: "demo" } });

  let messages = [
    context.systemMessage,
    { role: "user", content: userInput },
  ];

  const tools = toOpenAITools();
  // Step 1: ask LLM
  let response = await callLLM(messages, tools);
  console.log("LLM Response:", JSON.stringify(response));

  // Step 2: check tool call
  while (response.finish_reason === "tool_calls") {
    const activeToolCall = response.message.tool_calls[0];
    const toolCallId = activeToolCall.id;
    const toolCall = activeToolCall.function;

    const toolResult = await executeTool(toolCall);

    messages = enrichConversationWithToolResult(
      [...messages, response.message],
      {
        toolName: toolCall.name,
        result: toolResult,
        toolCallId,
      },
    );

    // Step 3: send result back to LLM
    response = await callLLM(messages, tools);
    console.log("LLM Response after tool call:", JSON.stringify(response));
  }

  return response.message.content;
}

// Build context

/**
 * Example MCP context provider.
 *
 * This file shows how to construct contextual messages for LLM calls
 * before first tool invocation and after tool results are available.
 *
 * The goal of context.js is to keep shared conversation metadata
 * (user locale, business rules, data schema hints) in one place.
 */

export function buildInitialContext({ userId, locale, appState } = {}) {
  const manifest = [
    "You are an intelligent revenue assistant.",
    "Accept Vietnamese and English user questions.",
    "Always use tools for factual data (get_revenue/time_tool) instead of hallucinating.",
  ];

  return {
    systemMessage: {
      role: "system",
      content: [
        "MCP context for user:",
        `userId=${userId || "anonymous"}`,
        `locale=${locale || "vi-VN"}`,
        `appState=${JSON.stringify(appState || { environment: "demo" })}`,
        "\nBusiness rules:\n- Revenue month must be accepted in MM/YYYY format.\n- If month is not provided, get current time using tool.",
        "\nTool usage example:\nUser: Doanh thu tháng 02/2025 là bao nhiêu?\nAssistant: {\"name\":\"get_revenue\",\"arguments\":\"{\\\"month\\\":\\\"02/2025\\\"}\"}",
      ].join("\n"),
    },
    extraMetadata: {
      userId,
      locale,
      appState,
      firstRun: true,
    },
    manifest,
  };
}

export function enrichConversationWithToolResult(conversation, toolResult) {
  // Add a tool response back into the conversation workflow.
  return [
    ...conversation,
    {
      role: "tool",
      name: toolResult.toolName,
      content: JSON.stringify(toolResult.result),
      tool_call_id: toolResult.toolCallId,
    },
  ];
}

export function resolveLocaleText(locale, key) {
  const messages = {
    "vi-VN": {
      greeting: "Xin chào! Bạn cần biết doanh thu tháng nào?",
      missingMonth: "Vui lòng cho biết tháng theo format MM/YYYY.",
    },
    "en-US": {
      greeting: "Hi! Which month revenue do you want to check?",
      missingMonth: "Please provide a month in MM/YYYY format.",
    },
  };

  return (messages[locale] || messages["en-US"])[key] || "";
}

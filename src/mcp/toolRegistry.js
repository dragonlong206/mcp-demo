import { revenueTool } from "../tools/revenueTool.js";
import { timeTool } from "../tools/timeTool.js";

export const tools = [revenueTool, timeTool];

export function toOpenAITools() {
  return tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.schema
        ? t.schema._def.openapi?.schema || {}
        : { type: "object", properties: {} },
    },
  }));
}

export function getTool(name) {
  return tools.find((t) => t.name === name);
}

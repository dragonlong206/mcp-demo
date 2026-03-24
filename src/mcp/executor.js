import { getTool } from "./toolRegistry.js";

export async function executeTool(toolCall) {
  const { name, arguments: args } = toolCall;

  const tool = getTool(name);
  if (!tool) throw new Error(`Tool not found: ${name}`);

  try {
    let parsedArgs = args;

    if (tool.schema) {
      parsedArgs = tool.schema.parse(JSON.parse(args));
    }

    const result = await tool.handler(parsedArgs);

    return result;
  } catch (err) {
    throw new Error(`Tool execution failed: ${err.message}`);
  }
}

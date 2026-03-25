# 🧩 MCP Demo (Model + Tool + Context)

A lightweight Node.js demonstration of MCP using OpenAI function-calling to show how LLMs can use external tools with proper context management.

## 📦 Project Structure

```
mcp-demo/
├── package.json
├── src/
│   ├── app.js                          # Entry point
│   ├── llm/
│   │   └── openai.js                   # OpenAI Chat Completions API
│   ├── mcp/
│   │   ├── context.js                  # Context builder + tool result enrichment
│   │   ├── orchestrator.js             # MCP main workflow (runMCP)
│   │   ├── executor.js                 # Executes validated tool calls
│   │   └── toolRegistry.js             # Tool list → OpenAI tool schemas
│   ├── tools/
│   │   ├── revenueTool.js              # get_revenue function
│   │   └── timeTool.js                 # get_time function
│   └── utils/
│       └── logger.js                   # Logging utilities
└── README.md
```

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set OpenAI API key

```bash
export OPENAI_API_KEY=your_api_key_here
```

### 3. Run a demo
#### Demo 1
```bash
node src/app.js "What is the revenue for 02/2025?"
```

**Expected output:**

LLM Response:
```json
{
  "index": 0,
  "message": {
    "role": "assistant",
    "content": null,
    "tool_calls": [
      {
        "id": "call_",
        "type": "function",
        "function": {
          "name": "get_revenue",
          "arguments": {
            "month": "02/2025"
          }
        }
      }
    ],
    "refusal": null,
    "annotations": []
  },
  "logprobs": null,
  "finish_reason": "tool_calls"
}
```

LLM Response after tool call:
```json
{
  "index": 0,
  "message": {
    "role": "assistant",
    "content": "The revenue for February 2025 is 150,000.",
    "finish_reason": "stop"
  },
  ...
}
```

Final Answer:
```
The revenue for February 2025 is 150,000.
```

---

## 🧠 Core Components

### `src/mcp/context.js`

Manages contextual information and tool result enrichment:

- **`buildInitialContext({ userId, locale, appState })`**
  - Builds system message with user metadata, business rules, and tool usage examples
  - Returns locale-aware context for LLM instructions

- **`enrichConversationWithToolResult(conversation, { toolName, result, toolCallId })`**
  - Appends tool response to conversation history
  - Maintains proper message chain for multi-turn tool use

- **`resolveLocaleText(locale, key)`**
  - Retrieves locale-specific messages (Vietnamese, English)
  - Supports extensibility for new languages

### `src/mcp/orchestrator.js`

Main MCP workflow (`runMCP`):

1. **Build context** - Initialize system message with user locale and business rules
2. **Call LLM** - Send user query with available tools
3. **Check for tool calls** - If LLM wants to use a tool:
   - Extract tool name and arguments
   - Execute the tool
   - Append tool result to conversation
   - Call LLM again with result
4. **Return answer** - Final text response from LLM

### `src/mcp/executor.js`

Tool execution pipeline:

- Retrieves tool definition from registry
- Validates arguments against Zod schema
- Executes tool handler
- Returns result or error

### `src/mcp/toolRegistry.js`

Tool management:

- Maintains list of all available tools
- Converts tool definitions to OpenAI-compatible schemas
- Provides tool lookup by name

### `src/tools/revenueTool.js`

Example revenue data tool:

```javascript
{
  name: "get_revenue",
  description: "Get revenue for a specific month in MM/YYYY format",
  schema: z.object({
    month: z.string().describe("Month in MM/YYYY format (e.g., '02/2025')")
  }),
  handler: async ({ month }) => { /* returns revenue data */ }
}
```

### `src/llm/openai.js`

OpenAI integration:

- Configures GPT-4o-mini model
- Handles tool schema formatting
- Manages function-calling flow

---

## 🧪 Demo Usage Examples

### Example 1: Revenue query with month

```bash
node src/app.js "What is the revenue for 02/2025?"
```

**Flow:**
- LLM identifies month `02/2025` from Vietnamese query
- Calls `get_revenue` with `{"month":"02/2025"}`
- Returns formatted revenue

### Example 2: Current time query

```bash
node src/app.js "What is today's date?"
```

**Flow:**
- LLM recognizes date query
- May call time tool if configured
- Returns current date response

### Example 3: Query with current month

```bash
node src/app.js "What is the revenue for this month?"
```

**Expected:**
- LLM suggests call `get_time` tool to get current month
- Tool return the current month. LLM suggests to call `get_revenue` tool with current month parameter
- Returns the revenue of current month

---

## 🛠️ How MCP Works: The Flow

```
User Input
    ↓
[1] buildInitialContext
    ↓
[2] callLLM with tools
    ↓
    └─→ LLM response: tool_calls?
         ├─ YES: [3] executeTool
         │        ↓
         │        [4] enrichConversationWithToolResult
         │        ↓
         │        [2] callLLM again (with tool result)
         │
         └─ NO: Return final_response
```

---

## 🛡️ Key Features

### ✅ Context Injection

System context includes:
- User locale and preferences
- Business rules (e.g., month format requirements)
- Tool usage examples  
- Metadata (userId, environment)

### ✅ Schema Validation

- Zod schemas enforce type safety
- Invalid arguments rejected before execution
- Clear error messages

### ✅ Tool Result Feedback Loop

- Tool output automatically appended to conversation
- LLM can reason over tool results
- Supports multi-turn tool usage

### ✅ Multilingual Support

- Vietnamese and English prompts
- Extensible locale resolver
- Business rule enforcement per locale

---

## 🔧 Extending the Demo

### Add a new tool

1. Create `src/tools/myTool.js`:

```javascript
import { z } from "zod";

export const myTool = {
  name: "my_function",
  description: "What this tool does",
  schema: z.object({
    param1: z.string().describe("Parameter description"),
  }),
  handler: async ({ param1 }) => {
    return { result: "data" };
  },
};
```

2. Register in `src/mcp/toolRegistry.js`:

```javascript
import { myTool } from "../tools/myTool.js";

export const tools = [revenueTool, timeTool, myTool];
```

### Improve month validation

In `revenueTool.js`, add regex validation:

```javascript
schema: z.object({
  month: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{4}$/, "Format must be MM/YYYY")
    .describe("Month in MM/YYYY format"),
})
```

### Connect real database

Modify `revenueTool.handler`:

```javascript
handler: async ({ month }) => {
  const data = await db.query("SELECT * FROM revenue WHERE month = ?", [month]);
  return { month, revenue: data[0].revenue };
}
```

### Add authentication

In `orchestrator.js`:

```javascript
const context = buildInitialContext({
  userId: req.user.id,
  locale: req.user.locale,
  appState: { environment: "prod" }
});
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│  User Query (Vietnamese/English)                    │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  orchestrator.js: runMCP()                          │
│  - buildInitialContext()                            │
│  - Add system message + user query                  │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  openai.js: callLLM()                               │
│  - Send to GPT-4o-mini with tool schemas            │
└──────────────────┬──────────────────────────────────┘
                   ↓
         ┌─────────┴─────────┐
         ↓                   ↓
   [Tool Calls]        [Direct Answer]
         ↓                   ↓
    executor.js          RETURN
  - Resolve tool
  - Validate args
  - Execute handler
         ↓
    enrichConversationWithToolResult()
         ↓
    callLLM() again
         ↓
    Return final answer
```

---

## 🧾 Troubleshooting

### Error: `Invalid input expected string, received undefined`

**Cause:** LLM did not provide required parameters  
**Solution:** Improve system prompt with clear examples

### Error: `Invalid parameter: messages with role 'tool' must be a response to preceeding message with tool_calls`

**Cause:** Message chain broken, tool message without matching assistant message  
**Solution:** Ensure `enrichConversationWithToolResult` is called with full conversation history including assistant message

### Error: `401 Unauthorized` when calling OpenAI

**Cause:** Invalid or missing API key  
**Solution:** 
```bash
export OPENAI_API_KEY=sk-...
echo $OPENAI_API_KEY  # verify it's set
```

### LLM not using tools

**Cause:** Tool schema not properly formatted or example not clear  
**Solution:** 
- Check Zod schema conversion in `toolRegistry.js`
- Add explicit tool usage example in `context.js` systemMessage
- Verify tool names are included in OpenAI request

---

## 📝 Recommended Next Steps

- [ ] Add persistent conversation history (database)
- [ ] Implement rate limiting for API calls
- [ ] Add monitoring/logging for tool execution
- [ ] Create integration tests for MCP flow
- [ ] Add TypeScript for type safety
- [ ] Document cost estimation per tool call
- [ ] Implement retry logic for failed tool calls
- [ ] Add support for streaming responses

---

## 🏗️ Technology Stack

- **Runtime:** Node.js v24+
- **LLM:** OpenAI GPT-4o-mini
- **Schema Validation:** Zod
- **Environment:** dotenv

---

## 📄 License

MIT

---

## 🤝 Contributing

Contributions welcome! Follow these patterns:
- Use Zod for schema definitions
- Keep tool handlers pure and side-effect-free
- Test tool outputs match expected schema
- Update README with new tool examples

---

**Made with ❤️ for MCP demos**

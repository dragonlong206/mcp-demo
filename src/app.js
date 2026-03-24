import "dotenv/config";
import { runMCP } from "./mcp/orchestrator.js";

async function main() {
  const input = process.argv[2] || "Doanh thu tháng này là bao nhiêu?";

  const result = await runMCP(input);

  console.log("\nFinal Answer:\n", result);
}

main();

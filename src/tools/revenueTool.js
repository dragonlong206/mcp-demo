import { z } from "zod";

export const revenueTool = {
  name: "get_revenue",
  description: "Get revenue for a specific month. Provide the month in MM/YYYY format (e.g., '02/2025' for February 2025).",

  schema: z.object({
    month: z.string().describe("The month to get revenue for, in MM/YYYY format"),
  }),

  handler: async ({ month }) => {
  
    // TODO: replace with real DB query
    return {
      month: month,
      revenue: 150000,
    };
  },
};

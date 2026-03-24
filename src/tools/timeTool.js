export const timeTool = {
  name: "get_time",
  description: "Get current time",

  schema: null,

  handler: async () => {
    return { now: new Date().toISOString() };
  },
};
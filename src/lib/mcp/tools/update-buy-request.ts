import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function client(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "update_buy_request",
  title: "Update a buy request",
  description:
    "Update the status of a buy request. Only the seller of the underlying listing can accept/reject/complete a request via RLS.",
  inputSchema: {
    id: z.string().uuid(),
    status: z.enum(["accepted", "rejected", "completed"]),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, status }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = client(ctx);
    const { data, error } = await supabase
      .from("buy_requests")
      .update({ status })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Request not found or not permitted." }], isError: true };
    return {
      content: [{ type: "text", text: `Request marked ${status}.` }],
      structuredContent: { request: data },
    };
  },
});

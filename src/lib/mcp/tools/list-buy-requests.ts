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
  name: "list_buy_requests",
  title: "List buy requests",
  description:
    "List the signed-in user's buy requests. Direction 'incoming' returns requests on your listings; 'sent' returns requests you sent to others.",
  inputSchema: {
    direction: z.enum(["incoming", "sent"]),
    status: z.enum(["pending", "accepted", "rejected", "completed", "expired"]).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ direction, status }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = client(ctx);
    const userId = ctx.getUserId()!;
    let q = supabase
      .from("buy_requests")
      .select("*, listing:listings(id,title,price,images,status)")
      .order("created_at", { ascending: false });
    q = direction === "incoming" ? q.eq("seller_id", userId) : q.eq("buyer_id", userId);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `${data?.length ?? 0} ${direction} request(s).` }],
      structuredContent: { requests: data ?? [] },
    };
  },
});

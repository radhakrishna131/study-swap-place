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
  name: "search_listings",
  title: "Search CampusCart listings",
  description:
    "Search available marketplace listings by keyword, college, category, and price range. Returns the most recent matches first.",
  inputSchema: {
    query: z.string().trim().min(1).max(120).optional().describe("Keyword to match against title/description."),
    college: z.string().trim().max(120).optional().describe("Filter by college name (exact match)."),
    category: z
      .enum(["books", "electronics", "furniture", "clothing", "sports", "stationery", "hostel", "other"])
      .optional()
      .describe("Filter by listing category."),
    min_price: z.number().min(0).optional(),
    max_price: z.number().min(0).optional(),
    limit: z.number().int().min(1).max(50).optional().describe("Max results, default 20."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = client(ctx);
    let q = supabase
      .from("listings")
      .select("id,title,description,price,category,condition,college,hostel,images,status,created_at,seller_id")
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(input.limit ?? 20);

    if (input.query) q = q.or(`title.ilike.%${input.query}%,description.ilike.%${input.query}%`);
    if (input.college) q = q.eq("college", input.college);
    if (input.category) q = q.eq("category", input.category);
    if (typeof input.min_price === "number") q = q.gte("price", input.min_price);
    if (typeof input.max_price === "number") q = q.lte("price", input.max_price);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Found ${data?.length ?? 0} listings.` }],
      structuredContent: { listings: data ?? [] },
    };
  },
});

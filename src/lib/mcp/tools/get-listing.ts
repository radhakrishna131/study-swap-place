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
  name: "get_listing",
  title: "Get listing details",
  description: "Fetch full details for a single CampusCart listing by id, including seller contact preferences.",
  inputSchema: { id: z.string().uuid().describe("Listing id (uuid).") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = client(ctx);
    const { data: listing, error } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!listing) return { content: [{ type: "text", text: "Listing not found." }], isError: true };
    const { data: seller } = await supabase
      .from("profiles")
      .select("id,full_name,college,hostel,instagram,whatsapp,phone,preferred_contact,verified")
      .eq("id", listing.seller_id)
      .maybeSingle();
    return {
      content: [{ type: "text", text: `${listing.title} — ₹${listing.price}` }],
      structuredContent: { listing, seller },
    };
  },
});

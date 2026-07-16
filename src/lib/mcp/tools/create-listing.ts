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
  name: "create_listing",
  title: "Create a listing",
  description:
    "Create a new CampusCart listing for the signed-in user. The listing is created as 'available' and appears in the marketplace immediately.",
  inputSchema: {
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().max(2000).optional(),
    price: z.number().min(0),
    category: z.enum([
      "books",
      "electronics",
      "furniture",
      "clothing",
      "sports",
      "stationery",
      "hostel",
      "other",
    ]),
    condition: z.enum(["new", "like_new", "good", "fair", "poor"]),
    college: z.string().trim().min(2).max(120),
    hostel: z.string().trim().max(120).optional(),
    pickup_location: z.string().trim().max(200).optional(),
    negotiable: z.boolean().optional(),
    images: z.array(z.string().url()).max(6).optional().describe("Public image URLs (e.g. hosted on Cloudinary)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = client(ctx);
    const { data, error } = await supabase
      .from("listings")
      .insert({
        seller_id: ctx.getUserId()!,
        title: input.title,
        description: input.description ?? "",
        price: input.price,
        category: input.category,
        condition: input.condition,
        college: input.college,
        hostel: input.hostel ?? null,
        pickup_location: input.pickup_location ?? null,
        negotiable: input.negotiable ?? false,
        images: input.images ?? [],
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Listing created: ${data.title}` }],
      structuredContent: { listing: data },
    };
  },
});

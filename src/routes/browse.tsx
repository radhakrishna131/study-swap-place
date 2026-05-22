import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import { Input } from "@/components/ui/input";
import { z } from "zod";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/browse")({
  validateSearch: searchSchema,
  component: BrowsePage,
  head: () => ({ meta: [{ title: "Browse listings — CampusCart" }] }),
});

function BrowsePage() {
  const { category, q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState(q ?? "");

  const { data: listings, isLoading } = useQuery({
    queryKey: ["listings", category, q],
    queryFn: async () => {
      let req = supabase
        .from("listings")
        .select("id,title,price,images,category,college,hostel,status,seller_id,profiles:seller_id(full_name,verified)")
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(60);
      if (category) req = req.eq("category", category as CategoryKey);
      if (q) req = req.ilike("title", `%${q}%`);
      const { data, error } = await req;
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        price: row.price,
        images: row.images ?? [],
        category: row.category,
        college: row.college,
        hostel: row.hostel,
        status: row.status,
        seller: Array.isArray(row.profiles) ? row.profiles[0] : row.profiles,
      })) as ListingCardData[];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-3xl md:text-4xl font-bold">Browse</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ search: (s: { category?: string; q?: string }) => ({ ...s, q: query || undefined }) });
          }}
          className="relative max-w-xl"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books, cycles, headphones…"
            className="pl-10 h-12 border-2 border-ink shadow-pop-sm"
          />
        </form>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <Link
            to="/browse"
            search={{ q }}
            className={`shrink-0 rounded-full border-2 border-ink px-4 py-1.5 text-xs font-bold uppercase transition ${
              !category ? "bg-ink text-background" : "bg-card hover:bg-secondary"
            }`}
          >
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              to="/browse"
              search={{ category: c.key, q }}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-4 py-1.5 text-xs font-bold uppercase transition ${
                category === c.key ? "bg-ink text-background" : "bg-card hover:bg-secondary"
              }`}
            >
              <c.icon className="h-3.5 w-3.5" /> {c.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : !listings || listings.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-ink/20 p-12 text-center">
            <p className="text-muted-foreground">No listings yet. Be the first to sell something!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

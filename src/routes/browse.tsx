import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { CATEGORIES, CONDITIONS, type CategoryKey } from "@/lib/categories";
import { COLLEGES } from "@/lib/colleges";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  college: z.string().optional(),
  condition: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
});

export const Route = createFileRoute("/browse")({
  validateSearch: searchSchema,
  component: BrowsePage,
  head: () => ({ meta: [{ title: "Browse listings — CampusCart" }] }),
});

function BrowsePage() {
  const { category, q, college, condition, min, max } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState(q ?? "");
  const [collegeQuery, setCollegeQuery] = useState(college ?? "");
  const [showFilters, setShowFilters] = useState(false);

  // Live college list from existing listings + curated seed list
  const { data: collegeOptions } = useQuery({
    queryKey: ["college-options"],
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("college")
        .not("college", "is", null);
      const fromDb = (data ?? [])
        .map((r) => (r.college ?? "").trim())
        .filter(Boolean);
      return Array.from(new Set([...COLLEGES, ...fromDb])).sort();
    },
    staleTime: 60_000,
  });

  const { data: listings, isLoading } = useQuery({
    queryKey: ["listings", category, q, college, condition, min, max],
    queryFn: async () => {
      let req = supabase
        .from("listings")
        .select(
          "id,title,price,images,category,college,hostel,status,condition,seller_id,profiles:seller_id(full_name,verified)"
        )
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(80);
      if (category) req = req.eq("category", category as CategoryKey);
      if (q) req = req.ilike("title", `%${q}%`);
      if (college) req = req.ilike("college", college);
      if (condition) req = req.eq("condition", condition as "new" | "like_new" | "good" | "fair" | "poor");
      if (typeof min === "number" && !Number.isNaN(min)) req = req.gte("price", min);
      if (typeof max === "number" && !Number.isNaN(max)) req = req.lte("price", max);
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

  const activeFilterCount = useMemo(
    () => [college, condition, min, max].filter((v) => v !== undefined && v !== "" && !Number.isNaN(v as number)).length,
    [college, condition, min, max]
  );

  function updateSearch(patch: Record<string, string | number | undefined>) {
    navigate({
      search: (s) => {
        const next = { ...s, ...patch } as Record<string, unknown>;
        for (const k of Object.keys(next)) {
          if (next[k] === "" || next[k] === undefined || Number.isNaN(next[k] as number)) delete next[k];
        }
        return next as typeof s;
      },
    });
  }

  function clearAll() {
    setQuery("");
    setCollegeQuery("");
    navigate({ search: () => ({}) });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="font-display text-3xl md:text-4xl font-bold">Browse</h1>
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="text-xs font-semibold text-muted-foreground hover:text-ink inline-flex items-center gap-1">
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateSearch({ q: query || undefined });
          }}
          className="flex gap-2 max-w-2xl"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books, cycles, headphones…"
              className="pl-10 h-12 border-2 border-ink shadow-pop-sm"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 border-2 border-ink shadow-pop-sm relative"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold border border-ink">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </form>

        {showFilters && (
          <div className="rounded-2xl border-2 border-ink bg-card shadow-pop-sm p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">College</label>
              <Input
                list="college-list"
                value={collegeQuery}
                onChange={(e) => setCollegeQuery(e.target.value)}
                onBlur={() => updateSearch({ college: collegeQuery || undefined })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    updateSearch({ college: collegeQuery || undefined });
                  }
                }}
                placeholder="Any college"
              />
              <datalist id="college-list">
                {(collegeOptions ?? COLLEGES).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Condition</label>
              <Select
                value={condition ?? "any"}
                onValueChange={(v) => updateSearch({ condition: v === "any" ? undefined : v })}
              >
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any condition</SelectItem>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Min ₹</label>
              <Input
                type="number"
                min="0"
                defaultValue={min ?? ""}
                onBlur={(e) => updateSearch({ min: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Max ₹</label>
              <Input
                type="number"
                min="0"
                defaultValue={max ?? ""}
                onBlur={(e) => updateSearch({ max: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="No limit"
              />
            </div>
          </div>
        )}

        {/* Active college chips quick-select */}
        {!showFilters && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => updateSearch({ college: undefined })}
              className={`shrink-0 rounded-full border-2 border-ink px-4 py-1.5 text-xs font-bold uppercase transition ${
                !college ? "bg-ink text-background" : "bg-card hover:bg-secondary"
              }`}
            >
              All colleges
            </button>
            {(collegeOptions ?? COLLEGES).slice(0, 12).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCollegeQuery(c);
                  updateSearch({ college: c });
                }}
                className={`shrink-0 rounded-full border-2 border-ink px-4 py-1.5 text-xs font-bold uppercase transition ${
                  college === c ? "bg-ink text-background" : "bg-card hover:bg-secondary"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <Link
            to="/browse"
            search={{ q, college, condition, min, max }}
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
              search={{ category: c.key, q, college, condition, min, max }}
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
            <p className="text-muted-foreground">No listings match your filters. Try clearing them or be the first to sell something!</p>
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

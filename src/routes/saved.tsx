import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
  head: () => ({ meta: [{ title: "Saved items — CampusCart" }] }),
});

function SavedPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["saved", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("listing:listings(id,title,price,images,category,college,hostel,status,profiles:seller_id(full_name,verified))")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? [])
        .map((row) => {
          const l = Array.isArray(row.listing) ? row.listing[0] : row.listing;
          if (!l) return null;
          return {
            id: l.id,
            title: l.title,
            price: l.price,
            images: l.images ?? [],
            category: l.category,
            college: l.college,
            hostel: l.hostel,
            status: l.status,
            seller: Array.isArray(l.profiles) ? l.profiles[0] : l.profiles,
          } as ListingCardData;
        })
        .filter(Boolean) as ListingCardData[];
    },
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl md:text-4xl font-bold">Saved items</h1>
      <p className="text-muted-foreground mt-1">Listings you've bookmarked.</p>

      <div className="mt-8">
        {!data || data.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-ink/20 p-12 text-center text-muted-foreground">
            Nothing saved yet. Tap the heart on listings you like.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {data.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}

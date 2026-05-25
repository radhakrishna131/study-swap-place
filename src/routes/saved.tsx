import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { db } from "@/integrations/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
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
    queryKey: ["saved", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, "favorites"),
        where("user_id", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const favorites: ListingCardData[] = [];
      
      for (const doc of querySnapshot.docs) {
        const favoriteData = doc.data();
        
        // If listing_id is stored, fetch the listing
        if (favoriteData.listing_id) {
          const listingDoc = await getDocs(
            query(
              collection(db, "listings"),
              where("__name__", "==", favoriteData.listing_id)
            )
          );
          
          if (!listingDoc.empty) {
            const listingData = listingDoc.docs[0].data();
            favorites.push({
              id: listingDoc.docs[0].id,
              title: listingData.title,
              price: listingData.price,
              images: listingData.images ?? [],
              category: listingData.category,
              college: listingData.college,
              hostel: listingData.hostel,
              status: listingData.status,
              seller: listingData.seller,
            } as ListingCardData);
          }
        }
      }
      
      return favorites;
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

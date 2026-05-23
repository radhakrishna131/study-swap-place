import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  BadgeCheck,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Instagram,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categoryLabel, conditionLabel } from "@/lib/categories";

export const Route = createFileRoute("/listing/$id")({
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [active, setActive] = useState(0);
  const [showContact, setShowContact] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, profiles:seller_id(full_name,verified,college,department,phone,whatsapp,instagram,preferred_contact,avatar_url)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: isFav } = useQuery({
    queryKey: ["fav", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("listing_id")
        .eq("listing_id", id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Listing not found</h1>
        <Button asChild className="mt-6"><Link to="/browse">Back to browse</Link></Button>
      </div>
    );
  }

  const isOwner = user?.id === data.seller_id;
  const seller = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  const images: string[] = data.images ?? [];

  async function toggleFav() {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (isFav) {
      await supabase.from("favorites").delete().eq("listing_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("favorites").insert({ listing_id: id, user_id: user.id });
    }
    qc.invalidateQueries({ queryKey: ["fav", id] });
    qc.invalidateQueries({ queryKey: ["saved"] });
  }

  async function markSold() {
    const { error } = await supabase.from("listings").update({ status: "sold" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marked as sold");
    qc.invalidateQueries({ queryKey: ["listing", id] });
  }

  async function deleteListing() {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Listing deleted");
    navigate({ to: "/profile" });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Gallery */}
        <div className="lg:col-span-3">
          <div className="aspect-square rounded-3xl border-2 border-ink bg-secondary overflow-hidden shadow-pop">
            {images[active] ? (
              <img src={images[active]} alt={data.title} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">No image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`shrink-0 h-20 w-20 rounded-xl overflow-hidden border-2 ${i === active ? "border-ink" : "border-ink/20"}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase">
              <Badge variant="secondary" className="border border-ink/10">{categoryLabel(data.category)}</Badge>
              <Badge variant="outline" className="border-ink/30">{conditionLabel(data.condition)}</Badge>
              {data.status !== "available" && (
                <Badge className="bg-ink text-background uppercase">{data.status}</Badge>
              )}
            </div>
            <h1 className="mt-3 font-display text-3xl md:text-4xl font-bold leading-tight">{data.title}</h1>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display text-4xl font-bold tabular-nums">
                ₹{Number(data.price).toLocaleString("en-IN")}
              </span>
              {data.negotiable && <span className="text-xs font-bold text-muted-foreground uppercase">Negotiable</span>}
            </div>
          </div>

          {data.description && (
            <p className="text-sm whitespace-pre-wrap text-ink/80">{data.description}</p>
          )}

          <div className="rounded-2xl border-2 border-ink p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{data.college || "Campus"}{data.hostel ? ` · ${data.hostel}` : ""}</span>
            </div>
            {data.pickup_location && (
              <div className="text-muted-foreground pl-6">Pickup: {data.pickup_location}</div>
            )}
          </div>

          {/* Seller */}
          <div className="rounded-2xl border-2 border-ink bg-card p-4 shadow-pop-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary border-2 border-ink grid place-items-center font-bold">
                {seller?.full_name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 font-semibold">
                  <span className="truncate">{seller?.full_name || "Student"}</span>
                  {seller?.verified && <BadgeCheck className="h-4 w-4 text-success shrink-0" />}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {seller?.college}{seller?.department ? ` · ${seller.department}` : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isOwner ? (
            <div className="flex gap-2">
              {data.status === "available" && (
                <Button onClick={markSold} className="flex-1">Mark as sold</Button>
              )}
              <Button onClick={deleteListing} variant="outline" className="border-2 border-ink">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {seller?.phone || seller?.whatsapp || seller?.instagram ? (
                <>
                  {!showContact ? (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => setShowContact(true)}
                    >
                      <MessageCircle className="h-4 w-4" /> Show seller contact
                      {seller?.preferred_contact && (
                        <span className="ml-1 text-xs opacity-70">· prefers {seller.preferred_contact}</span>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      {seller.whatsapp && (
                        <Button asChild size="lg" className="w-full bg-success hover:bg-success/90 text-background">
                          <a
                            href={`https://wa.me/${seller.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Hi! I'm interested in your "${data.title}" on CampusCart.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="h-4 w-4" /> WhatsApp · {seller.whatsapp}
                          </a>
                        </Button>
                      )}
                      {seller.phone && (
                        <Button asChild size="lg" variant="outline" className="w-full border-2 border-ink">
                          <a href={`tel:${seller.phone}`}>
                            <Phone className="h-4 w-4" /> Call · {seller.phone}
                          </a>
                        </Button>
                      )}
                      {seller.instagram && (
                        <Button asChild size="lg" variant="outline" className="w-full border-2 border-ink">
                          <a
                            href={`https://instagram.com/${seller.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Instagram className="h-4 w-4" /> @{seller.instagram}
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <Button size="lg" className="w-full" disabled>
                  <MessageCircle className="h-4 w-4" /> Seller hasn't added contact
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                className="w-full border-2 border-ink"
                onClick={toggleFav}
              >
                <Heart className={`h-4 w-4 ${isFav ? "fill-destructive text-destructive" : ""}`} />
                {isFav ? "Saved" : "Save for later"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

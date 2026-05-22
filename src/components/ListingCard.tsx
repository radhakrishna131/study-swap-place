import { Link } from "@tanstack/react-router";
import { MapPin, BadgeCheck } from "lucide-react";
import { categoryLabel } from "@/lib/categories";

export interface ListingCardData {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  college?: string | null;
  hostel?: string | null;
  status: string;
  seller?: { full_name: string; verified: boolean } | null;
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const img = listing.images?.[0];
  return (
    <Link
      to="/listing/$id"
      params={{ id: listing.id }}
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-ink bg-secondary shadow-pop-sm transition-transform group-hover:-translate-y-1 group-hover:shadow-pop">
        {img ? (
          <img
            src={img}
            alt={listing.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground text-xs">
            No image
          </div>
        )}
        <span className="absolute top-2 left-2 rounded-full bg-background/90 backdrop-blur px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border border-ink/10">
          {categoryLabel(listing.category)}
        </span>
        {listing.status !== "available" && (
          <span className="absolute top-2 right-2 rounded-full bg-ink text-background px-2 py-0.5 text-[10px] font-bold uppercase">
            {listing.status}
          </span>
        )}
      </div>
      <div className="mt-3 px-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-medium text-sm truncate">{listing.title}</h3>
          <span className="font-display font-bold tabular-nums">
            ₹{Number(listing.price).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">
            {listing.hostel || listing.college || "Campus"}
          </span>
          {listing.seller?.verified && (
            <BadgeCheck className="h-3.5 w-3.5 text-success ml-auto" />
          )}
        </div>
      </div>
    </Link>
  );
}

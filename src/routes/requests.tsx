import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, X, Package, Inbox } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/requests")({
  component: RequestsPage,
  head: () => ({ meta: [{ title: "Buy requests — CampusCart" }] }),
});

type BuyRequest = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string | null;
  pickup_address: string;
  pickup_date: string;
  pickup_time: string;
  message: string | null;
  status: "pending" | "accepted" | "rejected" | "completed" | "expired";
  created_at: string;
  listings?: { title: string; price: number; images: string[] } | null;
};

const sb = supabase as unknown as {
  from: (t: string) => any;
};

function RequestsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data: incoming } = useQuery({
    queryKey: ["requests-incoming", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await sb
        .from("buy_requests")
        .select("*, listings:listing_id(title,price,images)")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BuyRequest[];
    },
  });

  const { data: outgoing } = useQuery({
    queryKey: ["requests-outgoing", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await sb
        .from("buy_requests")
        .select("*, listings:listing_id(title,price,images)")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BuyRequest[];
    },
  });

  async function updateStatus(id: string, status: BuyRequest["status"]) {
    const { error } = await sb.from("buy_requests").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Request ${status}`);
    qc.invalidateQueries({ queryKey: ["requests-incoming"] });
  }

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-bold mb-6">Buy requests</h1>
      <Tabs defaultValue="incoming">
        <TabsList>
          <TabsTrigger value="incoming">
            <Inbox className="h-4 w-4 mr-1" /> Incoming ({incoming?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            <Package className="h-4 w-4 mr-1" /> Sent ({outgoing?.length ?? 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="incoming" className="space-y-3 mt-4">
          {!incoming || incoming.length === 0 ? (
            <EmptyState text="No incoming requests yet." />
          ) : (
            incoming.map((r) => (
              <RequestCard key={r.id} r={r} onUpdate={updateStatus} isSeller />
            ))
          )}
        </TabsContent>
        <TabsContent value="outgoing" className="space-y-3 mt-4">
          {!outgoing || outgoing.length === 0 ? (
            <EmptyState text="You haven't sent any requests." />
          ) : (
            outgoing.map((r) => <RequestCard key={r.id} r={r} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/30 p-10 text-center text-muted-foreground">
      {text}
    </div>
  );
}

function statusColor(s: BuyRequest["status"]) {
  return s === "pending"
    ? "bg-secondary"
    : s === "accepted"
      ? "bg-success text-background"
      : s === "rejected"
        ? "bg-destructive text-background"
        : s === "expired"
          ? "bg-muted text-muted-foreground"
          : "bg-ink text-background";
}

function RequestCard({
  r,
  isSeller,
  onUpdate,
}: {
  r: BuyRequest;
  isSeller?: boolean;
  onUpdate?: (id: string, s: BuyRequest["status"]) => void;
}) {
  const [showBuyer, setShowBuyer] = useState(false);
  return (
    <div className="rounded-2xl border-2 border-ink p-4 bg-card shadow-pop-sm">
      <div className="flex items-start gap-3">
        <Link to="/listing/$id" params={{ id: r.listing_id }} className="shrink-0">
          <div className="h-16 w-16 rounded-xl overflow-hidden border-2 border-ink bg-secondary">
            {r.listings?.images?.[0] ? (
              <img src={r.listings.images[0]} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/listing/$id" params={{ id: r.listing_id }} className="font-semibold truncate hover:underline">
              {r.listings?.title || "Listing"}
            </Link>
            <Badge className={`uppercase text-[10px] ${statusColor(r.status)}`}>{r.status}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Pickup {r.pickup_date} · {r.pickup_time} · {r.pickup_address}
          </div>
          {r.message && <p className="mt-1 text-sm">{r.message}</p>}
          {isSeller && (
            <>
              <button
                onClick={() => setShowBuyer((v) => !v)}
                className="mt-2 text-xs font-bold underline"
              >
                {showBuyer ? "Hide" : "Show"} buyer contact
              </button>
              {showBuyer && (
                <div className="mt-1 text-sm space-y-0.5">
                  <div>{r.buyer_name}</div>
                  <div className="text-muted-foreground">
                    📞 <a className="underline" href={`tel:${r.buyer_phone}`}>{r.buyer_phone}</a>
                  </div>
                  {r.buyer_email && (
                    <div className="text-muted-foreground">
                      ✉️ <a className="underline" href={`mailto:${r.buyer_email}`}>{r.buyer_email}</a>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {isSeller && r.status === "pending" && onUpdate && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => onUpdate(r.id, "accepted")} className="bg-success text-background hover:bg-success/90">
            <Check className="h-4 w-4" /> Accept
          </Button>
          <Button size="sm" variant="outline" className="border-2 border-ink" onClick={() => onUpdate(r.id, "rejected")}>
            <X className="h-4 w-4" /> Reject
          </Button>
        </div>
      )}
      {isSeller && r.status === "accepted" && onUpdate && (
        <Button size="sm" className="mt-3" onClick={() => onUpdate(r.id, "completed")}>
          Mark completed
        </Button>
      )}
    </div>
  );
}

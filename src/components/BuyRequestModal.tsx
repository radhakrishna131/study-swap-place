import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  buyer_name: z.string().trim().min(2, "Enter your full name").max(80),
  buyer_phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{7,15}$/, "Enter a valid phone number"),
  buyer_email: z.string().trim().email().max(120).optional().or(z.literal("")),
  pickup_address: z.string().trim().min(4, "Pickup address required").max(200),
  pickup_date: z.string().min(1, "Pick a date"),
  pickup_time: z.string().min(1, "Pick a time"),
  message: z.string().max(500).optional(),
});

export interface BuyRequestSeller {
  id: string;
  full_name?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  preferred_contact?: string | null;
}

export interface BuyRequestListing {
  id: string;
  title: string;
  price: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  listing: BuyRequestListing;
  seller: BuyRequestSeller;
}

export function BuyRequestModal({ open, onOpenChange, listing, seller }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    buyer_name: "",
    buyer_phone: "",
    buyer_email: "",
    pickup_address: "",
    pickup_date: "",
    pickup_time: "",
    message: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to request pickup");
      navigate({ to: "/login" });
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    setSubmitting(true);
    const payload = {
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: seller.id,
      buyer_name: parsed.data.buyer_name,
      buyer_phone: parsed.data.buyer_phone,
      buyer_email: parsed.data.buyer_email || null,
      pickup_address: parsed.data.pickup_address,
      pickup_date: parsed.data.pickup_date,
      pickup_time: parsed.data.pickup_time,
      message: parsed.data.message || null,
    };
    // buy_requests + notifications tables are new — cast around generated types
    const sb = supabase as unknown as {
      from: (t: string) => {
        insert: (v: unknown) => Promise<{ error: { message: string } | null }>;
      };
    };
    const { error } = await sb.from("buy_requests").insert(payload);
    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }
    await sb.from("notifications").insert({
      user_id: seller.id,
      type: "buy_request",
      title: "New buy request",
      body: `${parsed.data.buyer_name} wants to pick up "${listing.title}"`,
      link: "/requests",
    });
    setSubmitting(false);
    toast.success("Request sent to seller!");
    onOpenChange(false);

    // Deliver via seller's preferred contact
    const pref = (seller.preferred_contact || "whatsapp").toLowerCase();
    const summary = [
      `Hi ${seller.full_name || "there"}! I'd like to buy "${listing.title}" (₹${Number(listing.price).toLocaleString("en-IN")}) on CampusCart.`,
      ``,
      `Name: ${parsed.data.buyer_name}`,
      `Phone: ${parsed.data.buyer_phone}`,
      parsed.data.buyer_email ? `Email: ${parsed.data.buyer_email}` : null,
      `Pickup: ${parsed.data.pickup_address}`,
      `When: ${parsed.data.pickup_date} at ${parsed.data.pickup_time}`,
      parsed.data.message ? `\nNote: ${parsed.data.message}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    if (pref === "whatsapp" && seller.whatsapp) {
      const num = seller.whatsapp.replace(/[^\d]/g, "");
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(summary)}`, "_blank");
    } else if (pref === "email" && parsed.data.buyer_email) {
      // best-effort mailto
      window.open(
        `mailto:?subject=${encodeURIComponent(`Buy request: ${listing.title}`)}&body=${encodeURIComponent(summary)}`,
      );
    }
    navigate({ to: "/requests" });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Request pickup</DialogTitle>
          <DialogDescription>
            {listing.title} · ₹{Number(listing.price).toLocaleString("en-IN")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="bn">Full name *</Label>
            <Input id="bn" value={form.buyer_name} onChange={(e) => setForm({ ...form, buyer_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bp">Phone *</Label>
              <Input id="bp" placeholder="+91 9xxxxxxxxx" value={form.buyer_phone} onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="be">Email</Label>
              <Input id="be" type="email" value={form.buyer_email} onChange={(e) => setForm({ ...form, buyer_email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pa">Pickup address *</Label>
            <Input id="pa" placeholder="Hostel block / landmark" value={form.pickup_address} onChange={(e) => setForm({ ...form, pickup_address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pd">Date *</Label>
              <Input id="pd" type="date" min={new Date().toISOString().slice(0, 10)} value={form.pickup_date} onChange={(e) => setForm({ ...form, pickup_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt">Time *</Label>
              <Input id="pt" type="time" value={form.pickup_time} onChange={(e) => setForm({ ...form, pickup_time: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="msg">Message to seller</Label>
            <Textarea id="msg" rows={3} maxLength={500} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Sending…" : "Send request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

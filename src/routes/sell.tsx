import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CATEGORIES, CONDITIONS, type CategoryKey } from "@/lib/categories";
import { uploadToCloudinary } from "@/lib/cloudinary";

const schema = z.object({
  title: z.string().trim().min(3, "Title too short").max(100),
  description: z.string().trim().max(2000).default(""),
  price: z.number().min(0).max(10_000_000),
  category: z.enum(CATEGORIES.map((c) => c.key) as [CategoryKey, ...CategoryKey[]]),
  condition: z.enum(CONDITIONS.map((c) => c.key) as [string, ...string[]]),
  hostel: z.string().trim().max(60).default(""),
  pickup_location: z.string().trim().max(120).default(""),
  negotiable: z.boolean(),
});

export const Route = createFileRoute("/sell")({
  component: SellPage,
  head: () => ({ meta: [{ title: "Sell an item — CampusCart" }] }),
});

function SellPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "books" as CategoryKey,
    condition: "good" as string,
    hostel: "",
    pickup_location: "",
    negotiable: true,
  });
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - images.length);
    setImages((prev) => [...prev, ...files].slice(0, 5));
    e.target.value = "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const priceNum = Number(form.price);
    const parsed = schema.safeParse({ ...form, price: priceNum });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (images.length === 0) {
      toast.error("Add at least one photo");
      return;
    }

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of images) {
        const url = await uploadToCloudinary(file, `campuscart/listings/${user.id}`);
        urls.push(url);
      }

      // Use seller's college from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("college")
        .eq("id", user.id)
        .maybeSingle();

      const { data: inserted, error: insErr } = await supabase
        .from("listings")
        .insert({
          seller_id: user.id,
          title: parsed.data.title,
          description: parsed.data.description,
          price: parsed.data.price,
          category: parsed.data.category,
          condition: parsed.data.condition as "new" | "like_new" | "good" | "fair" | "poor",
          hostel: parsed.data.hostel,
          pickup_location: parsed.data.pickup_location,
          negotiable: parsed.data.negotiable,
          college: profile?.college ?? "",
          images: urls,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      toast.success("Listing posted!");
      navigate({ to: "/listing/$id", params: { id: inserted.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setUploading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl md:text-4xl font-bold">Sell an item</h1>
      <p className="text-muted-foreground mt-1">Post in 60 seconds. Reach students on your campus.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        {/* Images */}
        <div>
          <Label>Photos (up to 5)</Label>
          <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-3">
            {images.map((file, i) => (
              <div key={i} className="relative aspect-square rounded-xl border-2 border-ink overflow-hidden shadow-pop-sm">
                <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-ink text-background"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-ink/30 grid place-items-center cursor-pointer hover:bg-secondary transition">
                <input type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </label>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Casio FX-991ES Plus calculator" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Condition, age, what's included…" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹)</Label>
            <Input id="price" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <div className="flex items-end gap-2 pb-2">
            <Switch id="neg" checked={form.negotiable} onCheckedChange={(v) => setForm({ ...form, negotiable: v })} />
            <Label htmlFor="neg" className="cursor-pointer">Negotiable</Label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as CategoryKey })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Condition</Label>
            <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((c) => (
                  <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hostel">Hostel / Block</Label>
            <Input id="hostel" value={form.hostel} onChange={(e) => setForm({ ...form, hostel: e.target.value })} placeholder="e.g. Hostel 4" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pickup">Pickup spot</Label>
            <Input id="pickup" value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} placeholder="e.g. Main canteen" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1" size="lg" disabled={uploading}>
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Posting…</> : "Post listing"}
          </Button>
          <Button asChild type="button" variant="outline" size="lg">
            <Link to="/browse">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

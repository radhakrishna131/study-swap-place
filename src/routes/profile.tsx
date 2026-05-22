import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BadgeCheck, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Your profile — CampusCart" }] }),
});

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    college: "",
    department: "",
    hostel: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data: profile, refetch } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        college: profile.college ?? "",
        department: profile.department ?? "",
        hostel: profile.hostel ?? "",
        phone: profile.phone ?? "",
      });
    }
  }, [profile]);

  const { data: myListings } = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id,title,price,images,category,college,hostel,status")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ListingCardData[];
    },
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(form)
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    refetch();
  }

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-10">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-primary border-2 border-ink grid place-items-center font-display text-2xl font-bold shadow-pop-sm">
          {form.full_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            {form.full_name || "Your profile"}
            {profile?.verified && <BadgeCheck className="h-6 w-6 text-success" />}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <form onSubmit={save} className="rounded-3xl border-2 border-ink p-6 bg-card shadow-pop-sm grid sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="col">College</Label>
          <Input id="col" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dep">Department</Label>
          <Input id="dep" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="host">Hostel / Block</Label>
          <Input id="host" value={form.hostel} onChange={(e) => setForm({ ...form, hostel: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (shared with interested buyers)</Label>
          <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      <div>
        <h2 className="font-display text-2xl font-bold mb-4">Your listings</h2>
        {!myListings || myListings.length === 0 ? (
          <p className="text-muted-foreground">You haven't listed anything yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {myListings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}

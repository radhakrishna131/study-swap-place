import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, BadgeCheck, Save, Upload } from "lucide-react";
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
  const qc = useQueryClient();
  const [form, setForm] = useState({
    full_name: "",
    college: "",
    department: "",
    hostel: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    preferred_contact: "phone",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
        whatsapp: (profile as { whatsapp?: string }).whatsapp ?? "",
        instagram: (profile as { instagram?: string }).instagram ?? "",
        preferred_contact: (profile as { preferred_contact?: string }).preferred_contact ?? "phone",
      });
      // Set preview URL from existing avatar
      if (profile.avatar_url) {
        setPreviewUrl(profile.avatar_url);
      }
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

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      // Create a preview URL for immediate display
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(localPreviewUrl);

      // Upload to Supabase storage
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;

      // Delete old avatar if it exists
      if (profile?.avatar_url) {
        try {
          const oldPath = profile.avatar_url.split("/").slice(-1)[0];
          await supabase.storage.from("avatars").remove([`${user.id}/${oldPath}`]);
        } catch (err) {
          // Silently fail if old file doesn't exist
        }
      }

      // Upload new avatar
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (upErr) throw upErr;

      // Get public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = data.publicUrl;

      // Update profile with avatar URL
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (updateErr) throw updateErr;

      toast.success("Profile photo updated!");
      setPreviewUrl(avatarUrl);
      refetch();
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
      // Reset preview on error
      if (profile?.avatar_url) {
        setPreviewUrl(profile.avatar_url);
      }
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

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
        <div className="relative group">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile"
              className="h-16 w-16 rounded-2xl border-2 border-ink object-cover shadow-pop-sm"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-primary border-2 border-ink grid place-items-center font-display text-2xl font-bold shadow-pop-sm">
              {form.full_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase()}
            </div>
          )}
          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 rounded-2xl bg-black/50 grid place-items-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
          >
            <Upload className="h-5 w-5 text-white" />
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={uploadingPhoto}
            className="hidden"
          />
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
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="+91 9xxxxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wa">WhatsApp</Label>
          <Input id="wa" placeholder="+91 9xxxxxxxxx" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ig">Instagram handle</Label>
          <Input id="ig" placeholder="yourhandle (no @)" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value.replace(/^@/, "") })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pc">Preferred contact</Label>
          <select
            id="pc"
            value={form.preferred_contact}
            onChange={(e) => setForm({ ...form, preferred_contact: e.target.value })}
            className="h-10 w-full rounded-md border-2 border-ink bg-background px-3 text-sm"
          >
            <option value="phone">Phone call</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="instagram">Instagram DM</option>
            <option value="in_app">In-app only</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <a href="/requests" className="text-sm font-bold underline">
            → View your buy requests dashboard
          </a>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={saving || uploadingPhoto}>
            <Save className="h-4 w-4" /> {saving ? "Saving…" : uploadingPhoto ? "Uploading photo…" : "Save changes"}
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

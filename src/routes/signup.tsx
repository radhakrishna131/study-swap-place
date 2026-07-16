import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COLLEGES } from "@/lib/colleges";

const schema = z.object({
  full_name: z.string().trim().min(2, "Name too short").max(80),
  college: z.string().trim().min(2, "Enter your college").max(120),
  email: z.string().email().max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

function safeNext(next: unknown): string {
  if (typeof next !== "string") return "/profile";
  if (!next.startsWith("/") || next.startsWith("//")) return "/profile";
  return next;
}

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({ next: safeNext(s.next) }),
  component: SignupPage,
  head: () => ({ meta: [{ title: "Join CampusCart" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [form, setForm] = useState({ full_name: "", college: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}${next}`,
        data: { full_name: form.full_name, college: form.college },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — welcome!");
    navigate({ to: next });
  }

  async function onGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}${next}`,
    });
    if (result.error) {
      toast.error(result.error.message || "Google sign-in failed");
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary border-2 border-ink shadow-pop-sm">
            <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
          </span>
        </Link>
        <div className="rounded-3xl border-2 border-ink bg-card shadow-pop p-8">
          <h1 className="font-display text-3xl font-bold">Join your campus</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Get the verified student badge by signing up with your college email.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="college">College</Label>
              <Input id="college" list="signup-college-list" placeholder="Start typing — e.g. IIT Madras" value={form.college} onChange={(e) => set("college", e.target.value)} required />
              <datalist id="signup-college-list">
                {COLLEGES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">College email</Label>
              <Input id="email" type="email" placeholder="you@college.edu" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={onGoogle}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </Button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" search={{ next }} className="font-semibold text-ink hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const searchSchema = z.object({ email: z.string().email().optional().catch(undefined) });

const formSchema = z.object({
  email: z.string().email("Enter a valid email").max(255),
  token: z.string().length(6, "Enter the 6-digit code"),
  password: z.string().min(6, "At least 6 characters").max(72),
});

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Reset password — CampusCart" },
      { name: "description", content: "Enter the one-time code from your email and set a new CampusCart password." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email ?? "");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function onResend() {
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) return toast.error("Enter your email first");
    setResending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setResending(false);
    if (error) return toast.error(error.message);
    toast.success("New code sent");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = formSchema.safeParse({ email, token, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });
    if (verifyError) {
      setLoading(false);
      return toast.error(verifyError.message);
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) return toast.error(updateError.message);

    toast.success("Password updated. You're signed in.");
    navigate({ to: "/browse" });
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
          <h1 className="font-display text-3xl font-bold">Reset password</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Enter the 6-digit code from your email and pick a new password.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>One-time code</Label>
              <InputOTP maxLength={6} value={token} onChange={setToken}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={onResend}
              disabled={resending}
              className="font-semibold text-ink hover:underline disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
            <Link to="/login" className="text-muted-foreground hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

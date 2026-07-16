import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Beta namespace typing — narrow local wrapper so we don't hunt through node_modules.
type OAuthResult = {
  data?: {
    client?: { name?: string; client_uri?: string; redirect_uris?: string[] } | null;
    scope?: string;
    redirect_url?: string;
    redirect_to?: string;
  } | null;
  error?: { message: string } | null;
};
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/login", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: ConsentPage,
  errorComponent: ({ error }) => (
    <div className="min-h-[60vh] grid place-items-center px-4">
      <div className="max-w-md text-center rounded-3xl border-2 border-ink bg-card shadow-pop p-8">
        <h1 className="font-display text-2xl font-bold">Couldn't load this authorization</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </div>
  ),
});

function ConsentPage() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorization_id)
      : await oauth.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border-2 border-ink bg-card shadow-pop p-8">
        <div className="flex items-center justify-center mb-4">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary border-2 border-ink shadow-pop-sm">
            <ShoppingBag className="h-6 w-6" strokeWidth={2.5} />
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold text-center">
          Connect {clientName} to CampusCart
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          {clientName} will be able to call CampusCart's enabled tools while you are signed in — search listings,
          create listings, and manage your buy requests as you.
        </p>
        <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 text-sm">
          <p className="font-semibold">This does not:</p>
          <ul className="mt-1 list-disc pl-5 text-muted-foreground space-y-1">
            <li>Bypass CampusCart's permissions or database policies.</li>
            <li>Expose your password or session token.</li>
          </ul>
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive text-center">
            {error}
          </p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => decide(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => decide(true)} disabled={busy}>
            {busy ? "Working…" : "Approve"}
          </Button>
        </div>
      </div>
    </div>
  );
}

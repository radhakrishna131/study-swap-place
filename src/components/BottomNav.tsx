import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Plus, Heart, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/browse", label: "Browse", icon: Search },
  { to: "/sell", label: "Sell", icon: Plus, primary: true },
  { to: "/saved", label: "Saved", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!user) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-ink/10 bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5 px-1">
        {items.map(({ to, label, icon: Icon, primary }) => {
          const active = pathname === to;
          return (
            <li key={to} className="flex justify-center">
              <Link
                to={to}
                className="flex flex-col items-center gap-1 py-2 px-3 text-[10px] font-medium"
              >
                {primary ? (
                  <span className="grid h-11 w-11 -mt-5 place-items-center rounded-2xl bg-primary text-primary-foreground border-2 border-ink shadow-pop-sm">
                    <Icon className="h-5 w-5" strokeWidth={2.5} />
                  </span>
                ) : (
                  <Icon
                    className={`h-5 w-5 ${active ? "text-ink" : "text-muted-foreground"}`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                )}
                {!primary && (
                  <span className={active ? "text-ink" : "text-muted-foreground"}>
                    {label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Plus, Heart, User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-pop-sm border-2 border-ink group-hover:rotate-[-4deg] transition-transform">
            <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            campus<span className="text-ink/60">cart</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/browse"
            className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-secondary transition"
          >
            Browse
          </Link>
          <Link
            to="/sell"
            className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-secondary transition"
          >
            Sell
          </Link>
          {user && (
            <Link
              to="/saved"
              className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-secondary transition"
            >
              Saved
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="default" size="sm" className="hidden sm:inline-flex">
                <Link to="/sell">
                  <Plus className="h-4 w-4" />
                  Sell item
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                    <User className="h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/saved" })}>
                    <Heart className="h-4 w-4" /> Saved
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut();
                      navigate({ to: "/" });
                    }}
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

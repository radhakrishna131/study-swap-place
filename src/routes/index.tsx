import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, MapPin, Sparkles, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "CampusCart — The student marketplace for your campus" },
      {
        name: "description",
        content:
          "Buy and sell books, electronics, cycles and hostel essentials with verified students from your college.",
      },
    ],
  }),
});

function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-gradient-hero">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--ink) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 md:py-32 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-background px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-pop-sm">
              <Sparkles className="h-3 w-3" /> Hyperlocal · Student-only
            </span>
            <h1 className="mt-6 font-display text-5xl md:text-7xl font-bold tracking-tight text-balance leading-[0.95]">
              Your campus,<br />
              your marketplace.
            </h1>
            <p className="mt-6 text-lg text-ink/70 max-w-md">
              Buy and sell books, cycles, hostel stuff and gadgets with verified
              students from your college. No randoms. No scams. Just fair deals.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="text-base">
                <Link to="/signup">
                  Join your campus <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base border-2 border-ink shadow-pop-sm bg-background">
                <Link to="/browse">Browse listings</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-ink/70">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-success" /> Verified students
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Same campus
              </div>
            </div>
          </div>

          {/* Mock card stack */}
          <div className="relative hidden lg:block h-[480px]">
            <FloatingCard
              className="absolute top-0 right-8 w-64 rotate-[6deg]"
              title="Casio FX-991ES"
              price="₹650"
              tag="Books"
              meta="Block C · Verified"
              emoji="🧮"
            />
            <FloatingCard
              className="absolute top-32 left-0 w-72 -rotate-[8deg]"
              title="Hero Cycle (1 yr used)"
              price="₹3,200"
              tag="Transport"
              meta="Hostel 4 · Verified"
              emoji="🚲"
            />
            <FloatingCard
              className="absolute bottom-0 right-0 w-72 rotate-[3deg]"
              title="Sony Headphones"
              price="₹1,800"
              tag="Electronics"
              meta="CSE Block · Verified"
              emoji="🎧"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Shop by category</h2>
            <p className="text-muted-foreground mt-2">Everything a student needs, from someone next door.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
          {CATEGORIES.map(({ key, label, icon: Icon }) => (
            <Link
              key={key}
              to="/browse"
              search={{ category: key }}
              className="group flex flex-col items-center gap-2 rounded-2xl border-2 border-ink bg-card p-4 shadow-pop-sm hover:bg-primary hover:-translate-y-1 transition"
            >
              <Icon className="h-6 w-6" strokeWidth={2.25} />
              <span className="text-xs font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How */}
      <section className="border-t-2 border-ink bg-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center">How it works</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Verify with your college", d: "Sign up with your college email and get the verified student badge." },
              { n: "02", t: "Post or browse", d: "Snap a photo, set a price. Or scroll listings from your campus." },
              { n: "03", t: "Meet on campus", d: "Chat, agree on a price, meet at the canteen. Done." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border-2 border-ink bg-card p-6 shadow-pop">
                <div className="font-display text-4xl font-bold text-ink/20">{s.n}</div>
                <h3 className="mt-2 font-display text-xl font-bold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 text-center">
          <ShoppingBag className="h-10 w-10 mx-auto text-primary" />
          <h2 className="mt-4 font-display text-3xl md:text-5xl font-bold text-balance">
            Stop wasting hostel stuff. Start making rent.
          </h2>
          <p className="mt-4 text-background/70 max-w-xl mx-auto">
            Join CampusCart and turn your semester clearout into cash.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/signup">Create free account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FloatingCard({
  className,
  title,
  price,
  tag,
  meta,
  emoji,
}: {
  className?: string;
  title: string;
  price: string;
  tag: string;
  meta: string;
  emoji: string;
}) {
  return (
    <div className={`rounded-2xl border-2 border-ink bg-card shadow-pop p-3 ${className}`}>
      <div className="aspect-square rounded-xl bg-secondary grid place-items-center text-6xl">
        {emoji}
      </div>
      <div className="mt-3 px-1 pb-1">
        <div className="flex justify-between items-baseline">
          <h4 className="font-medium text-sm truncate">{title}</h4>
          <span className="font-display font-bold">{price}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="rounded-full border border-ink/20 px-2 py-0.5 font-bold uppercase">{tag}</span>
          <span className="flex items-center gap-1"><BadgeCheck className="h-3 w-3 text-success" /> {meta}</span>
        </div>
      </div>
    </div>
  );
}

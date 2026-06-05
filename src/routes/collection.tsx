import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CATEGORIES, CATEGORY_META } from "@/lib/game/types";
import { getTrophyCount } from "@/lib/profile";

export const Route = createFileRoute("/collection")({
  head: () => ({
    meta: [
      { title: "Trophy Collection — World Cup Trivia" },
      { name: "description", content: "Your earned trophies across all World Cup trivia categories." },
    ],
  }),
  component: CollectionPage,
});

function CollectionPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setCounts(getTrophyCount());
  }, []);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Home
          </Link>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Total</div>
            <div className="font-display text-3xl">{total} trophies</div>
          </div>
        </header>

        <h1 className="font-display text-5xl tracking-wider text-center mb-2">
          🏆 Trophy Cabinet
        </h1>
        <p className="text-center text-muted-foreground mb-10">
          Earned by winning a question in each category.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const c = counts[cat] || 0;
            const earned = c > 0;
            return (
              <div
                key={cat}
                className={`rounded-3xl p-6 text-center border-2 transition ${
                  earned ? "shadow-trophy" : "opacity-60"
                }`}
                style={{
                  borderColor: meta.color,
                  background: earned ? `${meta.color}` : "var(--color-card)",
                  color: earned ? "white" : undefined,
                }}
              >
                <div className="text-6xl mb-3">{earned ? meta.trophy : "🔒"}</div>
                <div className="font-display text-2xl tracking-wider">{cat}</div>
                <div className="text-sm opacity-80 mt-1">{meta.tagline}</div>
                <div className="mt-3 inline-block px-3 py-1 rounded-full bg-black/20 font-display text-sm tracking-wider">
                  {c}×
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

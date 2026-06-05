import { createFileRoute, Link } from "@tanstack/react-router";
import { ProfileCard } from "@/components/home/ProfileCard";
import { RankingBoard } from "@/components/home/RankingBoard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "World Cup Trivia — Test Your Football Knowledge" },
      {
        name: "description",
        content:
          "Spin the wheel and answer FIFA World Cup trivia across 6 categories. Win trophies and climb the global ranking.",
      },
      { property: "og:title", content: "World Cup Trivia" },
      { property: "og:description", content: "Spin the wheel. Win the cup. Trivia for football fans." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen px-4 py-6 md:py-10">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-8 md:mb-12">
          <div className="inline-block px-4 py-1 rounded-full bg-gold/20 text-gold-foreground font-display tracking-widest text-sm mb-3">
            ⚽ KICKOFF 2026
          </div>
          <h1 className="font-display text-5xl md:text-7xl tracking-wider">
            World Cup <span className="text-grass">Trivia</span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Spin the roulette, conquer all six categories, and lift the trophy.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ProfileCard />

            <div className="rounded-3xl p-8 pitch-bg text-white shadow-stadium">
              <h2 className="font-display text-4xl tracking-wider mb-2">Ready to play?</h2>
              <p className="opacity-90 mb-6">
                Win one question from each of the 6 categories to complete the set and claim the
                trophy.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/game"
                  className="px-8 py-4 rounded-2xl bg-gold text-gold-foreground font-display text-2xl tracking-wider shadow-trophy hover:scale-105 active:scale-95 transition inline-block"
                >
                  ▶ New Game
                </Link>
                <Link
                  to="/collection"
                  className="px-6 py-4 rounded-2xl bg-white/15 border-2 border-white/30 text-white font-display text-xl tracking-wider hover:bg-white/25 transition inline-block backdrop-blur"
                >
                  🏆 Collection
                </Link>
              </div>
            </div>
          </div>

          <RankingBoard />
        </div>

        <footer className="text-center text-xs text-muted-foreground mt-10">
          Built for fans of the beautiful game.
        </footer>
      </div>
    </div>
  );
}

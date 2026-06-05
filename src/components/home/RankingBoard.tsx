import { useEffect, useState } from "react";
import { fetchTopRankings, type RankingRow } from "@/lib/ranking";

export function RankingBoard({ refreshKey }: { refreshKey?: number }) {
  const [rows, setRows] = useState<RankingRow[] | null>(null);

  useEffect(() => {
    fetchTopRankings(10).then(setRows).catch(() => setRows([]));
  }, [refreshKey]);

  return (
    <div className="rounded-3xl p-6 bg-card border border-border shadow-stadium">
      <h2 className="font-display text-3xl tracking-wider mb-4 flex items-center gap-2">
        🥇 Global Ranking
      </h2>
      {rows === null && <div className="text-muted-foreground text-sm">Loading…</div>}
      {rows && rows.length === 0 && (
        <div className="text-muted-foreground text-sm">No matches played yet. Be the first!</div>
      )}
      <ol className="space-y-2">
        {rows?.map((r, i) => (
          <li
            key={r.player_id}
            className="flex items-center justify-between p-3 rounded-xl bg-secondary"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-display text-lg ${
                  i === 0
                    ? "bg-gold text-gold-foreground"
                    : i === 1
                      ? "bg-muted-foreground/40 text-foreground"
                      : i === 2
                        ? "bg-[oklch(0.55_0.12_60)] text-white"
                        : "bg-foreground/10 text-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span className="font-medium">{r.nickname}</span>
              <span className="text-xs text-muted-foreground">🏆 {r.trophies_earned}</span>
            </div>
            <span className="font-display text-2xl">{r.best_score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

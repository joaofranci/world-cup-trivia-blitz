import { supabase } from "@/integrations/supabase/client";

export interface RankingRow {
  player_id: string;
  nickname: string;
  best_score: number;
  total_matches: number;
  trophies_earned: number;
}

export async function fetchTopRankings(limit = 10): Promise<RankingRow[]> {
  const { data, error } = await supabase
    .from("rankings")
    .select("player_id, nickname, best_score, total_matches, trophies_earned")
    .order("best_score", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function submitScore(params: {
  playerId: string;
  nickname: string;
  score: number;
  won: boolean;
}) {
  const { playerId, nickname, score, won } = params;
  // Fetch existing row
  const { data: existing } = await supabase
    .from("rankings")
    .select("best_score, total_matches, trophies_earned")
    .eq("player_id", playerId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("rankings").insert({
      player_id: playerId,
      nickname,
      best_score: score,
      total_matches: 1,
      trophies_earned: won ? 1 : 0,
    });
  } else {
    await supabase
      .from("rankings")
      .update({
        nickname,
        best_score: Math.max(existing.best_score, score),
        total_matches: existing.total_matches + 1,
        trophies_earned: existing.trophies_earned + (won ? 1 : 0),
        updated_at: new Date().toISOString(),
      })
      .eq("player_id", playerId);
  }
}

import { supabase } from "@/integrations/supabase/client";
import type { Question, Category } from "@/lib/game/types";

export async function fetchQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("id, category, question, options, correct_index, difficulty, era");
  if (error) throw error;
  return (data ?? []).map((q) => ({
    ...q,
    category: q.category as Category,
    options: q.options as string[],
  }));
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

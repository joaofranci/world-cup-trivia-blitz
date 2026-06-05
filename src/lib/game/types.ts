export const CATEGORIES = [
  "History",
  "Players",
  "Records",
  "Hosts",
  "Curiosities",
  "Rules",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_META: Record<
  Category,
  { color: string; icon: string; trophy: string; tagline: string }
> = {
  History: { color: "var(--cat-history)", icon: "📜", trophy: "🏆", tagline: "Past tournaments" },
  Players: { color: "var(--cat-players)", icon: "⚽", trophy: "👟", tagline: "Legends of the game" },
  Records: { color: "var(--cat-records)", icon: "📈", trophy: "🥇", tagline: "Numbers that matter" },
  Hosts: { color: "var(--cat-hosts)", icon: "🌍", trophy: "🏟️", tagline: "Where it all happened" },
  Curiosities: { color: "var(--cat-curiosities)", icon: "💡", trophy: "🎟️", tagline: "Beyond the pitch" },
  Rules: { color: "var(--cat-rules)", icon: "📏", trophy: "🟨", tagline: "Laws of the game" },
};

export interface Question {
  id: string;
  category: Category;
  question: string;
  options: string[];
  correct_index: number;
  difficulty: string;
  era: string | null;
}

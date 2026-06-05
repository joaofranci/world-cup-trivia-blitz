# World Cup Trivia — Build Plan

A Trivia Crack–style web game focused on the FIFA World Cup. Sporty visual identity (grass green, white, trophy gold), smooth roulette animation, and a global leaderboard powered by Lovable Cloud.

## Visual direction

- Palette: deep pitch green `#0B6E3F`, fresh grass `#2EB872`, ivory white, trophy gold `#E2B341`, charcoal `#0F1B15`.
- Typography: "Bebas Neue" for display/scoreboard, "Inter" for UI/body — stadium scoreboard feel without being gaudy.
- Surfaces: rounded-2xl cards, soft shadows, subtle pitch-line gradients, gold accents on win states.
- Animations: spinning roulette with eased deceleration, scale-in feedback on answers (green pulse / red shake), confetti on match win.

## Screens & routes

- `/` Home — Profile card (nickname + avatar initial), big "New Game" button, Top 10 global ranking, link to Collection.
- `/game` Match — Roulette → Question → repeat until the 6-category set is complete (or the player runs out of lives).
- `/collection` — Trophy gallery showing all 6 category trophies + count of completed sets.

## Game logic

- **Set progression**: 6 category slots. Spin lands on a category → answer correctly to claim that trophy slot. Wrong answer = lose 1 life (3 lives per match). Filling all 6 slots = match won → score submitted to ranking, trophy unlocked.
- **Scoring**: base 100 pts per correct, +time bonus (remaining seconds × 5), +50 streak bonus on 3-in-a-row.
- **Timer**: 20s countdown ring; auto-fails on 0.
- **Power-ups** (2 of each per match): **VAR** removes 2 wrong answers; **Extra Time** adds +10s.
- **Roulette**: 6 colored wedges, ease-out spin (~3s), pointer reveals category, transitions into question screen.

## Question bank

- 50 seed questions stored in a Supabase table `questions` (id, category, question, options jsonb, correct_index, difficulty, era). Categories: History, Players, Records, Hosts, Curiosities, Rules. Mix of past World Cups and 2026 (USA/Canada/Mexico).
- Loader fetches all questions once, picks a random unseen question per spin.
- Editable directly in the database — clean separation from UI.

## Profile & ranking

- Lightweight profile: nickname stored in `localStorage` (no auth friction for v1) + a generated `player_id` (uuid).
- `rankings` table: player_id, nickname, best_score, total_matches, trophies_earned, updated_at. Public read; public insert/update restricted to rows matching submitted player_id (enforced via RLS using a header-less open insert + on-conflict update keyed by player_id).
- Top 10 by best_score shown on Home, auto-refresh after each match.

## Technical details

- Stack: TanStack Start (existing), Tailwind v4 tokens in `src/styles.css`, Lovable Cloud (Supabase) for `questions` + `rankings`.
- New files:
  - `src/routes/index.tsx` (replace placeholder)
  - `src/routes/game.tsx`, `src/routes/collection.tsx`
  - `src/components/game/Roulette.tsx`, `QuestionCard.tsx`, `PowerUps.tsx`, `HUD.tsx`, `TrophySlots.tsx`
  - `src/components/home/RankingBoard.tsx`, `ProfileCard.tsx`
  - `src/lib/game/types.ts`, `useGame.ts` (state machine via `useReducer`)
  - `src/lib/data/questions.ts` (typed loader)
  - `src/lib/profile.ts` (localStorage helpers)
- Migrations: create `questions` (public read) + `rankings` (public read, public upsert by player_id), seed 50 questions via insert tool.
- SEO: per-route `head()` metadata; semantic H1s.

## Out of scope for v1

- Authentication / social login (nickname-only profile)
- Multiplayer / real-time duels
- Localization (English copy only)
- Sound effects

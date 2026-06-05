import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Roulette } from "@/components/game/Roulette";
import { QuestionCard } from "@/components/game/QuestionCard";
import { TrophySlots } from "@/components/game/TrophySlots";
import { fetchQuestions, pickRandom } from "@/lib/data/questions";
import { CATEGORIES, type Category, type Question } from "@/lib/game/types";
import { addTrophy, getProfile } from "@/lib/profile";
import { submitScore } from "@/lib/ranking";
import { sfx, isMuted, setMuted } from "@/lib/game/sfx";

type Phase = "wheel" | "question" | "result" | "won" | "lost";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "Play — World Cup Trivia" },
      { name: "description", content: "Spin, answer, and win your World Cup trivia set." },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  const navigate = useNavigate();
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>("wheel");
  const [current, setCurrent] = useState<{ cat: Category; q: Question } | null>(null);
  const [won, setWon] = useState<Category[]>([]);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastResult, setLastResult] = useState<{ correct: boolean; gained: number } | null>(null);
  const [varAvailable, setVarAvailable] = useState(2);
  const [extraAvailable, setExtraAvailable] = useState(2);
  const [varRemoved, setVarRemoved] = useState<number[]>([]);
  const [extraTimeTrigger, setExtraTimeTrigger] = useState(0);
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(isMuted());
    fetchQuestions().then(setAllQuestions).catch(console.error);
  }, []);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  const remainingCats = useMemo(
    () => CATEGORIES.filter((c) => !won.includes(c)),
    [won],
  );

  function pickQuestion(cat: Category): Question | null {
    const pool = allQuestions.filter((q) => q.category === cat && !usedIds.has(q.id));
    const fallback = allQuestions.filter((q) => q.category === cat);
    const chosen = pool.length ? pickRandom(pool) : fallback.length ? pickRandom(fallback) : null;
    if (chosen) setUsedIds((s) => new Set(s).add(chosen.id));
    return chosen;
  }

  function handleSpin(cat: Category) {
    const q = pickQuestion(cat);
    if (!q) return;
    setVarRemoved([]);
    setExtraTimeTrigger(0);
    setCurrent({ cat, q });
    setPhase("question");
  }

  async function endMatch(victory: boolean, finalScore: number) {
    const profile = getProfile();
    try {
      await submitScore({
        playerId: profile.playerId,
        nickname: profile.nickname,
        score: finalScore,
        won: victory,
      });
    } catch (e) {
      console.error("Score submit failed", e);
    }
    if (victory) {
      // Record one trophy per won category
      won.forEach((c) => addTrophy(c));
    }
  }

  function handleAnswer(correct: boolean, secondsLeft: number) {
    if (!current) return;
    let gained = 0;
    if (correct) {
      const newStreak = streak + 1;
      const streakBonus = newStreak >= 3 ? 50 : 0;
      gained = 100 + secondsLeft * 5 + streakBonus;
      const newScore = score + gained;
      const newWon = [...won, current.cat];
      setScore(newScore);
      setStreak(newStreak);
      setWon(newWon);
      setLastResult({ correct: true, gained });
      if (newWon.length === CATEGORIES.length) {
        endMatch(true, newScore);
        sfx.whistle();
        setTimeout(() => sfx.trophy(), 400);
        setPhase("won");
      } else {
        setPhase("result");
      }
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setStreak(0);
      setLastResult({ correct: false, gained: 0 });
      if (newLives <= 0) {
        endMatch(false, score);
        sfx.defeat();
        setPhase("lost");
      } else {
        setPhase("result");
      }
    }
  }

  function next() {
    setCurrent(null);
    setPhase("wheel");
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-3xl mx-auto">
        {/* HUD */}
        <header className="flex items-center justify-between mb-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Score</div>
              <div className="font-display text-3xl">{score}</div>
            </div>
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Lives</div>
              <div className="font-display text-3xl">
                {"❤️".repeat(lives)}
                <span className="opacity-20">{"❤️".repeat(3 - lives)}</span>
              </div>
            </div>
            <button
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className="w-11 h-11 rounded-xl bg-secondary hover:bg-muted flex items-center justify-center transition"
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <div className="mb-6">
          <TrophySlots won={won} />
        </div>

        {phase === "wheel" && allQuestions.length > 0 && (
          <Roulette onResult={handleSpin} completed={won} allowed={remainingCats} />
        )}
        {phase === "wheel" && allQuestions.length === 0 && (
          <div className="text-center text-muted-foreground py-20">Loading questions…</div>
        )}

        {phase === "question" && current && (
          <QuestionCard
            question={current.q}
            onAnswer={handleAnswer}
            extraTime={extraTimeTrigger}
            varRemoved={varRemoved}
            varAvailable={varAvailable}
            extraAvailable={extraAvailable}
            onUseVar={() => {
              if (varAvailable === 0) return;
              // remove 2 wrong options
              const wrongs = current.q.options
                .map((_, i) => i)
                .filter((i) => i !== current.q.correct_index);
              const shuffled = [...wrongs].sort(() => Math.random() - 0.5).slice(0, 2);
              setVarRemoved(shuffled);
              setVarAvailable((n) => n - 1);
            }}
            onUseExtra={() => {
              if (extraAvailable === 0) return;
              setExtraAvailable((n) => n - 1);
              setExtraTimeTrigger((n) => n + 1);
            }}
          />
        )}

        {phase === "result" && lastResult && (
          <div className="text-center py-10">
            <div
              className={`inline-block px-8 py-4 rounded-2xl font-display text-4xl tracking-wider mb-4 ${
                lastResult.correct
                  ? "bg-success text-success-foreground"
                  : "bg-destructive text-destructive-foreground"
              }`}
            >
              {lastResult.correct ? `+${lastResult.gained} GOAL!` : "MISS!"}
            </div>
            <div>
              <button
                onClick={next}
                className="px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-display text-2xl tracking-wider hover:scale-105 transition"
              >
                Next Spin →
              </button>
            </div>
          </div>
        )}

        {phase === "won" && (
          <ResultScreen
            title="🏆 CHAMPION!"
            subtitle={`You lifted the trophy with ${score} points.`}
            tone="win"
            onPlayAgain={() => navigate({ to: "/game", reloadDocument: true })}
          />
        )}
        {phase === "lost" && (
          <ResultScreen
            title="💔 ELIMINATED"
            subtitle={`Final score: ${score}. Set won: ${won.length}/6.`}
            tone="lose"
            onPlayAgain={() => navigate({ to: "/game", reloadDocument: true })}
          />
        )}
      </div>
    </div>
  );
}

function ResultScreen({
  title,
  subtitle,
  tone,
  onPlayAgain,
}: {
  title: string;
  subtitle: string;
  tone: "win" | "lose";
  onPlayAgain: () => void;
}) {
  return (
    <div
      className={`rounded-3xl p-10 text-center shadow-stadium ${
        tone === "win" ? "pitch-bg text-white" : "bg-card"
      }`}
    >
      <h2 className="font-display text-6xl tracking-wider mb-3">{title}</h2>
      <p className="text-lg opacity-90 mb-6">{subtitle}</p>
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={onPlayAgain}
          className="px-8 py-4 rounded-2xl bg-gold text-gold-foreground font-display text-2xl tracking-wider shadow-trophy hover:scale-105 transition"
        >
          Play Again
        </button>
        <Link
          to="/"
          className="px-8 py-4 rounded-2xl bg-white/15 border-2 border-white/30 font-display text-xl tracking-wider hover:bg-white/25 transition backdrop-blur"
        >
          Home
        </Link>
      </div>
    </div>
  );
}

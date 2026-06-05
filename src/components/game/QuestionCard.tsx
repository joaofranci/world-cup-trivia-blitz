import { useEffect, useRef, useState } from "react";
import type { Question } from "@/lib/game/types";
import { CATEGORY_META } from "@/lib/game/types";

interface Props {
  question: Question;
  initialSeconds?: number;
  onAnswer: (correct: boolean, secondsLeft: number) => void;
  extraTime: number;
  varRemoved: number[];
  onUseVar: () => void;
  onUseExtra: () => void;
  varAvailable: number;
  extraAvailable: number;
}

export function QuestionCard({
  question,
  initialSeconds = 20,
  onAnswer,
  extraTime,
  varRemoved,
  onUseVar,
  onUseExtra,
  varAvailable,
  extraAvailable,
}: Props) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const lockRef = useRef(false);
  const meta = CATEGORY_META[question.category];

  useEffect(() => {
    setSeconds(initialSeconds + extraTime);
  }, [question.id]); // reset on new q

  useEffect(() => {
    if (extraTime > 0) setSeconds((s) => s + 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraTime]);

  useEffect(() => {
    if (revealed) return;
    if (seconds <= 0) {
      handleAnswer(-1);
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, revealed]);

  function handleAnswer(idx: number) {
    if (lockRef.current) return;
    lockRef.current = true;
    setSelected(idx);
    setRevealed(true);
    const correct = idx === question.correct_index;
    setTimeout(() => onAnswer(correct, Math.max(0, seconds)), 1400);
  }

  const pct = Math.max(0, Math.min(100, (seconds / (initialSeconds + 10)) * 100));
  const lowTime = seconds <= 5;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className="rounded-3xl p-6 md:p-8 shadow-stadium border-2"
        style={{
          background: "var(--color-card)",
          borderColor: meta.color,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: meta.color }}
            >
              {meta.icon}
            </div>
            <div>
              <div className="font-display text-xl tracking-wide" style={{ color: meta.color }}>
                {question.category}
              </div>
              <div className="text-xs text-muted-foreground">{meta.tagline}</div>
            </div>
          </div>
          <div
            className={`font-display text-4xl tabular-nums ${lowTime ? "text-destructive" : ""}`}
          >
            {seconds}
          </div>
        </div>

        {/* Timer bar */}
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-6">
          <div
            className="h-full transition-all duration-1000 linear"
            style={{
              width: `${pct}%`,
              background: lowTime ? "var(--color-destructive)" : meta.color,
            }}
          />
        </div>

        {/* Question */}
        <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-6 leading-snug">
          {question.question}
        </h2>

        {/* Options */}
        <div className="grid gap-3">
          {question.options.map((opt, i) => {
            const removed = varRemoved.includes(i);
            const isSel = selected === i;
            const isCorrect = i === question.correct_index;
            let stateClass =
              "border-border bg-secondary hover:bg-muted hover:scale-[1.01]";
            if (revealed) {
              if (isCorrect) stateClass = "border-success bg-success/15 pulse-correct";
              else if (isSel) stateClass = "border-destructive bg-destructive/15 shake";
              else stateClass = "border-border bg-secondary opacity-60";
            }
            return (
              <button
                key={i}
                disabled={revealed || removed}
                onClick={() => handleAnswer(i)}
                className={`text-left p-4 rounded-2xl border-2 font-medium transition ${stateClass} ${
                  removed ? "opacity-30 line-through cursor-not-allowed" : ""
                }`}
              >
                <span className="inline-flex items-center gap-3">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-display"
                    style={{ background: meta.color, color: "white" }}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Power-ups */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={onUseVar}
            disabled={revealed || varAvailable === 0 || varRemoved.length > 0}
            className="px-4 py-2 rounded-xl bg-foreground/5 border-2 border-border font-display tracking-wide text-sm hover:bg-foreground/10 transition disabled:opacity-40"
          >
            📺 VAR ({varAvailable})
          </button>
          <button
            onClick={onUseExtra}
            disabled={revealed || extraAvailable === 0}
            className="px-4 py-2 rounded-xl bg-foreground/5 border-2 border-border font-display tracking-wide text-sm hover:bg-foreground/10 transition disabled:opacity-40"
          >
            ⏱️ Extra Time ({extraAvailable})
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Monitor, Clock, Zap } from "lucide-react";
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
  const [varStage, setVarStage] = useState<"idle" | "scanning" | "done">("idle");
  const prevVarLen = useRef(0);
  const lockRef = useRef(false);
  const meta = CATEGORY_META[question.category];

  useEffect(() => {
    setSeconds(initialSeconds + extraTime);
    setVarStage("idle");
    prevVarLen.current = 0;
  }, [question.id]); // reset on new q

  useEffect(() => {
    if (extraTime > 0) setSeconds((s) => s + 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraTime]);

  // VAR animation trigger
  useEffect(() => {
    if (varRemoved.length > prevVarLen.current && varStage === "idle") {
      setVarStage("scanning");
      const t = setTimeout(() => setVarStage("done"), 1500);
      return () => clearTimeout(t);
    }
    prevVarLen.current = varRemoved.length;
  }, [varRemoved, varStage]);

  const paused = varStage === "scanning";

  useEffect(() => {
    if (revealed || paused) return;
    if (seconds <= 0) {
      handleAnswer(-1);
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, revealed, paused]);

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
        <div className="grid grid-cols-2 gap-4 mt-6">
          <PowerUpButton
            icon={<Monitor className="w-6 h-6" />}
            label="VAR Review"
            description="Removes 2 wrong answers"
            count={varAvailable}
            disabled={revealed || varAvailable === 0 || varRemoved.length > 0}
            onClick={onUseVar}
            variant="var"
          />
          <PowerUpButton
            icon={<Clock className="w-6 h-6" />}
            label="Extra Time"
            description="+10 seconds on the clock"
            count={extraAvailable}
            disabled={revealed || extraAvailable === 0}
            onClick={onUseExtra}
            variant="time"
          />
        </div>
      </div>
    </div>
  );
}

function PowerUpButton({
  icon,
  label,
  description,
  count,
  disabled,
  onClick,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  count: number;
  disabled: boolean;
  onClick: () => void;
  variant: "var" | "time";
}) {
  const active = !disabled;
  const baseColor = variant === "var" ? "oklch(0.5 0.15 250)" : "oklch(0.55 0.15 145)";
  const glowColor = variant === "var" ? "oklch(0.5 0.15 250 / 0.3)" : "oklch(0.55 0.15 145 / 0.3)";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
        active
          ? "hover:scale-[1.03] cursor-pointer"
          : "opacity-40 cursor-not-allowed grayscale"
      }`}
      style={{
        background: active ? `linear-gradient(135deg, ${baseColor}, oklch(0.3 0.08 150))` : "var(--color-muted)",
        borderColor: active ? baseColor : "transparent",
        boxShadow: active ? `0 8px 24px -8px ${glowColor}` : "none",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-white/90">{icon}</span>
        <span className="font-display text-lg tracking-wide text-white">{label}</span>
      </div>
      <span className="text-xs text-white/70 leading-tight text-center">{description}</span>
      <span
        className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center font-display text-sm text-white"
        style={{ background: active ? baseColor : "var(--color-muted-foreground)" }}
      >
        {count}
      </span>
      {active && (
        <Zap className="absolute bottom-2 right-2 w-4 h-4 text-white/40" />
      )}
    </button>
  );
}

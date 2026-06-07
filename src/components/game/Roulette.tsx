import { useEffect, useRef, useState } from "react";
import { CATEGORIES, CATEGORY_META, type Category } from "@/lib/game/types";
import { sfx } from "@/lib/game/sfx";

interface Props {
  onResult: (category: Category) => void;
  /** Categories already won — visually marked as completed */
  completed: Category[];
  /** Force the wheel to land on one of these (e.g. only un-won categories). If empty, any. */
  allowed?: Category[];
}

export function Roulette({ onResult, completed, allowed }: Props) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const resultRef = useRef<Category | null>(null);

  const size = 320;
  const radius = size / 2;
  const slice = 360 / CATEGORIES.length;

  function spin() {
    if (spinning) return;
    const pool = allowed && allowed.length ? allowed : [...CATEGORIES];
    const target = pool[Math.floor(Math.random() * pool.length)];
    const targetIdx = CATEGORIES.indexOf(target);

    // Pointer is at the top (0°). Wedge i is centered at i*slice + slice/2.
    // We want the target wedge center at the top → rotate by -(idx*slice + slice/2) + extra spins.
    const turns = 5;
    const targetAngle = -(targetIdx * slice + slice / 2);
    const final = rotation - (rotation % 360) + turns * 360 + targetAngle;

    resultRef.current = target;
    setSpinning(true);
    setRotation(final);
    sfx.spin();
    setTimeout(() => {
      sfx.spinStop();
      setSpinning(false);
      if (resultRef.current) onResult(resultRef.current);
    }, 3200);
  }

  // Build wedge paths
  const wedges = CATEGORIES.map((cat, i) => {
    const start = (i * slice - 90) * (Math.PI / 180);
    const end = ((i + 1) * slice - 90) * (Math.PI / 180);
    const x1 = radius + radius * Math.cos(start);
    const y1 = radius + radius * Math.sin(start);
    const x2 = radius + radius * Math.cos(end);
    const y2 = radius + radius * Math.sin(end);
    const d = `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
    const labelAngle = (i * slice + slice / 2 - 90) * (Math.PI / 180);
    const lx = radius + (radius * 0.62) * Math.cos(labelAngle);
    const ly = radius + (radius * 0.62) * Math.sin(labelAngle);
    return { cat, d, lx, ly, meta: CATEGORY_META[cat] };
  });

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Pointer */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-10">
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "16px solid transparent",
              borderRight: "16px solid transparent",
              borderTop: "26px solid var(--color-gold)",
              filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))",
            }}
          />
        </div>

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 3.1s cubic-bezier(0.17, 0.67, 0.21, 1)" : undefined,
            filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.25))",
          }}
        >
          {/* Outer ring */}
          <circle cx={radius} cy={radius} r={radius - 1} fill="var(--color-gold)" />
          <g transform="translate(4, 4) scale(0.975)">
            {wedges.map((w) => {
              const isDone = completed.includes(w.cat);
              return (
                <g key={w.cat}>
                  <path d={w.d} fill={w.meta.color} opacity={isDone ? 0.35 : 1} stroke="rgba(0,0,0,0.25)" strokeWidth={2} />
                  <text
                    x={w.lx}
                    y={w.ly - 4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fill: "white",
                      fontFamily: "var(--font-display)",
                      fontSize: 32,
                      letterSpacing: 1,
                      paintOrder: "stroke",
                      stroke: "rgba(0,0,0,0.55)",
                      strokeWidth: 3,
                    }}
                  >
                    {w.meta.icon}
                  </text>
                  <text
                    x={w.lx}
                    y={w.ly + 26}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fill: "white",
                      fontFamily: "var(--font-display)",
                      fontSize: 17,
                      fontWeight: 800,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      paintOrder: "stroke",
                      stroke: "rgba(0,0,0,0.7)",
                      strokeWidth: 3.5,
                    }}
                  >
                    {w.cat}
                  </text>
                </g>
              );
            })}
            {/* Center hub */}
            <circle cx={radius - 4} cy={radius - 4} r={36} fill="var(--color-pitch)" />
            <circle cx={radius - 4} cy={radius - 4} r={30} fill="var(--color-gold)" />
          </g>
        </svg>
      </div>

      <button
        onClick={spin}
        disabled={spinning}
        className="px-10 py-4 rounded-2xl bg-gold text-gold-foreground font-display text-2xl tracking-wider shadow-trophy hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {spinning ? "Spinning…" : "Spin the Wheel"}
      </button>
    </div>
  );
}

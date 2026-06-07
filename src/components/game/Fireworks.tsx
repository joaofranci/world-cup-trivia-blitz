import { useEffect, useRef } from "react";

type Particle = {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; color: string; size: number;
};

const NEON = [
  "#ff00e6", "#00fff0", "#fff200", "#39ff14", "#ff6a00", "#7d00ff", "#ff0044",
];

export function Fireworks() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }
    resize();
    window.addEventListener("resize", resize);

    function burst(x: number, y: number, color: string) {
      const count = 60 + Math.floor(Math.random() * 40);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const speed = (2 + Math.random() * 5) * dpr;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          max: 60 + Math.random() * 40,
          color,
          size: (1.5 + Math.random() * 2.5) * dpr,
        });
      }
    }

    function launch() {
      const x = (window.innerWidth * (0.15 + Math.random() * 0.7)) * dpr;
      const y = (window.innerHeight * (0.15 + Math.random() * 0.45)) * dpr;
      const color = NEON[Math.floor(Math.random() * NEON.length)];
      burst(x, y, color);
    }

    const interval = setInterval(launch, 380);
    // initial salvo
    for (let i = 0; i < 3; i++) setTimeout(launch, i * 120);

    function tick() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";
      particles = particles.filter((p) => p.life < p.max);
      for (const p of particles) {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05 * dpr;
        p.vx *= 0.99;
        const t = 1 - p.life / p.max;
        ctx.beginPath();
        ctx.shadowBlur = 18;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = t;
        ctx.arc(p.x, p.y, p.size * (0.6 + t * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={ref}
        className="fixed inset-0 pointer-events-none z-40"
        aria-hidden
      />
      {/* Fluorescent overlay haze */}
      <div className="fixed inset-0 pointer-events-none z-30 neon-haze" aria-hidden />
    </>
  );
}

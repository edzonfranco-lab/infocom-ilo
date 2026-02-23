import { useEffect, useState, useCallback } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  char: string;
  drift: number;
}

const PARTICLE_CHARS: Record<string, string[]> = {
  hearts: ["❤", "💕", "💖", "♥"],
  snowflakes: ["❄", "❅", "❆", "✦"],
  flowers: ["🌸", "🌺", "🌷", "💐"],
  pumpkins: ["🎃", "👻", "🦇", "🕸"],
  fireworks: ["✨", "🎆", "⭐", "💫"],
  stars: ["⭐", "🌟", "✨", "💫"],
  balloons: ["🎈", "🎉", "🎊", "🎀"],
};

const SeasonalParticles = ({ type }: { type: string }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const chars = PARTICLE_CHARS[type] || PARTICLE_CHARS.stars;

  const createParticle = useCallback((): Particle => ({
    id: Math.random(),
    x: Math.random() * 100,
    y: -5,
    size: 12 + Math.random() * 10,
    speed: 0.3 + Math.random() * 0.5,
    opacity: 0.3 + Math.random() * 0.4,
    char: chars[Math.floor(Math.random() * chars.length)],
    drift: (Math.random() - 0.5) * 0.3,
  }), [chars]);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => {
        const updated = prev
          .map(p => ({ ...p, y: p.y + p.speed, x: p.x + p.drift, opacity: p.y > 80 ? p.opacity * 0.95 : p.opacity }))
          .filter(p => p.y < 105 && p.opacity > 0.05);
        if (updated.length < 8 && Math.random() > 0.7) {
          updated.push(createParticle());
        }
        return updated;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [createParticle]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute transition-none" style={{
          left: `${p.x}%`, top: `${p.y}%`, fontSize: `${p.size}px`,
          opacity: p.opacity, transform: `rotate(${p.drift * 100}deg)`,
        }}>
          {p.char}
        </div>
      ))}
    </div>
  );
};

export default SeasonalParticles;

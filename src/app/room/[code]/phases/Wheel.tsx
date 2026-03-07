'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRoom } from '../RoomContext';
import { useT } from '@/i18n/LanguageContext';

const PALETTE = [
  '#7c3aed',
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#db2777',
  '#0891b2',
  '#65a30d',
  '#9333ea',
  '#ea580c',
  '#0284c7',
  '#be185d',
];

function WheelSVG({ segments, rotation }: { segments: string[]; rotation: number }) {
  const n = segments.length;
  const cx = 150;
  const cy = 150;
  const r = 140;
  const angleStep = (2 * Math.PI) / n;
  const showLabels = n <= 8;

  const paths = segments.map((label, i) => {
    const startAngle = i * angleStep - Math.PI / 2;
    const endAngle = (i + 1) * angleStep - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = n === 1 ? 1 : 0;
    const d =
      n === 1
        ? `M ${cx} ${cy} m -${r} 0 a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 -${r * 2} 0`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    const midAngle = (i + 0.5) * angleStep - Math.PI / 2;
    const textR = r * 0.65;
    const tx = cx + textR * Math.cos(midAngle);
    const ty = cy + textR * Math.sin(midAngle);
    const textRotation = (midAngle * 180) / Math.PI + 90;

    const truncated = label.length > 10 ? label.slice(0, 9) + '…' : label;

    return (
      <g key={i}>
        <path d={d} fill={PALETTE[i % PALETTE.length]} stroke="#1e1b4b" strokeWidth={1.5} />
        {showLabels && (
          <text
            x={tx}
            y={ty}
            fill="white"
            fontSize={11}
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${textRotation}, ${tx}, ${ty})`}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {truncated}
          </text>
        )}
        {!showLabels && (
          <text
            x={tx}
            y={ty}
            fill="white"
            fontSize={13}
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${textRotation}, ${tx}, ${ty})`}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {i + 1}
          </text>
        )}
      </g>
    );
  });

  return (
    <div className="relative flex justify-center">
      {/* Pointer */}
      <div
        className="absolute z-10"
        style={{ top: -14, left: '50%', transform: 'translateX(-50%)' }}
      >
        <svg width="24" height="28" viewBox="0 0 24 28">
          <polygon points="12,28 0,0 24,0" fill="white" />
        </svg>
      </div>

      <motion.svg
        width={300}
        height={300}
        viewBox="0 0 300 300"
        animate={{ rotate: rotation }}
        transition={{ duration: 4.5, ease: [0.17, 0.67, 0.35, 1.0] }}
        style={{ originX: '50%', originY: '50%' }}
      >
        {paths}
        <circle cx={150} cy={150} r={16} fill="#1e1b4b" stroke="white" strokeWidth={3} />
      </motion.svg>
    </div>
  );
}

export function Wheel() {
  const { room, suggestions } = useRoom();
  const { t } = useT();
  const router = useRouter();
  const [spinning, setSpinning] = useState(true);
  const confettiFired = useRef(false);

  const n = suggestions.length;
  const winnerIdx = suggestions.findIndex((s) => s.id === room.wheel_winner_id);

  // Compute stop angle so the winner segment lands at the top pointer
  const stopAngle =
    winnerIdx >= 0 ? 5 * 360 + (360 - winnerIdx * (360 / n) - 360 / n / 2) : 5 * 360;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSpinning(false);
      if (!confettiFired.current) {
        confettiFired.current = true;
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.55 },
            colors: ['#a855f7', '#7c3aed', '#ec4899', '#f59e0b'],
          });
          setTimeout(
            () => confetti({ particleCount: 60, spread: 60, origin: { y: 0.55 }, angle: 60 }),
            300,
          );
          setTimeout(
            () => confetti({ particleCount: 60, spread: 60, origin: { y: 0.55 }, angle: 120 }),
            500,
          );
        });
      }
    }, 4700);
    return () => clearTimeout(timer);
  }, []);

  const winner = winnerIdx >= 0 ? suggestions[winnerIdx] : null;
  const showLegend = n > 8;

  return (
    <div className="flex h-full flex-col items-center gap-6 overflow-auto px-6 pt-16 pb-8">
      <div className="text-center">
        <p className="mb-1 text-xs tracking-widest text-white/50 uppercase">{room.topic}</p>
        <h2 className="text-3xl font-black text-white">{spinning ? t.wheelSpinning : '🎉'}</h2>
      </div>

      <WheelSVG segments={suggestions.map((s) => s.title)} rotation={stopAngle} />

      {!spinning && winner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          className="w-full text-center"
        >
          <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-purple-800 p-6 shadow-2xl shadow-violet-500/30">
            <p className="mb-1 text-sm text-white/70">{t.chosenByWheel} 🎡</p>
            <p className="text-3xl font-black text-white">{winner.title}</p>
            {!room.anonymous && winner.participant && (
              <p className="mt-2 text-sm text-white/50">{t.byAuthor(winner.participant.name)}</p>
            )}
          </div>
        </motion.div>
      )}

      {spinning && showLegend && (
        <div className="w-full space-y-1">
          {suggestions.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 text-sm">
              <span
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              >
                {i + 1}
              </span>
              <span className="text-white/60">{s.title}</span>
            </div>
          ))}
        </div>
      )}

      {!spinning && suggestions.length > 1 && (
        <div className="w-full">
          <p className="mb-3 text-xs tracking-widest text-white/40 uppercase">{t.allPicks}</p>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                  s.id === room.wheel_winner_id
                    ? 'border border-violet-500/30 bg-violet-500/20'
                    : 'bg-white/5'
                }`}
              >
                <span className="w-5 flex-shrink-0 text-right text-sm text-white/30">{i + 1}</span>
                <span
                  className={`flex-1 text-sm font-medium ${s.id === room.wheel_winner_id ? 'text-white' : 'text-white/60'}`}
                >
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!spinning && (
        <div className="mt-auto w-full">
          <Button
            onClick={() => router.push('/')}
            className="h-14 w-full rounded-2xl border-0 bg-gradient-to-r from-violet-600 to-purple-600 text-base font-bold text-white hover:from-violet-500 hover:to-purple-500"
          >
            {t.newRoom}
          </Button>
        </div>
      )}
    </div>
  );
}

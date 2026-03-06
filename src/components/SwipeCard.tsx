'use client';

import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import { Suggestion } from '@/types';

const CARD_GRADIENTS = [
  'from-violet-600 to-purple-800',
  'from-blue-600 to-indigo-800',
  'from-rose-500 to-pink-800',
  'from-emerald-500 to-teal-800',
  'from-amber-500 to-orange-700',
  'from-sky-500 to-cyan-700',
  'from-fuchsia-500 to-purple-700',
  'from-lime-500 to-green-700',
];

interface Props {
  suggestion: Suggestion;
  index: number;
  stackIndex: number; // 0 = top card
  anonymous: boolean;
  onSwipe: (liked: boolean) => void;
}

export function SwipeCard({ suggestion, index, stackIndex, anonymous, onSwipe }: Props) {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-18, 18]);
  const likeOpacity = useTransform(x, [30, 130], [0, 1]);
  const nopeOpacity = useTransform(x, [-130, -30], [1, 0]);

  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const isTop = stackIndex === 0;

  const handleDragEnd = async (_: unknown, info: PanInfo) => {
    const swipeRight = info.offset.x > 90 || info.velocity.x > 600;
    const swipeLeft = info.offset.x < -90 || info.velocity.x < -600;

    if (swipeRight) {
      await controls.start({
        x: typeof window !== 'undefined' ? window.innerWidth + 300 : 600,
        opacity: 0,
        transition: { duration: 0.28, ease: 'easeOut' },
      });
      onSwipe(true);
    } else if (swipeLeft) {
      await controls.start({
        x: typeof window !== 'undefined' ? -(window.innerWidth + 300) : -600,
        opacity: 0,
        transition: { duration: 0.28, ease: 'easeOut' },
      });
      onSwipe(false);
    } else {
      controls.start({
        x: 0,
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      });
    }
  };

  return (
    <motion.div
      animate={controls}
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale: 1 - stackIndex * 0.04,
        y: stackIndex * 14,
        zIndex: 10 - stackIndex,
        cursor: isTop ? 'grab' : 'default',
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      onDragEnd={isTop ? handleDragEnd : undefined}
      whileDrag={isTop ? { cursor: 'grabbing' } : undefined}
      className="absolute inset-0 touch-none select-none"
    >
      <div
        className={`w-full h-full rounded-3xl bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-8 shadow-2xl relative overflow-hidden`}
      >
        {/* Subtle decorative circles */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/5" />

        {/* LIKE badge */}
        {isTop && (
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-10 left-8 border-[3px] border-green-400 rounded-2xl px-4 py-2 -rotate-[22deg]"
          >
            <span className="text-green-400 font-black text-2xl uppercase tracking-widest">Like ✓</span>
          </motion.div>
        )}

        {/* NOPE badge */}
        {isTop && (
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-10 right-8 border-[3px] border-red-400 rounded-2xl px-4 py-2 rotate-[22deg]"
          >
            <span className="text-red-400 font-black text-2xl uppercase tracking-widest">Nope ✗</span>
          </motion.div>
        )}

        {/* Main text */}
        <p className="text-white font-bold text-3xl text-center leading-tight z-10 drop-shadow-lg">
          {suggestion.title}
        </p>

        {!anonymous && suggestion.participant && (
          <p className="text-white/50 mt-5 text-sm z-10">
            by {suggestion.participant.name}
          </p>
        )}
      </div>
    </motion.div>
  );
}

interface ActionButtonsProps {
  onDislike: () => void;
  onLike: () => void;
  disabled?: boolean;
}

export function SwipeActionButtons({ onDislike, onLike, disabled }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-10">
      <button
        onClick={onDislike}
        disabled={disabled}
        className="w-16 h-16 rounded-full bg-white/10 border-2 border-red-400/60 flex items-center justify-center text-red-400 transition-all active:scale-90 disabled:opacity-40 hover:bg-red-400/20"
      >
        <X size={28} strokeWidth={2.5} />
      </button>
      <button
        onClick={onLike}
        disabled={disabled}
        className="w-16 h-16 rounded-full bg-white/10 border-2 border-green-400/60 flex items-center justify-center text-green-400 transition-all active:scale-90 disabled:opacity-40 hover:bg-green-400/20"
      >
        <Heart size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
}

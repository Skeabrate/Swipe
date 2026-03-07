'use client';

import { useRoom } from './RoomContext';
import { Lobby } from './phases/Lobby';
import { Submitting } from './phases/Submitting';
import { Voting } from './phases/Voting';
import { Tiebreaker } from './phases/Tiebreaker';
import { Wheel } from './phases/Wheel';
import { Results } from './phases/Results';
import { AnimatePresence, motion } from 'framer-motion';

const phaseOrder = ['lobby', 'submitting', 'voting', 'tiebreaker', 'wheel', 'results'];

export function RoomShell() {
  const { room } = useRoom();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={room.phase}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.25 }}
        className=""
      >
        {room.phase === 'lobby' && <Lobby />}
        {room.phase === 'submitting' && <Submitting />}
        {room.phase === 'voting' && <Voting />}
        {room.phase === 'tiebreaker' && <Tiebreaker />}
        {room.phase === 'wheel' && <Wheel />}
        {room.phase === 'results' && <Results />}
      </motion.div>
    </AnimatePresence>
  );
}

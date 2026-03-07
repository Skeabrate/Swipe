'use client';

import { Button } from '@/components/ui/button';
import { useRoom } from './RoomContext';
import { useT } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import * as api from '@/lib/api';

export function SpinWheelButton() {
  const { room, session } = useRoom();
  const { t } = useT();

  const spinWheelMutation = useMutation({
    mutationFn: () => api.advancePhase(room.code, 'wheel', session.token),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed'),
  });

  return (
    <Button
      onClick={() => spinWheelMutation.mutate()}
      disabled={spinWheelMutation.isPending}
      className="h-12 w-full rounded-2xl border border-amber-500/40 bg-amber-500/20 text-base font-bold text-amber-300 hover:bg-amber-500/30"
    >
      🎡 {t.spinWheel}
    </Button>
  );
}

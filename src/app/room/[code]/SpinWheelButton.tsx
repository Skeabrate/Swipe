"use client";

import { Button } from "@/components/ui/button";
import { useRoom } from "./RoomContext";
import { useT } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function SpinWheelButton() {
  const { room, session } = useRoom();
  const { t } = useT();

  const spinWheelMutation = useMutation({
    mutationFn: () => api.advancePhase(room.code, "wheel", session.token),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
  });

  return (
    <Button
      onClick={() => spinWheelMutation.mutate()}
      disabled={spinWheelMutation.isPending}
      className="w-full h-12 text-base font-bold rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300"
    >
      🎡 {t.spinWheel}
    </Button>
  );
}

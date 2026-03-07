'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Trophy, BookmarkPlus, Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import * as api from '@/lib/api';

export default function HistoryPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const { t } = useT();
  const queryClient = useQueryClient();

  const [savedIdeas, setSavedIdeas] = useState<Set<string>>(new Set());
  const [pickerFor, setPickerFor] = useState<{ title: string; roomCode: string } | null>(null);

  const roomsQuery = useQuery({
    queryKey: queryKeys.userRooms(),
    queryFn: api.fetchUserRooms,
    enabled: !!isSignedIn,
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.userCategories(),
    queryFn: api.fetchCategories,
    enabled: !!isSignedIn,
  });

  const saveIdeaMutation = useMutation({
    mutationFn: ({
      title,
      roomCode,
      categoryId,
    }: {
      title: string;
      roomCode: string;
      categoryId: string | null;
    }) => api.createUserIdea(title, categoryId, roomCode),
    onSuccess: (_, { title, roomCode }) => {
      const key = `${roomCode}:${title}`;
      setSavedIdeas((prev) => new Set(prev).add(key));
      toast.success(t.ideaSaved(title));
      setPickerFor(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.userIdeas() });
    },
    onError: () => toast.error('Failed to save idea'),
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace('/');
  }, [isLoaded, isSignedIn, router]);

  const isLoading = roomsQuery.isLoading || categoriesQuery.isLoading;
  const allRooms = roomsQuery.data ?? [];
  const activeRooms = allRooms.filter((r) => r.phase !== 'results');
  const finishedRooms = allRooms.filter((r) => r.phase === 'results');
  const rooms = finishedRooms;
  const categories = categoriesQuery.data ?? [];

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#0a0a0f]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-dvh bg-[#0a0a0f] pb-16 text-white">
      <div className="mx-auto max-w-lg px-6">
        <PageHeader title={t.roomHistory} />

        {activeRooms.length > 0 && (
          <div className="mb-6 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30">
              {t.activeRooms}
            </h2>
            {activeRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => router.push(`/room/${room.code}`)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-4 py-3.5 text-left transition-colors hover:bg-violet-500/20"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{room.topic}</p>
                  <p className="mt-0.5 text-xs text-white/40">#{room.code} · {room.phase}</p>
                </div>
                <span className="flex flex-shrink-0 items-center gap-1.5 text-sm font-medium text-violet-300">
                  {t.rejoinRoom} <ArrowRight size={15} />
                </span>
              </button>
            ))}
          </div>
        )}

        {rooms.length === 0 && activeRooms.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-white/30">{t.noRoomsYet}</p>
          </div>
        ) : rooms.length > 0 ? (
          <div className="space-y-4">
            {rooms.map((room) => (
              <div key={room.id} className="overflow-hidden rounded-2xl bg-white/5">
                {/* Room header */}
                <div className="border-b border-white/10 px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-white">{room.topic}</h3>
                      <p className="mt-0.5 text-xs text-white/40">
                        {formatDate(room.created_at)} · #{room.code}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        room.phase === 'results'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {room.phase}
                    </span>
                  </div>
                  {room.winner && (
                    <div
                      className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 ${
                        room.wheel_winner_id ? 'bg-amber-500/10' : 'bg-yellow-500/10'
                      }`}
                    >
                      {room.wheel_winner_id ? (
                        <span className="flex-shrink-0 text-base leading-none">🎡</span>
                      ) : (
                        <Trophy size={14} className="flex-shrink-0 text-yellow-400" />
                      )}
                      <span
                        className={`truncate text-sm font-medium ${
                          room.wheel_winner_id ? 'text-amber-300' : 'text-yellow-300'
                        }`}
                      >
                        {room.winner.title}
                      </span>
                    </div>
                  )}
                </div>

                {/* Suggestions list */}
                {room.suggestions.length > 0 && (
                  <ul className="divide-y divide-white/5">
                    {room.suggestions.map((s) => {
                      const key = `${room.code}:${s.title}`;
                      const saved = savedIdeas.has(key);
                      const saving =
                        saveIdeaMutation.isPending &&
                        saveIdeaMutation.variables?.title === s.title &&
                        saveIdeaMutation.variables?.roomCode === room.code;
                      return (
                        <li
                          key={s.id}
                          className="flex items-center justify-between gap-3 px-4 py-2.5"
                        >
                          <span className="min-w-0 flex-1 truncate text-sm text-white/70">
                            {s.title}
                          </span>
                          <div className="flex flex-shrink-0 items-center gap-2">
                            {!room.wheel_winner_id && (
                              <span className="text-xs text-white/30 tabular-nums">
                                {s.score > 0 ? `+${s.score}` : s.score}
                              </span>
                            )}
                            {saved ? (
                              <span className="text-green-400">
                                <Check size={15} />
                              </span>
                            ) : (
                              <button
                                disabled={saving}
                                onClick={() => {
                                  if (categories.length === 0) {
                                    toast(t.noCategoriesHint, {
                                      action: {
                                        label: t.addCategory,
                                        onClick: () => router.push('/profile'),
                                      },
                                    });
                                  } else {
                                    setPickerFor({ title: s.title, roomCode: room.code });
                                  }
                                }}
                                className="text-white/30 transition-colors hover:text-violet-400"
                                title={t.saveToIdeas}
                              >
                                <BookmarkPlus size={16} />
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Category picker sheet */}
      {pickerFor && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60"
          onClick={() => setPickerFor(null)}
        >
          <div
            className="w-full space-y-4 rounded-t-3xl bg-[#13121a] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-white">{t.saveIdeaTo(pickerFor.title)}</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    saveIdeaMutation.mutate({
                      title: pickerFor.title,
                      roomCode: pickerFor.roomCode,
                      categoryId: cat.id,
                    })
                  }
                  disabled={saveIdeaMutation.isPending}
                  className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  <div
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-white">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

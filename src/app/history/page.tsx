"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Trophy, BookmarkPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n/LanguageContext";
import { PageHeader } from "@/components/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as api from "@/lib/api";

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
    mutationFn: ({ title, roomCode, categoryId }: { title: string; roomCode: string; categoryId: string | null }) =>
      api.createUserIdea(title, categoryId, roomCode),
    onSuccess: (_, { title, roomCode }) => {
      const key = `${roomCode}:${title}`;
      setSavedIdeas(prev => new Set(prev).add(key));
      toast.success(t.ideaSaved(title));
      setPickerFor(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.userIdeas() });
    },
    onError: () => toast.error("Failed to save idea"),
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/");
  }, [isLoaded, isSignedIn, router]);

  const isLoading = roomsQuery.isLoading || categoriesQuery.isLoading;
  const rooms = roomsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  if (!isLoaded || isLoading) {
    return (
      <div className='h-dvh bg-[#0a0a0f] flex items-center justify-center'>
        <div className='w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin' />
      </div>
    );
  }

  return (
    <main className='min-h-dvh bg-[#0a0a0f] text-white pb-16'>
      <div className='max-w-lg mx-auto px-6'>
        <PageHeader title={t.roomHistory} />

        {rooms.length === 0 ? (
          <div className='text-center py-20'>
            <p className='text-white/30 text-sm'>{t.noRoomsYet}</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {rooms.map((room) => (
              <div
                key={room.id}
                className='bg-white/5 rounded-2xl overflow-hidden'
              >
                {/* Room header */}
                <div className='px-4 py-4 border-b border-white/10'>
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <h3 className='text-white font-semibold'>{room.topic}</h3>
                      <p className='text-white/40 text-xs mt-0.5'>
                        {formatDate(room.created_at)} · #{room.code}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                        room.phase === "results" ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/50"
                      }`}
                    >
                      {room.phase}
                    </span>
                  </div>
                  {room.winner && (
                    <div
                      className={`flex items-center gap-2 mt-3 rounded-xl px-3 py-2 ${
                        room.wheel_winner_id ? "bg-amber-500/10" : "bg-yellow-500/10"
                      }`}
                    >
                      {room.wheel_winner_id ? (
                        <span className='text-base leading-none flex-shrink-0'>🎡</span>
                      ) : (
                        <Trophy
                          size={14}
                          className='text-yellow-400 flex-shrink-0'
                        />
                      )}
                      <span
                        className={`text-sm font-medium truncate ${
                          room.wheel_winner_id ? "text-amber-300" : "text-yellow-300"
                        }`}
                      >
                        {room.winner.title}
                      </span>
                    </div>
                  )}
                </div>

                {/* Suggestions list */}
                {room.suggestions.length > 0 && (
                  <ul className='divide-y divide-white/5'>
                    {room.suggestions.map((s) => {
                      const key = `${room.code}:${s.title}`;
                      const saved = savedIdeas.has(key);
                      const saving = saveIdeaMutation.isPending &&
                        saveIdeaMutation.variables?.title === s.title &&
                        saveIdeaMutation.variables?.roomCode === room.code;
                      return (
                        <li
                          key={s.id}
                          className='flex items-center justify-between px-4 py-2.5 gap-3'
                        >
                          <span className='text-white/70 text-sm flex-1 min-w-0 truncate'>{s.title}</span>
                          <div className='flex items-center gap-2 flex-shrink-0'>
                            {!room.wheel_winner_id && (
                              <span className='text-white/30 text-xs tabular-nums'>
                                {s.score > 0 ? `+${s.score}` : s.score}
                              </span>
                            )}
                            {saved ? (
                              <span className='text-green-400'>
                                <Check size={15} />
                              </span>
                            ) : (
                              <button
                                disabled={saving}
                                onClick={() => {
                                  if (categories.length === 0) {
                                    toast(t.noCategoriesHint, {
                                      action: { label: t.addCategory, onClick: () => router.push("/profile") },
                                    });
                                  } else {
                                    setPickerFor({ title: s.title, roomCode: room.code });
                                  }
                                }}
                                className='text-white/30 hover:text-violet-400 transition-colors'
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
        )}
      </div>

      {/* Category picker sheet */}
      {pickerFor && (
        <div
          className='fixed inset-0 bg-black/60 z-50 flex items-end'
          onClick={() => setPickerFor(null)}
        >
          <div
            className='w-full bg-[#13121a] rounded-t-3xl p-6 space-y-4'
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className='text-white font-semibold'>{t.saveIdeaTo(pickerFor.title)}</h3>
            <div className='space-y-2'>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => saveIdeaMutation.mutate({ title: pickerFor.title, roomCode: pickerFor.roomCode, categoryId: cat.id })}
                  className='w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left'
                >
                  <div
                    className='w-3 h-3 rounded-full flex-shrink-0'
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className='text-white text-sm'>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import * as api from '@/lib/api';

interface Props {
  usedTitles: string[];
  onSelect: (title: string) => void;
  label: string;
  maxSelect?: number;
}

export function SavedIdeasPicker({ usedTitles, onSelect, label, maxSelect }: Props) {
  const { user } = useUser();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { data: savedIdeas = [] } = useQuery({
    queryKey: queryKeys.userIdeas(),
    queryFn: api.fetchUserIdeas,
    enabled: !!user,
  });

  const unused = savedIdeas.filter((i) => !usedTitles.includes(i.title));

  const categories = Array.from(
    new Map(
      unused
        .filter((i) => i.user_categories)
        .map((i) => [i.user_categories!.id, i.user_categories!]),
    ).values(),
  );

  if (categories.length === 0) return null;

  const ideasInCategory = selectedCategoryId
    ? unused.filter((i) => i.category_id === selectedCategoryId)
    : [];

  return (
    <div>
      <div className="mb-2 flex w-full items-center gap-2">
        <p className="text-xs tracking-widest text-white/40 uppercase">{label}</p>
        {selectedCategoryId && (
          <>
            <button
              onClick={() => setSelectedCategoryId(null)}
              className="text-xs text-white/30 transition-colors hover:text-white/60"
            >
              ← back
            </button>
            {ideasInCategory.length > 0 && (
              <button
                onClick={() => {
                  const toAdd =
                    maxSelect != null ? ideasInCategory.slice(0, maxSelect) : ideasInCategory;
                  toAdd.forEach((idea) => onSelect(idea.title));
                }}
                className="ml-auto text-xs text-violet-400 transition-colors hover:text-violet-300"
              >
                + Add all ({Math.min(ideasInCategory.length, maxSelect ?? ideasInCategory.length)})
              </button>
            )}
          </>
        )}
      </div>

      {selectedCategoryId === null ? (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/15 hover:text-white"
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {ideasInCategory.map((idea) => (
            <button
              key={idea.id}
              onClick={() => onSelect(idea.title)}
              className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-violet-600/50 hover:text-white"
            >
              {idea.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

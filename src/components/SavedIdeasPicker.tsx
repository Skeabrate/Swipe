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

  const unused = savedIdeas.filter(i => !usedTitles.includes(i.title));

  const categories = Array.from(
    new Map(
      unused.filter(i => i.user_categories).map(i => [i.user_categories!.id, i.user_categories!])
    ).values()
  );

  if (categories.length === 0) return null;

  const ideasInCategory = selectedCategoryId
    ? unused.filter(i => i.category_id === selectedCategoryId)
    : [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 w-full">
        <p className="text-white/40 text-xs uppercase tracking-widest">{label}</p>
        {selectedCategoryId && (
          <>
            <button
              onClick={() => setSelectedCategoryId(null)}
              className="text-white/30 hover:text-white/60 text-xs transition-colors"
            >
              ← back
            </button>
            {ideasInCategory.length > 0 && (
              <button
                onClick={() => {
                  const toAdd = maxSelect != null ? ideasInCategory.slice(0, maxSelect) : ideasInCategory;
                  toAdd.forEach(idea => onSelect(idea.title));
                }}
                className="text-violet-400 hover:text-violet-300 text-xs transition-colors ml-auto"
              >
                + Add all ({Math.min(ideasInCategory.length, maxSelect ?? ideasInCategory.length)})
              </button>
            )}
          </>
        )}
      </div>

      {selectedCategoryId === null ? (
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className="flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/15 text-white/70 hover:text-white rounded-full px-3 py-1.5 transition-colors"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              {cat.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {ideasInCategory.map(idea => (
            <button
              key={idea.id}
              onClick={() => onSelect(idea.title)}
              className="text-sm bg-white/10 hover:bg-violet-600/50 text-white/70 hover:text-white rounded-full px-3 py-1.5 transition-colors"
            >
              {idea.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

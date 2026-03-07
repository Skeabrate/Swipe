'use client';

import { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Check, Pencil, X, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useT } from '@/i18n/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import * as api from '@/lib/api';
import type { Category, Idea } from '@/lib/api';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

function SortableIdeaItem({
  idea,
  onDelete,
  isDeleting,
}: {
  idea: Idea;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: idea.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5 last:border-0"
    >
      <button
        {...listeners}
        {...attributes}
        className="flex-shrink-0 cursor-grab touch-none text-white/20 hover:text-white/50 active:cursor-grabbing"
        tabIndex={-1}
      >
        <GripVertical size={14} />
      </button>
      <span className="flex-1 text-sm text-white/80">{idea.title}</span>
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="flex-shrink-0 text-white/20 transition-colors hover:text-red-400 disabled:opacity-40"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}

function DroppableCategory({
  cat,
  ideas,
  addingIdeaFor,
  newIdeaTitle,
  setNewIdeaTitle,
  setAddingIdeaFor,
  onAddIdea,
  onDeleteIdea,
  onDeleteCategory,
  isAddingIdea,
  isIdeaDeleting,
  t,
}: {
  cat: Category;
  ideas: Idea[];
  addingIdeaFor: string | null;
  newIdeaTitle: string;
  setNewIdeaTitle: (v: string) => void;
  setAddingIdeaFor: (v: string | null) => void;
  onAddIdea: (catId: string) => void;
  onDeleteIdea: (id: string) => void;
  onDeleteCategory: (cat: Category, count: number) => void;
  isAddingIdea: boolean;
  isIdeaDeleting: (id: string) => boolean;
  t: ReturnType<typeof import('@/i18n/LanguageContext').useT>['t'];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: cat.id });
  return (
    <div
      ref={setNodeRef}
      className={`overflow-hidden rounded-2xl bg-white/5 transition-all ${isOver ? 'ring-2 ring-violet-500/60' : ''}`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 flex-shrink-0 rounded-full"
            style={{ backgroundColor: cat.color }}
          />
          <span className="font-semibold text-white">{cat.name}</span>
          <span className="text-sm text-white/30">({ideas.length})</span>
        </div>
        <button
          onClick={() => onDeleteCategory(cat, ideas.length)}
          className="text-white/20 transition-colors hover:text-red-400"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <SortableContext items={ideas.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul>
          {ideas.map((idea) => (
            <SortableIdeaItem
              key={idea.id}
              idea={idea}
              onDelete={() => onDeleteIdea(idea.id)}
              isDeleting={isIdeaDeleting(idea.id)}
            />
          ))}
        </ul>
      </SortableContext>

      {ideas.length === 0 && addingIdeaFor !== cat.id && (
        <div className="px-4 py-3 text-xs text-white/20 italic">Drop ideas here</div>
      )}

      {addingIdeaFor === cat.id ? (
        <div className="flex gap-2 border-t border-white/10 p-3">
          <Input
            value={newIdeaTitle}
            onChange={(e) => setNewIdeaTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isAddingIdea) onAddIdea(cat.id);
              if (e.key === 'Escape') setAddingIdeaFor(null);
            }}
            placeholder={t.newIdeaPlaceholder}
            className="h-10 rounded-xl border-white/20 bg-white/10 text-sm text-white placeholder:text-white/30"
            autoFocus
          />
          <button
            onClick={() => onAddIdea(cat.id)}
            disabled={isAddingIdea}
            className="px-2 text-violet-400 hover:text-violet-300 disabled:opacity-40"
          >
            <Check size={18} />
          </button>
          <button
            onClick={() => setAddingIdeaFor(null)}
            className="px-1 text-white/40 hover:text-white/70"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setAddingIdeaFor(cat.id);
            setNewIdeaTitle('');
          }}
          className="flex w-full items-center gap-2 border-t border-white/5 px-4 py-2.5 text-left text-sm text-white/30 transition-colors hover:text-white/60"
        >
          <Plus size={14} /> {t.addIdea}
        </button>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const { t } = useT();
  const queryClient = useQueryClient();

  // UI-only state
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#7c3aed');
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingIdeaFor, setAddingIdeaFor] = useState<string | null>(null);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [activeIdea, setActiveIdea] = useState<Idea | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<{ cat: Category; count: number } | null>(
    null,
  );
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const profileQuery = useQuery({
    queryKey: queryKeys.userProfile(),
    queryFn: api.fetchUserProfile,
    enabled: !!isSignedIn,
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.userCategories(),
    queryFn: api.fetchCategories,
    enabled: !!isSignedIn,
  });
  const ideasQuery = useQuery({
    queryKey: queryKeys.userIdeas(),
    queryFn: api.fetchUserIdeas,
    enabled: !!isSignedIn,
  });

  const isLoading = profileQuery.isLoading || categoriesQuery.isLoading || ideasQuery.isLoading;

  // Sync username input when profile data loads
  useEffect(() => {
    if (profileQuery.data && !editingUsername) {
      setUsernameInput(profileQuery.data.username ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.data?.username]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace('/');
  }, [isLoaded, isSignedIn, router]);

  const saveProfileMutation = useMutation({
    mutationFn: (updates: Partial<api.UserProfile>) =>
      api.updateUserProfile({ ...profileQuery.data!, ...updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile() });
      toast.success(t.profileSaved);
      setEditingUsername(false);
    },
    onError: () => toast.error('Failed to save profile'),
  });

  const addCategoryMutation = useMutation({
    mutationFn: () => api.createCategory(newCategoryName.trim(), newCategoryColor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userCategories() });
      setNewCategoryName('');
      setAddingCategory(false);
    },
    onError: () => toast.error('Failed to create category'),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (catId: string) => api.deleteCategory(catId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userCategories() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userIdeas() });
      setDeletingCategory(null);
      setDeleteStep(1);
    },
    onError: () => toast.error('Failed to delete category'),
  });

  const addIdeaMutation = useMutation({
    mutationFn: ({ title, categoryId }: { title: string; categoryId: string }) =>
      api.createUserIdea(title, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userIdeas() });
      setNewIdeaTitle('');
      setAddingIdeaFor(null);
    },
    onError: () => toast.error('Failed to save idea'),
  });

  const deleteIdeaMutation = useMutation({
    mutationFn: (id: string) => api.deleteUserIdea(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.userIdeas() }),
    onError: () => toast.error('Failed to delete idea'),
  });

  const moveIdeaMutation = useMutation({
    mutationFn: ({ id, categoryId }: { id: string; categoryId: string }) =>
      api.moveUserIdea(id, categoryId),
    onMutate: async ({ id, categoryId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.userIdeas() });
      const snapshot = queryClient.getQueryData<Idea[]>(queryKeys.userIdeas());
      const categories = categoriesQuery.data ?? [];
      const targetCat = categories.find((c) => c.id === categoryId);
      queryClient.setQueryData<Idea[]>(queryKeys.userIdeas(), (old) =>
        (old ?? []).map((i) =>
          i.id === id
            ? { ...i, category_id: categoryId, user_categories: targetCat ?? i.user_categories }
            : i,
        ),
      );
      return { snapshot };
    },
    onError: (_, __, context) => {
      if (context?.snapshot) queryClient.setQueryData(queryKeys.userIdeas(), context.snapshot);
      toast.error('Failed to move idea');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.userIdeas() }),
  });

  const requestDeleteCategory = (cat: Category, count: number) => {
    setDeletingCategory({ cat, count });
    setDeleteStep(1);
  };

  const confirmDeleteCategory = () => {
    if (!deletingCategory) return;
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }
    deleteCategoryMutation.mutate(deletingCategory.cat.id);
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    const ideas = ideasQuery.data ?? [];
    setActiveIdea(ideas.find((i) => i.id === active.id) ?? null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveIdea(null);
    if (!over) return;

    const ideas = ideasQuery.data ?? [];
    const categories = categoriesQuery.data ?? [];
    const draggedIdea = ideas.find((i) => i.id === active.id);
    if (!draggedIdea) return;

    const overIdea = ideas.find((i) => i.id === over.id);
    const targetCatId = overIdea ? overIdea.category_id : (over.id as string);

    if (!targetCatId || !categories.find((c) => c.id === targetCatId)) return;

    if (draggedIdea.category_id === targetCatId) {
      // Reorder within same category (local only)
      if (overIdea && active.id !== over.id) {
        queryClient.setQueryData<Idea[]>(queryKeys.userIdeas(), (prev) => {
          if (!prev) return prev;
          const catIdeas = prev.filter((i) => i.category_id === targetCatId);
          const others = prev.filter((i) => i.category_id !== targetCatId);
          const oldIdx = catIdeas.findIndex((i) => i.id === active.id);
          const newIdx = catIdeas.findIndex((i) => i.id === over.id);
          return [...others, ...arrayMove(catIdeas, oldIdx, newIdx)];
        });
      }
    } else {
      // Move to different category — optimistic update via mutation
      moveIdeaMutation.mutate({ id: active.id as string, categoryId: targetCatId });
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#0a0a0f]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const profile = profileQuery.data;
  const categories = categoriesQuery.data ?? [];
  const ideas = ideasQuery.data ?? [];
  const displayName =
    profile?.username ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    'User';

  return (
    <main className="min-h-dvh bg-[#0a0a0f] pb-16 text-white">
      <div className="mx-auto max-w-lg px-6">
        <PageHeader title={t.myProfile} />

        {/* Profile card */}
        <div className="mb-6 space-y-5 rounded-2xl bg-white/5 p-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <UserButton
              appearance={{ elements: { avatarBox: 'w-14 h-14', userButtonPopoverCard: 'mr-2' } }}
            />
            <div className="min-w-0 flex-1">
              {editingUsername ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !saveProfileMutation.isPending)
                        saveProfileMutation.mutate({ username: usernameInput || null });
                      if (e.key === 'Escape') setEditingUsername(false);
                    }}
                    className="h-9 rounded-lg border-white/20 bg-white/10 text-sm text-white"
                    maxLength={30}
                    autoFocus
                  />
                  <button
                    onClick={() => saveProfileMutation.mutate({ username: usernameInput || null })}
                    disabled={saveProfileMutation.isPending}
                    className="text-violet-400 hover:text-violet-300 disabled:opacity-40"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => setEditingUsername(false)}
                    className="text-white/40 hover:text-white/70"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="truncate text-lg font-semibold text-white">{displayName}</span>
                  <button
                    onClick={() => setEditingUsername(true)}
                    className="text-white/30 transition-colors hover:text-white/60"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
              <p className="truncate text-sm text-white/40">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          {saveProfileMutation.isPending && <p className="text-xs text-white/40">{t.saving}</p>}
        </div>

        {/* Ideas by category */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{t.myIdeas}</h2>
            <button
              onClick={() => setAddingCategory(true)}
              className="flex items-center gap-1 text-sm text-violet-400 transition-colors hover:text-violet-300"
            >
              <Plus size={16} /> {t.addCategory}
            </button>
          </div>

          {/* New category input */}
          {addingCategory && (
            <div className="flex items-center gap-2">
              <div className="relative flex-shrink-0" title={t.accentColor}>
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="absolute inset-0 h-11 w-9 cursor-pointer rounded-xl opacity-0"
                />
                <div
                  className="pointer-events-none h-11 w-9 rounded-xl border border-white/20"
                  style={{ backgroundColor: newCategoryColor }}
                />
              </div>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !addCategoryMutation.isPending)
                    addCategoryMutation.mutate();
                  if (e.key === 'Escape') setAddingCategory(false);
                }}
                placeholder={t.categoryNamePlaceholder}
                className="h-11 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/30"
                autoFocus
              />
              <Button
                onClick={() => addCategoryMutation.mutate()}
                disabled={addCategoryMutation.isPending}
                className="h-11 flex-shrink-0 rounded-xl border-0 bg-violet-600 px-4 hover:bg-violet-500"
              >
                <Check size={18} />
              </Button>
              <button
                onClick={() => setAddingCategory(false)}
                className="flex-shrink-0 px-1 text-white/40 hover:text-white/70"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {categories.map((cat) => (
              <DroppableCategory
                key={cat.id}
                cat={cat}
                ideas={ideas.filter((i) => i.category_id === cat.id)}
                addingIdeaFor={addingIdeaFor}
                newIdeaTitle={newIdeaTitle}
                setNewIdeaTitle={setNewIdeaTitle}
                setAddingIdeaFor={setAddingIdeaFor}
                onAddIdea={(catId) =>
                  addIdeaMutation.mutate({ title: newIdeaTitle.trim(), categoryId: catId })
                }
                onDeleteIdea={(id) => deleteIdeaMutation.mutate(id)}
                onDeleteCategory={requestDeleteCategory}
                isAddingIdea={addIdeaMutation.isPending}
                isIdeaDeleting={(id) =>
                  deleteIdeaMutation.isPending && deleteIdeaMutation.variables === id
                }
                t={t}
              />
            ))}

            <DragOverlay>
              {activeIdea && (
                <div className="flex items-center gap-2 rounded-xl border border-violet-500/50 bg-[#1a1a2e] px-4 py-2.5 shadow-xl">
                  <GripVertical size={14} className="text-white/40" />
                  <span className="text-sm text-white/80">{activeIdea.title}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* Empty state */}
          {categories.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-white/30">{t.noCategoriesHint}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete category confirmation modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#1a1a2e] p-6">
            <p className="text-base leading-snug font-semibold text-white">
              {deleteStep === 1
                ? t.deleteCategoryConfirm(deletingCategory.cat.name, deletingCategory.count)
                : t.deleteCategoryConfirm2}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeletingCategory(null);
                  setDeleteStep(1);
                }}
                disabled={deleteCategoryMutation.isPending}
                className="h-11 flex-1 rounded-xl bg-white/10 text-sm font-medium text-white transition-colors hover:bg-white/15 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCategory}
                disabled={deleteCategoryMutation.isPending}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-70"
              >
                {deleteCategoryMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : deleteStep === 1 ? (
                  'Continue'
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

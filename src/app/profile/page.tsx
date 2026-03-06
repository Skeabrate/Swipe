'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Check, Pencil, X, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useT } from '@/i18n/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
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

const PRESET_COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#db2777'];

function SortableIdeaItem({
  idea,
  onDelete,
}: {
  idea: Idea;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: idea.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };
  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 last:border-0">
      <button
        {...listeners}
        {...attributes}
        className="text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
        tabIndex={-1}
      >
        <GripVertical size={14} />
      </button>
      <span className="flex-1 text-white/80 text-sm">{idea.title}</span>
      <button onClick={onDelete} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
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
  t: ReturnType<typeof import('@/i18n/LanguageContext').useT>['t'];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: cat.id });
  return (
    <div
      ref={setNodeRef}
      className={`bg-white/5 rounded-2xl overflow-hidden transition-all ${isOver ? 'ring-2 ring-violet-500/60' : ''}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
          <span className="text-white font-semibold">{cat.name}</span>
          <span className="text-white/30 text-sm">({ideas.length})</span>
        </div>
        <button onClick={() => onDeleteCategory(cat, ideas.length)} className="text-white/20 hover:text-red-400 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>

      <SortableContext items={ideas.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <ul>
          {ideas.map(idea => (
            <SortableIdeaItem key={idea.id} idea={idea} onDelete={() => onDeleteIdea(idea.id)} />
          ))}
        </ul>
      </SortableContext>

      {ideas.length === 0 && addingIdeaFor !== cat.id && (
        <div className="px-4 py-3 text-white/20 text-xs italic">Drop ideas here</div>
      )}

      {addingIdeaFor === cat.id ? (
        <div className="flex gap-2 p-3 border-t border-white/10">
          <Input
            value={newIdeaTitle}
            onChange={e => setNewIdeaTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onAddIdea(cat.id);
              if (e.key === 'Escape') setAddingIdeaFor(null);
            }}
            placeholder={t.newIdeaPlaceholder}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl h-10 text-sm"
            autoFocus
          />
          <button onClick={() => onAddIdea(cat.id)} className="text-violet-400 hover:text-violet-300 px-2">
            <Check size={18} />
          </button>
          <button onClick={() => setAddingIdeaFor(null)} className="text-white/40 hover:text-white/70 px-1">
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setAddingIdeaFor(cat.id); setNewIdeaTitle(''); }}
          className="w-full text-left px-4 py-2.5 text-white/30 hover:text-white/60 text-sm flex items-center gap-2 transition-colors border-t border-white/5"
        >
          <Plus size={14} /> {t.addIdea}
        </button>
      )}
    </div>
  );
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Idea {
  id: string;
  title: string;
  category_id: string | null;
  source_room_code: string | null;
  created_at: string;
  user_categories: { id: string; name: string; color: string } | null;
}

interface UserProfile {
  username: string | null;
  primary_color: string;
}

export default function ProfilePage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const { t } = useT();

  const [profile, setProfile] = useState<UserProfile>({ username: null, primary_color: '#7c3aed' });
  const [categories, setCategories] = useState<Category[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#7c3aed');
  const [addingCategory, setAddingCategory] = useState(false);

  const [addingIdeaFor, setAddingIdeaFor] = useState<string | null>(null);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');

  const [activeIdea, setActiveIdea] = useState<Idea | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<{ cat: Category; count: number } | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deletingCategoryLoading, setDeletingCategoryLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const fetchAll = useCallback(async () => {
    const [profileRes, catRes, ideaRes] = await Promise.all([
      fetch('/api/user/profile'),
      fetch('/api/user/categories'),
      fetch('/api/user/ideas'),
    ]);
    const [profileData, catData, ideaData] = await Promise.all([
      profileRes.json(),
      catRes.json(),
      ideaRes.json(),
    ]);
    setProfile(profileData);
    setUsernameInput(profileData.username ?? '');
    setCategories(catData);
    setIdeas(ideaData);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace('/');
    if (isSignedIn) fetchAll();
  }, [isLoaded, isSignedIn, router, fetchAll]);

  const saveProfile = async (updates: Partial<UserProfile>) => {
    setSavingProfile(true);
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, ...updates }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      toast.success(t.profileSaved);
    } else {
      toast.error('Failed to save profile');
    }
    setSavingProfile(false);
    setEditingUsername(false);
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    const res = await fetch('/api/user/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName.trim(), color: newCategoryColor }),
    });
    if (res.ok) {
      const data = await res.json();
      setCategories(prev => [...prev, data]);
      setNewCategoryName('');
      setAddingCategory(false);
    } else {
      toast.error('Failed to create category');
    }
  };

  const requestDeleteCategory = (cat: Category, count: number) => {
    setDeletingCategory({ cat, count });
    setDeleteStep(1);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    if (deleteStep === 1) { setDeleteStep(2); return; }
    const { cat } = deletingCategory;
    setDeletingCategoryLoading(true);
    const res = await fetch(`/api/user/categories/${cat.id}`, { method: 'DELETE' });
    if (res.ok) {
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      setIdeas(prev => prev.filter(i => i.category_id !== cat.id));
    } else {
      toast.error('Failed to delete category');
    }
    setDeletingCategoryLoading(false);
    setDeletingCategory(null);
    setDeleteStep(1);
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveIdea(ideas.find(i => i.id === active.id) ?? null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveIdea(null);
    if (!over) return;

    const draggedIdea = ideas.find(i => i.id === active.id);
    if (!draggedIdea) return;

    // over.id is either an idea id or a category id
    const overIdea = ideas.find(i => i.id === over.id);
    const targetCatId = overIdea ? overIdea.category_id : (over.id as string);

    if (!targetCatId || !categories.find(c => c.id === targetCatId)) return;

    if (draggedIdea.category_id === targetCatId) {
      // Reorder within same category (local only)
      if (overIdea && active.id !== over.id) {
        setIdeas(prev => {
          const catIdeas = prev.filter(i => i.category_id === targetCatId);
          const others = prev.filter(i => i.category_id !== targetCatId);
          const oldIdx = catIdeas.findIndex(i => i.id === active.id);
          const newIdx = catIdeas.findIndex(i => i.id === over.id);
          return [...others, ...arrayMove(catIdeas, oldIdx, newIdx)];
        });
      }
    } else {
      // Move to different category — optimistic update + API call
      const targetCat = categories.find(c => c.id === targetCatId)!;
      setIdeas(prev =>
        prev.map(i =>
          i.id === active.id
            ? { ...i, category_id: targetCatId, user_categories: { id: targetCat.id, name: targetCat.name, color: targetCat.color } }
            : i
        )
      );
      fetch(`/api/user/ideas/${active.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: targetCatId }),
      }).catch(() => {
        toast.error('Failed to move idea');
        setIdeas(prev => prev.map(i => i.id === active.id ? draggedIdea : i));
      });
    }
  };

  const addIdea = async (categoryId: string) => {
    if (!newIdeaTitle.trim()) return;
    const res = await fetch('/api/user/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newIdeaTitle.trim(), category_id: categoryId }),
    });
    if (res.ok) {
      const data = await res.json();
      const cat = categories.find(c => c.id === categoryId) ?? null;
      setIdeas(prev => [...prev, { ...data, user_categories: cat }]);
      setNewIdeaTitle('');
      setAddingIdeaFor(null);
    } else {
      toast.error('Failed to save idea');
    }
  };


  const deleteIdea = async (id: string) => {
    const res = await fetch(`/api/user/ideas/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setIdeas(prev => prev.filter(i => i.id !== id));
    } else {
      toast.error('Failed to delete idea');
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="h-dvh bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = profile.username || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'User';

  return (
    <main className="min-h-dvh bg-[#0a0a0f] text-white pb-16">
      <div className="max-w-lg mx-auto px-6">
        <PageHeader title={t.myProfile} />

        {/* Profile card */}
        <div className="bg-white/5 rounded-2xl p-5 space-y-5 mb-6">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <UserButton appearance={{ elements: { avatarBox: 'w-14 h-14', userButtonPopoverCard: 'mr-2' } }} />
            <div className="flex-1 min-w-0">
              {editingUsername ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={usernameInput}
                    onChange={e => setUsernameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveProfile({ username: usernameInput || null }); if (e.key === 'Escape') setEditingUsername(false); }}
                    className="bg-white/10 border-white/20 text-white h-9 rounded-lg text-sm"
                    maxLength={30}
                    autoFocus
                  />
                  <button onClick={() => saveProfile({ username: usernameInput || null })} className="text-violet-400 hover:text-violet-300">
                    <Check size={18} />
                  </button>
                  <button onClick={() => setEditingUsername(false)} className="text-white/40 hover:text-white/70">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-lg truncate">{displayName}</span>
                  <button onClick={() => setEditingUsername(true)} className="text-white/30 hover:text-white/60 transition-colors">
                    <Pencil size={14} />
                  </button>
                </div>
              )}
              <p className="text-white/40 text-sm truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>

          {savingProfile && <p className="text-white/40 text-xs">{t.saving}</p>}
        </div>

        {/* Ideas by category */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">{t.myIdeas}</h2>
            <button
              onClick={() => setAddingCategory(true)}
              className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1 transition-colors"
            >
              <Plus size={16} /> {t.addCategory}
            </button>
          </div>

          {/* New category input */}
          {addingCategory && (
            <div className="flex gap-2 items-center">
              <div className="relative flex-shrink-0" title={t.accentColor}>
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={e => setNewCategoryColor(e.target.value)}
                  className="w-9 h-11 rounded-xl cursor-pointer opacity-0 absolute inset-0"
                />
                <div
                  className="w-9 h-11 rounded-xl border border-white/20 pointer-events-none"
                  style={{ backgroundColor: newCategoryColor }}
                />
              </div>
              <Input
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') setAddingCategory(false); }}
                placeholder={t.categoryNamePlaceholder}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl h-11"
                autoFocus
              />
              <Button onClick={addCategory} className="h-11 rounded-xl bg-violet-600 hover:bg-violet-500 border-0 px-4 flex-shrink-0">
                <Check size={18} />
              </Button>
              <button onClick={() => setAddingCategory(false)} className="text-white/40 hover:text-white/70 px-1 flex-shrink-0">
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
            {categories.map(cat => (
              <DroppableCategory
                key={cat.id}
                cat={cat}
                ideas={ideas.filter(i => i.category_id === cat.id)}
                addingIdeaFor={addingIdeaFor}
                newIdeaTitle={newIdeaTitle}
                setNewIdeaTitle={setNewIdeaTitle}
                setAddingIdeaFor={setAddingIdeaFor}
                onAddIdea={addIdea}
                onDeleteIdea={deleteIdea}
                onDeleteCategory={requestDeleteCategory}
                t={t}
              />
            ))}

            <DragOverlay>
              {activeIdea && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a2e] border border-violet-500/50 rounded-xl shadow-xl">
                  <GripVertical size={14} className="text-white/40" />
                  <span className="text-white/80 text-sm">{activeIdea.title}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* Empty state */}
          {categories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/30 text-sm">{t.noCategoriesHint}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete category confirmation modal */}
      {deletingCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <p className="text-white font-semibold text-base leading-snug">
              {deleteStep === 1
                ? t.deleteCategoryConfirm(deletingCategory.cat.name, deletingCategory.count)
                : t.deleteCategoryConfirm2}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setDeletingCategory(null); setDeleteStep(1); }}
                disabled={deletingCategoryLoading}
                className="flex-1 h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCategory}
                disabled={deletingCategoryLoading}
                className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {deletingCategoryLoading
                  ? <Loader2 size={16} className="animate-spin" />
                  : deleteStep === 1 ? 'Continue' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

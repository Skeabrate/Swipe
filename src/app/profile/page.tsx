'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Check, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useT } from '@/i18n/LanguageContext';
import { PageHeader } from '@/components/PageHeader';

const PRESET_COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#db2777'];

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
  const [addingCategory, setAddingCategory] = useState(false);

  const [addingIdeaFor, setAddingIdeaFor] = useState<string | null>(null);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');

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
      body: JSON.stringify({ name: newCategoryName.trim(), color: profile.primary_color }),
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

  const deleteCategory = async (id: string) => {
    const res = await fetch(`/api/user/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCategories(prev => prev.filter(c => c.id !== id));
      setIdeas(prev => prev.map(i => i.category_id === id ? { ...i, category_id: null, user_categories: null } : i));
    } else {
      toast.error('Failed to delete category');
    }
  };

  const addIdea = async (categoryId: string | null) => {
    if (!newIdeaTitle.trim()) return;
    const res = await fetch('/api/user/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newIdeaTitle.trim(), category_id: categoryId }),
    });
    if (res.ok) {
      const data = await res.json();
      const cat = categories.find(c => c.id === categoryId) ?? null;
      setIdeas(prev => [{ ...data, user_categories: cat }, ...prev]);
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
  const uncategorized = ideas.filter(i => !i.category_id);

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

          {/* Primary color */}
          <div className="space-y-2">
            <p className="text-white/60 text-sm">{t.accentColor}</p>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => saveProfile({ primary_color: color })}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: profile.primary_color === color ? 'white' : 'transparent',
                    transform: profile.primary_color === color ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
              <div className="relative">
                <input
                  type="color"
                  value={profile.primary_color}
                  onChange={e => saveProfile({ primary_color: e.target.value })}
                  className="w-8 h-8 rounded-full cursor-pointer opacity-0 absolute inset-0"
                  title={t.customColor}
                />
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center text-white/40 text-xs pointer-events-none">
                  +
                </div>
              </div>
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
            <div className="flex gap-2">
              <Input
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') setAddingCategory(false); }}
                placeholder={t.categoryNamePlaceholder}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl h-11"
                autoFocus
              />
              <Button onClick={addCategory} className="h-11 rounded-xl bg-violet-600 hover:bg-violet-500 border-0 px-4">
                <Check size={18} />
              </Button>
              <button onClick={() => setAddingCategory(false)} className="text-white/40 hover:text-white/70 px-2">
                <X size={18} />
              </button>
            </div>
          )}

          {categories.map(cat => {
            const catIdeas = ideas.filter(i => i.category_id === cat.id);
            return (
              <div key={cat.id} className="bg-white/5 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-white font-semibold">{cat.name}</span>
                    <span className="text-white/30 text-sm">({catIdeas.length})</span>
                  </div>
                  <button onClick={() => deleteCategory(cat.id)} className="text-white/20 hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>

                {catIdeas.length > 0 && (
                  <ul className="divide-y divide-white/5">
                    {catIdeas.map(idea => (
                      <li key={idea.id} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-white/80 text-sm">{idea.title}</span>
                        <button onClick={() => deleteIdea(idea.id)} className="text-white/20 hover:text-red-400 transition-colors ml-3 flex-shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {addingIdeaFor === cat.id ? (
                  <div className="flex gap-2 p-3 border-t border-white/10">
                    <Input
                      value={newIdeaTitle}
                      onChange={e => setNewIdeaTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addIdea(cat.id); if (e.key === 'Escape') setAddingIdeaFor(null); }}
                      placeholder={t.newIdeaPlaceholder}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl h-10 text-sm"
                      autoFocus
                    />
                    <button onClick={() => addIdea(cat.id)} className="text-violet-400 hover:text-violet-300 px-2">
                      <Check size={18} />
                    </button>
                    <button onClick={() => setAddingIdeaFor(null)} className="text-white/40 hover:text-white/70 px-1">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingIdeaFor(cat.id); setNewIdeaTitle(''); }}
                    className="w-full text-left px-4 py-2.5 text-white/30 hover:text-white/60 text-sm flex items-center gap-2 transition-colors"
                  >
                    <Plus size={14} /> {t.addIdea}
                  </button>
                )}
              </div>
            );
          })}

          {/* Uncategorized */}
          {(uncategorized.length > 0 || addingIdeaFor === 'uncategorized') && (
            <div className="bg-white/5 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <span className="text-white/60 font-semibold text-sm">{t.uncategorized}</span>
              </div>
              {uncategorized.length > 0 && (
                <ul className="divide-y divide-white/5">
                  {uncategorized.map(idea => (
                    <li key={idea.id} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-white/80 text-sm">{idea.title}</span>
                      <button onClick={() => deleteIdea(idea.id)} className="text-white/20 hover:text-red-400 transition-colors ml-3 flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {addingIdeaFor === 'uncategorized' ? (
                <div className="flex gap-2 p-3 border-t border-white/10">
                  <Input
                    value={newIdeaTitle}
                    onChange={e => setNewIdeaTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addIdea(null); if (e.key === 'Escape') setAddingIdeaFor(null); }}
                    placeholder={t.newIdeaPlaceholder}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl h-10 text-sm"
                    autoFocus
                  />
                  <button onClick={() => addIdea(null)} className="text-violet-400 hover:text-violet-300 px-2">
                    <Check size={18} />
                  </button>
                  <button onClick={() => setAddingIdeaFor(null)} className="text-white/40 hover:text-white/70 px-1">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setAddingIdeaFor('uncategorized'); setNewIdeaTitle(''); }}
                  className="w-full text-left px-4 py-2.5 text-white/30 hover:text-white/60 text-sm flex items-center gap-2 transition-colors"
                >
                  <Plus size={14} /> {t.addIdea}
                </button>
              )}
            </div>
          )}

          {/* Empty state */}
          {categories.length === 0 && uncategorized.length === 0 && addingIdeaFor !== 'uncategorized' && (
            <div className="text-center py-12">
              <p className="text-white/30 text-sm mb-4">{t.noIdeasYet}</p>
              <button
                onClick={() => { setAddingIdeaFor('uncategorized'); setNewIdeaTitle(''); }}
                className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1 mx-auto transition-colors"
              >
                <Plus size={16} /> {t.addFirstIdea}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

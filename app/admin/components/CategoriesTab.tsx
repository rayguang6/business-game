'use client';

import { useEffect } from 'react';
import type { Category } from '@/lib/game/types';
import { makeUniqueId, slugify } from './utils';

interface CategoriesTabProps {
  industryId: string;
  categories: Category[];
  categoriesLoading: boolean;
  selectedCategoryId: string;
  isCreatingCategory: boolean;
  categoryForm: {
    id: string;
    name: string;
    orderIndex: string;
    description: string;
  };
  categorySaving: boolean;
  categoryDeleting: boolean;
  onSelectCategory: (category: Category) => void;
  onCreateCategory: () => void;
  onSaveCategory: () => Promise<void>;
  onDeleteCategory: () => Promise<void>;
  onReset: () => void;
    onUpdateForm: (updates: Partial<{
      id: string;
      name: string;
      orderIndex: string;
      description: string;
    }>) => void;
}

export function CategoriesTab({
  industryId,
  categories,
  categoriesLoading,
  selectedCategoryId,
  isCreatingCategory,
  categoryForm,
  categorySaving,
  categoryDeleting,
  onSelectCategory,
  onCreateCategory,
  onSaveCategory,
  onDeleteCategory,
  onReset,
  onUpdateForm,
}: CategoriesTabProps) {
  // Keyboard shortcuts for save and delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Save shortcut (Command/Ctrl + Enter)
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if ((selectedCategoryId || isCreatingCategory) && !categorySaving && !categoryDeleting) {
          onSaveCategory();
        }
      }
      // Delete shortcut (Command + Delete/Backspace) - prioritize Mac
      if (event.metaKey && (event.key === 'Delete' || event.key === 'Backspace') && !isCreatingCategory && selectedCategoryId) {
        event.preventDefault();
        event.stopPropagation();
        if (!categorySaving && !categoryDeleting) {
          onDeleteCategory();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedCategoryId, isCreatingCategory, categorySaving, categoryDeleting, onSaveCategory, onDeleteCategory]);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">Categories</h2>
        <p className="text-sm text-slate-400 mt-1">
          Organize upgrades and marketing campaigns into categories for better user experience.
        </p>
      </div>
      <div className="p-6 space-y-6">
        {!industryId ? (
          <div className="text-sm text-slate-400">Select or create an industry first.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onCreateCategory}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-purple-500 text-purple-200 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!industryId}
              >
                + New Category
              </button>
            </div>

            {categoriesLoading ? (
              <div className="text-sm text-slate-400">Loading categories…</div>
            ) : categories.length === 0 && !isCreatingCategory ? (
              <div className="text-sm text-slate-400">No categories configured yet.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => onSelectCategory(category)}
                      className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                        selectedCategoryId === category.id && !isCreatingCategory
                          ? 'border-purple-400 bg-purple-500/10 text-purple-200'
                          : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                      }`}
                    >
                      {category.name}
                      {category.industryId ? '' : ' 🌍'}
                    </button>
                  ))}
                </div>

                {(selectedCategoryId || isCreatingCategory) && (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1">
                          Category ID (auto-generated)
                        </label>
                        <input
                          value={categoryForm.id}
                          disabled={true}
                          className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-400 cursor-not-allowed"
                        />
                        <p className="text-xs text-slate-500 mt-1">ID will be auto-generated from name</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1">Order Index</label>
                        <input
                          type="number"
                          min="0"
                          value={categoryForm.orderIndex}
                          onChange={(e) => {
                            onUpdateForm({ orderIndex: e.target.value });
                          }}
                          className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                        />
                        <p className="text-xs text-slate-500 mt-1">Lower numbers appear first</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                        <input
                          value={categoryForm.name}
                          onChange={(e) => {
                            onUpdateForm({ name: e.target.value });
                          }}
                          onBlur={(e) => {
                            if (isCreatingCategory && e.target.value.trim()) {
                              const base = slugify(e.target.value.trim());
                              const unique = makeUniqueId(base, new Set(categories.map((c) => c.id)));
                              onUpdateForm({ id: unique });
                            }
                          }}
                          className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-300 mb-1">
                          Description (optional)
                        </label>
                        <textarea
                          rows={2}
                          value={categoryForm.description}
                          onChange={(e) => {
                            onUpdateForm({ description: e.target.value });
                          }}
                          className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Categories help organize upgrades and marketing campaigns. All categories in this industry are available for both upgrades and marketing.
                        </p>
                      </div>
                      <div className="md:col-span-2 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={onSaveCategory}
                          disabled={categorySaving || categoryDeleting}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            categorySaving
                              ? 'bg-purple-900 text-purple-300 cursor-wait'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          }`}
                        >
                          {categorySaving ? 'Saving…' : 'Save Category'}
                        </button>
                        <button
                          type="button"
                          onClick={onReset}
                          disabled={categorySaving || categoryDeleting}
                          className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                        >
                          {isCreatingCategory ? 'Cancel' : 'Reset'}
                        </button>
                        {!isCreatingCategory && selectedCategoryId && (
                          <button
                            type="button"
                            onClick={onDeleteCategory}
                            disabled={categorySaving || categoryDeleting}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                              categoryDeleting
                                ? 'bg-rose-900 text-rose-200 cursor-wait'
                                : 'bg-rose-600 hover:bg-rose-500 text-white'
                            }`}
                          >
                            {categoryDeleting ? 'Deleting…' : 'Delete Category'}
                          </button>
                        )}
                      </div>

                      {/* Floating Action Buttons */}
                      {(selectedCategoryId || isCreatingCategory) && (
                        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                          <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl px-6 py-3 shadow-2xl">
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={onSaveCategory}
                                disabled={categorySaving || categoryDeleting}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
                                  categorySaving
                                    ? 'bg-purple-900 text-purple-300 cursor-wait'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                                }`}
                              >
                                {categorySaving ? '💾 Saving…' : '💾 Save (⌘↵)'}
                              </button>
                              {!isCreatingCategory && selectedCategoryId && (
                                <button
                                  type="button"
                                  onClick={onDeleteCategory}
                                  disabled={categoryDeleting || categorySaving}
                                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
                                    categoryDeleting
                                      ? 'bg-rose-900 text-rose-200 cursor-wait'
                                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                                  }`}
                                >
                                  {categoryDeleting ? '🗑️ Deleting…' : '🗑️ Delete (⌘⌫)'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
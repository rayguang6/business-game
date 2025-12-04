'use client';

import { useEffect } from 'react';
import type { Industry } from '@/lib/features/industries';
import { makeUniqueId, slugify } from './utils';

interface IndustriesTabProps {
  industries: Industry[];
  isLoading: boolean;
  error: string | null;
  form: {
    id: string;
    name: string;
    icon: string;
    description: string;
    image: string;
    mapImage: string;
    isAvailable: boolean;
  };
  isSaving: boolean;
  isDeleting: boolean;
  statusMessage: string | null;
  isCreating: boolean;
  onSelectIndustry: (industryId: string) => void;
  onCreateNew: () => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onReset: () => void;
  onUpdateForm: (updates: Partial<IndustriesTabProps['form']>) => void;
}

export function IndustriesTab({
  industries,
  isLoading,
  error,
  form,
  isSaving,
  isDeleting,
  statusMessage,
  isCreating,
  onSelectIndustry,
  onCreateNew,
  onSave,
  onDelete,
  onReset,
  onUpdateForm,
}: IndustriesTabProps) {
  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if ((form.id || isCreating) && !isSaving && !isDeleting) {
          onSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [form.id, isCreating, isSaving, isDeleting, onSave]);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">Industries</h2>
        <p className="text-sm text-slate-400 mt-1">
          Select an industry and edit its basic metadata. Changes persist immediately to Supabase.
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onCreateNew}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-sky-500 text-sky-200 hover:bg-sky-500/10"
          >
            + New Industry
          </button>
          {statusMessage && <span className="text-sm text-slate-300">{statusMessage}</span>}
        </div>

        {isLoading ? (
          <div className="text-sm text-slate-400">Loading industries...</div>
        ) : error ? (
          <div className="text-sm text-rose-400">{error}</div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {industries.map((industry) => (
                <button
                  key={industry.id}
                  onClick={() => onSelectIndustry(industry.id)}
                  className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                    form.id === industry.id
                      ? 'border-sky-400 bg-sky-500/10 text-sky-200'
                      : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                  }`}
                >
                  {industry.icon} {industry.name}
                </button>
              ))}
            </div>

            {form.id || isCreating ? (
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Industry ID</label>
                  <input
                    value={form.id}
                    onChange={(e) => onUpdateForm({ id: e.target.value })}
                    disabled={!isCreating}
                    className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                      isCreating
                        ? 'bg-slate-900 border-slate-600'
                        : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => onUpdateForm({ name: e.target.value })}
                    onBlur={() => {
                      if (isCreating && !form.id && form.name.trim()) {
                        const base = slugify(form.name.trim());
                        const unique = makeUniqueId(base, new Set(industries.map((i) => i.id)));
                        onUpdateForm({ id: unique });
                      }
                    }}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Icon</label>
                  <input
                    value={form.icon}
                    onChange={(e) => onUpdateForm({ icon: e.target.value })}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Short Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => onUpdateForm({ description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Image URL</label>
                  <input
                    value={form.image}
                    onChange={(e) => onUpdateForm({ image: e.target.value })}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Map Image URL</label>
                  <input
                    value={form.mapImage}
                    onChange={(e) => onUpdateForm({ mapImage: e.target.value })}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    id="industry-available"
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) => onUpdateForm({ isAvailable: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-400"
                  />
                  <label htmlFor="industry-available" className="text-sm font-semibold text-slate-300">
                    Available for selection
                  </label>
                </div>

                <div className="md:col-span-2">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={onSave}
                      disabled={isSaving || isDeleting}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        isSaving
                          ? 'bg-sky-900 text-sky-300 cursor-wait'
                          : 'bg-sky-600 hover:bg-sky-500 text-white'
                      }`}
                    >
                      {isSaving ? 'Saving…' : 'Save Changes'}
                    </button>

                    <button
                      type="button"
                      onClick={onReset}
                      disabled={isSaving || isDeleting}
                      className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                    >
                      {isCreating ? 'Cancel' : 'Reset'}
                    </button>

                    {!isCreating && (
                      <button
                        type="button"
                        onClick={onDelete}
                        disabled={isDeleting || isSaving}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                          isDeleting
                            ? 'bg-rose-900 text-rose-200 cursor-wait'
                            : 'bg-rose-600 hover:bg-rose-500 text-white'
                        }`}
                      >
                        {isDeleting ? 'Deleting…' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Floating Save Button */}
                {(form.id || isCreating) && (
                  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl px-6 py-3 shadow-2xl">
                      <button
                        type="button"
                        onClick={onSave}
                        disabled={isSaving || isDeleting}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
                          isSaving
                            ? 'bg-sky-900 text-sky-300 cursor-wait'
                            : 'bg-sky-600 hover:bg-sky-500 text-white'
                        }`}
                      >
                        {isSaving ? '💾 Saving…' : '💾 Save Changes (⌘↵)'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="text-sm text-slate-400">Select an industry above to view its current details.</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}


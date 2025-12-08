'use client';

import { useEffect } from 'react';
import type { GameFlag } from '@/lib/data/flagRepository';
import { makeUniqueId, slugify } from './utils';

interface FlagsTabProps {
  industryId: string;
  flags: GameFlag[];
  flagsLoading: boolean;
  flagStatus: string | null;
  selectedFlagId: string;
  isCreatingFlag: boolean;
  flagForm: { id: string; name: string; description: string };
  flagSaving: boolean;
  flagDeleting: boolean;
  onSelectFlag: (flag: GameFlag) => void;
  onCreateFlag: () => void;
  onSaveFlag: () => Promise<void>;
  onDeleteFlag: () => Promise<void>;
  onReset: () => void;
  onUpdateForm: (updates: Partial<{ id: string; name: string; description: string }>) => void;
}

export function FlagsTab({
  industryId,
  flags,
  flagsLoading,
  flagStatus,
  selectedFlagId,
  isCreatingFlag,
  flagForm,
  flagSaving,
  flagDeleting,
  onSelectFlag,
  onCreateFlag,
  onSaveFlag,
  onDeleteFlag,
  onReset,
  onUpdateForm,
}: FlagsTabProps) {
  // Keyboard shortcuts for save and delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Save shortcut (Command/Ctrl + Enter)
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if ((selectedFlagId || isCreatingFlag) && !flagSaving && !flagDeleting) {
          onSaveFlag();
        }
      }
      // Delete shortcut (Command + Delete/Backspace) - prioritize Mac
      if (event.metaKey && (event.key === 'Delete' || event.key === 'Backspace') && !isCreatingFlag && selectedFlagId) {
        event.preventDefault();
        event.stopPropagation();
        if (!flagSaving && !flagDeleting) {
          onDeleteFlag();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedFlagId, isCreatingFlag, flagSaving, flagDeleting, onSaveFlag, onDeleteFlag]);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">Flags</h2>
        <p className="text-sm text-slate-400 mt-1">
          Create flags that can be set by event choices. Use these to track persistent game state.
        </p>
      </div>
      <div className="p-6 space-y-6">
        {!industryId ? (
          <div className="text-sm text-slate-400">Select or create an industry first.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onCreateFlag}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-purple-500 text-purple-200 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!industryId}
              >
                + New Flag
              </button>
              {flagStatus && <span className="text-sm text-slate-300">{flagStatus}</span>}
            </div>

            {flagsLoading ? (
              <div className="text-sm text-slate-400">Loading flags…</div>
            ) : flags.length === 0 && !isCreatingFlag ? (
              <div className="text-sm text-slate-400">No flags configured yet.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {flags.map((flag) => (
                    <button
                      key={flag.id}
                      onClick={() => onSelectFlag(flag)}
                      className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                        selectedFlagId === flag.id && !isCreatingFlag
                          ? 'border-purple-400 bg-purple-500/10 text-purple-200'
                          : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                      }`}
                    >
                      {flag.name}
                    </button>
                  ))}
                </div>

                {(selectedFlagId || isCreatingFlag) && (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1">
                          Flag ID (auto-generated)
                        </label>
                        <input
                          value={flagForm.id}
                          disabled={true}
                          className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-400 cursor-not-allowed"
                        />
                        <p className="text-xs text-slate-500 mt-1">ID will be auto-generated from name</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                        <input
                          value={flagForm.name}
                          onChange={(e) => {
                            onUpdateForm({ name: e.target.value });
                          }}
                          onBlur={(e) => {
                            if (isCreatingFlag && e.target.value.trim()) {
                              const base = slugify(e.target.value.trim());
                              const unique = makeUniqueId(base, new Set(flags.map((f) => f.id)));
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
                          value={flagForm.description}
                          onChange={(e) => {
                            onUpdateForm({ description: e.target.value });
                          }}
                          className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                        />
                      </div>
                      <div className="md:col-span-2 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={onSaveFlag}
                          disabled={flagSaving || flagDeleting}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            flagSaving
                              ? 'bg-purple-900 text-purple-300 cursor-wait'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          }`}
                        >
                          {flagSaving ? 'Saving…' : 'Save Flag'}
                        </button>
                        <button
                          type="button"
                          onClick={onReset}
                          disabled={flagSaving || flagDeleting}
                          className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                        >
                          {isCreatingFlag ? 'Cancel' : 'Reset'}
                        </button>
                        {!isCreatingFlag && selectedFlagId && (
                          <button
                            type="button"
                            onClick={onDeleteFlag}
                            disabled={flagSaving || flagDeleting}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                              flagDeleting
                                ? 'bg-rose-900 text-rose-200 cursor-wait'
                                : 'bg-rose-600 hover:bg-rose-500 text-white'
                            }`}
                          >
                            {flagDeleting ? 'Deleting…' : 'Delete Flag'}
                          </button>
                        )}
                      </div>

                      {/* Floating Action Buttons */}
                      {(selectedFlagId || isCreatingFlag) && (
                        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                          <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl px-6 py-3 shadow-2xl">
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={onSaveFlag}
                                disabled={flagSaving || flagDeleting}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
                                  flagSaving
                                    ? 'bg-purple-900 text-purple-300 cursor-wait'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                                }`}
                              >
                                {flagSaving ? '💾 Saving…' : '💾 Save (⌘↵)'}
                              </button>
                              {!isCreatingFlag && selectedFlagId && (
                                <button
                                  type="button"
                                  onClick={onDeleteFlag}
                                  disabled={flagDeleting || flagSaving}
                                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
                                    flagDeleting
                                      ? 'bg-rose-900 text-rose-200 cursor-wait'
                                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                                  }`}
                                >
                                  {flagDeleting ? '🗑️ Deleting…' : '🗑️ Delete (⌘⌫)'}
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


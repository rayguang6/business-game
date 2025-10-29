'use client';

import { useEffect, useState } from 'react';
import {
  fetchIndustriesFromSupabase,
  upsertIndustryToSupabase,
  deleteIndustryFromSupabase,
} from '@/lib/data/industryRepository';
import type { Industry } from '@/lib/features/industries';

interface FormState {
  id: string;
  name: string;
  icon: string;
  description: string;
  image: string;
  mapImage: string;
}

const emptyForm: FormState = {
  id: '',
  name: '',
  icon: '',
  description: '',
  image: '',
  mapImage: '',
};

export default function AdminPage() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchIndustriesFromSupabase();
        if (!isMounted) {
          return;
        }

        if (data) {
          setIndustries(data);
          if (data.length > 0) {
            const first = data[0];
            setForm({
              id: first.id,
              name: first.name,
              icon: first.icon,
              description: first.description,
              image: first.image ?? '',
              mapImage: first.mapImage ?? '',
            });
          }
        }
      } catch (err) {
        console.error('Failed to load industries for admin panel', err);
        if (isMounted) {
          setError('Failed to load industries.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelect = (industryId: string) => {
    const selected = industries.find((item) => item.id === industryId);
    if (!selected) {
      return;
    }

    setIsCreating(false);
    setForm({
      id: selected.id,
      name: selected.name,
      icon: selected.icon,
      description: selected.description,
      image: selected.image ?? '',
      mapImage: selected.mapImage ?? '',
    });
    setStatusMessage(null);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setForm({ ...emptyForm, icon: '🏢' });
    setStatusMessage(null);
  };

  const handleSave = async () => {
    const trimmedName = form.name.trim();
    let trimmedId = form.id.trim();

    if (!form.name.trim()) {
      setStatusMessage('Name is required.');
      return;
    }

    if (!trimmedId) {
      trimmedId = slugify(trimmedName);
      if (!trimmedId) {
        setStatusMessage('Industry ID is required.');
        return;
      }
    }

    setIsSaving(true);
    setStatusMessage(null);

    const payload: Industry = {
      id: trimmedId,
      name: trimmedName,
      icon: form.icon.trim() || '🏢',
      description: form.description.trim(),
      image: form.image.trim() || undefined,
      mapImage: form.mapImage.trim() || undefined,
    };

    const result = await upsertIndustryToSupabase(payload);
    setIsSaving(false);

    if (!result.success || !result.data) {
      setStatusMessage(result.message ?? 'Failed to save industry.');
      return;
    }

    setIndustries((prev) => {
      const exists = prev.some((item) => item.id === result.data!.id);
      const next = exists
        ? prev.map((item) => (item.id === result.data!.id ? result.data! : item))
        : [...prev, result.data!];

      return next.sort((a, b) => a.name.localeCompare(b.name));
    });

    setForm({
      id: result.data.id,
      name: result.data.name,
      icon: result.data.icon,
      description: result.data.description,
      image: result.data.image ?? '',
      mapImage: result.data.mapImage ?? '',
    });

    setIsCreating(false);
    setStatusMessage('Industry saved successfully.');
  };

  const handleDelete = async () => {
    if (isCreating || !form.id) {
      return;
    }

    if (!window.confirm(`Delete industry "${form.name || form.id}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setStatusMessage(null);

    const result = await deleteIndustryFromSupabase(form.id);
    setIsDeleting(false);

    if (!result.success) {
      setStatusMessage(result.message ?? 'Failed to delete industry.');
      return;
    }

    setIndustries((prev) => prev.filter((item) => item.id !== form.id));
    setForm(emptyForm);
    setIsCreating(false);
    setStatusMessage('Industry deleted.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-sm text-slate-400">Edit base game content directly</p>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-2xl font-semibold">Industries</h2>
            <p className="text-sm text-slate-400 mt-1">
              Select an industry and edit its basic metadata. Saving will be available in the next step.
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleCreateNew}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-sky-500 text-sky-200 hover:bg-sky-500/10"
              >
                + New Industry
              </button>
              {statusMessage && (
                <span className="text-sm text-slate-300">{statusMessage}</span>
              )}
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
                      onClick={() => handleSelect(industry.id)}
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
                      <label className="block text-sm font-semibold text-slate-300 mb-1">
                        Industry ID
                      </label>
                      <input
                        value={form.id}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, id: event.target.value }))
                        }
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
                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Icon</label>
                      <input
                        value={form.icon}
                        onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-1">
                        Short Description
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                        rows={3}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Image URL</label>
                      <input
                        value={form.image}
                        onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Map Image URL</label>
                      <input
                        value={form.mapImage}
                        onChange={(event) => setForm((prev) => ({ ...prev, mapImage: event.target.value }))}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleSave}
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
                          onClick={() => {
                            if (!isCreating) {
                              const current = industries.find((item) => item.id === form.id);
                              if (current) {
                                setForm({
                                  id: current.id,
                                  name: current.name,
                                  icon: current.icon,
                                  description: current.description,
                                  image: current.image ?? '',
                                  mapImage: current.mapImage ?? '',
                                });
                              }
                            } else {
                              setForm(emptyForm);
                              setIsCreating(false);
                            }
                            setStatusMessage(null);
                          }}
                          disabled={isSaving || isDeleting}
                          className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                        >
                          {isCreating ? 'Cancel' : 'Reset'}
                        </button>

                        {!isCreating && (
                          <button
                            type="button"
                            onClick={handleDelete}
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
                  </form>
                ) : (
                  <div className="text-sm text-slate-400">
                    Select an industry above to view its current details.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

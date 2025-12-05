import { useState, useCallback, useEffect } from 'react';
import { fetchIndustries, upsertIndustry, deleteIndustry } from '@/lib/server/actions/adminActions';
import type { Industry } from '@/lib/features/industries';
import { slugify } from '../components/utils';
import type { Operation } from './types';

interface IndustryForm {
  id: string;
  name: string;
  icon: string;
  description: string;
  image: string;
  mapImage: string;
  isAvailable: boolean;
}

const emptyForm: IndustryForm = {
  id: '',
  name: '',
  icon: '',
  description: '',
  image: '',
  mapImage: '',
  isAvailable: true,
};

export function useIndustries(industryId?: string) {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [operation, setOperation] = useState<Operation>('loading');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<IndustryForm>(emptyForm);

  // Load industries
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setOperation('loading');
      setError(null);
      try {
        const data = await fetchIndustries();
        if (!isMounted) return;
        if (data) {
          setIndustries(data);
        }
      } catch (err) {
        console.error('Failed to load industries', err);
        if (isMounted) {
          setError('Failed to load industries.');
        }
      } finally {
        if (isMounted) {
          setOperation('idle');
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Select industry when industryId changes or industries are loaded
  useEffect(() => {
    if (industryId && industries.length > 0) {
      const industry = industries.find(i => i.id === industryId);
      if (industry) {
        setIsCreating(false);
        setForm({
          id: industry.id,
          name: industry.name,
          icon: industry.icon,
          description: industry.description,
          image: industry.image ?? '',
          mapImage: industry.mapImage ?? '',
          isAvailable: industry.isAvailable ?? true,
        });
        setStatus(null);
      }
    }
  }, [industryId, industries]);

  const selectIndustry = useCallback((industry: Industry) => {
    setIsCreating(false);
    setForm({
      id: industry.id,
      name: industry.name,
      icon: industry.icon,
      description: industry.description,
      image: industry.image ?? '',
      mapImage: industry.mapImage ?? '',
      isAvailable: industry.isAvailable ?? true,
    });
    setStatus(null);
  }, []);

  const createNew = useCallback(() => {
    setIsCreating(true);
    setForm({ ...emptyForm, icon: '🏢' });
    setStatus(null);
  }, []);

  const save = useCallback(async () => {
    const trimmedName = form.name.trim();
    let trimmedId = form.id.trim();

    if (!trimmedName) {
      setStatus('Name is required.');
      return;
    }

    if (!trimmedId) {
      trimmedId = slugify(trimmedName);
      if (!trimmedId) {
        setStatus('Industry ID is required.');
        return;
      }
    }

    setOperation('saving');
    setStatus(null);

    const payload: Industry = {
      id: trimmedId,
      name: trimmedName,
      icon: form.icon.trim() || '🏢',
      description: form.description.trim(),
      image: form.image.trim() || undefined,
      mapImage: form.mapImage.trim() || undefined,
      isAvailable: form.isAvailable,
    };

    const result = await upsertIndustry(payload);
    setOperation('idle');

    if (!result.success || !result.data) {
      setStatus(result.message ?? 'Failed to save industry.');
      return;
    }

    setIndustries((prev) => {
      const exists = prev.some((item) => item.id === result.data!.id);
      const next = exists
        ? prev.map((item) => (item.id === result.data!.id ? result.data! : item))
        : [...prev, result.data!];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });

    selectIndustry(result.data);
    setStatus('Industry saved successfully.');
  }, [form, selectIndustry]);

  const deleteIndustry = useCallback(async () => {
    if (isCreating || !form.id) return;
    if (!window.confirm(`Delete industry "${form.name || form.id}"?`)) return;
    setOperation('deleting');
    const result = await deleteIndustry(form.id);
    setOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to delete industry.');
      return;
    }
    setIndustries((prev) => prev.filter((item) => item.id !== form.id));
    if (industries.length > 1) {
      const remaining = industries.filter(item => item.id !== form.id);
      if (remaining.length > 0) {
        selectIndustry(remaining[0]);
      } else {
        setForm(emptyForm);
        setIsCreating(false);
      }
    } else {
      setForm(emptyForm);
      setIsCreating(false);
    }
    setStatus('Industry deleted.');
  }, [form, isCreating, industries, selectIndustry]);

  const reset = useCallback(() => {
    if (!isCreating) {
      const current = industries.find((item) => item.id === form.id);
      if (current) {
        selectIndustry(current);
      }
    } else {
      setIsCreating(false);
      setForm(emptyForm);
    }
    setStatus(null);
  }, [isCreating, form.id, industries, selectIndustry]);

  const updateForm = useCallback((updates: Partial<IndustryForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    industries,
    loading: operation === 'loading',
    error,
    saving: operation === 'saving',
    deleting: operation === 'deleting',
    operation,
    status,
    isCreating,
    form,
    selectIndustry,
    createNew,
    save,
    deleteIndustry,
    reset,
    updateForm,
  };
}


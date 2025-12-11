import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCategories, upsertCategory, deleteCategory } from '@/lib/server/actions/adminActions';
import type { Category, IndustryId } from '@/lib/game/types';
import type { Operation } from './types';
import { useToastFunctions } from '../components/ui/ToastContext';

interface CategoryForm {
  id: string;
  name: string;
  orderIndex: string;
  description: string;
}

// Query key factory for categories
const categoriesQueryKey = (industryId: string) => ['categories', industryId] as const;

export function useCategories(industryId: string, categoryId?: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToastFunctions();
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<CategoryForm>({
    id: '',
    name: '',
    orderIndex: '0',
    description: '',
  });

  // Fetch categories using React Query
  const {
    data: categories = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: categoriesQueryKey(industryId),
    queryFn: async () => {
      if (!industryId) return [];
      const result = await fetchCategories(industryId);
      if (!result) return [];
      return result.slice().sort((a, b) => {
        // Null/undefined orders go to the end
        const aOrderNull = a.orderIndex == null;
        const bOrderNull = b.orderIndex == null;
        if (aOrderNull && bOrderNull) return a.name.localeCompare(b.name);
        if (aOrderNull) return 1;
        if (bOrderNull) return -1;
        if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
        return a.name.localeCompare(b.name);
      });
    },
    enabled: !!industryId,
  });

  // Save category mutation with optimistic update
  const saveMutation = useMutation({
    mutationFn: async (payload: Category) => {
      if (!industryId) throw new Error('Industry ID is required');
      const result = await upsertCategory(industryId as IndustryId, payload);
      if (!result.success) {
        throw new Error(result.message ?? 'Failed to save category.');
      }
      return payload;
    },
    onMutate: async (newCategory) => {
      await queryClient.cancelQueries({ queryKey: categoriesQueryKey(industryId) });
      const previousCategories = queryClient.getQueryData<Category[]>(categoriesQueryKey(industryId));

      queryClient.setQueryData<Category[]>(categoriesQueryKey(industryId), (old = []) => {
        const exists = old.some((c) => c.id === newCategory.id);
        const next = exists ? old.map((c) => (c.id === newCategory.id ? newCategory : c)) : [...old, newCategory];
        return next.sort((a, b) => {
          // Null/undefined orders go to the end
          const aOrderNull = a.orderIndex == null;
          const bOrderNull = b.orderIndex == null;
          if (aOrderNull && bOrderNull) return a.name.localeCompare(b.name);
          if (aOrderNull) return 1;
          if (bOrderNull) return -1;
          if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
          return a.name.localeCompare(b.name);
        });
      });

      return { previousCategories };
    },
    onError: (err, newCategory, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(categoriesQueryKey(industryId), context.previousCategories);
      }
      const errorMsg = err instanceof Error ? err.message : 'Failed to save category.';
      console.error('[Admin] Save failed:', errorMsg);
      error(errorMsg);
    },
    onSuccess: (savedCategory) => {
      setIsCreating(false);
      setSelectedId(savedCategory.id);
      selectCategory(savedCategory, false);
      success(`Category saved successfully.`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey(industryId) });
    },
  });

  // Delete category mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteCategory(id);
      if (!result.success) {
        throw new Error(result.message ?? 'Failed to delete category.');
      }
      return id;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: categoriesQueryKey(industryId) });
      const previousCategories = queryClient.getQueryData<Category[]>(categoriesQueryKey(industryId));

      queryClient.setQueryData<Category[]>(categoriesQueryKey(industryId), (old = []) =>
        old.filter((c) => c.id !== deletedId)
      );

      return { previousCategories };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(categoriesQueryKey(industryId), context.previousCategories);
      }
      error(err instanceof Error ? err.message : 'Failed to delete category.');
    },
    onSuccess: () => {
      setSelectedId('');
      setForm({
        id: '',
        name: '',
        orderIndex: '0',
        description: '',
      });
      success('Category deleted.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey(industryId) });
    },
  });

  const selectCategory = useCallback((category: Category, resetMsg = true) => {
    setSelectedId(category.id);
    setIsCreating(false);

    setForm({
      id: category.id,
      name: category.name,
      orderIndex: String(category.orderIndex ?? 0),
      description: category.description || '',
    });

  }, []);

  // Select category when categoryId changes or categories are loaded
  useEffect(() => {
    if (categoryId && categories.length > 0) {
      const category = categories.find((c) => c.id === categoryId);
      if (category) {
        setSelectedId(category.id);
        setIsCreating(false);

        setForm({
          id: category.id,
          name: category.name,
          orderIndex: String(category.orderIndex ?? 0),
          description: category.description || '',
        });
      }
    }
  }, [categoryId, categories]);

  const createCategory = useCallback(() => {
    if (!industryId) {
      error('Save the industry first.');
      return;
    }
    setIsCreating(true);
    setSelectedId('');
    setForm({
      id: '',
      name: '',
      orderIndex: '0',
      description: '',
    });
  }, [industryId, error]);

  const saveCategory = useCallback(async () => {
    if (!industryId) {
      error('Save the industry first.');
      return;
    }
    const id = form.id.trim();
    const name = form.name.trim();
    const description = form.description.trim();

    if (!id || !name) {
      error('Category id and name are required.');
      return;
    }

    const orderIndex = form.orderIndex.trim() ? Number(form.orderIndex.trim()) : 0;
    if (Number.isNaN(orderIndex) || orderIndex < 0) {
      error('Order index must be a non-negative number.');
      return;
    }

    const payload: Category = {
      id,
      name,
      orderIndex,
      description: description || undefined,
      industryId: industryId as IndustryId,
    };

    saveMutation.mutate(payload);
  }, [industryId, form, saveMutation, error]);

  const deleteCategoryHandler = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const category = categories.find((c) => c.id === selectedId);
    if (!window.confirm(`Delete category "${category?.name || selectedId}"?`)) return;
    deleteMutation.mutate(selectedId);
  }, [selectedId, isCreating, categories, deleteMutation]);

  const reset = useCallback(() => {
    if (selectedId && !isCreating) {
      const existing = categories.find((c) => c.id === selectedId);
      if (existing) selectCategory(existing);
    } else {
      setIsCreating(false);
      setSelectedId('');
      setForm({
        id: '',
        name: '',
        orderIndex: '0',
      description: '',
    });
    }
  }, [selectedId, isCreating, categories, selectCategory]);

  const updateForm = useCallback((updates: Partial<CategoryForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const operation: Operation = isLoading ? 'loading' : saveMutation.isPending ? 'saving' : deleteMutation.isPending ? 'deleting' : 'idle';

  return {
    categories,
    loading: isLoading,
    selectedId,
    isCreating,
    saving: saveMutation.isPending,
    deleting: deleteMutation.isPending,
    operation,
    form,
    load: () => queryClient.invalidateQueries({ queryKey: categoriesQueryKey(industryId) }),
    selectCategory,
    createCategory,
    saveCategory,
    deleteCategory: deleteCategoryHandler,
    reset,
    updateForm,
  };
}
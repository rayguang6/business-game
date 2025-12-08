import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '@/lib/server/actions/adminActions';
import type { Category, IndustryId } from '@/lib/game/types';

// Query key factory for categories
const categoriesQueryKey = (industryId: string) => ['categories', industryId] as const;

export function useCategories(industryId: string) {
  return useQuery({
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
}
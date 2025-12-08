'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CategoriesTab } from '../../../components/CategoriesTab';
import { SidebarContentLayout } from '../../../components/SidebarContentLayout';
import { useCategories } from '../../../hooks/useCategories';
import { buildCategoryDetailUrl } from '../../../utils/routing';

export default function CategoryDetailPage({
  params,
}: {
  params: Promise<{ industry: string; categoryId: string }>;
}) {
  const { industry, categoryId } = use(params);
  const router = useRouter();
  const categories = useCategories(industry, categoryId);

  // Redirect to list if category not found (404 handling)
  useEffect(() => {
    if (!categories.loading && !categories.isCreating && categories.categories.length > 0) {
      const category = categories.categories.find(c => c.id === categoryId);
      if (!category) {
        router.replace(`/admin/${industry}/categories`);
      }
    }
  }, [categories.loading, categories.isCreating, categories.categories, categoryId, industry, router]);

  // Handle category selection from sidebar - navigate to URL
  const handleSelectCategory = (category: import('@/lib/game/types').Category) => {
    router.push(buildCategoryDetailUrl(industry, category.id));
  };

  // Handle save - navigate to detail page after creating new category
  const handleSave = async () => {
    const wasCreating = categories.isCreating;
    await categories.saveCategory();

    if (wasCreating && categories.form.id) {
      router.push(buildCategoryDetailUrl(industry, categories.form.id));
    }
  };

  // Handle delete - redirect to list
  const handleDelete = async () => {
    await categories.deleteCategory();
    router.push(`/admin/${industry}/categories`);
  };

  const sidebarItems = categories.categories.map((category) => ({
    id: category.id,
    label: category.name,
    icon: '📁',
    disabled: false,
  }));

  return (
    <SidebarContentLayout
      title="Categories"
      description="Organize upgrades and marketing campaigns"
      sidebarItems={sidebarItems}
      selectedId={categoryId}
      onSelect={(id) => {
        const category = categories.categories.find(c => c.id === id);
        if (category) handleSelectCategory(category);
      }}
      loading={categories.loading}
      actionButton={{
        label: '+ New Category',
        onClick: categories.createCategory,
        variant: 'primary',
      }}
      emptyState={{
        icon: '📁',
        title: 'No Categories Yet',
        description: 'Create your first category to organize upgrades and marketing campaigns',
      }}
    >
      <CategoriesTab
        industryId={industry}
        categories={categories.categories}
        categoriesLoading={categories.loading}
        selectedCategoryId={categories.selectedId}
        isCreatingCategory={categories.isCreating}
        categoryForm={categories.form}
        categorySaving={categories.saving}
        categoryDeleting={categories.deleting}
        onSelectCategory={handleSelectCategory}
        onCreateCategory={categories.createCategory}
        onSaveCategory={handleSave}
        onDeleteCategory={handleDelete}
        onReset={categories.reset}
        onUpdateForm={categories.updateForm}
      />
    </SidebarContentLayout>
  );
}
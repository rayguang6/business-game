'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CategoriesTab } from '../../components/CategoriesTab';
import { SidebarContentLayout } from '../../components/SidebarContentLayout';
import { useCategories } from '../../hooks/useCategories';
import { buildCategoryDetailUrl } from '../../utils/routing';

export default function CategoriesPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = use(params);
  const router = useRouter();
  const categories = useCategories(industry);

  // Auto-redirect to first category if categories are loaded and not creating
  useEffect(() => {
    if (!categories.loading && categories.categories.length > 0 && !categories.isCreating) {
      const firstCategory = categories.categories[0];
      router.replace(buildCategoryDetailUrl(industry, firstCategory.id));
    }
  }, [categories.loading, categories.categories, categories.isCreating, industry, router]);

  // Handle category selection - navigate to detail page
  const handleSelectCategory = (category: import('@/lib/game/types').Category) => {
    router.push(buildCategoryDetailUrl(industry, category.id));
  };

  // Handle create new - show form inline
  const handleCreateNew = () => {
    categories.createCategory();
  };

  // Handle save - navigate to detail page after creating
  const handleSave = async () => {
    const wasCreating = categories.isCreating;
    await categories.saveCategory();

    if (wasCreating && categories.form.id) {
      router.push(buildCategoryDetailUrl(industry, categories.form.id));
    }
  };

  // Handle delete - stay on list page
  const handleDelete = async () => {
    await categories.deleteCategory();
  };

  const sidebarItems = categories.categories.map((category) => ({
    id: category.id,
    label: category.name,
    icon: '📁',
    disabled: false,
  }));

  // Show loading or redirecting state
  if (categories.loading || (categories.categories.length > 0 && !categories.isCreating)) {
    return (
      <SidebarContentLayout
        title="Categories"
        description="Organize upgrades and marketing campaigns"
        sidebarItems={sidebarItems}
        selectedId=""
        onSelect={(id) => {
          const category = categories.categories.find(c => c.id === id);
          if (category) handleSelectCategory(category);
        }}
        loading={categories.loading}
        actionButton={{
          label: '+ New Category',
          onClick: handleCreateNew,
          variant: 'primary',
        }}
        emptyState={{
          icon: '📁',
          title: 'Loading Categories',
          description: 'Redirecting to first category...',
        }}
      >
        <div className="text-sm text-slate-400">Redirecting...</div>
      </SidebarContentLayout>
    );
  }

  // Show list with create form or empty state
  return (
    <SidebarContentLayout
      title="Categories"
      description={categories.categories.length === 0 ? "Create your first category" : "Select a category to edit"}
      sidebarItems={sidebarItems}
      selectedId=""
      onSelect={(id) => {
        const category = categories.categories.find(c => c.id === id);
        if (category) handleSelectCategory(category);
      }}
      loading={categories.loading}
      actionButton={{
        label: '+ New Category',
        onClick: handleCreateNew,
        variant: 'primary',
      }}
      emptyState={{
        icon: '📁',
        title: categories.categories.length === 0 ? 'No Categories Yet' : 'Select a Category',
        description: categories.categories.length === 0
          ? 'Create your first category to organize upgrades and marketing campaigns'
          : 'Choose a category from the sidebar to edit',
      }}
      forceShowContent={categories.isCreating}
    >
      {categories.isCreating ? (
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
          onCreateCategory={handleCreateNew}
          onSaveCategory={handleSave}
          onDeleteCategory={handleDelete}
          onReset={categories.reset}
          onUpdateForm={categories.updateForm}
        />
      ) : (
        <div className="text-sm text-slate-400">
          {categories.categories.length === 0
            ? 'Click "+ New Category" to create your first category.'
            : 'Select a category from the sidebar to edit.'}
        </div>
      )}
    </SidebarContentLayout>
  );
}
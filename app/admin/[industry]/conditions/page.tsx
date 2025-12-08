'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConditionsTab } from '../../components/ConditionsTab';
import { SidebarContentLayout } from '../../components/SidebarContentLayout';
import { useConditions } from '../../hooks/useConditions';
import { buildConditionDetailUrl } from '../../utils/routing';

export default function ConditionsPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = use(params);
  const router = useRouter();
  const conditions = useConditions(industry);

  // Auto-redirect to first condition if conditions are loaded and not creating
  useEffect(() => {
    if (!conditions.loading && conditions.conditions.length > 0 && !conditions.isCreating) {
      const firstCondition = conditions.conditions[0];
      router.replace(buildConditionDetailUrl(industry, firstCondition.id));
    }
  }, [conditions.loading, conditions.conditions, conditions.isCreating, industry, router]);

  // Handle condition selection - navigate to detail page
  const handleSelectCondition = (condition: import('@/lib/types/conditions').GameCondition) => {
    router.push(buildConditionDetailUrl(industry, condition.id));
  };

  // Handle create new - show form inline
  const handleCreateNew = () => {
    conditions.createCondition();
  };

  // Handle save - navigate to detail page after creating
  const handleSave = async () => {
    const wasCreating = conditions.isCreating;
    await conditions.saveCondition();
    
    if (wasCreating && conditions.form.id) {
      router.push(buildConditionDetailUrl(industry, conditions.form.id));
    }
  };

  // Handle delete - stay on list page
  const handleDelete = async () => {
    await conditions.deleteCondition();
  };

  const sidebarItems = conditions.conditions.map((condition) => ({
    id: condition.id,
    label: condition.name,
    icon: '📊',
    disabled: false,
  }));

  // Show loading or redirecting state
  if (conditions.loading || (conditions.conditions.length > 0 && !conditions.isCreating)) {
    return (
      <SidebarContentLayout
        title="Conditions"
        description="Manage conditions for this industry"
        sidebarItems={sidebarItems}
        selectedId=""
        onSelect={(id) => {
          const condition = conditions.conditions.find(c => c.id === id);
          if (condition) handleSelectCondition(condition);
        }}
        loading={conditions.loading}
        actionButton={{
          label: '+ New Condition',
          onClick: handleCreateNew,
          variant: 'primary',
        }}
        emptyState={{
          icon: '📊',
          title: 'Loading Conditions',
          description: 'Redirecting to first condition...',
        }}
      >
        <div className="text-sm text-slate-400">Redirecting...</div>
      </SidebarContentLayout>
    );
  }

  // Show list with create form or empty state
  return (
    <SidebarContentLayout
      title="Conditions"
      description={conditions.conditions.length === 0 ? "Create your first condition" : "Select a condition to edit"}
      sidebarItems={sidebarItems}
      selectedId=""
      onSelect={(id) => {
        const condition = conditions.conditions.find(c => c.id === id);
        if (condition) handleSelectCondition(condition);
      }}
      loading={conditions.loading}
      actionButton={{
        label: '+ New Condition',
        onClick: handleCreateNew,
        variant: 'primary',
      }}
      emptyState={{
        icon: '📊',
        title: conditions.conditions.length === 0 ? 'No Conditions Yet' : 'Select a Condition',
        description: conditions.conditions.length === 0 
          ? 'Create your first condition to get started'
          : 'Choose a condition from the sidebar to edit',
      }}
      forceShowContent={conditions.isCreating}
    >
      {conditions.isCreating ? (
        <ConditionsTab
          industryId={industry}
          conditions={conditions.conditions}
          conditionsLoading={conditions.loading}
          conditionsError={conditions.error}
          selectedConditionId={conditions.selectedId}
          isCreatingCondition={conditions.isCreating}
          conditionForm={conditions.form}
          conditionSaving={conditions.saving}
          conditionDeleting={conditions.deleting}
          onSelectCondition={handleSelectCondition}
          onCreateCondition={handleCreateNew}
          onSaveCondition={handleSave}
          onDeleteCondition={handleDelete}
          onReset={conditions.reset}
          onReload={conditions.load}
          onUpdateForm={conditions.updateForm}
        />
      ) : (
        <div className="text-sm text-slate-400">
          {conditions.conditions.length === 0 
            ? 'Click "+ New Condition" to create your first condition.'
            : 'Select a condition from the sidebar to edit.'}
        </div>
      )}
    </SidebarContentLayout>
  );
}

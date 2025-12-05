'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConditionsTab } from '../../../components/ConditionsTab';
import { SidebarContentLayout } from '../../../components/SidebarContentLayout';
import { useConditions } from '../../../hooks/useConditions';
import { buildConditionDetailUrl } from '../../../utils/routing';

export default function ConditionDetailPage({
  params,
}: {
  params: Promise<{ industry: string; conditionId: string }>;
}) {
  const { industry, conditionId } = use(params);
  const router = useRouter();
  const conditions = useConditions(industry, conditionId);

  // Redirect to list if condition not found (404 handling)
  useEffect(() => {
    if (!conditions.loading && !conditions.isCreating && conditions.conditions.length > 0) {
      const condition = conditions.conditions.find(c => c.id === conditionId);
      if (!condition) {
        router.replace(`/admin/${industry}/conditions`);
      }
    }
  }, [conditions.loading, conditions.isCreating, conditions.conditions, conditionId, industry, router]);

  // Handle condition selection from sidebar - navigate to URL
  const handleSelectCondition = (condition: import('@/lib/types/conditions').GameCondition) => {
    router.push(buildConditionDetailUrl(industry, condition.id));
  };

  // Handle save - navigate to detail page after creating new condition
  const handleSave = async () => {
    const wasCreating = conditions.isCreating;
    await conditions.saveCondition();
    
    if (wasCreating && conditions.form.id) {
      router.push(buildConditionDetailUrl(industry, conditions.form.id));
    }
  };

  // Handle delete - redirect to list
  const handleDelete = async () => {
    await conditions.deleteCondition();
    router.push(`/admin/${industry}/conditions`);
  };

  const sidebarItems = conditions.conditions.map((condition) => ({
    id: condition.id,
    label: condition.name,
    icon: '📊',
    disabled: false,
  }));

  return (
    <SidebarContentLayout
      title="Conditions"
      description="Manage conditions for this industry"
      sidebarItems={sidebarItems}
      selectedId={conditionId}
      onSelect={(id) => {
        const condition = conditions.conditions.find(c => c.id === id);
        if (condition) handleSelectCondition(condition);
      }}
      loading={conditions.loading}
      error={conditions.status}
      actionButton={{
        label: '+ New Condition',
        onClick: conditions.createCondition,
        variant: 'primary',
      }}
      emptyState={{
        icon: '📊',
        title: 'No Conditions Yet',
        description: 'Create your first condition to get started',
      }}
    >
      <ConditionsTab
        industryId={industry}
        conditions={conditions.conditions}
        conditionsLoading={conditions.loading}
        conditionsStatus={conditions.status}
        selectedConditionId={conditions.selectedId}
        isCreatingCondition={conditions.isCreating}
        conditionForm={conditions.form}
        conditionSaving={conditions.saving}
        conditionDeleting={conditions.deleting}
        onSelectCondition={handleSelectCondition}
        onCreateCondition={conditions.createCondition}
        onSaveCondition={handleSave}
        onDeleteCondition={handleDelete}
        onReset={conditions.reset}
        onUpdateForm={conditions.updateForm}
      />
    </SidebarContentLayout>
  );
}

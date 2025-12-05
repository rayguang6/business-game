'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RolesTab } from '../../../components/RolesTab';
import { SidebarContentLayout } from '../../../components/SidebarContentLayout';
import { useRoles } from '../../../hooks/useRoles';
import { useFlags } from '../../../hooks/useFlags';
import { useUpgrades } from '../../../hooks/useUpgrades';
import { METRIC_OPTIONS, EFFECT_TYPE_OPTIONS } from '../../../utils/constants';
import { buildRoleDetailUrl } from '../../../utils/routing';

export default function RoleDetailPage({
  params,
}: {
  params: Promise<{ industry: string; roleId: string }>;
}) {
  const { industry, roleId } = use(params);
  const router = useRouter();
  const roles = useRoles(industry, roleId);
  const flags = useFlags(industry);
  const upgrades = useUpgrades(industry);

  // Redirect to list if role not found (404 handling)
  useEffect(() => {
    if (!roles.loading && !roles.isCreating && roles.roles.length > 0) {
      const role = roles.roles.find(r => r.id === roleId);
      if (!role) {
        router.replace(`/admin/${industry}/roles`);
      }
    }
  }, [roles.loading, roles.isCreating, roles.roles, roleId, industry, router]);

  // Handle role selection from sidebar - navigate to URL
  const handleSelectRole = (role: import('@/lib/game/staffConfig').StaffRoleConfig) => {
    router.push(buildRoleDetailUrl(industry, role.id));
  };

  // Handle save - navigate to detail page after creating new role
  const handleSave = async () => {
    const wasCreating = roles.isCreating;
    await roles.saveRole();
    
    if (wasCreating && roles.form.id) {
      router.push(buildRoleDetailUrl(industry, roles.form.id));
    }
  };

  // Handle delete - redirect to list
  const handleDelete = async () => {
    await roles.deleteRole();
    router.push(`/admin/${industry}/roles`);
  };

  const sidebarItems = roles.roles.map((role) => ({
    id: role.id,
    label: role.name,
    icon: '👥',
    disabled: false,
  }));

  return (
    <SidebarContentLayout
      title="Staff Roles"
      description="Manage staff roles for this industry"
      sidebarItems={sidebarItems}
      selectedId={roleId}
      onSelect={(id) => {
        const role = roles.roles.find(r => r.id === id);
        if (role) handleSelectRole(role);
      }}
      loading={roles.loading}
      error={roles.status}
      actionButton={{
        label: '+ New Role',
        onClick: roles.createRole,
        variant: 'primary',
      }}
      emptyState={{
        icon: '👥',
        title: 'No Roles Yet',
        description: 'Create your first role to get started',
      }}
    >
      <RolesTab
        industryId={industry}
        roles={roles.roles}
        loading={roles.loading}
        status={roles.status}
        selectedId={roles.selectedId}
        isCreating={roles.isCreating}
        form={roles.form}
        saving={roles.saving}
        deleting={roles.deleting}
        flags={flags.flags}
        flagsLoading={flags.loading}
        upgrades={upgrades.upgrades}
        metricOptions={METRIC_OPTIONS}
        effectTypeOptions={EFFECT_TYPE_OPTIONS}
        onSelectRole={handleSelectRole}
        onCreateRole={roles.createRole}
        onSaveRole={handleSave}
        onDeleteRole={handleDelete}
        onReset={roles.reset}
        onUpdateForm={roles.updateForm}
      />
    </SidebarContentLayout>
  );
}

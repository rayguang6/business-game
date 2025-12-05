'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RolesTab } from '../../components/RolesTab';
import { SidebarContentLayout } from '../../components/SidebarContentLayout';
import { useRoles } from '../../hooks/useRoles';
import { useFlags } from '../../hooks/useFlags';
import { useUpgrades } from '../../hooks/useUpgrades';
import { METRIC_OPTIONS, EFFECT_TYPE_OPTIONS } from '../../utils/constants';
import { buildRoleDetailUrl } from '../../utils/routing';

export default function RolesPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = use(params);
  const router = useRouter();
  const roles = useRoles(industry);
  const flags = useFlags(industry);
  const upgrades = useUpgrades(industry);

  // Auto-redirect to first role if roles are loaded and not creating
  useEffect(() => {
    if (!roles.loading && roles.roles.length > 0 && !roles.isCreating) {
      const firstRole = roles.roles[0];
      router.replace(buildRoleDetailUrl(industry, firstRole.id));
    }
  }, [roles.loading, roles.roles, roles.isCreating, industry, router]);

  // Handle role selection - navigate to detail page
  const handleSelectRole = (role: import('@/lib/game/staffConfig').StaffRoleConfig) => {
    router.push(buildRoleDetailUrl(industry, role.id));
  };

  // Handle create new - show form inline
  const handleCreateNew = () => {
    roles.createRole();
  };

  // Handle save - navigate to detail page after creating
  const handleSave = async () => {
    const wasCreating = roles.isCreating;
    await roles.saveRole();
    
    if (wasCreating && roles.form.id) {
      router.push(buildRoleDetailUrl(industry, roles.form.id));
    }
  };

  // Handle delete - stay on list page
  const handleDelete = async () => {
    await roles.deleteRole();
  };

  const sidebarItems = roles.roles.map((role) => ({
    id: role.id,
    label: role.name,
    icon: '👥',
    disabled: false,
  }));

  // Show loading or redirecting state
  if (roles.loading || (roles.roles.length > 0 && !roles.isCreating)) {
    return (
      <SidebarContentLayout
        title="Staff Roles"
        description="Manage staff roles for this industry"
        sidebarItems={sidebarItems}
        selectedId=""
        onSelect={(id) => {
          const role = roles.roles.find(r => r.id === id);
          if (role) handleSelectRole(role);
        }}
        loading={roles.loading}
        error={roles.status}
        actionButton={{
          label: '+ New Role',
          onClick: handleCreateNew,
          variant: 'primary',
        }}
        emptyState={{
          icon: '👥',
          title: 'Loading Roles',
          description: 'Redirecting to first role...',
        }}
      >
        <div className="text-sm text-slate-400">Redirecting...</div>
      </SidebarContentLayout>
    );
  }

  // Show list with create form or empty state
  return (
    <SidebarContentLayout
      title="Staff Roles"
      description={roles.roles.length === 0 ? "Create your first role" : "Select a role to edit"}
      sidebarItems={sidebarItems}
      selectedId=""
      onSelect={(id) => {
        const role = roles.roles.find(r => r.id === id);
        if (role) handleSelectRole(role);
      }}
      loading={roles.loading}
      error={roles.status}
      actionButton={{
        label: '+ New Role',
        onClick: handleCreateNew,
        variant: 'primary',
      }}
      emptyState={{
        icon: '👥',
        title: roles.roles.length === 0 ? 'No Roles Yet' : 'Select a Role',
        description: roles.roles.length === 0 
          ? 'Create your first role to get started'
          : 'Choose a role from the sidebar to edit',
      }}
      forceShowContent={roles.isCreating}
    >
      {roles.isCreating ? (
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
          onCreateRole={handleCreateNew}
          onSaveRole={handleSave}
          onDeleteRole={handleDelete}
          onReset={roles.reset}
          onUpdateForm={roles.updateForm}
        />
      ) : (
        <div className="text-sm text-slate-400">
          {roles.roles.length === 0 
            ? 'Click "+ New Role" to create your first role.'
            : 'Select a role from the sidebar to edit.'}
        </div>
      )}
    </SidebarContentLayout>
  );
}

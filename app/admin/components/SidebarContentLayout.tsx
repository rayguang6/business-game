'use client';

import { ReactNode } from 'react';
import { VerticalSidebar } from './VerticalSidebar';

interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  metadata?: string;
  category?: string;
}

interface SidebarContentLayoutProps {
  title: string;
  description: string;
  sidebarItems: SidebarItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  actionButton?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'success';
  };
  children: ReactNode;
  emptyState?: {
    icon: string;
    title: string;
    description: string;
  };
  forceShowContent?: boolean; // Force show children even without selection (e.g., when creating)
}

export function SidebarContentLayout({
  title,
  description,
  sidebarItems,
  selectedId,
  onSelect,
  loading = false,
  error = null,
  actionButton,
  children,
  emptyState,
  forceShowContent = false,
}: SidebarContentLayoutProps) {
  const hasSelection = selectedId && sidebarItems.some(item => item.id === selectedId);
  const shouldShowContent = hasSelection || forceShowContent;

  return (
    <div className="p-6">
      <div className="w-full">
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[600px]">
            {/* Sidebar */}
            <div className="lg:col-span-1 border-r border-slate-800 lg:border-r-slate-700 p-6">
              <div className="lg:sticky lg:top-6 lg:self-start">
                <div className="lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
                  <VerticalSidebar
                    title={title}
                    description={description}
                    items={sidebarItems}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    loading={loading}
                    error={error}
                    actionButton={actionButton}
                    width="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3 p-6">
              {shouldShowContent ? (
                children
              ) : emptyState ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4">{emptyState.icon}</div>
                    <h3 className="text-xl font-medium mb-2">{emptyState.title}</h3>
                    <p className="text-sm">{emptyState.description}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

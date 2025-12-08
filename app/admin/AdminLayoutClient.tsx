'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  isGlobalRoute,
  isIndustryRoute,
  getIndustryFromPath,
  getTabFromPath,
  buildGlobalTabUrl,
  buildIndustryTabUrl,
  AdminTabEnum,
  type AdminTab,
  type IndustryTab,
  type GlobalTab,
} from './utils/routing';
import type { Industry } from '@/lib/features/industries';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/types';
import { AdminQueryProvider } from './providers/QueryProvider';
import { prefetchTabData, prefetchIndustryData } from './utils/prefetch';
import { ToastProvider } from './components/ui/ToastContext';

// Tab configuration with icons - matching original implementation
const TAB_CONFIG = {
  [AdminTabEnum.Industries]: { label: 'Industries', icon: '🏢' },
  [AdminTabEnum.Global]: { label: 'Global Config', icon: '⚡' },
  [AdminTabEnum.GlobalMetricDisplay]: { label: 'Global Metric Display', icon: '📊' },
  [AdminTabEnum.IndustryConfig]: { label: 'Industry Config', icon: '🎯' },
  [AdminTabEnum.IndustryMetricDisplay]: { label: 'Industry Metric Display', icon: '📊' },
  [AdminTabEnum.Services]: { label: 'Services', icon: '🛎️' },
  [AdminTabEnum.Roles]: { label: 'Roles', icon: '👥' },
  [AdminTabEnum.Presets]: { label: 'Presets', icon: '👤' },
  [AdminTabEnum.Categories]: { label: 'Categories', icon: '📁' },
  [AdminTabEnum.Upgrades]: { label: 'Upgrades', icon: '⚙️' },
  [AdminTabEnum.Marketing]: { label: 'Marketing', icon: '📢' },
  [AdminTabEnum.Events]: { label: 'Events', icon: '📅' },
  [AdminTabEnum.Flags]: { label: 'Flags', icon: '🏁' },
  [AdminTabEnum.Conditions]: { label: 'Conditions', icon: '📊' },
} as const;

// Organized by workflow (matching original):
// 1. Setup (Industries, Global Config, Global Metric Display, Industry Config, Industry Metric Display)
// 2. Content (Services, Roles, Presets)
// 3. Mechanics (Upgrades, Marketing, Events)
// 4. System (Flags, Conditions)
const GLOBAL_TABS: GlobalTab[] = [AdminTabEnum.Industries, AdminTabEnum.Global, AdminTabEnum.GlobalMetricDisplay];
const INDUSTRY_TABS: IndustryTab[] = [
  AdminTabEnum.IndustryConfig,        // Setup
  AdminTabEnum.IndustryMetricDisplay, // Setup (Metric Display Config)
  AdminTabEnum.Services,               // Content
  AdminTabEnum.Roles,                  // Content (Staff Roles)
  AdminTabEnum.Presets,                // Content (Staff Presets)
  AdminTabEnum.Categories,             // Content (Categories)
  AdminTabEnum.Upgrades,               // Mechanics
  AdminTabEnum.Marketing,              // Mechanics
  AdminTabEnum.Events,                 // Mechanics
  AdminTabEnum.Flags,                  // System
  AdminTabEnum.Conditions,             // System
];

interface AdminLayoutClientProps {
  industries: Industry[];
  children: React.ReactNode;
}

function AdminLayoutContent({ industries, children }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [lastSelectedIndustry, setLastSelectedIndustry] = useState<string | null>(null);
  
  // Determine current route type
  const isGlobal = isGlobalRoute(pathname);
  const isIndustry = isIndustryRoute(pathname);
  const currentIndustry = isIndustry ? getIndustryFromPath(pathname) : null;
  const currentTab = getTabFromPath(pathname);
  
  // Initialize last selected industry from localStorage or current route
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_last_industry');
      if (stored) {
        setLastSelectedIndustry(stored);
      } else if (currentIndustry) {
        setLastSelectedIndustry(currentIndustry);
        localStorage.setItem('admin_last_industry', currentIndustry);
      } else if (industries.length > 0) {
        const defaultIndustry = industries.find(i => i.id === DEFAULT_INDUSTRY_ID) || industries[0];
        setLastSelectedIndustry(defaultIndustry.id);
        localStorage.setItem('admin_last_industry', defaultIndustry.id);
      }
    }
  }, [currentIndustry, industries]);
  
  // Update last selected industry when navigating to industry pages
  useEffect(() => {
    if (currentIndustry && typeof window !== 'undefined') {
      setLastSelectedIndustry(currentIndustry);
      localStorage.setItem('admin_last_industry', currentIndustry);
    }
  }, [currentIndustry]);
  
  // Handle sidebar tab navigation
  const handleTabClick = (tab: AdminTab) => {
    if (GLOBAL_TABS.includes(tab as GlobalTab)) {
      // Global tabs
      router.push(buildGlobalTabUrl(tab as GlobalTab));
    } else {
      // Industry tab - use current, last selected, or first available
      const targetIndustry = currentIndustry || lastSelectedIndustry ||
        (industries.length > 0 ? industries[0].id : DEFAULT_INDUSTRY_ID);
      router.push(buildIndustryTabUrl(targetIndustry, tab as IndustryTab));
    }
  };

  // Prefetch data on hover
  const handleTabHover = (tab: AdminTab) => {
    if (GLOBAL_TABS.includes(tab as GlobalTab)) return;
    const targetIndustry = currentIndustry || lastSelectedIndustry ||
      (industries.length > 0 ? industries[0].id : DEFAULT_INDUSTRY_ID);
    if (targetIndustry) {
      prefetchTabData(queryClient, targetIndustry, tab as IndustryTab).catch(() => {
        // Silently fail prefetch - it's just an optimization
      });
    }
  };
  
  // Handle industry dropdown change
  const handleIndustryChange = (industryId: string) => {
    // Prefetch data for the new industry
    prefetchIndustryData(queryClient, industryId).catch(() => {
      // Silently fail prefetch - it's just an optimization
    });

    if (isIndustry && currentTab && !GLOBAL_TABS.includes(currentTab as GlobalTab)) {
      // Navigate to same tab under new industry (only if it's an industry tab)
      router.push(buildIndustryTabUrl(industryId, currentTab as IndustryTab));
    } else {
      // If on global page or global tab, just update the stored industry
      setLastSelectedIndustry(industryId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_last_industry', industryId);
        // Dispatch custom event for global-metric-display page to listen
        window.dispatchEvent(new CustomEvent('industryChanged', { detail: industryId }));
      }
    }
  };
  
  // Get display industry (current or last selected or default)
  const displayIndustry = currentIndustry || lastSelectedIndustry ||
    (industries.length > 0 ? industries[0].id : DEFAULT_INDUSTRY_ID);

  // Refresh game cache for immediate content updates
  const refreshGameCache = async () => {
    try {
      // Invalidate ALL admin queries to clear any cached content data
      // This includes industry data, services, staff, upgrades, events, marketing, flags, conditions, etc.
      await queryClient.invalidateQueries();

      // Note: This only affects the admin panel's cache. Game clients have separate caches.
      // Players currently in games will see updates on their next page load or after 5 minutes.
      // For immediate effect, players need to refresh their browser.

      // Show success feedback with clear instructions
      alert('✅ Cache refreshed!\n\n📋 Update timeline:\n• Admin panel: Updates immediately\n• New visitors: See changes within 30 seconds\n• Active players: May need browser refresh (F5)\n• Select industry: May need hard refresh (Ctrl+F5) if cached\n\n💡 Content updates are now much faster (30-second cache)!');
    } catch (error) {
      console.error('Failed to refresh game cache:', error);
      alert('❌ Failed to refresh cache. Please try again.');
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
        {/* Left Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex-shrink-0">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-200 mb-1">Admin Panel</h2>
            <p className="text-xs text-slate-500">Edit game content</p>
          </div>

          {/* Global Tabs - Setup */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Setup
            </div>
            {GLOBAL_TABS.map((tab) => {
              const config = TAB_CONFIG[tab];
              const isActive = currentTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  onMouseEnter={() => handleTabHover(tab)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="mr-2">{config.icon}</span>
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Industry Tabs - Organized by workflow */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Industry
            </div>
            {INDUSTRY_TABS.map((tab) => {
              const config = TAB_CONFIG[tab];
              const isActive = currentTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  onMouseEnter={() => handleTabHover(tab)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="mr-2">{config.icon}</span>
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with Industry Dropdown */}
        {/* Hide dropdown on global config and industries pages, but show on global-metric-display for reference */}
        {currentTab === AdminTabEnum.GlobalMetricDisplay || (currentTab !== AdminTabEnum.Global && currentTab !== AdminTabEnum.Industries) ? (
          <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-300">Industry:</label>
                  <select
                    value={displayIndustry}
                    onChange={(e) => handleIndustryChange(e.target.value)}
                    disabled={isGlobal && currentTab !== AdminTabEnum.GlobalMetricDisplay}
                    className={`px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium min-w-[180px] ${
                      isGlobal && currentTab !== AdminTabEnum.GlobalMetricDisplay
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  >
                    {industries.length === 0 ? (
                      <option value={DEFAULT_INDUSTRY_ID}>No industries</option>
                    ) : (
                      industries.map((industry) => (
                        <option key={industry.id} value={industry.id}>
                          {industry.icon} {industry.name}
                        </option>
                      ))
                    )}
                  </select>
                  {isGlobal && currentTab !== AdminTabEnum.GlobalMetricDisplay && (
                    <span className="text-xs text-slate-500 italic">
                      (disabled on global pages)
                    </span>
                  )}
                  {currentTab === AdminTabEnum.GlobalMetricDisplay && (
                    <span className="text-xs text-slate-500 italic">
                      (for reference only - changes save to global)
                    </span>
                  )}
                </div>
              </div>

              {/* Cache Refresh Button */}
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-500">
                  <strong>💡 Tip:</strong> Content updates appear within 30 seconds automatically. Use refresh for immediate admin updates.
                </div>
                <button
                  onClick={refreshGameCache}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  title="Clear admin cache for immediate updates"
                >
                  <span>🔄</span>
                  Refresh Cache
                </button>
              </div>
            </div>
          </header>
        ) : null}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayoutClient({ industries, children }: AdminLayoutClientProps) {
  return (
    <AdminQueryProvider>
      <ToastProvider>
        <AdminLayoutContent industries={industries}>{children}</AdminLayoutContent>
      </ToastProvider>
    </AdminQueryProvider>
  );
}

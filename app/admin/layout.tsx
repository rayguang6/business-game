'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  isGlobalRoute,
  isIndustryRoute,
  getIndustryFromPath,
  getTabFromPath,
  buildGlobalTabUrl,
  buildIndustryTabUrl,
  type AdminTab,
  type IndustryTab,
  type GlobalTab,
} from './utils/routing';
import { fetchIndustriesFromSupabase } from '@/lib/data/industryRepository';
import type { Industry } from '@/lib/features/industries';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/types';

// Tab configuration with icons - matching original implementation
const TAB_CONFIG = {
  industries: { label: 'Industries', icon: '🏢' },
  global: { label: 'Global Config', icon: '⚡' },
  'industry-config': { label: 'Industry Config', icon: '🎯' },
  services: { label: 'Services', icon: '🛎️' },
  roles: { label: 'Roles', icon: '👥' },
  presets: { label: 'Presets', icon: '👤' },
  upgrades: { label: 'Upgrades', icon: '⚙️' },
  marketing: { label: 'Marketing', icon: '📢' },
  events: { label: 'Events', icon: '📅' },
  flags: { label: 'Flags', icon: '🏁' },
  conditions: { label: 'Conditions', icon: '📊' },
} as const;

// Organized by workflow (matching original):
// 1. Setup (Industries, Global Config, Industry Config)
// 2. Content (Services, Roles, Presets)
// 3. Mechanics (Upgrades, Marketing, Events)
// 4. System (Flags, Conditions)
const GLOBAL_TABS: GlobalTab[] = ['industries', 'global'];
const INDUSTRY_TABS: IndustryTab[] = [
  'industry-config',  // Setup
  'services',         // Content
  'roles',           // Content (Staff Roles)
  'presets',         // Content (Staff Presets)
  'upgrades',         // Mechanics
  'marketing',        // Mechanics
  'events',           // Mechanics
  'flags',            // System
  'conditions',       // System
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  // State for industries and last selected industry
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [lastSelectedIndustry, setLastSelectedIndustry] = useState<string | null>(null);
  
  // Determine current route type
  const isGlobal = isGlobalRoute(pathname);
  const isIndustry = isIndustryRoute(pathname);
  const currentIndustry = isIndustry ? getIndustryFromPath(pathname) : null;
  const currentTab = getTabFromPath(pathname);
  
  // Fetch industries from database
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIndustriesLoading(true);
      try {
        const data = await fetchIndustriesFromSupabase();
        if (!isMounted) return;
        if (data) {
          setIndustries(data);
          // If no last selected industry stored and we have industries, use first one or default
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('admin_last_industry');
            if (!stored && data.length > 0) {
              const defaultIndustry = data.find(i => i.id === DEFAULT_INDUSTRY_ID) || data[0];
              setLastSelectedIndustry(defaultIndustry.id);
              localStorage.setItem('admin_last_industry', defaultIndustry.id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load industries', err);
      } finally {
        if (isMounted) {
          setIndustriesLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Initialize last selected industry from localStorage or current route
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_last_industry');
      if (stored) {
        setLastSelectedIndustry(stored);
      } else if (currentIndustry) {
        setLastSelectedIndustry(currentIndustry);
        localStorage.setItem('admin_last_industry', currentIndustry);
      }
    }
  }, [currentIndustry]);
  
  // Update last selected industry when navigating to industry pages
  useEffect(() => {
    if (currentIndustry && typeof window !== 'undefined') {
      setLastSelectedIndustry(currentIndustry);
      localStorage.setItem('admin_last_industry', currentIndustry);
    }
  }, [currentIndustry]);
  
  // Handle sidebar tab navigation
  const handleTabClick = (tab: AdminTab) => {
    if (tab === 'industries' || tab === 'global') {
      // Global tabs
      router.push(buildGlobalTabUrl(tab as GlobalTab));
    } else {
      // Industry tab - use current, last selected, or first available
      const targetIndustry = currentIndustry || lastSelectedIndustry ||
        (industries.length > 0 ? industries[0].id : DEFAULT_INDUSTRY_ID);
      router.push(buildIndustryTabUrl(targetIndustry, tab as IndustryTab));
    }
  };
  
  // Handle industry dropdown change
  const handleIndustryChange = (industryId: string) => {
    if (isIndustry && currentTab) {
      // Navigate to same tab under new industry
      router.push(buildIndustryTabUrl(industryId, currentTab as IndustryTab));
    } else {
      // If on global page, just update the stored industry
      setLastSelectedIndustry(industryId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_last_industry', industryId);
      }
    }
  };
  
  // Get display industry (current or last selected or default)
  const displayIndustry = currentIndustry || lastSelectedIndustry || 
    (industries.length > 0 ? industries[0].id : DEFAULT_INDUSTRY_ID);
  
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
        {/* Hide dropdown on global config and industries pages */}
        {currentTab !== 'global' && currentTab !== 'industries' && (
          <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-300">Industry:</label>
                {industriesLoading ? (
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : (
                  <select
                    value={displayIndustry}
                    onChange={(e) => handleIndustryChange(e.target.value)}
                    disabled={isGlobal}
                    className={`px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium min-w-[180px] ${
                      isGlobal
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
                )}
                {isGlobal && !industriesLoading && (
                  <span className="text-xs text-slate-500 italic">
                    (disabled on global pages)
                  </span>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

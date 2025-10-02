/**
 * Shared UI types and configurations
 */

export type TabType = 'staff' | 'finance' | 'home' | 'upgrades' | 'marketing';

export interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
  activeColor: string;
  isHome?: boolean;
}

/**
 * Navigation tab configuration - single source of truth
 */
export const TAB_CONFIGS: TabConfig[] = [
  { id: 'staff', label: 'Staff', icon: '/images/icons/staff.png', activeColor: 'text-blue-600' },
  { id: 'finance', label: 'Finance', icon: '/images/icons/finance.png', activeColor: 'text-green-600' },
  { id: 'home', label: 'Home', icon: '/images/icons/home.png', activeColor: 'text-yellow-600', isHome: true },
  { id: 'upgrades', label: 'Upgrades', icon: '/images/icons/upgrades.png', activeColor: 'text-purple-600' },
  { id: 'marketing', label: 'Marketing', icon: '/images/icons/marketing.png', activeColor: 'text-red-600' },
];


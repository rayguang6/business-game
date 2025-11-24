/**
 * Shared UI types and configurations
 */

export type TabType = 'home' | 'upgrades' | 'marketing';

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
  { id: 'upgrades', label: 'Upgrades', icon: '/images/icons/upgrades.png', activeColor: 'text-purple-600' },
  { id: 'home', label: 'Home', icon: '/images/icons/home.png', activeColor: 'text-yellow-600', isHome: true },
  { id: 'marketing', label: 'Marketing', icon: '/images/icons/marketing.png', activeColor: 'text-green-600' },
];


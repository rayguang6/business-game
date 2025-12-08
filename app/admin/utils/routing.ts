/**
 * Routing utilities for admin panel
 *
 * URL builders for navigation. Next.js App Router handles routing automatically.
 */

// Enum for all admin tabs - single source of truth
export const enum AdminTabEnum {
  Industries = 'industries',
  Global = 'global',
  GlobalMetricDisplay = 'global-metric-display',
  IndustryConfig = 'industry-config',
  IndustryMetricDisplay = 'industry-metric-display',
  Services = 'services',
  Roles = 'roles',
  Presets = 'presets',
  Categories = 'categories',
  Upgrades = 'upgrades',
  Marketing = 'marketing',
  Events = 'events',
  Flags = 'flags',
  Conditions = 'conditions',
}

export type AdminTab = `${AdminTabEnum}`;
export type IndustryTab = AdminTabEnum.Services | AdminTabEnum.Roles | AdminTabEnum.Presets | AdminTabEnum.Categories | AdminTabEnum.Upgrades | AdminTabEnum.Flags | AdminTabEnum.Conditions | AdminTabEnum.Events | AdminTabEnum.Marketing | AdminTabEnum.IndustryConfig | AdminTabEnum.IndustryMetricDisplay;
export type GlobalTab = AdminTabEnum.Industries | AdminTabEnum.Global | AdminTabEnum.GlobalMetricDisplay;

// All valid industry tab routes
const INDUSTRY_TAB_ROUTES: IndustryTab[] = [
  AdminTabEnum.Services,
  AdminTabEnum.Roles,
  AdminTabEnum.Presets,
  AdminTabEnum.Categories,
  AdminTabEnum.Upgrades,
  AdminTabEnum.Flags,
  AdminTabEnum.Conditions,
  AdminTabEnum.Events,
  AdminTabEnum.Marketing,
  AdminTabEnum.IndustryConfig,
  AdminTabEnum.IndustryMetricDisplay,
];

/**
 * Check if a pathname represents a global route (no industry parameter)
 */
export function isGlobalRoute(pathname: string): boolean {
  return pathname === '/admin/industries' || pathname === '/admin/global' || pathname === '/admin/global-metric-display';
}

/**
 * Check if a pathname represents an industry-specific route
 */
export function isIndustryRoute(pathname: string): boolean {
  const pattern = new RegExp(`^/admin/([^/]+)/(${INDUSTRY_TAB_ROUTES.join('|')})$`);
  return pattern.test(pathname);
}

/**
 * Extract industry ID from pathname
 * Returns null if not an industry route
 */
export function getIndustryFromPath(pathname: string): string | null {
  const pattern = new RegExp(`^/admin/([^/]+)/(${INDUSTRY_TAB_ROUTES.join('|')})$`);
  const match = pathname.match(pattern);
  return match ? match[1] : null;
}

/**
 * Extract tab name from pathname
 * Returns null if not a valid admin route
 * Handles both list routes (/admin/[industry]/services) and detail routes (/admin/[industry]/services/[id])
 */
export function getTabFromPath(pathname: string): AdminTab | null {
  if (pathname === '/admin/industries') return AdminTabEnum.Industries;
  if (pathname === '/admin/global') return AdminTabEnum.Global;
  if (pathname === '/admin/global-metric-display') return AdminTabEnum.GlobalMetricDisplay;
  
  // Check for list routes: /admin/[industry]/[tab]
  const listPattern = new RegExp(`^/admin/[^/]+/(${INDUSTRY_TAB_ROUTES.join('|')})$`);
  const listMatch = pathname.match(listPattern);
  if (listMatch) {
    return listMatch[1] as IndustryTab;
  }
  
  // Check for detail routes: /admin/[industry]/[tab]/[id]
  const detailPattern = new RegExp(`^/admin/[^/]+/(${INDUSTRY_TAB_ROUTES.join('|')})/[^/]+$`);
  const detailMatch = pathname.match(detailPattern);
  if (detailMatch) {
    return detailMatch[1] as IndustryTab;
  }
  
  return null;
}

/**
 * Build URL for a global tab
 */
export function buildGlobalTabUrl(tab: GlobalTab): string {
  return `/admin/${tab}`;
}

/**
 * Build URL for an industry tab
 */
export function buildIndustryTabUrl(industry: string, tab: IndustryTab): string {
  return `/admin/${industry}/${tab}`;
}

// URL builders for detail pages
export function buildIndustryDetailUrl(industryId: string): string {
  return `/admin/industries/${industryId}`;
}

export function buildServiceDetailUrl(industry: string, serviceId: string): string {
  return `/admin/${industry}/services/${serviceId}`;
}

export function buildUpgradeDetailUrl(industry: string, upgradeId: string): string {
  return `/admin/${industry}/upgrades/${upgradeId}`;
}

export function buildMarketingDetailUrl(industry: string, campaignId: string): string {
  return `/admin/${industry}/marketing/${campaignId}`;
}

export function buildEventDetailUrl(industry: string, eventId: string): string {
  return `/admin/${industry}/events/${eventId}`;
}

export function buildFlagDetailUrl(industry: string, flagId: string): string {
  return `/admin/${industry}/flags/${flagId}`;
}

export function buildConditionDetailUrl(industry: string, conditionId: string): string {
  return `/admin/${industry}/conditions/${conditionId}`;
}

export function buildRoleDetailUrl(industry: string, roleId: string): string {
  return `/admin/${industry}/roles/${roleId}`;
}

export function buildPresetDetailUrl(industry: string, presetId: string): string {
  return `/admin/${industry}/presets/${presetId}`;
}

export function buildCategoryDetailUrl(industry: string, categoryId: string): string {
  return `/admin/${industry}/categories/${categoryId}`;
}

export function buildGlobalMetricDisplayUrl(): string {
  return '/admin/global-metric-display';
}

export function buildIndustryMetricDisplayUrl(industry: string): string {
  return `/admin/${industry}/industry-metric-display`;
}

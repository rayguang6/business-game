import { supabaseServer } from '@/lib/server/supabaseServer';
import type { IndustryId } from '@/lib/game/types';
import { GameMetric } from '@/lib/game/effectManager';

export interface MetricDisplayConfig {
  id: string;  // Composite: {industry_id}_{metric_id}
  industryId: string;  // 'global' for global defaults, industry ID for overrides
  metricId: GameMetric;
  
  // Presentation
  displayLabel: string;
  description: string | null;
  unit: string | null;
  iconPath: string | null;
  
  // Visibility
  showOnHUD: boolean;
  showInDetails: boolean;
  
  // Ordering
  priority: number | null;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface MetricDisplayConfigRow {
  id: string;
  industry_id: string;  // 'global' or industry ID
  metric_id: string;
  display_label: string;
  description: string | null;
  unit: string | null;
  icon_path: string | null;
  show_on_hud: boolean;
  show_in_details: boolean;
  priority: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Generate ID for metric display config
 */
function generateId(industryId: string, metricId: GameMetric): string {
  return `${industryId}_${metricId}`;
}

/**
 * Fetch display config for a specific metric and industry
 * Returns industry-specific config if exists, otherwise global config, otherwise null
 */
export async function fetchMetricDisplayConfig(
  metricId: GameMetric,
  industryId: IndustryId | 'global' = 'global',
): Promise<MetricDisplayConfig | null> {
  if (!supabaseServer) {
    console.error('[MetricDisplayConfig] Supabase client not configured.');
    return null;
  }

  // First try industry-specific (if not 'global')
  if (industryId !== 'global') {
    const { data, error } = await supabaseServer
      .from('metric_display_config')
      .select('*')
      .eq('industry_id', industryId)
      .eq('metric_id', metricId)
      .maybeSingle();

    if (error) {
      console.error(`[MetricDisplayConfig] Failed to fetch config for metric "${metricId}" and industry "${industryId}":`, error);
    } else if (data) {
      return mapRowToConfig(data);
    }
  }

  // Fallback to global
  const { data, error } = await supabaseServer
    .from('metric_display_config')
    .select('*')
    .eq('industry_id', 'global')
    .eq('metric_id', metricId)
    .maybeSingle();

  if (error) {
    console.error(`[MetricDisplayConfig] Failed to fetch global config for metric "${metricId}":`, error);
    return null;
  }

  return data ? mapRowToConfig(data) : null;
}

/**
 * Fetch only industry-specific configs (no merging with global)
 * Returns only configs that exist for the given industryId
 */
export async function fetchIndustrySpecificMetricDisplayConfigs(
  industryId: IndustryId,
): Promise<Record<GameMetric, MetricDisplayConfig | null>> {
  if (!supabaseServer) {
    console.error('[MetricDisplayConfig] Supabase client not configured.');
    return {} as Record<GameMetric, MetricDisplayConfig | null>;
  }

  const { data, error } = await supabaseServer
    .from('metric_display_config')
    .select('*')
    .eq('industry_id', industryId);

  if (error) {
    console.error(`[MetricDisplayConfig] Failed to fetch configs for industry "${industryId}":`, error);
    return {} as Record<GameMetric, MetricDisplayConfig | null>;
  }

  const result: Record<string, MetricDisplayConfig | null> = {};
  (data || []).forEach(row => {
    const metricId = row.metric_id as GameMetric;
    result[metricId] = mapRowToConfig(row);
  });

  return result as Record<GameMetric, MetricDisplayConfig | null>;
}

/**
 * Fetch all display configs for an industry (industry-specific + global fallbacks)
 * Returns merged configs where industry-specific overrides global
 */
export async function fetchAllMetricDisplayConfigs(
  industryId: IndustryId | 'global' = 'global',
): Promise<Record<GameMetric, MetricDisplayConfig | null>> {
  if (!supabaseServer) {
    console.error('[MetricDisplayConfig] Supabase client not configured.');
    return {} as Record<GameMetric, MetricDisplayConfig | null>;
  }

  // Fetch all global configs
  const { data: globalData, error: globalError } = await supabaseServer
    .from('metric_display_config')
    .select('*')
    .eq('industry_id', 'global');

  if (globalError) {
    console.error('[MetricDisplayConfig] Failed to fetch global configs:', globalError);
    return {} as Record<GameMetric, MetricDisplayConfig | null>;
  }

  // Fetch industry-specific configs if industryId is not 'global'
  let industryData: MetricDisplayConfigRow[] = [];
  if (industryId !== 'global') {
    const { data, error } = await supabaseServer
      .from('metric_display_config')
      .select('*')
      .eq('industry_id', industryId);

    if (error) {
      console.error(`[MetricDisplayConfig] Failed to fetch configs for industry "${industryId}":`, error);
    } else {
      industryData = data || [];
    }
  }

  // Build result: industry-specific overrides global
  const result: Record<string, MetricDisplayConfig | null> = {};
  const industryMap = new Map(industryData.map(row => [row.metric_id, row]));

  (globalData || []).forEach(globalRow => {
    const metricId = globalRow.metric_id as GameMetric;
    const industryRow = industryMap.get(metricId);
    
    // Use industry-specific if exists, otherwise global
    result[metricId] = mapRowToConfig(industryRow || globalRow);
  });

  return result as Record<GameMetric, MetricDisplayConfig | null>;
}

/**
 * Upsert display config for a metric
 */
export async function upsertMetricDisplayConfig(
  config: Omit<MetricDisplayConfig, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<{ success: boolean; data?: MetricDisplayConfig; message?: string }> {
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  // Ensure industryId is 'global' if null/undefined
  const industryId = config.industryId || 'global';
  const id = generateId(industryId, config.metricId);

  const payload: MetricDisplayConfigRow = {
    id,
    industry_id: industryId,
    metric_id: config.metricId,
    display_label: config.displayLabel,
    description: config.description,
    unit: config.unit,
    icon_path: config.iconPath,
    show_on_hud: config.showOnHUD,
    show_in_details: config.showInDetails,
    priority: config.priority,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseServer
    .from('metric_display_config')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .maybeSingle();

  if (error) {
    console.error(`[MetricDisplayConfig] Failed to upsert config for metric "${config.metricId}":`, error);
    return { success: false, message: `Failed to save config: ${error.message}` };
  }

  return { success: true, data: data ? mapRowToConfig(data) : undefined };
}

/**
 * Delete display config
 */
export async function deleteMetricDisplayConfig(
  industryId: string,
  metricId: GameMetric,
): Promise<{ success: boolean; message?: string }> {
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const id = generateId(industryId, metricId);

  const { error } = await supabaseServer
    .from('metric_display_config')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`[MetricDisplayConfig] Failed to delete config "${id}":`, error);
    return { success: false, message: `Failed to delete config: ${error.message}` };
  }

  return { success: true };
}

function mapRowToConfig(row: MetricDisplayConfigRow): MetricDisplayConfig {
  return {
    id: row.id,
    industryId: row.industry_id || 'global', // Fallback to 'global' if null (shouldn't happen)
    metricId: row.metric_id as GameMetric,
    displayLabel: row.display_label,
    description: row.description,
    unit: row.unit,
    iconPath: row.icon_path,
    showOnHUD: row.show_on_hud,
    showInDetails: row.show_in_details,
    priority: row.priority,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

import { supabaseServer } from '@/lib/server/supabaseServer';

export interface RouteProtectionConfig {
  id: number;
  enabled: boolean;
  redirectTarget?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get the current route protection configuration.
 * Only uses the first row in the table.
 */
export async function getRouteProtectionConfig(): Promise<RouteProtectionConfig | null> {
  if (!supabaseServer) return null;

  const { data, error } = await supabaseServer
    .from('route_protection')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[RouteProtection] Failed to fetch config:', error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    enabled: data.enabled,
    redirectTarget: data.redirect_target,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update the route protection configuration
 */
export async function updateRouteProtectionConfig(
  config: { enabled: boolean; redirectTarget?: string }
): Promise<{ success: boolean; message?: string }> {
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  // Get the current config to update the first row
  const currentConfig = await getRouteProtectionConfig();
  if (!currentConfig) {
    return { success: false, message: 'No route protection config found.' };
  }

  const { error } = await supabaseServer
    .from('route_protection')
    .update({
      enabled: config.enabled,
      redirect_target: config.redirectTarget || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', currentConfig.id);

  if (error) {
    console.error('[RouteProtection] Failed to update config:', error);
    return { success: false, message: `Failed to update config: ${error.message}` };
  }

  return { success: true };
}
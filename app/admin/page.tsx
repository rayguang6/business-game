import { redirect } from 'next/navigation';
import { fetchIndustriesFromSupabase } from '@/lib/data/industryRepository';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/types';

/**
 * Admin Panel Root Redirect
 * 
 * Redirects /admin to the default route:
 * - /admin/industries (default tab)
 * 
 * If industries are available, we could also redirect to:
 * - /admin/{firstAvailableIndustry}/services
 * 
 * For now, we'll redirect to /admin/industries as specified.
 */
export default async function AdminPage() {
  // Try to fetch industries to determine if we should use a specific industry
  const industries = await fetchIndustriesFromSupabase();
  
  // For now, always redirect to industries page (default tab)
  // In the future, we could redirect to first available industry's services page
  redirect('/admin/industries');
}

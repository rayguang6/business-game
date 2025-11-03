import { supabase } from '@/lib/supabase/client';
import { Industry } from '@/lib/features/industries';

interface IndustryRow {
  id: string;
  name: string;
  icon: string;
  description: string;
  image: string | null;
  map_image: string | null;
  is_available: boolean | null;
  staff_positions?: unknown; // JSONB column for staff positions array
  service_room_positions?: unknown; // JSONB column for service room positions array
  bed_image?: string | null; // Path to bed image for service rooms
}

export async function fetchIndustriesFromSupabase(): Promise<Industry[] | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('industries')
    .select('id,name,icon,description,image,map_image,is_available,staff_positions,service_room_positions,bed_image');

  if (error || !data) {
    return null;
  }

  return data.map(mapRowToIndustry);
}

const mapRowToIndustry = (row: IndustryRow): Industry => ({
  id: row.id,
  name: row.name,
  icon: row.icon,
  description: row.description,
  image: row.image ?? undefined,
  mapImage: row.map_image ?? undefined,
  bedImage: row.bed_image ?? undefined,
  isAvailable: row.is_available ?? undefined,
});

export async function upsertIndustryToSupabase(
  industry: Industry,
  layout?: {
    staffPositions?: Array<{ x: number; y: number }>;
    serviceRoomPositions?: Array<{ x: number; y: number }>;
  },
): Promise<{ success: boolean; data?: Industry; message?: string }> {
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const payload: IndustryRow = {
    id: industry.id,
    name: industry.name,
    icon: industry.icon,
    description: industry.description,
    image: industry.image ?? null,
    map_image: industry.mapImage ?? null,
    bed_image: industry.bedImage ?? null,
    is_available: industry.isAvailable ?? true,
    staff_positions: layout?.staffPositions ? (layout.staffPositions as unknown) : undefined,
    service_room_positions: layout?.serviceRoomPositions ? (layout.serviceRoomPositions as unknown) : undefined,
  };

  const { data, error } = await supabase
    .from('industries')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data: data ? mapRowToIndustry(data) : industry };
}

export async function deleteIndustryFromSupabase(id: string): Promise<{ success: boolean; message?: string }>
{
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const { error } = await supabase.from('industries').delete().eq('id', id);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
}

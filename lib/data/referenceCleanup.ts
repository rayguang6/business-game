import { supabaseServer } from '@/lib/server/supabaseServer';

/**
 * Cleans up references to a deleted flag from all tables that reference it
 */
export async function cleanupFlagReferences(flagId: string): Promise<{ success: boolean; message?: string }> {
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  try {
    // Tables that have requirements (array of strings)
    const tablesWithRequirementIds = ['upgrades', 'marketing_campaigns', 'staff_roles', 'events'];
    
    // Tables that have sets_flag (string)
    const tablesWithSetsFlag = ['upgrades', 'marketing_campaigns', 'staff_roles'];

    // Clean up requirements arrays - remove the flag reference
    for (const table of tablesWithRequirementIds) {
      const { data: rows, error: fetchError } = await supabaseServer
        .from(table)
        .select('id, requirements')
        .not('requirements', 'is', null);

      if (fetchError) {
        console.error(`Failed to fetch ${table} for cleanup:`, fetchError);
        continue;
      }

      if (!rows || rows.length === 0) continue;

      // Find rows that need updating
      const rowsToUpdate = rows.filter((row: any) => {
        const requirements = Array.isArray(row.requirements) ? row.requirements : [];
        return requirements.some((req: any) => req.id === flagId && req.type === 'flag');
      });

      if (rowsToUpdate.length === 0) continue;

      // Update each row to remove the flag reference
      for (const row of rowsToUpdate) {
        const requirements = Array.isArray(row.requirements) ? row.requirements : [];
        const updatedRequirements = requirements.filter((req: any) => !(req.id === flagId && req.type === 'flag'));

        const { error: updateError } = await supabaseServerServer
          .from(table)
          .update({ requirements: updatedRequirements })
          .eq('id', row.id);

        if (updateError) {
          console.error(`Failed to update ${table} row ${row.id}:`, updateError);
        }
      }
    }

    // Clean up sets_flag columns - set to null if they reference the deleted flag
    for (const table of tablesWithSetsFlag) {
      const { error: updateError } = await supabaseServer
        .from(table)
        .update({ sets_flag: null })
        .eq('sets_flag', flagId);

      if (updateError) {
        console.error(`Failed to cleanup sets_flag in ${table}:`, updateError);
      }
    }

    // For events, we also need to check choices.setsFlag
    const { data: events, error: eventsError } = await supabaseServer
      .from('events')
      .select('id, choices');

    if (!eventsError && events) {
      for (const event of events) {
        const choices = Array.isArray(event.choices) ? event.choices : [];
        const hasReference = choices.some((choice: any) => choice.setsFlag === flagId);

        if (hasReference) {
          // Remove the flag reference from all choices
          const updatedChoices = choices.map((choice: any) => {
            if (choice.setsFlag === flagId) {
              const { setsFlag, ...rest } = choice;
              return rest;
            }
            return choice;
          });

          const { error: updateError } = await supabaseServerServerServer
            .from('events')
            .update({ choices: updatedChoices })
            .eq('id', event.id);

          if (updateError) {
            console.error(`Failed to cleanup choices in event ${event.id}:`, updateError);
          }
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error during flag reference cleanup:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Cleans up references to a deleted condition from all tables that reference it
 */
export async function cleanupConditionReferences(conditionId: string): Promise<{ success: boolean; message?: string }> {
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  try {
    // Tables that have requirements (array of objects)
    const tablesWithRequirements = ['upgrades', 'marketing_campaigns', 'staff_roles', 'events'];

    // Clean up requirements arrays - remove the condition reference
    for (const table of tablesWithRequirements) {
      const { data: rows, error: fetchError } = await supabaseServer
        .from(table)
        .select('id, requirements')
        .not('requirements', 'is', null);

      if (fetchError) {
        console.error(`Failed to fetch ${table} for cleanup:`, fetchError);
        continue;
      }

      if (!rows || rows.length === 0) continue;

      // Find rows that need updating
      const rowsToUpdate = rows.filter((row: any) => {
        const requirements = Array.isArray(row.requirements) ? row.requirements : [];
        return requirements.some((req: any) => req.id === conditionId && req.type === 'condition');
      });

      if (rowsToUpdate.length === 0) continue;

      // Update each row to remove the condition reference
      for (const row of rowsToUpdate) {
        const requirements = Array.isArray(row.requirements) ? row.requirements : [];
        const updatedRequirements = requirements.filter((req: any) => !(req.id === conditionId && req.type === 'condition'));

        const { error: updateError } = await supabaseServerServer
          .from(table)
          .update({ requirements: updatedRequirements })
          .eq('id', row.id);

        if (updateError) {
          console.error(`Failed to update ${table} row ${row.id}:`, updateError);
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error during condition reference cleanup:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}


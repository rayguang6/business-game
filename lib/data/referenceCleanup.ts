import { supabase } from '@/lib/supabase/client';

/**
 * Cleans up references to a deleted flag from all tables that reference it
 */
export async function cleanupFlagReferences(flagId: string): Promise<{ success: boolean; message?: string }> {
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  try {
    // Tables that have requirement_ids (array of strings)
    const tablesWithRequirementIds = ['upgrades', 'marketing_campaigns', 'staff_roles', 'events'];
    
    // Tables that have sets_flag (string)
    const tablesWithSetsFlag = ['upgrades', 'marketing_campaigns', 'staff_roles'];

    // Clean up requirement_ids arrays - remove the flag reference
    for (const table of tablesWithRequirementIds) {
      const { data: rows, error: fetchError } = await supabase
        .from(table)
        .select('id, requirement_ids')
        .not('requirement_ids', 'is', null);

      if (fetchError) {
        console.error(`Failed to fetch ${table} for cleanup:`, fetchError);
        continue;
      }

      if (!rows || rows.length === 0) continue;

      // Find rows that need updating
      const rowsToUpdate = rows.filter((row: any) => {
        const requirementIds = Array.isArray(row.requirement_ids) ? row.requirement_ids : [];
        return requirementIds.includes(flagId);
      });

      if (rowsToUpdate.length === 0) continue;

      // Update each row to remove the flag reference
      for (const row of rowsToUpdate) {
        const requirementIds = Array.isArray(row.requirement_ids) ? row.requirement_ids : [];
        const updatedIds = requirementIds.filter((id: string) => id !== flagId);

        const { error: updateError } = await supabase
          .from(table)
          .update({ requirement_ids: updatedIds })
          .eq('id', row.id);

        if (updateError) {
          console.error(`Failed to update ${table} row ${row.id}:`, updateError);
        }
      }
    }

    // Clean up sets_flag columns - set to null if they reference the deleted flag
    for (const table of tablesWithSetsFlag) {
      const { error: updateError } = await supabase
        .from(table)
        .update({ sets_flag: null })
        .eq('sets_flag', flagId);

      if (updateError) {
        console.error(`Failed to cleanup sets_flag in ${table}:`, updateError);
      }
    }

    // For events, we also need to check choices.setsFlag
    const { data: events, error: eventsError } = await supabase
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

          const { error: updateError } = await supabase
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
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  try {
    // Tables that have requirement_ids (array of strings)
    const tablesWithRequirementIds = ['upgrades', 'marketing_campaigns', 'staff_roles', 'events'];

    // Clean up requirement_ids arrays - remove the condition reference
    for (const table of tablesWithRequirementIds) {
      const { data: rows, error: fetchError } = await supabase
        .from(table)
        .select('id, requirement_ids')
        .not('requirement_ids', 'is', null);

      if (fetchError) {
        console.error(`Failed to fetch ${table} for cleanup:`, fetchError);
        continue;
      }

      if (!rows || rows.length === 0) continue;

      // Find rows that need updating
      const rowsToUpdate = rows.filter((row: any) => {
        const requirementIds = Array.isArray(row.requirement_ids) ? row.requirement_ids : [];
        return requirementIds.includes(conditionId);
      });

      if (rowsToUpdate.length === 0) continue;

      // Update each row to remove the condition reference
      for (const row of rowsToUpdate) {
        const requirementIds = Array.isArray(row.requirement_ids) ? row.requirement_ids : [];
        const updatedIds = requirementIds.filter((id: string) => id !== conditionId);

        const { error: updateError } = await supabase
          .from(table)
          .update({ requirement_ids: updatedIds })
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


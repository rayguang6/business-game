import { supabase } from '@/lib/supabase/client';
import type {
  GameEvent,
  GameEventChoice,
  GameEventConsequence,
  GameEventTemporaryEffect,
} from '@/lib/types/gameEvents';
import type { IndustryId } from '@/lib/game/types';
import { EffectType, GameMetric } from '@/lib/game/effectManager';

interface EventRow {
  id: string;
  industry_id: string;
  title: string;
  category: string;
  summary: string;
  choices: unknown;
}

type RawChoice = {
  id?: string;
  label?: string;
  description?: string;
  cost?: number;
  consequences?: RawConsequence[];
};

type RawConsequence = {
  id?: string;
  label?: string;
  description?: string;
  weight?: number;
  effects?: RawEffect[];
  temporaryEffects?: RawTemporaryEffect[]; // For backward compatibility with old data
};

type RawEffect =
  | { type: 'cash'; amount: number; label?: string }
  | { type: 'reputation'; amount: number; label?: string }
  | { type: 'metric'; metric?: string; effectType?: string; value?: number; durationSeconds?: number | null; priority?: number };

type RawTemporaryEffect = {
  metric?: string;
  type?: string;
  value?: number;
  durationSeconds?: number | null;
  priority?: number;
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const isRawEffect = (value: unknown): value is RawEffect => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return record.type === 'cash' || record.type === 'reputation' || record.type === 'metric';
};


const mapConsequences = (raw: RawConsequence[] | undefined): GameEventConsequence[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((consequence) => {
    // Handle backward compatibility: convert temporaryEffects to metric effects if they exist
    const regularEffects = Array.isArray(consequence.effects)
      ? consequence.effects.filter(isRawEffect).map((effect) => ({ ...effect }))
      : [];

    // For backward compatibility with old data that still has temporaryEffects
    const temporaryEffects = Array.isArray((consequence as any).temporaryEffects)
      ? (consequence as any).temporaryEffects.map((temp: any): RawEffect => ({
          type: 'metric',
          metric: temp.metric,
          effectType: temp.type,
          value: temp.value,
          durationSeconds: temp.durationSeconds,
          priority: temp.priority,
        }))
      : [];

    return {
      id: String(consequence.id ?? ''),
      label: consequence.label,
      description: consequence.description,
      weight: Math.max(0, toNumber(consequence.weight, 0)),
      effects: [...regularEffects, ...temporaryEffects],
    };
  });
};

const mapChoices = (raw: RawChoice[] | undefined): GameEventChoice[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((choice) => ({
    id: String(choice.id ?? ''),
    label: choice.label ?? '',
    description: choice.description,
    cost: choice.cost !== undefined ? toNumber(choice.cost, 0) : undefined,
    consequences: mapConsequences(choice.consequences),
  }));
};

export async function fetchEventsForIndustry(industryId: IndustryId): Promise<GameEvent[] | null> {
  if (!supabase) {
    console.error('Supabase client not configured. Unable to fetch events.');
    return null;
  }

  const { data, error } = await supabase
    .from('events')
    .select('id, industry_id, title, category, summary, choices')
    .eq('industry_id', industryId);

  if (error) {
    console.error('Failed to fetch events from Supabase', error);
    return null;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data
    .filter((row) => row.id && row.title && row.category && row.summary)
    .map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category as GameEvent['category'],
      summary: row.summary,
      choices: mapChoices(Array.isArray(row.choices) ? (row.choices as RawChoice[]) : undefined),
    }));
}

function serializeChoices(choices: GameEventChoice[]): RawChoice[] {
  return choices.map((choice) => ({
    id: choice.id,
    label: choice.label,
    description: choice.description,
    cost: choice.cost,
    consequences: choice.consequences.map((consequence) => ({
      id: consequence.id,
      label: consequence.label,
      description: consequence.description,
      weight: consequence.weight,
      effects: consequence.effects.map((e) => ({ ...(e as RawEffect) })),
    })),
  }));
}

export async function upsertEventForIndustry(
  industryId: IndustryId,
  event: GameEvent,
): Promise<{ success: boolean; message?: string }>
{
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const payload: EventRow = {
    id: event.id,
    industry_id: industryId,
    title: event.title,
    category: event.category,
    summary: event.summary,
    choices: serializeChoices(event.choices),
  };

  const { error } = await supabase
    .from('events')
    .upsert(payload, { onConflict: 'industry_id,id' });

  if (error) {
    console.error('Failed to upsert event', error);
    return { success: false, message: error.message };
  }
  return { success: true };
}

export async function deleteEventById(id: string): Promise<{ success: boolean; message?: string }>
{
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete event', error);
    return { success: false, message: error.message };
  }
  return { success: true };
}

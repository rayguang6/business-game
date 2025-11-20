import { supabase } from '@/lib/supabase/client';
import type {
  GameEvent,
  GameEventChoice,
  GameEventConsequence,
  GameEventEffect,
} from '@/lib/types/gameEvents';
import { EventEffectType } from '@/lib/types/gameEvents';
import type { IndustryId, Requirement } from '@/lib/game/types';
import { EffectType, GameMetric } from '@/lib/game/effectManager';
import { validateAndParseGameEventEffects } from '@/lib/utils/effectValidation';

interface EventRow {
  id: string;
  industry_id: string;
  title: string;
  category: string;
  summary: string;
  choices: unknown;
  requirements: unknown;
}

type RawChoice = {
  id?: string;
  label?: string;
  description?: string;
  cost?: number;
  timeCost?: number;
  consequences?: RawConsequence[];
  setsFlag?: string;
};

type RawConsequence = {
  id?: string;
  label?: string;
  description?: string;
  weight?: number;
  effects?: RawEffect[];
};

type RawEffect =
  | { type: EventEffectType.Cash; amount: number; label?: string }
  | { type: EventEffectType.SkillLevel; amount: number }
  | { type: EventEffectType.DynamicCash; expression: string; label?: string }
  | { type: EventEffectType.Metric; metric: string; effectType: string; value: number; durationSeconds?: number | null; priority?: number };

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
  // Use centralized validation utility
  return validateAndParseGameEventEffects([value]).length === 1;
};

const mapConsequences = (raw: RawConsequence[] | undefined): GameEventConsequence[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((consequence): consequence is RawConsequence => consequence !== null && typeof consequence === 'object')
    .map((consequence) => ({
      id: String(consequence.id ?? ''),
      label: consequence.label,
      description: consequence.description,
      weight: Math.max(0, toNumber(consequence.weight, 0)),
      effects: Array.isArray(consequence.effects)
        ? validateAndParseGameEventEffects(consequence.effects).map(convertRawEffectToGameEventEffect)
        : [],
    }));
};

const mapChoices = (raw: RawChoice[] | undefined): GameEventChoice[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((choice): choice is RawChoice => choice !== null && typeof choice === 'object')
    .map((choice) => ({
      id: String(choice.id ?? ''),
      label: choice.label ?? '',
      description: choice.description,
      cost: choice.cost !== undefined ? toNumber(choice.cost, 0) : undefined,
      timeCost: choice.timeCost !== undefined ? toNumber(choice.timeCost, 0) : undefined,
      setsFlag: choice.setsFlag,
      consequences: mapConsequences(choice.consequences),
    }));
};

export async function fetchEventsForIndustry(industryId: IndustryId): Promise<GameEvent[] | null> {
  if (!supabase) {
    console.error('Supabase client not configured. Unable to fetch events.');
    return null;
  }

  console.log(`[Events] fetchEventsForIndustry called with: ${industryId}`);

  const { data, error } = await supabase
    .from('events')
    .select('id, industry_id, title, category, summary, choices, requirements')
    .eq('industry_id', industryId);

  if (error) {
    console.error('[Events] Failed to fetch events from Supabase', error);
    return null;
  }

  console.log(`[Events] Supabase query result for "${industryId}":`, { 
    count: data?.length || 0, 
    events: data?.map(e => ({ id: e.id, title: e.title })) || [] 
  });

  if (!data || data.length === 0) {
    console.warn(`[Events] ⚠️ No events found for industry "${industryId}"`);
    return [];
  }

  const mapped = data
    .filter((row) => row.id && row.title && row.category && row.summary)
    .map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category as GameEvent['category'],
      summary: row.summary,
      choices: mapChoices(Array.isArray(row.choices) ? (row.choices as RawChoice[]) : undefined),
      requirements: Array.isArray(row.requirements) ? row.requirements as Requirement[] : undefined,
    }));

  console.log(`[Events] Mapped ${mapped.length} events for industry "${industryId}"`);
  return mapped;
}

const convertRawEffectToGameEventEffect = (rawEffect: unknown): GameEventEffect => {
  // rawEffect is already validated by validateAndParseGameEventEffects
  const e = rawEffect as Record<string, unknown>;
  
  switch (e.type) {
    case EventEffectType.Cash:
      return {
        type: EventEffectType.Cash,
        amount: e.amount as number,
        label: e.label as string | undefined,
      };
    case EventEffectType.SkillLevel:
      return {
        type: EventEffectType.SkillLevel,
        amount: e.amount as number,
      };
    case EventEffectType.DynamicCash:
      return {
        type: EventEffectType.DynamicCash,
        expression: e.expression as string,
        label: e.label as string | undefined,
      };
    case EventEffectType.Metric:
      // Use enum values - already validated to be valid GameMetric and EffectType
      return {
        type: EventEffectType.Metric,
        metric: e.metric as GameMetric,
        effectType: e.effectType as EffectType,
        value: e.value as number,
        durationSeconds: e.durationSeconds as number | null | undefined,
        priority: e.priority as number | undefined,
      };
    default:
      throw new Error(`Invalid effect type: ${e.type}`);
  }
};

const convertGameEventEffectToRawEffect = (effect: GameEventEffect): RawEffect => {
  switch (effect.type) {
    case EventEffectType.Cash:
      return {
        type: EventEffectType.Cash,
        amount: effect.amount,
        label: effect.label,
      };
    case EventEffectType.SkillLevel:
      return {
        type: EventEffectType.SkillLevel,
        amount: effect.amount,
      };
    case EventEffectType.DynamicCash:
      return {
        type: EventEffectType.DynamicCash,
        expression: effect.expression,
        label: effect.label,
      };
    case EventEffectType.Metric:
      // Use enum values directly - they come from GameMetric and EffectType enums
      return {
        type: EventEffectType.Metric,
        metric: effect.metric,
        effectType: effect.effectType,
        value: effect.value,
        durationSeconds: effect.durationSeconds,
        priority: effect.priority,
      };
  }
};

function serializeChoices(choices: GameEventChoice[]): RawChoice[] {
  return choices.map((choice) => ({
    id: choice.id,
    label: choice.label,
    description: choice.description,
    cost: choice.cost,
    timeCost: choice.timeCost,
    setsFlag: choice.setsFlag,
    consequences: choice.consequences.map((consequence) => ({
      id: consequence.id,
      label: consequence.label,
      description: consequence.description,
      weight: consequence.weight,
      effects: consequence.effects.map(convertGameEventEffectToRawEffect),
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
    requirements: event.requirements || [],
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

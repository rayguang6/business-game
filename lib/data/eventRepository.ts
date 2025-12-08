import { supabaseServer } from '@/lib/server/supabaseServer';
import type {
  GameEvent,
  GameEventChoice,
  GameEventConsequence,
  GameEventEffect,
  DelayedConsequence,
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

type RawDelayedConsequence = {
  id?: string;
  delaySeconds?: number;
  successRequirements?: Requirement[];
  successEffects?: RawEffect[];
  failureEffects?: RawEffect[];
  label?: string;
  successDescription?: string;
  failureDescription?: string;
};

type RawConsequence = {
  id?: string;
  label?: string;
  description?: string;
  weight?: number;
  effects?: RawEffect[];
  delayedConsequence?: RawDelayedConsequence;
};

type RawEffect =
  | { type: EventEffectType.Cash; amount: number; label?: string }
  | { type: EventEffectType.Exp; amount: number }
  | { type: EventEffectType.DynamicCash; expression: string; label?: string }
  | { type: EventEffectType.Metric; metric: string; effectType: string; value: number; durationMonths?: number | null; priority?: number };

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

const mapDelayedConsequence = (raw: RawDelayedConsequence | undefined): DelayedConsequence | undefined => {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }

  const id = String(raw.id ?? '');
  const delaySeconds = toNumber(raw.delaySeconds, 0);
  
  if (!id || delaySeconds <= 0) {
    return undefined;
  }

  const successEffects = Array.isArray(raw.successEffects)
    ? validateAndParseGameEventEffects(raw.successEffects).map(convertRawEffectToGameEventEffect)
    : [];

  const failureEffects = Array.isArray(raw.failureEffects)
    ? validateAndParseGameEventEffects(raw.failureEffects).map(convertRawEffectToGameEventEffect)
    : undefined;

  return {
    id,
    delaySeconds,
    successRequirements: Array.isArray(raw.successRequirements) ? raw.successRequirements : undefined,
    successEffects,
    failureEffects: failureEffects && failureEffects.length > 0 ? failureEffects : undefined,
    label: raw.label,
    successDescription: raw.successDescription,
    failureDescription: raw.failureDescription,
  };
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
      delayedConsequence: mapDelayedConsequence(consequence.delayedConsequence),
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
  if (!supabaseServer) {
    console.error('Supabase client not configured. Unable to fetch events.');
    return null;
  }

  const { data, error } = await supabaseServer
    .from('events')
    .select('id, industry_id, title, category, summary, choices, requirements')
    .eq('industry_id', industryId);

  if (error) {
    console.error(`[Events] Failed to fetch events for industry "${industryId}":`, error);
    return null;
  }

  if (!data || data.length === 0) {
    console.warn(`[Events] ⚠️ No events found for industry "${industryId}"`);
    return [];
  }

  const mapped: GameEvent[] = [];
  
  for (const row of data) {
    if (!row.id || !row.title || !row.category || !row.summary) {
      console.warn(`[Events] Skipping event with missing required fields: id=${row.id}, title=${row.title}`);
      continue;
    }
    
    try {
      // Parse choices JSONB with error handling
      let choices: GameEventChoice[] = [];
      if (row.choices) {
        if (Array.isArray(row.choices)) {
          choices = mapChoices(row.choices as RawChoice[]);
        } else {
          console.warn(`[Events] Invalid choices format for event "${row.id}": expected array, got ${typeof row.choices}`);
        }
      }
      
      // Parse requirements JSONB with error handling
      let requirements: Requirement[] | undefined = undefined;
      if (row.requirements) {
        if (Array.isArray(row.requirements)) {
          requirements = row.requirements as Requirement[];
        } else {
          console.warn(`[Events] Invalid requirements format for event "${row.id}": expected array, got ${typeof row.requirements}`);
        }
      }
      
      mapped.push({
        id: row.id,
        title: row.title,
        category: row.category as GameEvent['category'],
        summary: row.summary,
        choices,
        requirements,
      });
    } catch (err) {
      console.error(`[Events] Failed to parse event "${row.id}":`, err);
      // Continue processing other events
    }
  }

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
    case EventEffectType.Exp:
      return {
        type: EventEffectType.Exp,
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
        durationMonths: e.durationMonths as number | null | undefined,
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
    case EventEffectType.Exp:
      return {
        type: EventEffectType.Exp,
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
        durationMonths: effect.durationMonths,
        priority: effect.priority,
      };
  }
};

const serializeDelayedConsequence = (delayed: DelayedConsequence | undefined): RawDelayedConsequence | undefined => {
  if (!delayed) {
    return undefined;
  }

  return {
    id: delayed.id,
    delaySeconds: delayed.delaySeconds,
    successRequirements: delayed.successRequirements,
    successEffects: delayed.successEffects.map(convertGameEventEffectToRawEffect),
    failureEffects: delayed.failureEffects?.map(convertGameEventEffectToRawEffect),
    label: delayed.label,
    successDescription: delayed.successDescription,
    failureDescription: delayed.failureDescription,
  };
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
      delayedConsequence: serializeDelayedConsequence(consequence.delayedConsequence),
    })),
  }));
}

export async function upsertEventForIndustry(
  industryId: IndustryId,
  event: GameEvent,
): Promise<{ success: boolean; message?: string }>
{
  if (!supabaseServer) {
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

  const { error } = await supabaseServer
    .from('events')
    .upsert(payload, { onConflict: 'industry_id,id' });

  if (error) {
    console.error(`[Events] Failed to upsert event "${event.id}" for industry "${industryId}":`, error);
    return { success: false, message: `Failed to save event: ${error.message}` };
  }
  return { success: true };
}

export async function deleteEventById(id: string): Promise<{ success: boolean; message?: string }>
{
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }
  const { error } = await supabaseServer.from('events').delete().eq('id', id);
  if (error) {
    console.error(`[Events] Failed to delete event "${id}":`, error);
    return { success: false, message: `Failed to delete event: ${error.message}` };
  }
  return { success: true };
}

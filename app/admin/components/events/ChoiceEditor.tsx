'use client';

import type { GameFlag } from '@/lib/data/flagRepository';
import type { Requirement, UpgradeDefinition } from '@/lib/game/types';
import type { StaffRoleConfig } from '@/lib/game/staffConfig';
import { RequirementsSelector } from '../RequirementsSelector';
import { NumberInput } from '../NumberInput';

export interface ChoiceFormData {
  id: string;
  label: string;
  description: string;
  cost: string;
  timeCost: string;
  setsFlag?: string;
  requirements: Requirement[];
  order: string;
}

interface ChoiceEditorProps {
  choiceForm: ChoiceFormData;
  isCreatingChoice: boolean;
  flags: GameFlag[];
  flagsLoading: boolean;
  upgrades?: UpgradeDefinition[];
  staffRoles?: StaffRoleConfig[];
  marketingCampaigns?: import('@/lib/store/slices/marketingSlice').MarketingCampaign[];
  onUpdate: (updates: Partial<ChoiceFormData>) => void;
  onSave: () => void;
  onReset: () => void;
  onDelete?: () => void;
}

export function ChoiceEditor({
  choiceForm,
  isCreatingChoice,
  flags,
  flagsLoading,
  upgrades = [],
  staffRoles = [],
  marketingCampaigns = [],
  onUpdate,
  onSave,
  onReset,
  onDelete,
}: ChoiceEditorProps) {
  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-700 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">Choice ID (optional)</label>
          <input
            value={choiceForm.id}
            onChange={(e) => onUpdate({ id: e.target.value })}
            placeholder="Auto-generated if empty"
            disabled={!isCreatingChoice}
            className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
              isCreatingChoice ? 'bg-slate-900 border-slate-600' : 'bg-slate-800 border-slate-700 cursor-not-allowed'
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">Label</label>
          <input
            value={choiceForm.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">Cost (optional)</label>
          <NumberInput
            min="0"
            placeholder="Cash cost to select this choice"
            value={choiceForm.cost}
            onChange={(e) => onUpdate({ cost: e.target.value })}
            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">Time Cost (optional)</label>
          <NumberInput
            min="0"
            placeholder="Time cost to select this choice"
            value={choiceForm.timeCost}
            onChange={(e) => onUpdate({ timeCost: e.target.value })}
            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">Order (optional)</label>
          <NumberInput
            min="0"
            placeholder="Display order (lower = first)"
            value={choiceForm.order}
            onChange={(e) => onUpdate({ order: e.target.value })}
            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
          />
          <p className="text-xs text-gray-400 mt-1">Lower numbers appear first in choice lists</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1">Description (optional)</label>
        <textarea
          rows={2}
          value={choiceForm.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1">Sets Flag (optional)</label>
        <select
          value={choiceForm.setsFlag || ''}
          onChange={(e) => onUpdate({ setsFlag: e.target.value })}
          disabled={flagsLoading}
          className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200 disabled:opacity-50"
        >
          <option value="">
            {flagsLoading ? 'Loading flags...' : 'None'}
          </option>
          {!flagsLoading && flags.map((flag) => (
            <option key={flag.id} value={flag.id}>
              {flag.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">Flag to set when this choice is selected</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Requirements (optional)</label>
        <RequirementsSelector
          requirements={choiceForm.requirements}
          onRequirementsChange={(requirements) => onUpdate({ requirements })}
          flags={flags}
          flagsLoading={flagsLoading}
          upgrades={upgrades}
          staffRoles={staffRoles}
          marketingCampaigns={marketingCampaigns}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
        >
          Save Choice
        </button>
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
        >
          {isCreatingChoice ? 'Cancel' : 'Reset'}
        </button>
        {onDelete && !isCreatingChoice && (
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-rose-600 hover:bg-rose-500 text-white"
          >
            Delete Choice
          </button>
        )}
      </div>
    </div>
  );
}
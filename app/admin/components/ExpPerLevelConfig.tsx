'use client';

import { useState, useEffect, useMemo } from 'react';
import { NumberInput } from './NumberInput';

interface ExpPerLevelConfigProps {
  value: number | number[] | undefined;
  onChange: (value: number | number[]) => void;
}

interface ExpLevelEntry {
  exp: number;
  repeat: number;
}

export function ExpPerLevelConfig({ value, onChange }: ExpPerLevelConfigProps) {
  // Determine initial mode: if value is array, use 'array', otherwise 'flat'
  const isArrayValue = Array.isArray(value);
  const [mode, setMode] = useState<'flat' | 'array'>(isArrayValue ? 'array' : 'flat');
  
  // For flat mode: single number
  const [flatValue, setFlatValue] = useState<number>(
    typeof value === 'number' ? value : 200
  );
  
  // For array mode: list of entries with EXP and repeat count
  const [entries, setEntries] = useState<ExpLevelEntry[]>(() => {
    if (Array.isArray(value) && value.length > 0) {
      // Convert array to entries format
      // e.g., [100, 100, 100, 150, 150] -> [{exp: 100, repeat: 3}, {exp: 150, repeat: 2}]
      const result: ExpLevelEntry[] = [];
      let currentExp = value[0];
      let repeat = 1;
      
      for (let i = 1; i < value.length; i++) {
        if (value[i] === currentExp) {
          repeat++;
        } else {
          result.push({ exp: currentExp, repeat });
          currentExp = value[i];
          repeat = 1;
        }
      }
      result.push({ exp: currentExp, repeat });
      return result;
    }
    return [{ exp: 200, repeat: 1 }];
  });

  // Update mode when value prop changes externally
  useEffect(() => {
    const isArray = Array.isArray(value);
    if (isArray && mode === 'flat') {
      setMode('array');
      // Also update entries if switching to array mode
      if (value.length > 0) {
        const result: ExpLevelEntry[] = [];
        let currentExp = value[0];
        let repeat = 1;
        for (let i = 1; i < value.length; i++) {
          if (value[i] === currentExp) {
            repeat++;
          } else {
            result.push({ exp: currentExp, repeat });
            currentExp = value[i];
            repeat = 1;
          }
        }
        result.push({ exp: currentExp, repeat });
        setEntries(result);
      }
    } else if (!isArray && mode === 'array') {
      setMode('flat');
      if (typeof value === 'number') {
        setFlatValue(value);
      }
    }
  }, [value, mode]);

  // Helper to convert entries to array
  const entriesToArray = (entryList: ExpLevelEntry[]): number[] => {
    return entryList.flatMap(entry => Array(entry.repeat).fill(entry.exp));
  };

  // Compute the resulting array from entries
  const computedArray = useMemo(() => {
    return entriesToArray(entries);
  }, [entries]);

  // Handle flat mode change
  const handleFlatChange = (newValue: number) => {
    setFlatValue(newValue);
    onChange(newValue);
  };

  // Handle array mode changes
  const handleAddEntry = () => {
    const lastExp = entries.length > 0 ? entries[entries.length - 1].exp : 200;
    const updated = [...entries, { exp: lastExp, repeat: 1 }];
    setEntries(updated);
    onChange(entriesToArray(updated));
  };

  const handleRemoveEntry = (index: number) => {
    if (entries.length > 1) {
      const updated = entries.filter((_, i) => i !== index);
      setEntries(updated);
      onChange(entriesToArray(updated));
    }
  };

  const handleUpdateEntry = (index: number, field: 'exp' | 'repeat', newValue: number) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: newValue };
    setEntries(updated);
    onChange(entriesToArray(updated));
  };

  // Handle mode switch
  const handleModeChange = (newMode: 'flat' | 'array') => {
    setMode(newMode);
    if (newMode === 'flat') {
      // Convert array to flat: use last value or first value
      if (Array.isArray(value) && value.length > 0) {
        const flatVal = value[value.length - 1]; // Use last value as it will repeat
        setFlatValue(flatVal);
        onChange(flatVal);
      } else {
        onChange(flatValue);
      }
    } else {
      // Convert flat to array: create single entry
      const newEntries = [{ exp: typeof value === 'number' ? value : flatValue, repeat: 1 }];
      setEntries(newEntries);
      onChange(entriesToArray(newEntries));
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode selector */}
      <div className="flex items-center gap-4">
        <label className="block text-xs text-slate-400">Configuration Mode:</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleModeChange('flat')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              mode === 'flat'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Flat (All Levels Same)
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('array')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              mode === 'array'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Per-Level (Custom)
          </button>
        </div>
      </div>

      {mode === 'flat' ? (
        /* Flat mode: single number input */
        <div>
          <NumberInput
            min="1"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
            value={flatValue}
            onChange={(e) => handleFlatChange(e.target.value === '' ? 200 : Number(e.target.value))}
          />
          <p className="text-xs text-slate-500 mt-1">
            All levels will require {flatValue} EXP to progress
          </p>
        </div>
      ) : (
        /* Array mode: entries with EXP and repeat count */
        <div className="space-y-3">
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">EXP Value</label>
                    <NumberInput
                      min="1"
                      className="w-full rounded bg-slate-700 border border-slate-600 px-2 py-1 text-sm text-slate-200"
                      value={entry.exp}
                      onChange={(e) => handleUpdateEntry(index, 'exp', e.target.value === '' ? 1 : Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Repeat Count</label>
                    <NumberInput
                      min="1"
                      className="w-full rounded bg-slate-700 border border-slate-600 px-2 py-1 text-sm text-slate-200"
                      value={entry.repeat}
                      onChange={(e) => handleUpdateEntry(index, 'repeat', e.target.value === '' ? 1 : Number(e.target.value))}
                    />
                  </div>
                </div>
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEntry(index)}
                    className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddEntry}
            className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            + Add Entry
          </button>

          {/* Preview */}
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
            <div className="text-xs text-slate-400 mb-2">
              Preview (first 20 levels, then repeats last value):
            </div>
            <div className="text-xs text-slate-300 font-mono max-h-32 overflow-y-auto">
              {computedArray.slice(0, 20).map((exp, idx) => (
                <span key={idx} className="mr-2">
                  L{idx + 1}→L{idx + 2}: {exp}
                </span>
              ))}
              {computedArray.length > 20 && (
                <span className="text-slate-500">... (then repeats {computedArray[computedArray.length - 1]} EXP per level)</span>
              )}
              {computedArray.length === 0 && (
                <span className="text-slate-500">No entries configured</span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Total levels configured: {computedArray.length} (Levels beyond this will use {computedArray.length > 0 ? computedArray[computedArray.length - 1] : 'N/A'} EXP per level)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

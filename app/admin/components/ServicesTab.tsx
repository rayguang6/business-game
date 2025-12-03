'use client';

import type { IndustryServiceDefinition, Requirement, UpgradeDefinition } from '@/lib/game/types';
import type { GameFlag } from '@/lib/data/flagRepository';
import type { StaffRoleConfig } from '@/lib/game/staffConfig';
import { RequirementsSelector } from './RequirementsSelector';
import { makeUniqueId, slugify } from './utils';

interface ServicesTabProps {
  industryId: string;
  services: IndustryServiceDefinition[];
  serviceLoading: boolean;
  serviceStatus: string | null;
  selectedServiceId: string;
  isCreatingService: boolean;
  serviceForm: { id: string; name: string; duration: string; price: string; requirements: Requirement[]; pricingCategory: string; weightage: string; requiredStaffRoleIds: string[] };
  serviceSaving: boolean;
  serviceDeleting: boolean;
  flags: GameFlag[];
  flagsLoading: boolean;
  upgrades?: UpgradeDefinition[];
  staffRoles?: StaffRoleConfig[];
  onSelectService: (service: IndustryServiceDefinition) => void;
  onCreateService: () => void;
  onSaveService: () => Promise<void>;
  onDeleteService: () => Promise<void>;
  onReset: () => void;
  onUpdateForm: (updates: Partial<ServicesTabProps['serviceForm']>) => void;
}

export function ServicesTab({
  industryId,
  services,
  serviceLoading,
  serviceStatus,
  selectedServiceId,
  isCreatingService,
  serviceForm,
  serviceSaving,
  serviceDeleting,
  flags,
  flagsLoading,
  upgrades,
  staffRoles,
  onSelectService,
  onCreateService,
  onSaveService,
  onDeleteService,
  onReset,
  onUpdateForm,
}: ServicesTabProps) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">Services</h2>
        <p className="text-sm text-slate-400 mt-1">Manage the services offered for the selected industry.</p>
      </div>
      <div className="p-6 space-y-6">
        {!industryId ? (
          <div className="text-sm text-slate-400">Select or create an industry first.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onCreateService}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!industryId}
              >
                + New Service
              </button>
              {serviceStatus && <span className="text-sm text-slate-300">{serviceStatus}</span>}
            </div>

            {serviceLoading ? (
              <div className="text-sm text-slate-400">Loading services...</div>
            ) : services.length === 0 && !isCreatingService ? (
              <div className="text-sm text-slate-400">No services configured yet.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => onSelectService(service)}
                      className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                        selectedServiceId === service.id && !isCreatingService
                          ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
                          : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                      }`}
                    >
                      {service.name}
                    </button>
                  ))}
                </div>

                {(selectedServiceId || isCreatingService) && (
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Service ID</label>
                      <input
                        value={serviceForm.id}
                        onChange={(e) => onUpdateForm({ id: e.target.value })}
                        disabled={!isCreatingService && !!selectedServiceId}
                        className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                          isCreatingService || !selectedServiceId
                            ? 'bg-slate-900 border-slate-600'
                            : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                      <input
                        value={serviceForm.name}
                        onChange={(e) => onUpdateForm({ name: e.target.value })}
                        onBlur={() => {
                          if (!serviceForm.id && serviceForm.name.trim()) {
                            const base = slugify(`${industryId}-${serviceForm.name.trim()}`);
                            const unique = makeUniqueId(base, new Set(services.map((s) => s.id)));
                            onUpdateForm({ id: unique });
                          }
                        }}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Duration (seconds)</label>
                      <input
                        type="number"
                        min="0"
                        value={serviceForm.duration}
                        onChange={(e) => onUpdateForm({ duration: e.target.value })}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Price</label>
                      <input
                        type="number"
                        min="0"
                        value={serviceForm.price}
                        onChange={(e) => onUpdateForm({ price: e.target.value })}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Pricing Category</label>
                      <select
                        value={serviceForm.pricingCategory}
                        onChange={(e) => onUpdateForm({ pricingCategory: e.target.value })}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      >
                        <option value="">None</option>
                        <option value="low">Low End</option>
                        <option value="mid">Mid Range</option>
                        <option value="high">High End</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Weightage</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={serviceForm.weightage}
                        onChange={(e) => onUpdateForm({ weightage: e.target.value })}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                        placeholder="1.0"
                      />
                      <p className="text-xs text-slate-400 mt-1">Higher weightage = more likely to be selected</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Required Staff Roles</label>
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400 mb-2">
                          Select which staff roles can perform this service. Leave empty to allow any staff.
                        </p>
                        {/* Main Character (Founder) - always available */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(() => {
                            const mainCharacterRole = { id: 'main-character', name: 'Founder' };
                            const isSelected = serviceForm.requiredStaffRoleIds?.includes('main-character') ?? false;
                            return (
                              <button
                                key="main-character"
                                type="button"
                                onClick={() => {
                                  const currentIds = serviceForm.requiredStaffRoleIds || [];
                                  const newIds = isSelected
                                    ? currentIds.filter((id) => id !== 'main-character')
                                    : [...currentIds, 'main-character'];
                                  onUpdateForm({ requiredStaffRoleIds: newIds });
                                }}
                                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                                  isSelected
                                    ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200'
                                    : 'border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300'
                                }`}
                              >
                                {mainCharacterRole.name}
                                {isSelected && ' ✓'}
                              </button>
                            );
                          })()}
                        </div>
                        {/* Regular Staff Roles */}
                        {staffRoles && staffRoles.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {staffRoles.map((role) => {
                              const isSelected = serviceForm.requiredStaffRoleIds?.includes(role.id) ?? false;
                              return (
                                <button
                                  key={role.id}
                                  type="button"
                                  onClick={() => {
                                    const currentIds = serviceForm.requiredStaffRoleIds || [];
                                    const newIds = isSelected
                                      ? currentIds.filter((id) => id !== role.id)
                                      : [...currentIds, role.id];
                                    onUpdateForm({ requiredStaffRoleIds: newIds });
                                  }}
                                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                                    isSelected
                                      ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200'
                                      : 'border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300'
                                  }`}
                                >
                                  {role.name}
                                  {isSelected && ' ✓'}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400 py-2">
                            No staff roles available. Create staff roles first in the Staff tab.
                          </div>
                        )}
                        {serviceForm.requiredStaffRoleIds && serviceForm.requiredStaffRoleIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onUpdateForm({ requiredStaffRoleIds: [] })}
                            className="text-xs text-slate-400 hover:text-slate-300 underline"
                          >
                            Clear selection
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Requirements</label>
                      <RequirementsSelector
                        flags={flags}
                        upgrades={upgrades || []}
                        staffRoles={staffRoles || []}
                        flagsLoading={flagsLoading}
                        requirements={serviceForm.requirements || []}
                        onRequirementsChange={(requirements) => onUpdateForm({ requirements })}
                      />
                    </div>

                    <div className="md:col-span-2 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={onSaveService}
                        disabled={serviceSaving || serviceDeleting}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                          serviceSaving
                            ? 'bg-emerald-900 text-emerald-200 cursor-wait'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {serviceSaving ? 'Saving…' : 'Save Service'}
                      </button>

                      <button
                        type="button"
                        onClick={onReset}
                        disabled={serviceSaving || serviceDeleting}
                        className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                      >
                        {isCreatingService ? 'Cancel' : 'Reset'}
                      </button>

                      {!isCreatingService && selectedServiceId && (
                        <button
                          type="button"
                          onClick={onDeleteService}
                          disabled={serviceDeleting || serviceSaving}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            serviceDeleting
                              ? 'bg-rose-900 text-rose-200 cursor-wait'
                              : 'bg-rose-600 hover:bg-rose-500 text-white'
                          }`}
                        >
                          {serviceDeleting ? 'Deleting…' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}


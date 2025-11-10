'use client';

import { useState, useEffect } from 'react';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { FlagsTab } from './components/FlagsTab';
import { ConditionsTab } from './components/ConditionsTab';
import { MarketingTab } from './components/MarketingTab';
import { UpgradesTab } from './components/UpgradesTab';
import { StaffTab } from './components/StaffTab';
import { ServicesTab } from './components/ServicesTab';
import { IndustriesTab } from './components/IndustriesTab';
import { GlobalConfigTab } from './components/GlobalConfigTab';
import { IndustrySimulationConfigTab } from './components/IndustrySimulationConfigTab';
import { IndustrySelector } from './components/IndustrySelector';
import { EmptyIndustryState } from './components/EmptyIndustryState';
import { EventsTab } from './components/EventsTab';
import { useIndustries } from './hooks/useIndustries';
import { useFlags } from './hooks/useFlags';
import { useConditions } from './hooks/useConditions';
import { useEvents } from './hooks/useEvents';
import { useMarketing } from './hooks/useMarketing';
import { useUpgrades } from './hooks/useUpgrades';
import { useServices } from './hooks/useServices';
import { useStaff } from './hooks/useStaff';
import { useGlobalConfig } from './hooks/useGlobalConfig';
import { useIndustrySimulationConfig } from './hooks/useIndustrySimulationConfig';

export default function AdminPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<string>('industries');

  // Hooks
  const industries = useIndustries();
  const globalConfig = useGlobalConfig();
  const industrySimConfig = useIndustrySimulationConfig(industries.form.id);
  const flags = useFlags(industries.form.id);
  const conditions = useConditions(industries.form.id);
  const events = useEvents(industries.form.id);
  const marketing = useMarketing(industries.form.id);
  const upgrades = useUpgrades(industries.form.id);
  const services = useServices(industries.form.id);
  const staff = useStaff(industries.form.id);

  // Load industry-specific data when industry changes
  // Note: We only depend on industries.form.id. The load functions from hooks are stable
  // and the hooks themselves handle reloading when their industryId prop changes.
  useEffect(() => {
    if (industries.form.id) {
      // Explicitly reload all industry-specific data when industry changes
      // This ensures data is fresh even if hooks don't auto-reload
      flags.load();
      conditions.load();
      events.load();
      marketing.load();
      upgrades.load();
      services.load();
      staff.load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industries.form.id]);

  // Constants
  const METRIC_OPTIONS: { value: GameMetric; label: string }[] = [
    { value: GameMetric.ServiceRooms, label: 'Service Rooms' },
    { value: GameMetric.MonthlyExpenses, label: 'Monthly Expenses' },
    { value: GameMetric.ServiceSpeedMultiplier, label: 'Service Speed Multiplier' },
    { value: GameMetric.SpawnIntervalSeconds, label: 'Spawn Interval (seconds)' },
    { value: GameMetric.ServiceRevenueFlatBonus, label: 'Service Revenue (flat bonus)' },
    { value: GameMetric.ServiceRevenueMultiplier, label: 'Service Revenue Multiplier' },
    { value: GameMetric.HappyProbability, label: 'Happy Probability' },
    { value: GameMetric.ReputationMultiplier, label: 'Reputation Multiplier' },
    { value: GameMetric.FounderWorkingHours, label: 'Founder Working Hours' },
    { value: GameMetric.HighTierServiceRevenueMultiplier, label: 'High-Tier Service Revenue Multiplier' },
    { value: GameMetric.HighTierServiceWeightageMultiplier, label: 'High-Tier Service Weightage Multiplier' },
    { value: GameMetric.MidTierServiceRevenueMultiplier, label: 'Mid-Tier Service Revenue Multiplier' },
    { value: GameMetric.MidTierServiceWeightageMultiplier, label: 'Mid-Tier Service Weightage Multiplier' },
    { value: GameMetric.LowTierServiceRevenueMultiplier, label: 'Low-Tier Service Revenue Multiplier' },
    { value: GameMetric.LowTierServiceWeightageMultiplier, label: 'Low-Tier Service Weightage Multiplier' },
  ];

  const EFFECT_TYPE_OPTIONS: { value: EffectType; label: string; hint: string }[] = [
    { value: EffectType.Add, label: 'Add (flat)', hint: 'Add or subtract a flat amount, e.g. +1 room or +100 revenue' },
    { value: EffectType.Percent, label: 'Percent (%)', hint: 'Increase/decrease by percentage, e.g. +15% speed' },
    { value: EffectType.Multiply, label: 'Multiply (×)', hint: 'Multiply the value, e.g. ×1.5 for 50% boost' },
    { value: EffectType.Set, label: 'Set (=)', hint: 'Force a value to a number, overwrites others' },
  ];

  // Tab configuration - Organized by workflow:
  // 1. Setup (Industries, Global Config, Industry Config)
  // 2. Content (Services, Staff)
  // 3. Mechanics (Upgrades, Marketing, Events)
  // 4. System (Flags, Conditions)
  const tabs = [
    { id: 'industries', label: 'Industries', icon: '🏢', requiresIndustry: false },
    { id: 'global', label: 'Global Config', icon: '⚡', requiresIndustry: false },
    { id: 'industry-config', label: 'Industry Config', icon: '🎯', requiresIndustry: true },
    { id: 'services', label: 'Services', icon: '🛎️', requiresIndustry: true },
    { id: 'staff', label: 'Staff', icon: '👥', requiresIndustry: true },
    { id: 'upgrades', label: 'Upgrades', icon: '⚙️', requiresIndustry: true },
    { id: 'marketing', label: 'Marketing', icon: '📢', requiresIndustry: true },
    { id: 'events', label: 'Events', icon: '📅', requiresIndustry: true },
    { id: 'flags', label: 'Flags', icon: '🏁', requiresIndustry: true },
    { id: 'conditions', label: 'Conditions', icon: '📊', requiresIndustry: true },
  ];

  // Check if current tab requires an industry
  const currentTab = tabs.find(t => t.id === activeTab);
  const requiresIndustry = currentTab?.requiresIndustry ?? false;
  const hasSelectedIndustry = Boolean(industries.form.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-sm text-slate-400 mt-1">Edit base game content directly</p>
          </div>
        </header>

        {/* Persistent Industry Selector - Show on all tabs except Global */}
        {activeTab !== 'global' && (
          <IndustrySelector
            industries={industries.industries}
            selectedIndustryId={industries.form.id}
            loading={industries.loading}
            error={industries.error}
            onSelectIndustry={industries.selectIndustry}
          />
        )}

        {/* Tab Navigation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <nav className="flex flex-wrap border-b border-slate-800">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const isDisabled = tab.requiresIndustry && !hasSelectedIndustry && !isActive;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (!isDisabled) {
                      setActiveTab(tab.id);
                    }
                  }}
                  disabled={isDisabled}
                  title={isDisabled ? 'Select an industry first' : undefined}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                    isActive
                      ? 'border-blue-500 text-blue-400'
                      : isDisabled
                      ? 'border-transparent text-slate-600 cursor-not-allowed'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                  {tab.requiresIndustry && !hasSelectedIndustry && !isActive && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Industry Simulation Config Section */}
        {activeTab === 'industry-config' && (
          <>
            {!industries.form.id ? (
              <EmptyIndustryState
                icon="🎯"
                title="No Industry Selected"
                message="Please select an industry above to configure its simulation settings."
              />
            ) : (
              <IndustrySimulationConfigTab
                industryName={industries.form.name || 'Unknown'}
                loading={industrySimConfig.operation === 'loading'}
                status={industrySimConfig.status}
                saving={industrySimConfig.operation === 'saving'}
                businessMetrics={industrySimConfig.businessMetrics}
                businessStats={industrySimConfig.businessStats}
                mapWidth={industrySimConfig.mapWidth}
                mapHeight={industrySimConfig.mapHeight}
                mapWalls={industrySimConfig.mapWalls}
                entryPosition={industrySimConfig.entryPosition}
                waitingPositions={industrySimConfig.waitingPositions}
                serviceRoomPositions={industrySimConfig.serviceRoomPositions}
                staffPositions={industrySimConfig.staffPositions}
                capacityImage={industrySimConfig.capacityImage}
                winCondition={industrySimConfig.winCondition}
                loseCondition={industrySimConfig.loseCondition}
                setBusinessMetrics={industrySimConfig.setBusinessMetrics}
                setBusinessStats={industrySimConfig.setBusinessStats}
                setMapWidth={industrySimConfig.setMapWidth}
                setMapHeight={industrySimConfig.setMapHeight}
                setMapWalls={industrySimConfig.setMapWalls}
                setEntryPosition={industrySimConfig.setEntryPosition}
                setWaitingPositions={industrySimConfig.setWaitingPositions}
                setServiceRoomPositions={industrySimConfig.setServiceRoomPositions}
                setStaffPositions={industrySimConfig.setStaffPositions}
                setCapacityImage={industrySimConfig.setCapacityImage}
                setWinCondition={industrySimConfig.setWinCondition}
                setLoseCondition={industrySimConfig.setLoseCondition}
                onSave={industrySimConfig.save}
              />
            )}
          </>
        )}

        {/* Global Config Section */}
        {activeTab === 'global' && (
          <GlobalConfigTab
            globalLoading={globalConfig.loading}
            globalStatus={globalConfig.status}
            globalSaving={globalConfig.saving}
            metrics={globalConfig.metrics}
            stats={globalConfig.stats}
            eventSecondsInput={globalConfig.eventSecondsInput}
            movementJSON={globalConfig.movementJSON}
            winCondition={globalConfig.winCondition}
            loseCondition={globalConfig.loseCondition}
            onUpdateMetrics={globalConfig.updateMetrics}
            onUpdateStats={globalConfig.updateStats}
            onUpdateEventSeconds={globalConfig.setEventSecondsInput}
            onUpdateMovementJSON={globalConfig.setMovementJSON}
            onUpdateWinCondition={globalConfig.updateWinCondition}
            onUpdateLoseCondition={globalConfig.updateLoseCondition}
            onSave={globalConfig.save}
          />
        )}

        {/* Industries Section */}
        {activeTab === 'industries' && (
          <IndustriesTab
            industries={industries.industries}
            isLoading={industries.loading}
            error={industries.error}
            form={industries.form}
            isSaving={industries.saving}
            isDeleting={industries.deleting}
            statusMessage={industries.status}
            isCreating={industries.isCreating}
            onSelectIndustry={(industryId) => {
              const industry = industries.industries.find(i => i.id === industryId);
              if (industry) industries.selectIndustry(industry);
            }}
            onCreateNew={industries.createNew}
            onSave={industries.save}
            onDelete={industries.deleteIndustry}
            onReset={industries.reset}
            onUpdateForm={industries.updateForm}
          />
        )}

        {/* Flags Section */}
        {activeTab === 'flags' && (
          <>
            {!industries.form.id ? (
              <EmptyIndustryState
                icon="🏁"
                title="No Industry Selected"
                message="Please select an industry above to manage flags."
              />
            ) : (
              <FlagsTab
                industryId={industries.form.id}
                flags={flags.flags}
                flagsLoading={flags.loading}
                flagStatus={flags.status}
                selectedFlagId={flags.selectedId}
                isCreatingFlag={flags.isCreating}
                flagForm={flags.form}
                flagSaving={flags.saving}
                flagDeleting={flags.deleting}
                onSelectFlag={flags.selectFlag}
                onCreateFlag={flags.createFlag}
                onSaveFlag={flags.saveFlag}
                onDeleteFlag={flags.deleteFlag}
                onReset={flags.reset}
                onUpdateForm={flags.updateForm}
              />
            )}
          </>
        )}

        {/* Conditions Section */}
        {activeTab === 'conditions' && (
          <>
            {!industries.form.id ? (
              <EmptyIndustryState
                icon="📊"
                title="No Industry Selected"
                message="Please select an industry above to manage conditions."
              />
            ) : (
              <ConditionsTab
                industryId={industries.form.id}
            conditions={conditions.conditions}
            conditionsLoading={conditions.loading}
            conditionsStatus={conditions.status}
            selectedConditionId={conditions.selectedId}
            isCreatingCondition={conditions.isCreating}
            conditionForm={conditions.form}
            conditionSaving={conditions.saving}
            conditionDeleting={conditions.deleting}
            onSelectCondition={conditions.selectCondition}
            onCreateCondition={conditions.createCondition}
            onSaveCondition={conditions.saveCondition}
            onDeleteCondition={conditions.deleteCondition}
            onReset={conditions.reset}
            onUpdateForm={conditions.updateForm}
          />
            )}
          </>
        )}

        {/* Events Section */}
        {activeTab === 'events' && (
          <>
            {!industries.form.id ? (
              <EmptyIndustryState
                icon="📅"
                title="No Industry Selected"
                message="Please select an industry above to manage events."
              />
            ) : (
              <EventsTab
                industryId={industries.form.id}
                events={events.events}
                eventsLoading={events.loading}
                eventStatus={events.status}
                selectedEventId={events.selectedId}
                isCreatingEvent={events.isCreating}
                eventForm={events.form}
                eventChoices={events.choices}
                eventSaving={events.saving}
                eventDeleting={events.deleting}
                flags={flags.flags}
                flagsLoading={flags.loading}
                metricOptions={METRIC_OPTIONS}
                effectTypeOptions={EFFECT_TYPE_OPTIONS}
                onSelectEvent={events.selectEvent}
                onCreateEvent={events.createEvent}
                onSaveEvent={events.saveEvent}
                onDeleteEvent={events.deleteEvent}
                onReset={events.reset}
                onUpdateEventForm={events.updateForm}
                onUpdateEventChoices={events.updateChoices}
                onPersistEventWithChoices={events.persistEventWithChoices}
                onUpdateStatus={events.updateStatus}
                onJsonImport={events.jsonImport}
                onJsonExport={events.jsonExport}
              />
            )}
          </>
        )}

        {/* Marketing Section */}
        {activeTab === 'marketing' && (
          <>
            {!industries.form.id ? (
              <EmptyIndustryState
                icon="📢"
                title="No Industry Selected"
                message="Please select an industry above to manage marketing campaigns."
              />
            ) : (
              <MarketingTab
                campaigns={marketing.campaigns}
                campaignsLoading={marketing.loading}
                campaignStatus={marketing.status}
                selectedCampaignId={marketing.selectedId}
                isCreatingCampaign={marketing.isCreating}
                campaignForm={marketing.form}
                campaignEffectsForm={marketing.effectsForm}
                campaignSaving={marketing.saving}
                campaignDeleting={marketing.deleting}
                flags={flags.flags}
                flagsLoading={flags.loading}
                conditions={conditions.conditions}
                conditionsLoading={conditions.loading}
                metricOptions={METRIC_OPTIONS}
                effectTypeOptions={EFFECT_TYPE_OPTIONS}
                onSelectCampaign={marketing.selectCampaign}
                onCreateCampaign={marketing.createCampaign}
                onSaveCampaign={marketing.saveCampaign}
                onDeleteCampaign={marketing.deleteCampaign}
                onReset={marketing.reset}
                onUpdateForm={marketing.updateForm}
                onUpdateEffects={marketing.updateEffects}
              />
            )}
          </>
        )}

        {/* Upgrades Section */}
        {activeTab === 'upgrades' && (
          <>
            {!industries.form.id ? (
              <EmptyIndustryState
                icon="⚙️"
                title="No Industry Selected"
                message="Please select an industry above to manage upgrades."
              />
            ) : (
              <UpgradesTab
                industryId={industries.form.id}
                upgrades={upgrades.upgrades}
                upgradesLoading={upgrades.loading}
                upgradeStatus={upgrades.status}
                selectedUpgradeId={upgrades.selectedId}
                isCreatingUpgrade={upgrades.isCreating}
                upgradeForm={upgrades.form}
                effectsForm={upgrades.effectsForm}
                upgradeSaving={upgrades.saving}
                upgradeDeleting={upgrades.deleting}
                flags={flags.flags}
                flagsLoading={flags.loading}
                conditions={conditions.conditions}
                conditionsLoading={conditions.loading}
                metricOptions={METRIC_OPTIONS}
                effectTypeOptions={EFFECT_TYPE_OPTIONS}
                onSelectUpgrade={upgrades.selectUpgrade}
                onCreateUpgrade={upgrades.createUpgrade}
                onSaveUpgrade={upgrades.saveUpgrade}
                onDeleteUpgrade={upgrades.deleteUpgrade}
                onReset={upgrades.reset}
                onUpdateForm={upgrades.updateForm}
                onUpdateEffects={upgrades.updateEffects}
              />
            )}
          </>
        )}

        {/* Services Section */}
        {activeTab === 'services' && (
          <>
            {!industries.form.id ? (
              <EmptyIndustryState
                icon="🛎️"
                title="No Industry Selected"
                message="Please select an industry above to manage services."
              />
            ) : (
              <ServicesTab
                industryId={industries.form.id}
                services={services.services}
                serviceLoading={services.loading}
                serviceStatus={services.status}
                selectedServiceId={services.selectedId}
                isCreatingService={services.isCreating}
                serviceForm={services.form}
                serviceSaving={services.saving}
                serviceDeleting={services.deleting}
                flags={flags.flags}
                flagsLoading={flags.loading}
                conditions={conditions.conditions}
                conditionsLoading={conditions.loading}
                onSelectService={services.selectService}
                onCreateService={services.createService}
                onSaveService={services.saveService}
                onDeleteService={services.deleteService}
                onReset={services.reset}
                onUpdateForm={services.updateForm}
              />
            )}
          </>
        )}

        {/* Staff Section */}
        {activeTab === 'staff' && (
          <>
            {!industries.form.id ? (
              <EmptyIndustryState
                icon="👥"
                title="No Industry Selected"
                message="Please select an industry above to manage staff."
              />
            ) : (
              <StaffTab
                industryId={industries.form.id}
                staffRoles={staff.roles}
                staffPresets={staff.presets}
                staffLoading={staff.loading}
                staffStatus={staff.status}
                selectedRoleId={staff.selectedRoleId}
                isCreatingRole={staff.isCreatingRole}
                roleForm={staff.roleForm}
                roleSaving={staff.roleSaving}
                roleDeleting={staff.roleDeleting}
                selectedPresetId={staff.selectedPresetId}
                isCreatingPreset={staff.isCreatingPreset}
                presetForm={staff.presetForm}
                presetSaving={staff.presetSaving}
                presetDeleting={staff.presetDeleting}
                flags={flags.flags}
                flagsLoading={flags.loading}
                conditions={conditions.conditions}
                conditionsLoading={conditions.loading}
                onSelectRole={staff.selectRole}
                onCreateRole={staff.createRole}
                onSaveRole={staff.saveRole}
                onDeleteRole={staff.deleteRole}
                onResetRole={staff.resetRole}
                onUpdateRoleForm={staff.updateRoleForm}
                onSelectPreset={staff.selectPreset}
                onCreatePreset={staff.createPreset}
                onSavePreset={staff.savePreset}
                onDeletePreset={staff.deletePreset}
                onResetPreset={staff.resetPreset}
                onUpdatePresetForm={staff.updatePresetForm}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

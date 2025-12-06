'use client';

import { useEffect, useState } from 'react';
import { IndustrySimulationConfigTab } from '../../components/IndustrySimulationConfigTab';
import { useSimulationConfig } from '../../hooks/useSimulationConfig';
import type { Industry } from '@/lib/features/industries';

interface IndustryConfigPageClientProps {
  industry: string;
  industries: Industry[];
}

export default function IndustryConfigPageClient({ industry, industries }: IndustryConfigPageClientProps) {
  const industrySimConfig = useSimulationConfig({ configType: 'industry', industryId: industry });
  const globalConfig = useSimulationConfig({ configType: 'global' });
  const [industryName, setIndustryName] = useState<string>('Unknown');

  // Adapter functions for IndustrySimulationConfigTab compatibility
  const setBusinessMetrics = (value: any) => industrySimConfig.updateMetrics(value || {});
  const setBusinessStats = (value: any) => industrySimConfig.updateStats(value || {});
  const setMapWidth = (value: number | null) => industrySimConfig.updateMapConfig(value || 10, industrySimConfig.mapHeight || 10, industrySimConfig.mapWalls);
  const setMapHeight = (value: number | null) => industrySimConfig.updateMapConfig(industrySimConfig.mapWidth || 10, value || 10, industrySimConfig.mapWalls);
  const setMapWalls = (value: any[]) => industrySimConfig.updateMapConfig(industrySimConfig.mapWidth || 10, industrySimConfig.mapHeight || 10, value);
  const setEntryPosition = (value: any) => industrySimConfig.updateLayoutConfig({ entryPosition: value });
  const setWaitingPositions = (value: any[]) => industrySimConfig.updateLayoutConfig({ waitingPositions: value });
  const setServiceRooms = (value: any[]) => industrySimConfig.updateLayoutConfig({ serviceRooms: value });
  const setStaffPositions = (value: any[]) => industrySimConfig.updateLayoutConfig({ staffPositions: value });
  const setMainCharacterPosition = (value: any) => industrySimConfig.updateLayoutConfig({ mainCharacterPosition: value });
  const setMainCharacterSpriteImage = (value: string) => industrySimConfig.updateLayoutConfig({ mainCharacterSpriteImage: value });
  const setCapacityImage = (value: string) => industrySimConfig.updateMediaConfig({ capacityImage: value });
  const setLeadDialogues = (value: string[] | null) => industrySimConfig.updateMediaConfig({ leadDialogues: value || [] });
  const setWinCondition = (value: any) => industrySimConfig.updateWinCondition(value);
  const setLoseCondition = (value: any) => industrySimConfig.updateLoseCondition(value);
  const setEventSelectionMode = (value: 'random' | 'sequence') => industrySimConfig.updateEventConfig(value, industrySimConfig.eventSequence);
  const setEventSequence = (value: string[]) => industrySimConfig.updateEventConfig(industrySimConfig.eventSelectionMode, value);

  // Set industry name from props
  useEffect(() => {
    const found = industries.find(i => i.id === industry);
    if (found) {
      setIndustryName(found.name);
    }
  }, [industry, industries]);

  return (
    <div className="max-w-5xl">
      <IndustrySimulationConfigTab
        industryName={industryName}
        loading={industrySimConfig.loading}
        status={industrySimConfig.status ? { type: industrySimConfig.status.includes('success') ? 'success' : 'error', message: industrySimConfig.status } : null}
        saving={industrySimConfig.saving}
        businessMetrics={industrySimConfig.businessMetrics}
        businessStats={industrySimConfig.businessStats}
        globalMetrics={globalConfig.businessMetrics}
        globalStats={globalConfig.businessStats}
        mapWidth={industrySimConfig.mapWidth}
        mapHeight={industrySimConfig.mapHeight}
        mapWalls={industrySimConfig.mapWalls}
        entryPosition={industrySimConfig.entryPosition}
        waitingPositions={industrySimConfig.waitingPositions}
        serviceRooms={industrySimConfig.serviceRooms}
        staffPositions={industrySimConfig.staffPositions}
        mainCharacterPosition={industrySimConfig.mainCharacterPosition}
        mainCharacterSpriteImage={industrySimConfig.mainCharacterSpriteImage}
        capacityImage={industrySimConfig.capacityImage}
        leadDialogues={industrySimConfig.leadDialogues}
        winCondition={industrySimConfig.winCondition}
        loseCondition={industrySimConfig.loseCondition}
        eventSelectionMode={industrySimConfig.eventSelectionMode}
        eventSequence={industrySimConfig.eventSequence}
        events={[]}  // TODO: Need to load events separately
        setBusinessMetrics={setBusinessMetrics}
        setBusinessStats={setBusinessStats}
        setMapWidth={setMapWidth}
        setMapHeight={setMapHeight}
        setMapWalls={setMapWalls}
        setEntryPosition={setEntryPosition}
        setWaitingPositions={setWaitingPositions}
        setServiceRooms={setServiceRooms}
        setStaffPositions={setStaffPositions}
        setMainCharacterPosition={setMainCharacterPosition}
        setMainCharacterSpriteImage={setMainCharacterSpriteImage}
        setCapacityImage={setCapacityImage}
        setLeadDialogues={setLeadDialogues}
        setWinCondition={setWinCondition}
        setLoseCondition={setLoseCondition}
        setEventSelectionMode={setEventSelectionMode}
        setEventSequence={setEventSequence}
        onSave={industrySimConfig.save}
      />
    </div>
  );
}



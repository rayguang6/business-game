'use client';

import { useEffect, useState } from 'react';
import { IndustrySimulationConfigTab } from '../../components/IndustrySimulationConfigTab';
import { useIndustrySimulationConfig } from '../../hooks/useIndustrySimulationConfig';
import { useGlobalConfig } from '../../hooks/useGlobalConfig';
import type { Industry } from '@/lib/features/industries';

interface IndustryConfigPageClientProps {
  industry: string;
  industries: Industry[];
}

export default function IndustryConfigPageClient({ industry, industries }: IndustryConfigPageClientProps) {
  const industrySimConfig = useIndustrySimulationConfig(industry);
  const globalConfig = useGlobalConfig();
  const [industryName, setIndustryName] = useState<string>('Unknown');

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
        loading={industrySimConfig.operation === 'loading'}
        status={industrySimConfig.status}
        saving={industrySimConfig.operation === 'saving'}
        businessMetrics={industrySimConfig.businessMetrics}
        businessStats={industrySimConfig.businessStats}
        globalMetrics={globalConfig.metrics}
        globalStats={globalConfig.stats}
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
        events={industrySimConfig.events}
        setBusinessMetrics={industrySimConfig.setBusinessMetrics}
        setBusinessStats={industrySimConfig.setBusinessStats}
        setMapWidth={industrySimConfig.setMapWidth}
        setMapHeight={industrySimConfig.setMapHeight}
        setMapWalls={industrySimConfig.setMapWalls}
        setEntryPosition={industrySimConfig.setEntryPosition}
        setWaitingPositions={industrySimConfig.setWaitingPositions}
        setServiceRooms={industrySimConfig.setServiceRooms}
        setStaffPositions={industrySimConfig.setStaffPositions}
        setMainCharacterPosition={industrySimConfig.setMainCharacterPosition}
        setMainCharacterSpriteImage={industrySimConfig.setMainCharacterSpriteImage}
        setCapacityImage={industrySimConfig.setCapacityImage}
        setLeadDialogues={industrySimConfig.setLeadDialogues}
        setWinCondition={industrySimConfig.setWinCondition}
        setLoseCondition={industrySimConfig.setLoseCondition}
        setEventSelectionMode={industrySimConfig.setEventSelectionMode}
        setEventSequence={industrySimConfig.setEventSequence}
        onSave={industrySimConfig.save}
      />
    </div>
  );
}



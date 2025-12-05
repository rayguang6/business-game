'use client';

import { use } from 'react';
import { IndustrySimulationConfigTab } from '../../components/IndustrySimulationConfigTab';
import { useIndustrySimulationConfig } from '../../hooks/useIndustrySimulationConfig';
import { useGlobalConfig } from '../../hooks/useGlobalConfig';
import { fetchIndustriesFromSupabase } from '@/lib/data/industryRepository';
import { useEffect, useState } from 'react';
import type { Industry } from '@/lib/features/industries';

export default function IndustryConfigPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = use(params);
  const industrySimConfig = useIndustrySimulationConfig(industry);
  const globalConfig = useGlobalConfig();
  const [industryName, setIndustryName] = useState<string>('Unknown');

  // Fetch industry name for display
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const industries = await fetchIndustriesFromSupabase();
      if (isMounted && industries) {
        const found = industries.find(i => i.id === industry);
        if (found) {
          setIndustryName(found.name);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [industry]);

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

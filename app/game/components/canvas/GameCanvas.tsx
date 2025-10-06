'use client';

import React from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { CustomerStatus } from '@/lib/features/customers';
import { WaitingArea } from './WaitingArea';
import { TreatmentRoom } from './TreatmentRoom';
import { getUpgradeEffects } from '@/lib/features/upgrades';
import { getUpgradesForIndustry } from '@/lib/game/config';


export function GameCanvas() {
  const { selectedIndustry, customers, upgrades } = useGameStore();

  if (!selectedIndustry) return null;

  const upgradeEffects = getUpgradeEffects(upgrades);
  const treatmentRoomsLabel = 'Treatment Rooms';
  const treatmentRooms = upgradeEffects.treatmentRooms;
  const mapBackground = selectedIndustry.mapImage ?? '/images/maps/dental-map.png';

  return (
    <div className="h-full w-full bg-[#8ed0fb] relative overflow-hidden flex items-center justify-center">
      {/* Inner Canvas Container - Maintains 1:1 aspect ratio */}
      <div 
        className="relative"
        style={{
          // Maintain 1:1 aspect ratio (square)
          aspectRatio: '1/1',
          width: 'min(100%, 100vh)', // Don't exceed container width or height
          height: 'min(100%, 100vw)', // Don't exceed container height or width
          backgroundImage: `url(${mapBackground})`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      >
        {/* HUD Overlay - Positioned relative to the inner canvas */}
        <div className="absolute inset-0 flex items-center justify-between px-4 pt-20 pointer-events-none">
          {/* Left HUD Panel - Waiting Area */}
          <div className="w-64 pointer-events-auto">
            <WaitingArea customers={customers} />
          </div>

          {/* Right HUD Panel - Treatment Rooms */}
          <div className="w-64 pointer-events-auto">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-700">{treatmentRoomsLabel}</h4>
              <div className="text-xs text-gray-500">
                {customers.filter((c) => c.status === CustomerStatus.InService).length}/{treatmentRooms} in service
              </div>
            </div>
            <div className="space-y-2">
              {Array.from({ length: treatmentRooms }, (_, index) => (
                <TreatmentRoom key={index + 1} roomId={index + 1} customers={customers} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



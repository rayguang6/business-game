'use client';

import React from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { Customer, CustomerStatus } from '@/lib/features/customers';
import { WaitingArea } from './WaitingArea';
import { TreatmentRoom } from './TreatmentRoom';

export function GameCanvas() {
  const { selectedIndustry, customers } = useGameStore();

  if (!selectedIndustry) return null;

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
          backgroundImage: "url('/images/maps/dental-map.png')",
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
              <h4 className="text-xs font-semibold text-gray-700">Treatment Rooms</h4>
              <div className="text-xs text-gray-500">
                {customers.filter((c) => c.status === CustomerStatus.InService).length}/2 in service
              </div>
            </div>
            <div className="space-y-2">
              <TreatmentRoom roomId={1} customers={customers} />
              <TreatmentRoom roomId={2} customers={customers} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



'use client';

import React from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { Customer, CustomerStatus } from '@/lib/game/customers/types';
import { WaitingArea } from './WaitingArea';
import { TreatmentRoom } from './TreatmentRoom';

export function GameCanvas() {
  const { selectedIndustry, customers } = useGameStore();

  if (!selectedIndustry) return null;

  return (
    <div 
      className="h-full w-full md:aspect-square md:max-w-full bg-[#8ed0fb] border-gray-200 p-3 md:mx-auto relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/maps/dental-map.png')",
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="h-full">
        <div className="flex h-full gap-3 pt-20">
          {/* Waiting Area */}
          <div className="flex-1">
            <WaitingArea customers={customers} />
          </div>

          {/* Divider */}
          <div className="w-px bg-gray-200 self-stretch" />

          {/* Treatment Rooms */}
          <div className="flex-1">
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



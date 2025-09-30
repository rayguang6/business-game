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
    <div className="flex justify-center p-4">
        <div className="w-72 h-72 bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-3">
        <div className="h-full">
          <div className="flex h-full gap-3">
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
    </div>
  );
}



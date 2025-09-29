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
    <div className="bg-white rounded-2xl p-8 shadow-xl">
      <div className="text-center">
        <div className="text-6xl mb-4">{selectedIndustry.icon}</div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Welcome to your {selectedIndustry.name.toLowerCase()}!
        </h2>
        <p className="text-gray-600 mb-6">{selectedIndustry.description}</p>

        <div className="relative bg-gray-100 rounded-lg min-h-96 border-2 border-dashed border-gray-300 mb-6 p-4">
          <div className="flex items-start gap-4 h-full">
            {/* Waiting Area */}
            <WaitingArea customers={customers} />

            {/* Divider */}
            <div className="w-px bg-gray-200 self-stretch" />

            {/* Treatment Rooms */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">Treatment Rooms</h4>
                <div className="text-xs text-gray-500">
                  {customers.filter((c) => c.status === CustomerStatus.InService).length}/2 in service
                </div>
              </div>
              <div className="space-y-3">
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



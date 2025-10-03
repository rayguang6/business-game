'use client';

import React from 'react';
import GameButton from '@/app/components/ui/GameButton';
import { useGameStore } from '@/lib/store/gameStore';
import { getUpgradesForIndustry } from '@/lib/config/gameConfig';

export function UpgradesTab() {
  const { upgrades, metrics, upgradeTreatmentRooms, getUpgradeCost, canAffordUpgrade } = useGameStore();
  
  // Get dental upgrade config
  const dentalConfig = getUpgradesForIndustry('dental');
  const treatmentRoomsConfig = (dentalConfig as any).treatmentRooms;
  
  // Calculate current upgrade cost
  const upgradeCost = getUpgradeCost('treatmentRooms');
  const canUpgrade = canAffordUpgrade(upgradeCost) && upgrades.treatmentRooms < treatmentRoomsConfig.max;
  const isMaxed = upgrades.treatmentRooms >= treatmentRoomsConfig.max;
  
  const handleUpgrade = () => {
    const result = upgradeTreatmentRooms();
    if (result.success) {
      console.log('✅', result.message);
    } else {
      console.log('❌', result.message);
    }
  };
  
  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-white">Equipment Upgrades</h3>
      <p className="text-gray-300 mb-6">Upgrade your equipment to improve efficiency.</p>
      
      <div className="space-y-4">
        {/* Treatment Rooms */}
        <div className={`bg-gray-800 rounded-xl p-3 border ${isMaxed ? 'border-gray-600 opacity-60' : 'border-gray-700'}`}>
          <div className="flex items-center justify-between gap-2">
            {/* Left: Info and Status */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center border-2 border-blue-500 flex-shrink-0">
                <span className="text-xl">{treatmentRoomsConfig.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-sm mb-1 truncate">{treatmentRoomsConfig.name}</h4>
                <p className="text-blue-300 text-xs mb-1">
                  {isMaxed 
                    ? `Max Level (${upgrades.treatmentRooms} rooms)`
                    : `Level ${upgrades.treatmentRooms} → ${upgrades.treatmentRooms + 1}`
                  }
                </p>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Current:</span>
                    <span className="text-white font-semibold">{upgrades.treatmentRooms} rooms</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Benefit:</span>
                    <span className="text-green-400 font-semibold">+1 Customer Capacity</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Weekly Cost:</span>
                    <span className="text-red-400 font-semibold">+${treatmentRoomsConfig.weeklyExpenses}/room</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Price and Button */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="text-right">
                <div className={`text-lg font-bold ${isMaxed ? 'text-gray-500' : 'text-yellow-400'}`}>
                  {isMaxed ? 'MAXED' : `$${upgradeCost.toLocaleString()}`}
                </div>
                <div className="text-gray-400 text-xs">One-time</div>
              </div>
              <div className="scale-75">
                <GameButton 
                  color={isMaxed ? "gold" : "blue"} 
                  onClick={isMaxed ? () => console.log('Already maxed') : canUpgrade ? handleUpgrade : () => console.log('Not enough cash')}
                >
                  {isMaxed ? 'Maxed' : canUpgrade ? 'Upgrade' : 'Need Cash'}
                </GameButton>
              </div>
            </div>
          </div>
        </div>
        
        {/* Future Upgrades Placeholder */}
        <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 opacity-50">
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <div className="text-2xl mb-2">🚀</div>
              <p className="text-gray-400 text-sm">More upgrades coming soon!</p>
              <p className="text-gray-500 text-xs">Equipment, Staff, Marketing...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

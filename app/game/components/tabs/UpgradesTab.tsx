'use client';

import React from 'react';
import GameButton from '@/app/components/ui/GameButton';
import { useGameStore } from '@/lib/store/gameStore';
import { getUpgradesForIndustry } from '@/lib/config/gameConfig';

export function UpgradesTab() {
  const { 
    upgrades, 
    metrics, 
    upgradeTreatmentRooms, 
    upgradeEquipment, 
    upgradeStaff, 
    upgradeMarketing,
    getUpgradeCost, 
    canAffordUpgrade 
  } = useGameStore();
  
  // Get dental upgrade config
  const dentalConfig = getUpgradesForIndustry('dental');
  const treatmentRoomsConfig = (dentalConfig as any).treatmentRooms;
  const equipmentConfig = (dentalConfig as any).equipment;
  const staffConfig = (dentalConfig as any).staff;
  const marketingConfig = (dentalConfig as any).marketing;
  
  // Calculate current upgrade costs and states
  const treatmentRoomsCost = getUpgradeCost('treatmentRooms');
  const equipmentCost = getUpgradeCost('equipment');
  const staffCost = getUpgradeCost('staff');
  const marketingCost = getUpgradeCost('marketing');
  
  const canUpgradeTreatmentRooms = canAffordUpgrade(treatmentRoomsCost) && upgrades.treatmentRooms < treatmentRoomsConfig.max;
  const canUpgradeEquipment = canAffordUpgrade(equipmentCost) && upgrades.equipment < equipmentConfig.max;
  const canUpgradeStaff = canAffordUpgrade(staffCost) && upgrades.staff < staffConfig.max;
  const canUpgradeMarketing = canAffordUpgrade(marketingCost) && upgrades.marketing < marketingConfig.max;
  
  const isTreatmentRoomsMaxed = upgrades.treatmentRooms >= treatmentRoomsConfig.max;
  const isEquipmentMaxed = upgrades.equipment >= equipmentConfig.max;
  const isStaffMaxed = upgrades.staff >= staffConfig.max;
  const isMarketingMaxed = upgrades.marketing >= marketingConfig.max;
  
  const handleTreatmentRoomsUpgrade = () => {
    const result = upgradeTreatmentRooms();
    if (result.success) {
      console.log('✅', result.message);
    } else {
      console.log('❌', result.message);
    }
  };
  
  const handleEquipmentUpgrade = () => {
    const result = upgradeEquipment();
    if (result.success) {
      console.log('✅', result.message);
    } else {
      console.log('❌', result.message);
    }
  };
  
  const handleStaffUpgrade = () => {
    const result = upgradeStaff();
    if (result.success) {
      console.log('✅', result.message);
    } else {
      console.log('❌', result.message);
    }
  };
  
  const handleMarketingUpgrade = () => {
    const result = upgradeMarketing();
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
        <div className={`bg-gray-800 rounded-xl p-3 border ${isTreatmentRoomsMaxed ? 'border-gray-600 opacity-60' : 'border-gray-700'}`}>
          <div className="flex items-center justify-between gap-2">
            {/* Left: Info and Status */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center border-2 border-blue-500 flex-shrink-0">
                <span className="text-xl">{treatmentRoomsConfig.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-sm mb-1 truncate">{treatmentRoomsConfig.name}</h4>
                <p className="text-blue-300 text-xs mb-1">
                         {isTreatmentRoomsMaxed
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
                    <span className="text-gray-400">Capacity:</span>
                    <span className="text-green-400 font-semibold">2 → 3 → 4 → 5 Rooms</span>
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
                       <div className={`text-lg font-bold ${isTreatmentRoomsMaxed ? 'text-gray-500' : 'text-yellow-400'}`}>
                         {isTreatmentRoomsMaxed ? 'MAXED' : `$${treatmentRoomsCost.toLocaleString()}`}
                       </div>
                <div className="text-gray-400 text-xs">One-time</div>
              </div>
              <div className="scale-75">
                <GameButton 
                  color={isTreatmentRoomsMaxed ? "gold" : "blue"} 
                  onClick={isTreatmentRoomsMaxed ? () => console.log('Already maxed') : canUpgradeTreatmentRooms ? handleTreatmentRoomsUpgrade : () => console.log('Not enough cash')}
                >
                  {isTreatmentRoomsMaxed ? 'Maxed' : canUpgradeTreatmentRooms ? 'Upgrade' : 'Need Cash'}
                </GameButton>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modern Equipment */}
        <div className={`bg-gray-800 rounded-xl p-3 border ${isEquipmentMaxed ? 'border-gray-600 opacity-60' : 'border-gray-700'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center border-2 border-purple-500 flex-shrink-0">
                <span className="text-xl">{equipmentConfig.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-sm mb-1 truncate">{equipmentConfig.name}</h4>
                <p className="text-purple-300 text-xs mb-1">
                  {isEquipmentMaxed
                    ? `Max Level (${upgrades.equipment}/3)`
                    : `Level ${upgrades.equipment} → ${upgrades.equipment + 1}`
                  }
                </p>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Current:</span>
                    <span className="text-white font-semibold">Level {upgrades.equipment}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Speed:</span>
                    <span className="text-green-400 font-semibold">0.8x → 0.6x → 0.5x Service Time</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Weekly Cost:</span>
                    <span className="text-red-400 font-semibold">+${equipmentConfig.weeklyExpenses}/level</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="text-right">
                <div className={`text-lg font-bold ${isEquipmentMaxed ? 'text-gray-500' : 'text-yellow-400'}`}>
                  {isEquipmentMaxed ? 'MAXED' : `$${equipmentCost.toLocaleString()}`}
                </div>
                <div className="text-gray-400 text-xs">One-time</div>
              </div>
              <div className="scale-75">
                <GameButton 
                  color={isEquipmentMaxed ? "gold" : "blue"} 
                  onClick={isEquipmentMaxed ? () => console.log('Already maxed') : canUpgradeEquipment ? handleEquipmentUpgrade : () => console.log('Not enough cash')}
                >
                  {isEquipmentMaxed ? 'Maxed' : canUpgradeEquipment ? 'Upgrade' : 'Need Cash'}
                </GameButton>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Training */}
        <div className={`bg-gray-800 rounded-xl p-3 border ${isStaffMaxed ? 'border-gray-600 opacity-60' : 'border-gray-700'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center border-2 border-green-500 flex-shrink-0">
                <span className="text-xl">{staffConfig.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-sm mb-1 truncate">{staffConfig.name}</h4>
                <p className="text-green-300 text-xs mb-1">
                  {isStaffMaxed
                    ? `Max Level (${upgrades.staff}/3)`
                    : `Level ${upgrades.staff} → ${upgrades.staff + 1}`
                  }
                </p>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Current:</span>
                    <span className="text-white font-semibold">Level {upgrades.staff}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Reputation:</span>
                    <span className="text-green-400 font-semibold">2x → 3x → 4x Reputation Gain</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Weekly Cost:</span>
                    <span className="text-red-400 font-semibold">+${staffConfig.weeklyExpenses}/level</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="text-right">
                <div className={`text-lg font-bold ${isStaffMaxed ? 'text-gray-500' : 'text-yellow-400'}`}>
                  {isStaffMaxed ? 'MAXED' : `$${staffCost.toLocaleString()}`}
                </div>
                <div className="text-gray-400 text-xs">One-time</div>
              </div>
              <div className="scale-75">
                <GameButton 
                  color={isStaffMaxed ? "gold" : "blue"} 
                  onClick={isStaffMaxed ? () => console.log('Already maxed') : canUpgradeStaff ? handleStaffUpgrade : () => console.log('Not enough cash')}
                >
                  {isStaffMaxed ? 'Maxed' : canUpgradeStaff ? 'Upgrade' : 'Need Cash'}
                </GameButton>
              </div>
            </div>
          </div>
        </div>

        {/* Marketing Campaign */}
        <div className={`bg-gray-800 rounded-xl p-3 border ${isMarketingMaxed ? 'border-gray-600 opacity-60' : 'border-gray-700'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center border-2 border-orange-500 flex-shrink-0">
                <span className="text-xl">{marketingConfig.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-sm mb-1 truncate">{marketingConfig.name}</h4>
                <p className="text-orange-300 text-xs mb-1">
                  {isMarketingMaxed
                    ? `Max Level (${upgrades.marketing}/3)`
                    : `Level ${upgrades.marketing} → ${upgrades.marketing + 1}`
                  }
                </p>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Current:</span>
                    <span className="text-white font-semibold">Level {upgrades.marketing}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Spawn Rate:</span>
                    <span className="text-green-400 font-semibold">0.7x → 0.5x → 0.3x Spawn Interval</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Weekly Cost:</span>
                    <span className="text-red-400 font-semibold">+${marketingConfig.weeklyExpenses}/level</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="text-right">
                <div className={`text-lg font-bold ${isMarketingMaxed ? 'text-gray-500' : 'text-yellow-400'}`}>
                  {isMarketingMaxed ? 'MAXED' : `$${marketingCost.toLocaleString()}`}
                </div>
                <div className="text-gray-400 text-xs">One-time</div>
              </div>
              <div className="scale-75">
                <GameButton 
                  color={isMarketingMaxed ? "gold" : "blue"} 
                  onClick={isMarketingMaxed ? () => console.log('Already maxed') : canUpgradeMarketing ? handleMarketingUpgrade : () => console.log('Not enough cash')}
                >
                  {isMarketingMaxed ? 'Maxed' : canUpgradeMarketing ? 'Upgrade' : 'Need Cash'}
                </GameButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

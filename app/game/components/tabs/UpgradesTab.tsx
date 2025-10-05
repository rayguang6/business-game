'use client';

import React from 'react';
import GameButton from '@/app/components/ui/GameButton';
import { useGameStore } from '@/lib/store/gameStore';
import { getUpgradesForIndustry } from '@/lib/config/gameConfig';

export function UpgradesTab() {
  const { 
    upgrades,
    upgradeTreatmentRooms, 
    upgradeEquipment, 
    upgradeStaff, 
    upgradeMarketing,
    getUpgradeCost, 
    canAffordUpgrade,
    selectedIndustry
  } = useGameStore();
  
  if (!selectedIndustry) {
    return null;
  }

  const industryConfig = getUpgradesForIndustry(selectedIndustry.id);
  const treatmentRoomsConfig = industryConfig.treatmentRooms;
  const equipmentConfig = industryConfig.equipment;
  const staffConfig = industryConfig.staff;
  const marketingConfig = industryConfig.marketing;

  const formatLevelRange = (config?: { starting: number; max: number }) => {
    if (!config || config.starting === undefined || config.max === undefined) {
      return '';
    }
    const levels: number[] = [];
    for (let level = config.starting; level <= config.max; level += 1) {
      levels.push(level);
    }
    return levels.join(' → ');
  };

  const formatMultiplier = (values?: number[], suffix?: string) => {
    if (!values || values.length === 0) {
      return '';
    }
    return values.map((value) => `${value}${suffix ?? ''}`).join(' → ');
  };

  const treatmentRange = formatLevelRange(treatmentRoomsConfig);
  const equipmentSpeeds = formatMultiplier(equipmentConfig?.speedMultiplier, 'x');
  const staffQuality = formatMultiplier(staffConfig?.qualityMultiplier, 'x');
  const marketingSpawn = formatMultiplier(marketingConfig?.spawnMultiplier, 'x');
  
  // Calculate current upgrade costs and states
  const treatmentRoomsCost = getUpgradeCost('treatmentRooms');
  const equipmentCost = getUpgradeCost('equipment');
  const staffCost = getUpgradeCost('staff');
  const marketingCost = getUpgradeCost('marketing');
  
  const canUpgradeTreatmentRooms = canAffordUpgrade(treatmentRoomsCost) && (treatmentRoomsConfig?.max === undefined || upgrades.treatmentRooms < treatmentRoomsConfig.max);
  const canUpgradeEquipment = canAffordUpgrade(equipmentCost) && (equipmentConfig?.max === undefined || upgrades.equipment < equipmentConfig.max);
  const canUpgradeStaff = canAffordUpgrade(staffCost) && (staffConfig?.max === undefined || upgrades.staff < staffConfig.max);
  const canUpgradeMarketing = canAffordUpgrade(marketingCost) && (marketingConfig?.max === undefined || upgrades.marketing < marketingConfig.max);

  const isTreatmentRoomsMaxed = treatmentRoomsConfig?.max !== undefined && upgrades.treatmentRooms >= treatmentRoomsConfig.max;
  const isEquipmentMaxed = equipmentConfig?.max !== undefined && upgrades.equipment >= equipmentConfig.max;
  const isStaffMaxed = staffConfig?.max !== undefined && upgrades.staff >= staffConfig.max;
  const isMarketingMaxed = marketingConfig?.max !== undefined && upgrades.marketing >= marketingConfig.max;
  
  
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
                <span className="text-xl">{treatmentRoomsConfig?.icon ?? '🏢'}</span>
              </div>
              <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-sm mb-1 truncate">{treatmentRoomsConfig?.name ?? 'Treatment Rooms'}</h4>
              <p className="text-blue-300 text-xs mb-1">
                         {isTreatmentRoomsMaxed
                           ? `Max Level (${upgrades.treatmentRooms}/${treatmentRoomsConfig?.max ?? upgrades.treatmentRooms})`
                           : `Level ${upgrades.treatmentRooms} → ${upgrades.treatmentRooms + 1}`
                         }
                </p>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Current:</span>
                    <span className="text-white font-semibold">{upgrades.treatmentRooms}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Capacity:</span>
                    <span className="text-green-400 font-semibold">{treatmentRange || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Weekly Cost:</span>
                    <span className="text-red-400 font-semibold">{treatmentRoomsConfig?.weeklyExpenses ? `+$${treatmentRoomsConfig.weeklyExpenses}/unit` : 'Included'}</span>
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
              <span className="text-xl">{equipmentConfig?.icon ?? '⚙️'}</span>
              </div>
              <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-sm mb-1 truncate">{equipmentConfig?.name ?? 'Equipment'}</h4>
              <p className="text-purple-300 text-xs mb-1">
                  {isEquipmentMaxed
                    ? `Max Level (${upgrades.equipment}/${equipmentConfig?.max ?? upgrades.equipment})`
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
                    <span className="text-green-400 font-semibold">{equipmentSpeeds ? `${equipmentSpeeds} Service Time` : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Weekly Cost:</span>
                    <span className="text-red-400 font-semibold">{equipmentConfig?.weeklyExpenses ? `+$${equipmentConfig.weeklyExpenses}/level` : 'Included'}</span>
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
              <span className="text-xl">{staffConfig?.icon ?? '👥'}</span>
              </div>
              <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-sm mb-1 truncate">{staffConfig?.name ?? 'Staff'}</h4>
                <p className="text-green-300 text-xs mb-1">
                  {isStaffMaxed
                    ? `Max Level (${upgrades.staff}/${staffConfig?.max ?? upgrades.staff})`
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
                    <span className="text-green-400 font-semibold">{staffQuality ? `${staffQuality} Reputation Gain` : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Weekly Cost:</span>
                    <span className="text-red-400 font-semibold">{staffConfig?.weeklyExpenses ? `+$${staffConfig.weeklyExpenses}/level` : 'Included'}</span>
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
              <span className="text-xl">{marketingConfig?.icon ?? '📣'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-sm mb-1 truncate">{marketingConfig?.name ?? 'Marketing'}</h4>
                <p className="text-orange-300 text-xs mb-1">
                  {isMarketingMaxed
                    ? `Max Level (${upgrades.marketing}/${marketingConfig?.max ?? upgrades.marketing})`
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
                    <span className="text-green-400 font-semibold">{marketingSpawn ? `${marketingSpawn} Spawn Interval` : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Weekly Cost:</span>
                    <span className="text-red-400 font-semibold">{marketingConfig?.weeklyExpenses ? `+$${marketingConfig.weeklyExpenses}/level` : 'Included'}</span>
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

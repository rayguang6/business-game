'use client';

import React from 'react';
import GameButton from '@/app/components/ui/GameButton';

export function UpgradesTab() {
  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-white">Equipment Upgrades</h3>
      <p className="text-gray-300 mb-6">Upgrade your equipment to improve efficiency.</p>
      
      <div className="space-y-4">
        {/* Advanced Dental Chair */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            {/* Left: Info and Status */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center border-2 border-blue-500">
                <span className="text-3xl">🦷</span>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-lg mb-1">Advanced Dental Chair</h4>
                <p className="text-blue-300 text-sm mb-2">Level 2 → Level 3</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Current:</span>
                    <span className="text-white font-semibold">Level 2</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Benefit:</span>
                    <span className="text-green-400 font-semibold">+25% Efficiency</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Price and Button */}
            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-400">$2,500</div>
                <div className="text-gray-400 text-xs">One-time purchase</div>
              </div>
              <div className="scale-75">
                <GameButton color="blue" onClick={() => console.log('Upgrade Dental Chair')}>
                  Upgrade
                </GameButton>
              </div>
            </div>
          </div>
        </div>
        
        {/* X-Ray Machine */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            {/* Left: Info and Status */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center border-2 border-green-500">
                <span className="text-3xl">🔬</span>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-lg mb-1">X-Ray Machine</h4>
                <p className="text-green-300 text-sm mb-2">Level 1 → Level 2</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Current:</span>
                    <span className="text-white font-semibold">Level 1</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Benefit:</span>
                    <span className="text-green-400 font-semibold">+15% Accuracy</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Price and Button */}
            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-400">$1,800</div>
                <div className="text-gray-400 text-xs">One-time purchase</div>
              </div>
              <div className="scale-75">
                <GameButton color="blue" onClick={() => console.log('Upgrade X-Ray Machine')}>
                  Upgrade
                </GameButton>
              </div>
            </div>
          </div>
        </div>
        
        {/* Laser Treatment Unit - Locked */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 opacity-60">
          <div className="flex items-center justify-between">
            {/* Left: Info and Status */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center border-2 border-purple-500">
                <span className="text-3xl">💎</span>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-lg mb-1">Laser Treatment Unit</h4>
                <p className="text-purple-300 text-sm mb-2">Locked - Level 5 Required</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Requirement:</span>
                    <span className="text-red-400 font-semibold">Level 5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Benefit:</span>
                    <span className="text-gray-500 font-semibold">+50% Precision</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Price and Button */}
            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-500">$5,000</div>
                <div className="text-gray-500 text-xs">Locked</div>
              </div>
              <div className="opacity-50 scale-75">
                <GameButton color="gold" onClick={() => console.log('Locked')}>
                  Locked
                </GameButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

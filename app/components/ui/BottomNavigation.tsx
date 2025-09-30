'use client';

import React from 'react';
import Image from 'next/image';

type TabType = 'staff' | 'finance' | 'home' | 'upgrades' | 'marketing';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'staff', label: 'Staff', icon: '/images/icons/staff.png', activeColor: 'text-blue-600' },
    { id: 'finance', label: 'Finance', icon: '/images/icons/finance.png', activeColor: 'text-green-600' },
    { id: 'home', label: 'Home', icon: '/images/icons/home.png', activeColor: 'text-yellow-600', isHome: true },
    { id: 'upgrades', label: 'Upgrades', icon: '/images/icons/upgrades.png', activeColor: 'text-purple-600' },
    { id: 'marketing', label: 'Marketing', icon: '/images/icons/marketing.png', activeColor: 'text-red-600' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 
                    bg-white/80 backdrop-blur-md border border-gray-200 
                    rounded-2xl shadow-xl px-6 py-3 w-[90%] max-w-md">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as TabType)}
            className={`relative flex flex-col items-center transition-all duration-200 
              ${activeTab === tab.id ? 'scale-110' : 'hover:scale-105'}`}
          >
            {/* Icon with subtle active state */}
            <div className={`p-1 rounded-xl transition-all duration-200 ${
              tab.isHome 
                ? 'bg-gradient-to-br from-yellow-200 to-yellow-400 p-2 rounded-full' 
                : activeTab === tab.id 
                  ? 'bg-gray-100/50 rounded-full' 
                  : ''
            }`}>
              <Image 
                src={tab.icon} 
                alt={tab.label}
                width={tab.isHome ? 48 : 32}
                height={tab.isHome ? 48 : 32}
                className={`mx-auto transition-all duration-200 ${
                  activeTab === tab.id && !tab.isHome 
                    ? 'brightness-110 contrast-110' 
                    : ''
                }`}
              />
            </div>
            
            {/* Label */}
            <span className={`text-xs font-semibold mt-1 
              ${activeTab === tab.id ? tab.activeColor : 'text-gray-600'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

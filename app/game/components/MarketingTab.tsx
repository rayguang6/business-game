'use client';

import React from 'react';

export function MarketingTab() {
  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-white">Marketing Campaigns</h3>
      <p className="text-gray-300 mb-6">Launch marketing campaigns to attract more customers.</p>
      
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📢</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">Social Media Ads</h4>
                <p className="text-gray-400 text-sm">Reach 1000+ potential customers</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 font-bold">$500</div>
              <div className="text-green-400 text-xs">+20% New Customers</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors">
              Launch
            </button>
            <button className="px-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors">
              Details
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📧</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">Email Newsletter</h4>
                <p className="text-gray-400 text-sm">Send promotions to existing customers</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 font-bold">$200</div>
              <div className="text-green-400 text-xs">+10% Retention</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors">
              Send
            </button>
            <button className="px-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors">
              Preview
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">Referral Program</h4>
                <p className="text-gray-400 text-sm">Reward customers for referrals</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 font-bold">$300</div>
              <div className="text-green-400 text-xs">+15% Referrals</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors">
              Activate
            </button>
            <button className="px-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors">
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

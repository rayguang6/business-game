'use client';

import React from 'react';

export function HomeTab() {
  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-white">Business Overview</h3>
      <p className="text-gray-300 mb-6">View your business performance and key metrics.</p>
      
      {/* Test content to enable scrolling */}
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">Weekly Performance</h4>
          <p className="text-gray-300 text-sm">Your business is performing well this week with steady customer flow.</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">Customer Satisfaction</h4>
          <p className="text-gray-300 text-sm">High satisfaction rates from your patients.</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">Revenue Trends</h4>
          <p className="text-gray-300 text-sm">Revenue is trending upward this month.</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">Staff Performance</h4>
          <p className="text-gray-300 text-sm">Your staff is working efficiently and maintaining quality service.</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">Equipment Status</h4>
          <p className="text-gray-300 text-sm">All equipment is in good working condition.</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">Marketing Impact</h4>
          <p className="text-gray-300 text-sm">Current marketing campaigns are bringing in new customers.</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">Future Plans</h4>
          <p className="text-gray-300 text-sm">Consider expanding your services to increase revenue potential.</p>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';

export function StaffTab() {
  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-white">Staff Management</h3>
      <p className="text-gray-300 mb-6">Manage your employees and their performance.</p>
      
      {/* Staff Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Dr. Smith Card */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-4 border-2 border-blue-600 relative overflow-hidden">
          {/* Character Avatar */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white/20">
              <span className="text-3xl">👨‍⚕️</span>
            </div>
          </div>
          
          {/* Staff Info */}
          <div className="text-center mb-3">
            <h4 className="text-white font-bold text-sm mb-1">Dr. Smith</h4>
            <p className="text-blue-200 text-xs">Senior Dentist</p>
          </div>
          
          {/* Stats */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-blue-200 text-xs">Level</span>
              <span className="text-yellow-400 font-bold text-sm">LV.8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-200 text-xs">Skill</span>
              <span className="text-green-400 font-bold text-sm">2043</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-200 text-xs">Rating</span>
              <span className="text-yellow-400 text-sm">⭐ 4.9</span>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">Active</span>
          </div>
        </div>
        
        {/* Nurse Johnson Card */}
        <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-4 border-2 border-purple-600 relative overflow-hidden">
          {/* Character Avatar */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center border-2 border-white/20">
              <span className="text-3xl">👩‍⚕️</span>
            </div>
          </div>
          
          {/* Staff Info */}
          <div className="text-center mb-3">
            <h4 className="text-white font-bold text-sm mb-1">Nurse Johnson</h4>
            <p className="text-purple-200 text-xs">Dental Assistant</p>
          </div>
          
          {/* Stats */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-purple-200 text-xs">Level</span>
              <span className="text-yellow-400 font-bold text-sm">LV.3</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-200 text-xs">Skill</span>
              <span className="text-green-400 font-bold text-sm">1951</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-200 text-xs">Rating</span>
              <span className="text-yellow-400 text-sm">⭐ 4.7</span>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">Active</span>
          </div>
        </div>
        
        {/* Available Staff Slot */}
        <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl p-4 border-2 border-gray-500 relative overflow-hidden opacity-60">
          {/* Character Avatar */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center border-2 border-white/20">
              <span className="text-3xl">❓</span>
            </div>
          </div>
          
          {/* Staff Info */}
          <div className="text-center mb-3">
            <h4 className="text-gray-300 font-bold text-sm mb-1">Hire Staff</h4>
            <p className="text-gray-400 text-xs">Available Slot</p>
          </div>
          
          {/* Stats */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Level</span>
              <span className="text-gray-500 font-bold text-sm">--</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Skill</span>
              <span className="text-gray-500 font-bold text-sm">--</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Rating</span>
              <span className="text-gray-500 text-sm">--</span>
            </div>
          </div>
          
          {/* Lock Badge */}
          <div className="absolute top-2 right-2">
            <span className="bg-gray-600 text-gray-300 px-2 py-1 rounded-full text-xs font-bold">Hire</span>
          </div>
        </div>
        
        {/* Locked Staff Slot */}
        <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-xl p-4 border-2 border-red-600 relative overflow-hidden opacity-60">
          {/* Character Avatar */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center border-2 border-white/20">
              <span className="text-3xl">🔒</span>
            </div>
          </div>
          
          {/* Staff Info */}
          <div className="text-center mb-3">
            <h4 className="text-red-200 font-bold text-sm mb-1">Specialist</h4>
            <p className="text-red-300 text-xs">Level 10 Required</p>
          </div>
          
          {/* Stats */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-red-200 text-xs">Level</span>
              <span className="text-gray-500 font-bold text-sm">--</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-200 text-xs">Skill</span>
              <span className="text-gray-500 font-bold text-sm">--</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-200 text-xs">Rating</span>
              <span className="text-gray-500 text-sm">--</span>
            </div>
          </div>
          
          {/* Lock Badge */}
          <div className="absolute top-2 right-2">
            <span className="bg-red-600 text-red-200 px-2 py-1 rounded-full text-xs font-bold">Locked</span>
          </div>
        </div>
      </div>
    </div>
  );
}

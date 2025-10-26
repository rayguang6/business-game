'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { Staff, StaffApplicant, getRankStyles } from '@/lib/features/staff';
import { JOB_POST_COST } from '@/lib/store/slices/staffSlice';

export function StaffTab() {
  const [showJobBoard, setShowJobBoard] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const hiredStaff = useGameStore((state) => state.hiredStaff);
  const hireStaff = useGameStore((state) => state.hireStaff);
  const jobBoardApplicants = useGameStore((state) => state.jobBoardApplicants);
  const ensureJobBoardApplicants = useGameStore((state) => state.ensureJobBoardApplicants);
  const repostJobBoardApplicants = useGameStore((state) => state.repostJobBoardApplicants);

  const handleOpenJobBoard = () => {
    ensureJobBoardApplicants();
    setShowJobBoard(true);
  };

  const handleCloseJobBoard = () => {
    setShowJobBoard(false);
  };

  const handlePostNewJob = () => {
    const result = repostJobBoardApplicants();
    if (!result.success) {
      console.warn(result.message);
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 800);
  };

  const handleHireStaff = (staffToHire: Staff) => {
    hireStaff(staffToHire);
    console.log(`Hiring ${staffToHire.name} for ${staffToHire.hireCost} and ${staffToHire.salary}/week`);
  };

  return (
    <div className="relative">
      <h3 className="text-2xl sm:text-3xl font-extrabold mb-4 sm:mb-6 text-white text-center">Staff Management</h3>
      <p className="text-base sm:text-lg text-gray-300 mb-6 sm:mb-8 text-center px-2">
        Oversee your talented team. Happy staff, happy customers!
      </p>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-4">
        {hiredStaff.map((member) => {
          const rankStyles = getRankStyles(member.rank);
          return (
            <div
              key={member.id}
              className={`bg-gradient-to-br ${rankStyles.card} rounded-2xl p-4 sm:p-6 border-2 relative overflow-hidden shadow-lg transform hover:scale-[1.01] sm:hover:scale-105 transition-all duration-300`}
            >
              {/* Rank Overlay */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
                   style={{ background: `linear-gradient(to bottom right, var(--color-${member.rank}-900), transparent 50%)` }}></div>

              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">Active</span>
              </div>

              {/* Character Avatar */}
              <div className="flex justify-center mb-3 sm:mb-4">
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 ${rankStyles.avatarBg} rounded-full flex items-center justify-center border-4 border-white/30 shadow-inner`}
                >
                  <span className="text-4xl sm:text-5xl leading-none">{member.emoji}</span>
                </div>
              </div>

              {/* Staff Info */}
              <div className="text-center mb-4 sm:mb-5">
                <h4 className="text-white font-extrabold text-lg sm:text-xl mb-1">{member.name}</h4>
                <p className={`${rankStyles.textColor} text-xs sm:text-sm font-semibold`}>{member.role} (Level {member.level})</p>
              </div>

              {/* Stats Grid */}
              <div className="space-y-2 sm:space-y-3 mb-5 sm:mb-6">
                <div className="flex justify-between items-center bg-white/10 px-2 py-1.5 sm:p-2 rounded-lg">
                  <span className="text-gray-200 text-xs sm:text-sm">💰 Salary</span>
                  <span className="text-white font-bold text-sm sm:text-base">${Math.round(member.salary)}/week</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 px-2 py-1.5 sm:p-2 rounded-lg">
                  <span className="text-gray-200 text-xs sm:text-sm">⚡ Speed Boost</span>
                  <span className="text-yellow-400 font-bold text-sm sm:text-base">{Math.round(member.increaseServiceSpeed)}%</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 px-2 py-1.5 sm:p-2 rounded-lg">
                  <span className="text-gray-200 text-xs sm:text-sm">😊 Happy Customer Chance</span>
                  <span className="text-green-400 font-bold text-sm sm:text-base">+{Math.round(member.increaseHappyCustomerProbability)}%</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Hire Staff Card */}
        <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 border-2 border-gray-600 relative overflow-hidden shadow-lg flex flex-col justify-center items-center text-center transform hover:scale-[1.01] sm:hover:scale-105 transition-all duration-300">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-700 rounded-full flex items-center justify-center border-4 border-gray-500 shadow-inner mb-3 sm:mb-4">
            <span className="text-4xl sm:text-5xl leading-none">➕</span>
          </div>
          <h4 className="text-white font-extrabold text-lg sm:text-xl mb-1 sm:mb-2">Hire New Staff</h4>
          <p className="text-gray-300 text-xs sm:text-sm mb-4 sm:mb-6">Expand your team and boost your business!</p>
          <button onClick={handleOpenJobBoard} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 sm:py-3 rounded-xl transition-colors duration-200 shadow-md">
            Open Job Board
          </button>
        </div>
      </div>

      {/* Job Board Modal */}
      {showJobBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
          <div className="bg-gray-900 p-5 sm:p-8 rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto relative border-2 border-blue-600">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 sm:mb-6 text-center">Job Board</h3>
            <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 text-center">Find talented individuals to join your team.</p>

            <button onClick={handleCloseJobBoard} className="absolute top-3 sm:top-4 right-3 sm:right-4 text-gray-400 hover:text-white text-2xl sm:text-3xl leading-none">
              &times;
            </button>

            {/* Generated Staff Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6`}>
              {jobBoardApplicants.map((member: StaffApplicant, index) => {
                const rankStyles = getRankStyles(member.rank);
                const isHired = member.isHired ?? false;
                const animationClasses = isGenerating
                  ? 'opacity-0 transform -translate-y-16 scale-50'
                  : 'opacity-100 transform translate-y-0 scale-100';
                const delayStyle = { transitionDelay: `${index * 100}ms` }; // Staggered delay

                return (
                  <div
                    key={member.id}
                    className={`bg-gradient-to-br ${rankStyles.card} rounded-2xl p-4 sm:p-6 border-2 relative overflow-hidden shadow-lg
                                  transition-all duration-700 ease-out ${animationClasses}`}
                    style={delayStyle}
                  >
                    <div className="flex justify-center mb-3 sm:mb-4">
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 ${rankStyles.avatarBg} rounded-full flex items-center justify-center border-3 border-white/30 shadow-inner`}>
                        <span className="text-3xl sm:text-4xl leading-none">{member.emoji}</span>
                      </div>
                    </div>
                    <div className="text-center mb-4">
                      <h4 className="text-white font-extrabold text-base sm:text-lg mb-1">{member.name}</h4>
                      <p className={`${rankStyles.textColor} text-xs sm:text-sm font-semibold`}>{member.role} (Level {member.level})</p>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 mb-4 text-xs sm:text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-200">💰 Salary:</span>
                        <span className="text-white font-bold">${Math.round(member.salary)}/week</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-200">⚡ Speed Boost:</span>
                        <span className="text-yellow-400 font-bold">{Math.round(member.increaseServiceSpeed)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-200">😊 Happy Chance:</span>
                        <span className="text-green-400 font-bold">+{Math.round(member.increaseHappyCustomerProbability)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-200">💸 Hire Cost:</span>
                        <span className="text-red-400 font-bold text-lg">${Math.round(member.hireCost)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleHireStaff(member)}
                      disabled={isHired}
                      className={`w-full bg-${member.rank}-500 hover:bg-${member.rank}-600 text-white font-bold py-2 sm:py-2.5 rounded-xl transition-colors duration-200 shadow-md flex items-center justify-center space-x-2 ${isHired ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <span>{isHired ? `${member.name} hired` : `Hire ${member.name}`}</span>
                      {!isHired && <span className="text-sm opacity-90">(${Math.round(member.hireCost)})</span>}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Regenerate Button */}
            <div className="text-center">
              <button onClick={handlePostNewJob} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl transition-colors duration-200 shadow-md">
                Repost Job Board (${JOB_POST_COST})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';

// Define a simple Staff interface for prototyping
interface Staff {
  id: string;
  name: string;
  salary: number;
  increaseServiceSpeed: number; // e.g., 0.1 for 10% increase
  increaseHappyCustomerProbability: number; // e.g., 0.05 for 5% increase
  emoji: string; // To represent the staff member
  rank: 'blue' | 'purple' | 'orange' | 'red';
  role: string;
  level: number;
  hireCost: number; // Cost to hire this staff member
}

// Dummy staff data
const dummyStaff: Staff[] = [
  {
    id: 'staff-1',
    name: 'Alice',
    salary: 500,
    increaseServiceSpeed: 0.1,
    increaseHappyCustomerProbability: 0.05,
    emoji: '👩‍⚕️',
    rank: 'blue',
    role: 'Assistant',
    level: 1,
    hireCost: 1000,
  },
  {
    id: 'staff-2',
    name: 'Bob',
    salary: 600,
    increaseServiceSpeed: 0.15,
    increaseHappyCustomerProbability: 0.08,
    emoji: '👨‍🔬',
    rank: 'purple',
    role: 'Specialist',
    level: 3,
    hireCost: 1500,
  },
  {
    id: 'staff-3',
    name: 'Charlie',
    salary: 550,
    increaseServiceSpeed: 0.08,
    increaseHappyCustomerProbability: 0.07,
    emoji: '👨‍🔧',
    rank: 'orange',
    role: 'Technician',
    level: 5,
    hireCost: 2000,
  },
  {
    id: 'staff-4',
    name: 'David',
    salary: 800,
    increaseServiceSpeed: 0.2,
    increaseHappyCustomerProbability: 0.12,
    emoji: '👨‍💼',
    rank: 'red',
    role: 'Manager',
    level: 8,
    hireCost: 3000,
  },
];

const STAFF_NAMES = [
  'Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Charlotte', 'Elijah', 'Amelia',
  'James', 'Ava', 'William', 'Sophia', 'Benjamin', 'Isabella', 'Lucas', 'Mia',
  'Henry', 'Evelyn', 'Theodore', 'Harper', 'Jackson', 'Camila', 'Samuel', 'Abigail',
];

const getRankStyles = (rank: Staff['rank']) => {
  switch (rank) {
    case 'blue':
      return {
        card: 'from-blue-900 to-blue-800 border-blue-600',
        avatarBg: 'bg-blue-500',
        textColor: 'text-blue-200',
      };
    case 'purple':
      return {
        card: 'from-purple-900 to-purple-800 border-purple-600',
        avatarBg: 'bg-purple-500',
        textColor: 'text-purple-200',
      };
    case 'orange':
      return {
        card: 'from-orange-700 to-orange-600 border-orange-500',
        avatarBg: 'bg-orange-500',
        textColor: 'text-orange-200',
      };
    case 'red':
      return {
        card: 'from-red-900 to-red-800 border-red-600',
        avatarBg: 'bg-red-500',
        textColor: 'text-red-200',
      };
    default:
      return {
        card: 'from-gray-700 to-gray-600 border-gray-500',
        avatarBg: 'bg-gray-500',
        textColor: 'text-gray-200',
      };
  }
};

const getRandomEmoji = (rank: Staff['rank']): string => {
  const emojis: Record<Staff['rank'], string[]> = {
    blue: ['👩‍⚕️', '👨‍🔬', '👩‍🔧', '👨‍💻'],
    purple: ['👩‍🎓', '👨‍💼', '👩‍🏫', '👨‍⚖️'],
    orange: ['👩‍🚀', '👨‍🎤', '👩‍🎨', '👨‍✈️'],
    red: ['🧙‍♀️', '🧝‍♂️', '👸', '🤴'],
  };
  const availableEmojis = emojis[rank] || emojis.blue;
  return availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
};

const generateRandomStaff = (id: string): Staff => {
  // Determine initial rank based on a more generous random roll
  let rank: Staff['rank'];
  const initialRoll = Math.random();
  if (initialRoll < 0.05) {
    rank = 'red'; // 5% chance for Red
  } else if (initialRoll < 0.20) {
    rank = 'orange'; // 15% chance for Orange (20% total for Orange or better)
  } else if (initialRoll < 0.45) {
    rank = 'purple'; // 25% chance for Purple (45% total for Purple or better)
  } else {
    rank = 'blue'; // 55% chance for Blue
  }

  const getStatMultiplier = (currentRank: Staff['rank']) => {
    switch (currentRank) {
      case 'blue': return 1.0;
      case 'purple': return 1.2;
      case 'orange': return 1.5;
      case 'red': return 2.0;
      default: return 1.0;
    }
  };
  const multiplier = getStatMultiplier(rank);

  const salary = Math.round(500 * multiplier + Math.random() * 200);
  const increaseServiceSpeed = parseFloat((0.05 * multiplier + Math.random() * 0.05).toFixed(2));
  const increaseHappyCustomerProbability = parseFloat((0.03 * multiplier + Math.random() * 0.03).toFixed(2));
  const level = Math.floor(Math.random() * 5 * multiplier) + 1; // Level 1-5 for blue, higher for others
  const hireCost = Math.round(salary * 2 + level * 50); // Example cost calculation

  const roles = ['Assistant', 'Specialist', 'Technician', 'Engineer', 'Manager', 'Consultant'];
  const role = roles[Math.floor(Math.random() * roles.length)];
  const randomName = STAFF_NAMES[Math.floor(Math.random() * STAFF_NAMES.length)];

  return {
    id,
    name: randomName,
    salary,
    increaseServiceSpeed,
    increaseHappyCustomerProbability,
    emoji: getRandomEmoji(rank),
    rank,
    role,
    level,
    hireCost,
  };
};

export function StaffTab() {
  const [showJobBoard, setShowJobBoard] = useState(false);
  const [jobBoardStaff, setJobBoardStaff] = useState<Staff[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const JOB_POST_COST = 1000;

  const generateJobBoardStaff = () => {
    const newStaff: Staff[] = [];
    const usedNames: Set<string> = new Set();

    for (let i = 0; i < 3; i++) {
      let staffMember: Staff;
      let uniqueNameFound = false;
      do {
        staffMember = generateRandomStaff(`job-staff-${Date.now()}-${i}`);
        if (!usedNames.has(staffMember.name)) {
          uniqueNameFound = true;
          usedNames.add(staffMember.name);
        }
      } while (!uniqueNameFound);
      newStaff.push(staffMember);
    }
    setJobBoardStaff(newStaff);
  };

  const handleOpenJobBoard = () => {
    setShowJobBoard(true);
    generateJobBoardStaff();
  };

  const handleCloseJobBoard = () => {
    setShowJobBoard(false);
  };

  const handlePostNewJob = () => {
    setIsGenerating(true);
    setTimeout(() => {
      generateJobBoardStaff();
      setIsGenerating(false);
    }, 800); // Wait for old cards to fully disappear (duration-700 + a small buffer)
  };

  const handleHireStaff = (staffToHire: Staff) => {
    console.log(`Hiring ${staffToHire.name} for ${staffToHire.hireCost} and ${staffToHire.salary}/week`);
    handleCloseJobBoard();
  };

  return (
    <div className="relative">
      <h3 className="text-3xl font-extrabold mb-6 text-white text-center">Staff Management</h3>
      <p className="text-lg text-gray-300 mb-8 text-center">Oversee your talented team. Happy staff, happy customers!</p>
      
      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {dummyStaff.map((member) => {
          const rankStyles = getRankStyles(member.rank);
          return (
            <div key={member.id} className={`bg-gradient-to-br ${rankStyles.card} rounded-2xl p-6 border-2 relative overflow-hidden shadow-lg transform hover:scale-105 transition-all duration-300`}>
              {/* Rank Overlay */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
                   style={{ background: `linear-gradient(to bottom right, var(--color-${member.rank}-900), transparent 50%)` }}></div>

              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">Active</span>
              </div>

              {/* Character Avatar */}
              <div className="flex justify-center mb-4">
                <div className={`w-24 h-24 ${rankStyles.avatarBg} rounded-full flex items-center justify-center border-4 border-white/30 shadow-inner`}>
                  <span className="text-5xl leading-none">{member.emoji}</span>
                </div>
              </div>
              
              {/* Staff Info */}
              <div className="text-center mb-5">
                <h4 className="text-white font-extrabold text-xl mb-1">{member.name}</h4>
                <p className={`${rankStyles.textColor} text-sm font-semibold`}>{member.role} (Level {member.level})</p>
              </div>
              
              {/* Stats Grid */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg">
                  <span className="text-gray-200 text-sm">💰 Salary</span>
                  <span className="text-white font-bold text-base">${member.salary}/week</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg">
                  <span className="text-gray-200 text-sm">⚡ Speed Boost</span>
                  <span className="text-yellow-400 font-bold text-base">{(member.increaseServiceSpeed * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg">
                  <span className="text-gray-200 text-sm">😊 Happy Customer Chance</span>
                  <span className="text-green-400 font-bold text-base">{(member.increaseHappyCustomerProbability * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg">
                  <span className="text-gray-200 text-sm">🧠 Skill</span>
                  <span className="text-yellow-400 font-bold text-base">N/A</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg">
                  <span className="text-gray-200 text-sm">⭐ Rating</span>
                  <span className="text-yellow-400 text-base">4.9 (Placeholder)</span>
                </div>
              </div>

              {/* View Details Button */}
              <button className={`w-full bg-${member.rank}-500 hover:bg-${member.rank}-600 text-white font-bold py-3 rounded-xl transition-colors duration-200 shadow-md`}>
                View Details
              </button>
            </div>
          );
        })}

        {/* Hire Staff Card */}
        <div className="bg-gray-800 rounded-2xl p-6 border-2 border-gray-600 relative overflow-hidden shadow-lg flex flex-col justify-center items-center text-center transform hover:scale-105 transition-all duration-300">
          <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center border-4 border-gray-500 shadow-inner mb-4">
            <span className="text-5xl leading-none">➕</span>
          </div>
          <h4 className="text-white font-extrabold text-xl mb-2">Hire New Staff</h4>
          <p className="text-gray-300 text-sm mb-6">Expand your team and boost your business!</p>
          <button onClick={handleOpenJobBoard} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors duration-200 shadow-md">
            Open Job Board
          </button>
        </div>
      </div>

      {/* Job Board Modal */}
      {showJobBoard && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-8 rounded-2xl shadow-xl max-w-4xl w-full relative border-2 border-blue-600">
            <h3 className="text-3xl font-extrabold text-white mb-6 text-center">Job Board</h3>
            <p className="text-gray-300 mb-6 text-center">Find talented individuals to join your team.</p>

            <button onClick={handleCloseJobBoard} className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl leading-none">
              &times;
            </button>

            {/* Generated Staff Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-6`}>
              {jobBoardStaff.map((member, index) => {
                const rankStyles = getRankStyles(member.rank);
                const animationClasses = isGenerating
                  ? 'opacity-0 transform -translate-y-16 scale-50'
                  : 'opacity-100 transform translate-y-0 scale-100';
                const delayStyle = { transitionDelay: `${index * 100}ms` }; // Staggered delay

                return (
                  <div key={member.id} 
                       className={`bg-gradient-to-br ${rankStyles.card} rounded-2xl p-6 border-2 relative overflow-hidden shadow-lg
                                  transition-all duration-700 ease-out ${animationClasses}`}
                       style={delayStyle}
                  >
                    <div className="flex justify-center mb-4">
                      <div className={`w-20 h-20 ${rankStyles.avatarBg} rounded-full flex items-center justify-center border-3 border-white/30 shadow-inner`}>
                        <span className="text-4xl leading-none">{member.emoji}</span>
                      </div>
                    </div>
                    <div className="text-center mb-4">
                      <h4 className="text-white font-extrabold text-lg mb-1">{member.name}</h4>
                      <p className={`${rankStyles.textColor} text-xs font-semibold`}>{member.role} (Level {member.level})</p>
                    </div>
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-200">💰 Salary:</span>
                        <span className="text-white font-bold">${member.salary}/week</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-200">⚡ Speed Boost:</span>
                        <span className="text-yellow-400 font-bold">{(member.increaseServiceSpeed * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-200">😊 Happy Chance:</span>
                        <span className="text-green-400 font-bold">{(member.increaseHappyCustomerProbability * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-200">💸 Hire Cost:</span>
                        <span className="text-red-400 font-bold">${member.hireCost}</span>
                      </div>
                    </div>
                    <button onClick={() => handleHireStaff(member)} className={`w-full bg-${member.rank}-500 hover:bg-${member.rank}-600 text-white font-bold py-2 rounded-xl transition-colors duration-200 shadow-md`}>
                      Hire {member.name}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Regenerate Button */}
            <div className="text-center">
              <button onClick={handlePostNewJob} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-md">
                Repost Job Board ($1000)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

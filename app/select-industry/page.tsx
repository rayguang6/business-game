'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllIndustries } from '@/lib/game/industry/registry';
import { useGameStore } from '@/lib/store/gameStore';

export default function SelectIndustry() {
  const router = useRouter();
  const setSelectedIndustry = useGameStore((state) => state.setSelectedIndustry);
  const industries = getAllIndustries();

  const handleIndustrySelect = (industry: typeof industries[0]) => {
    setSelectedIndustry(industry);
    router.push(`/game/${industry.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Choose Your Industry</h1>
          <p className="text-lg text-gray-600">Select the type of business you want to run</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((industry) => (
            <button
              key={industry.id}
              onClick={() => handleIndustrySelect(industry)}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-blue-300 w-full"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">{industry.icon}</div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">{industry.name}</h3>
                <p className="text-gray-600">{industry.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

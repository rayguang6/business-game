// SelectIndustry.tsx
import React from 'react';
import Link from 'next/link';
import IndustryCard from '../ui/IndustryCard';
import { AudioPrompt } from '../ui/AudioPrompt';
import { Industry } from '@/lib/features/industries';

interface SelectIndustryProps {
  industries: Industry[];
  onIndustrySelect: (industry: Industry) => void;
}

export default function SelectIndustry({ industries, onIndustrySelect }: SelectIndustryProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 to-blue-700 p-6 relative">
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
      
      {/* Audio Prompt */}
      <AudioPrompt />

      <div className="relative max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-white drop-shadow-[0_0_15px_rgba(0,0,0,0.6)]">
            Choose Your Industry
          </h1>
          <p className="text-xl text-blue-100 font-medium">
            Select the type of business empire you want to build
          </p>
        </div>

        {/* Industry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-14">
          {industries.map((industry) => (
            <IndustryCard
              key={industry.id}
              industry={industry}
              onClick={() => onIndustrySelect(industry)}
            />
          ))}
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center px-8 py-4 rounded-full font-semibold text-white bg-white/10 backdrop-blur-md border border-white/30 hover:bg-white/20 transition-all duration-300"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

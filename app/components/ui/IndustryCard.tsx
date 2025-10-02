// IndustryCard.tsx
import React from 'react';
import Image from 'next/image';
import { Industry } from '@/lib/features/industries';

interface IndustryCardProps {
  industry: Industry;
  onClick: () => void;
}

export default function IndustryCard({ industry, onClick }: IndustryCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl shadow-xl w-full overflow-hidden relative border-4 border-transparent hover:border-blue-400 hover:shadow-blue-300/50 active:scale-95 transition-all duration-200 group"
    >
      {/* Industry Image - Large Background */}
      <div className="h-48 w-full relative overflow-hidden">
        {industry.image ? (
          <Image
            src={industry.image}
            alt={industry.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center">
            <span className="text-6xl">{industry.icon}</span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
      </div>

      {/* Industry Info */}
      <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
        <h3 className="text-2xl font-extrabold text-gray-800 mb-2 text-center">
          {industry.name}
        </h3>
        <p className="text-gray-600 text-center font-medium leading-relaxed">
          {industry.description}
        </p>
      </div>
    </button>
  );
}

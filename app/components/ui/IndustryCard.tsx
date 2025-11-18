// IndustryCard.tsx
import React from 'react';
import Image from 'next/image';
import { Industry } from '@/lib/features/industries';
import { getBusinessMetrics } from '@/lib/game/config';

interface IndustryCardProps {
  industry: Industry;
  onClick: () => void;
}

export default function IndustryCard({ industry, onClick }: IndustryCardProps) {
  // Get starting stats for this industry
  const metrics = getBusinessMetrics(industry.id);
  const startingCash = metrics.startingCash || 15000;
  const startingSkillLevel = metrics.startingSkillLevel || 10; // Previously: startingReputation

  return (
    <button
      onClick={onClick}
      className="relative w-full group focus:outline-none focus:ring-4 focus:ring-[var(--game-primary)]/50 rounded-2xl overflow-hidden"
      aria-label={`Select ${industry.name} industry`}
    >
      {/* Game-style Card Frame */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--game-primary-light)]/20 via-[var(--game-primary)]/10 to-[var(--game-primary-dark)]/20 rounded-2xl border-4 border-[var(--game-primary)]/30 group-hover:border-[var(--game-primary)] group-hover:shadow-[0_0_30px_rgba(35,170,246,0.5)] transition-all duration-300 z-0" />
      
      {/* Decorative corner accents (Pokemon-style) */}
      <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-[var(--game-secondary)]/40 rounded-tl-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-[var(--game-secondary)]/40 rounded-tr-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-[var(--game-secondary)]/40 rounded-bl-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-[var(--game-secondary)]/40 rounded-br-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Main Card Content */}
      <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-white/50 group-hover:bg-white transition-all duration-300">
        {/* Industry Image Section */}
        <div className="h-48 sm:h-52 md:h-56 w-full relative overflow-hidden bg-gradient-to-br from-[var(--game-primary-light)]/30 via-[var(--game-primary)]/20 to-[var(--game-primary-dark)]/30">
          {industry.image ? (
            <Image
              src={industry.image}
              alt={industry.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl sm:text-7xl md:text-8xl opacity-80 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg">
                {industry.icon}
              </span>
            </div>
          )}

          {/* Overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent group-hover:from-black/60 transition-all duration-300" />
          
          {/* Industry Name Badge */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-[var(--game-secondary)] transition-colors duration-300">
              {industry.name}
            </h3>
          </div>
        </div>

        {/* Industry Info Section */}
        <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-b from-white to-gray-50/50">
          {/* Description */}
          <p className="text-sm sm:text-base text-gray-700 text-center font-medium leading-relaxed mb-4 min-h-[3rem] flex items-center justify-center">
            {industry.description}
          </p>

          {/* Stats Section (RPG/Tycoon style) */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t-2 border-gray-200 group-hover:border-[var(--game-primary)]/30 transition-colors duration-300">
            {/* Starting Cash */}
            <div className="flex flex-col items-center p-2 bg-gradient-to-br from-[var(--success)]/10 to-[var(--success)]/5 rounded-lg border border-[var(--success)]/20 group-hover:border-[var(--success)]/40 transition-all duration-300">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Starting Cash</div>
              <div className="text-lg sm:text-xl font-bold text-[var(--success-dark)] flex items-center gap-1">
                <span>💰</span>
                <span>${(startingCash / 1000).toFixed(0)}k</span>
              </div>
            </div>

            {/* Starting Skill Level */}
            <div className="flex flex-col items-center p-2 bg-gradient-to-br from-[var(--game-secondary)]/10 to-[var(--game-secondary)]/5 rounded-lg border border-[var(--game-secondary)]/20 group-hover:border-[var(--game-secondary)]/40 transition-all duration-300">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Skill Level</div>
              <div className="text-lg sm:text-xl font-bold text-[var(--game-secondary-dark)] flex items-center gap-1">
                <span>⭐</span>
                <span>{startingSkillLevel}</span>
              </div>
            </div>
          </div>

          {/* Select Button Hint */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--game-primary)]/10 to-[var(--game-primary-dark)]/10 rounded-lg border border-[var(--game-primary)]/20 group-hover:from-[var(--game-primary)]/20 group-hover:to-[var(--game-primary-dark)]/20 group-hover:border-[var(--game-primary)]/40 transition-all duration-300">
              <span className="text-sm font-semibold text-[var(--game-primary-dark)]">Click to Select</span>
              <span className="text-[var(--game-primary)] group-hover:translate-x-1 transition-transform duration-300">→</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active state scale effect */}
      <div className="absolute inset-0 rounded-2xl group-active:bg-white/20 group-active:scale-[0.98] transition-transform duration-150 pointer-events-none z-20" />
    </button>
  );
}

// SelectIndustry.tsx
import React from 'react';
import Link from 'next/link';
import IndustryCard from '../ui/IndustryCard';
import { Industry } from '@/lib/features/industries';

interface SelectIndustryProps {
  industries: Industry[];
  onIndustrySelect: (industry: Industry) => void;
}

export default function SelectIndustry({ industries, onIndustrySelect }: SelectIndustryProps) {
  return (
    <div
      className="min-h-screen p-4 sm:p-6 md:p-8 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg,
          rgba(13, 71, 161, 0.95) 0%,
          rgba(25, 118, 210, 0.98) 25%,
          rgba(33, 150, 243, 0.95) 50%,
          rgba(66, 165, 245, 0.98) 75%,
          rgba(100, 181, 246, 0.95) 100%
        )`
      }}
    >
      {/* Animated background pattern (subtle game-style) */}
      <div className="absolute inset-0 opacity-8">
        <div
          className="absolute inset-0 animate-pulse-slow"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(144, 202, 249, 0.4) 0%, transparent 50%),
                              radial-gradient(circle at 80% 80%, rgba(77, 182, 172, 0.3) 0%, transparent 50%),
                              radial-gradient(circle at 40% 20%, rgba(129, 212, 250, 0.4) 0%, transparent 50%),
                              radial-gradient(circle at 60% 30%, rgba(100, 181, 246, 0.3) 0%, transparent 50%)`,
            backgroundSize: '100% 100%'
          }}
        />
      </div>

      {/* Subtle grid overlay for depth */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative max-w-7xl mx-auto z-10">
        {/* Header Section - Game Style */}
        <header className="text-center mb-10 sm:mb-12 md:mb-16 pt-6 sm:pt-8 md:pt-10">
          {/* Decorative line above title */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-1 w-16 sm:w-24 bg-gradient-to-r from-transparent via-[var(--game-secondary)] to-[var(--game-secondary)] rounded-full" />
            <div className="w-3 h-3 bg-[var(--game-secondary)] rounded-full shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
            <div className="h-1 w-16 sm:w-24 bg-gradient-to-l from-transparent via-[var(--game-secondary)] to-[var(--game-secondary)] rounded-full" />
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 sm:mb-6 text-white relative inline-block"
            style={{
              textShadow: `
                0 0 20px rgba(100, 181, 246, 0.6),
                0 4px 20px rgba(13, 71, 161, 0.4),
                0 2px 8px rgba(13, 71, 161, 0.3),
                0 0 40px rgba(66, 165, 245, 0.4)
              `,
              WebkitTextStroke: '1px rgba(100, 181, 246, 0.4)'
            }}
          >
            Choose Your Industry
          </h1>

          {/* Subtitle with game-style badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[var(--game-primary)]/20 via-[var(--game-primary-dark)]/20 to-[var(--game-primary)]/20 backdrop-blur-sm rounded-full border border-[var(--game-primary)]/30 mb-6">
            <span className="text-lg sm:text-xl md:text-2xl text-white/95 font-semibold">
              Select the type of business empire you want to build
            </span>
          </div>

          {/* Decorative line below subtitle */}
          <div className="flex items-center justify-center gap-4">
            <div className="h-1 w-16 sm:w-24 bg-gradient-to-r from-transparent via-[var(--game-primary)] to-[var(--game-primary)] rounded-full" />
            <div className="w-3 h-3 bg-[var(--game-primary)] rounded-full shadow-[0_0_10px_rgba(35,170,246,0.5)]" />
            <div className="h-1 w-16 sm:w-24 bg-gradient-to-l from-transparent via-[var(--game-primary)] to-[var(--game-primary)] rounded-full" />
          </div>
        </header>

        {/* Industry Cards Grid */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-10 mb-12 sm:mb-14 md:mb-16">
          {industries.map((industry, index) => (
            <div
              key={industry.id}
              className="animate-fade-in flex-shrink-0 w-full sm:w-80 md:w-72 lg:w-80"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              <IndustryCard
                industry={industry}
                onClick={() => onIndustrySelect(industry)}
              />
            </div>
          ))}
        </div>

        {/* Navigation Buttons - Game Style */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-6 sm:pb-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-white bg-gradient-to-r from-white/20 via-blue-400/30 to-white/20 backdrop-blur-lg border-2 border-white/40 hover:border-white/80 hover:bg-gradient-to-r hover:from-blue-500/40 hover:via-blue-600/50 hover:to-blue-500/40 hover:shadow-[0_0_25px_rgba(100,181,246,0.5),0_0_50px_rgba(66,165,245,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300/50 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            aria-label="Return to home page"
          >
            <span className="text-2xl sm:text-3xl group-hover:scale-110 group-hover:-translate-x-1 transition-all duration-300">←</span>
            <span className="text-lg sm:text-xl tracking-wide">Back to Home</span>
          </Link>
        </div>
      </div>

    </div>
  );
}

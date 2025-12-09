'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Industry } from '@/lib/features/industries';
import GameButton from '@/app/components/ui/GameButton';

interface LeaderboardClientProps {
  industries: Industry[];
}

export default function LeaderboardClient({ industries }: LeaderboardClientProps) {
  const router = useRouter();

  const handleIndustrySelect = (industry: Industry) => {
    router.push(`/leaderboard/${industry.id}`);
  };

  return (
    <div
      className="min-h-screen p-4 sm:p-6 md:p-8 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg,
          rgba(15, 12, 8, 0.95) 0%,
          rgba(25, 20, 15, 0.98) 50%,
          rgba(15, 12, 8, 0.95) 100%
        )`
      }}
    >
      {/* Animated background pattern (subtle game-style) */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0 animate-pulse-slow"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(184, 134, 11, 0.4) 0%, transparent 50%),
                              radial-gradient(circle at 80% 80%, rgba(255, 215, 0, 0.3) 0%, transparent 50%),
                              radial-gradient(circle at 40% 20%, rgba(184, 134, 11, 0.3) 0%, transparent 50%)`,
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
                0 0 20px rgba(184, 134, 11, 0.8),
                0 4px 20px rgba(0, 0, 0, 0.8),
                0 2px 8px rgba(0, 0, 0, 0.6),
                0 0 40px rgba(184, 134, 11, 0.6)
              `,
              WebkitTextStroke: '2px rgba(184, 134, 11, 0.5)'
            }}
          >
            🏆 Leaderboard
          </h1>

          {/* Decorative line between title and subtitle */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-1 w-16 sm:w-24 bg-gradient-to-r from-transparent via-yellow-500 to-yellow-500 rounded-full" />
            <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(184,134,11,0.8)]" />
            <div className="h-1 w-16 sm:w-24 bg-gradient-to-l from-transparent via-yellow-500 to-yellow-500 rounded-full" />
          </div>

          {/* Subtitle with game-style badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-600/20 via-yellow-500/10 to-yellow-600/20 backdrop-blur-sm rounded-full border border-yellow-500/40 mb-6">
            <span className="text-lg sm:text-xl md:text-2xl text-white/95 font-semibold">
              View top players by industry
            </span>
          </div>

        </header>

        {/* Industry SaaS-Style Cards */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-12 sm:mb-14 md:mb-16">
          {industries.map((industry, index) => (
            <div
              key={industry.id}
              className="animate-fade-in flex-shrink-0 w-full sm:w-80 md:w-72 lg:w-80"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              <button
                onClick={() => handleIndustrySelect(industry)}
                className="w-full group focus:outline-none focus:ring-4 focus:ring-yellow-500/50 h-full"
                aria-label={`View ${industry.name} leaderboard`}
              >
                <div className="relative bg-gradient-to-br from-slate-800/90 via-slate-900/80 to-slate-800/90 backdrop-blur-lg rounded-2xl border border-yellow-500/30 group-hover:border-yellow-400/60 group-hover:shadow-[0_0_30px_rgba(184,134,11,0.3)] transition-all duration-500 overflow-hidden h-full">
                  {/* Industry Image */}
                  <div className="h-40 w-full relative overflow-hidden">
                    {industry.image ? (
                      <Image
                        src={industry.image}
                        alt={industry.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-yellow-600/20 to-amber-600/20 flex items-center justify-center">
                        <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                          {industry.icon}
                        </span>
                      </div>
                    )}
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

                    {/* Top performers indicator */}
                    {/* <div className="absolute top-3 right-3 bg-yellow-500/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-900">🏆</span>
                      <span className="text-xs font-bold text-slate-900">TOP</span>
                    </div> */}
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    {/* Industry info */}
                    <div className="text-center">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-yellow-500/30 transition-colors duration-300">
                        <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{industry.icon}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-yellow-100 transition-colors duration-300 mb-2">
                        {industry.name}
                      </h3>
                      <p className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors duration-300 leading-relaxed">
                        {industry.description}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-6 sm:pb-8">
          <GameButton
            color="blue"
            onClick={() => router.push('/')}
          >
            ← Back to Home
          </GameButton>
        </div>
      </div>
    </div>
  );
}

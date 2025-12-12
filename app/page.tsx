'use client';

import Image from 'next/image';
import GameButton from '@/app/components/ui/GameButton';
import { useAudio } from '@/hooks/useAudio';

// Welcome page constants
const WELCOME_CONFIG = {
  backgroundImageMobile: "/images/start-screen-bg.png",
  backgroundImageDesktop: "/images/start-screen-bg-desktop.png",
  titleImage: "/images/business-empire-title.png",
  titleAlt: "Business Empire",
  startGameHref: "/select-industry"
} as const;

export default function WelcomePage() {
  // Play welcome music when component mounts
  // useAudio('welcome', true);

  return (
    <div
      className="min-h-screen flex flex-col p-4 sm:p-6 md:p-8 relative"
      style={{
        background: `linear-gradient(to bottom,
          rgba(35, 170, 246, 0.3),
          rgba(16, 87, 218, 0.5)
        )`
      }}
    >
      {/* Background image overlay that loads on top */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-responsive-start"
      />

      {/* Spacer to push buttons to bottom */}
      <div className="flex-1"></div>

      {/* Game Buttons - positioned at bottom with space from edge */}
      <div className="relative z-10 text-center w-full max-w-2xl mx-auto pb-12 sm:pb-16 md:pb-20">
        <div className="flex flex-col items-center justify-center gap-4 sm:gap-6">
          <GameButton color="blue" href={WELCOME_CONFIG.startGameHref}>
            🚀 Start Game
          </GameButton>
          <GameButton color="gold" href="/leaderboard">
            🏆 Leaderboard
          </GameButton>
        </div>
      </div>
    </div>
  );
}
'use client';

import Image from 'next/image';
import GameButton from '@/app/components/ui/GameButton';
import { useAudio } from '@/hooks/useAudio';

// Welcome page constants
const WELCOME_CONFIG = {
  backgroundImage: "/images/start-screen-bg.png",
  titleImage: "/images/business-empire-title.png",
  titleAlt: "Business Empire",
  titleWidth: 300,
  titleHeight: 200,
  startGameHref: "/select-industry"
} as const;

export default function WelcomePage() {
  // Play welcome music when component mounts
  useAudio('welcome', true);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('${WELCOME_CONFIG.backgroundImage}')`
      }}
    >
      {/* Fallback background gradient using design system colors */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(to bottom, 
            rgba(35, 170, 246, 0.3), 
            rgba(16, 87, 218, 0.5)
          )`
        }}
      />
      
      {/* Content Container */}
      <div className="relative z-10 text-center w-full max-w-2xl">
        {/* Game Title Image */}
        <div className="mb-10 sm:mb-12 md:mb-16 flex justify-center">
          <div className="relative">
            <Image
              src={WELCOME_CONFIG.titleImage}
              alt={WELCOME_CONFIG.titleAlt}
              width={WELCOME_CONFIG.titleWidth}
              height={WELCOME_CONFIG.titleHeight}
              className="max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg h-auto drop-shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
              priority
            />
          </div>
        </div>
        
        {/* Game Button */}
        <div className="flex justify-center">
          <GameButton color="blue" href={WELCOME_CONFIG.startGameHref}>
            Start Game
          </GameButton>
        </div>
      </div>
    </div>
  );
}
'use client';

import Image from 'next/image';
import GameButton from '@/app/components/ui/GameButton';
import { useAudio } from '@/hooks/useAudio';

// Welcome page constants
const WELCOME_CONFIG = {
  backgroundImage: "/images/start-screen-bg.png",
  titleImage: "/images/business-empire-title.png",
  titleAlt: "Business Empire",
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
          <div className="relative w-[280px] sm:w-96 md:w-[448px] lg:w-[512px]">
            <div className="relative pb-[66.67%]">
              <Image
                src={WELCOME_CONFIG.titleImage}
                alt={WELCOME_CONFIG.titleAlt}
                fill
                sizes="(max-width: 640px) 280px, (max-width: 768px) 384px, (max-width: 1024px) 448px, 512px"
                className="object-contain drop-shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                priority
              />
            </div>
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
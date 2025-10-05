'use client';

import Link from 'next/link';
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
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('${WELCOME_CONFIG.backgroundImage}')`
      }}
    >
      {/* Fallback background color in case image doesn't load */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-blue-500 -z-10"></div>
      
      
      {/* Game Title and Button */}
      <div className="relative z-10 text-center">
        {/* Game Title Image */}
        <div className="mb-8 flex justify-center">
          <Image
            src={WELCOME_CONFIG.titleImage}
            alt={WELCOME_CONFIG.titleAlt}
            width={WELCOME_CONFIG.titleWidth}
            height={WELCOME_CONFIG.titleHeight}
            className="max-w-sm md:max-w-md lg:max-w-lg h-auto"
            priority
          />
        </div>
        
        {/* Game Button */}
        <GameButton color="blue" href={WELCOME_CONFIG.startGameHref}>Start Game</GameButton>
      </div>
    </div>
  );
}
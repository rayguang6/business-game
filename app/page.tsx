'use client';

import Link from 'next/link';
import Image from 'next/image';
import GameButton from './components/ui/GameButton';

export default function WelcomePage() {

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/start-screen-bg.png')"
      }}
    >
      {/* Fallback background color in case image doesn't load */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-blue-500 -z-10"></div>
      
      {/* Game Title and Button */}
      <div className="relative z-10 text-center">
        {/* Game Title Image */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/business-empire-title.png"
            alt="Business Empire"
            width={600}
            height={200}
            className="max-w-sm md:max-w-md lg:max-w-lg h-auto"
            priority
          />
        </div>
        
        {/* Game Button */}
        <GameButton color="blue" href="/select-industry">Start Game</GameButton>
      </div>
    </div>
  );
}
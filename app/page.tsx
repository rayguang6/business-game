'use client';

import Link from 'next/link';
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
        {/* Game Title */}
        <h1 className="text-6xl md:text-8xl font-bold mb-8 text-stroke text-stroke-dark-blue text-stroke-massive">
          Business Empire
        </h1>
        
        {/* Game Button */}
        <GameButton color="blue" href="/select-industry">Start Game</GameButton>
      </div>
    </div>
  );
}
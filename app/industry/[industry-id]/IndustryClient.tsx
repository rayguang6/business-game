'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import GameButton from '@/app/components/ui/GameButton';
import { useAudio } from '@/hooks/useAudio';
import Image from 'next/image';
import type { Industry } from '@/lib/features/industries';

interface IndustryClientProps {
  industry: Industry;
}

export default function IndustryClient({ industry }: IndustryClientProps) {
  const router = useRouter();
  const setSelectedIndustry = useGameStore((state) => state.setSelectedIndustry);
  const setUsername = useGameStore((state) => state.setUsername);
  const savedUsername = useGameStore((state) => state.username);
  const [username, setUsernameInput] = useState('');
  
  // Load saved username from store on mount
  useEffect(() => {
    if (savedUsername) {
      setUsernameInput(savedUsername);
    }
  }, [savedUsername]);
  const [error, setError] = useState<string | null>(null);
  
  // Play selection music
  useAudio('selection', true);

  const handleStartGame = () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Please enter a username');
      return;
    }
    
    if (trimmedUsername.length > 50) {
      setError('Username must be 50 characters or less');
      return;
    }
    
    // Store username in game store
    setUsername(trimmedUsername);
    
    // Set industry and navigate to game
    setSelectedIndustry(industry);
    router.push(`/game/${industry.id}`);
  };

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
      {/* Animated background pattern */}
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

      <div className="relative max-w-4xl mx-auto z-10">
        {/* Header */}
        <header className="text-center mb-6 sm:mb-8 pt-6 sm:pt-8">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2 text-white relative inline-block"
            style={{
              textShadow: `
                0 0 20px rgba(100, 181, 246, 0.6),
                0 4px 20px rgba(13, 71, 161, 0.4),
                0 2px 8px rgba(13, 71, 161, 0.3)
              `
            }}
          >
            {industry.icon} {industry.name}
          </h1>

          <p className="text-sm sm:text-base text-white/70 max-w-lg mx-auto">
            {industry.description}
          </p>
        </header>

        {/* Industry Image (if available) */}
        {industry.image && (
          <div className="mb-6 flex justify-center">
            <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
              <Image
                src={industry.image}
                alt={industry.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 448px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {/* Username Input - Below the image */}
        <div className="max-w-md mx-auto">
          <div className="space-y-4">
            <div className="text-center">
              <label className="block text-white/90 text-sm font-medium mb-2">
                Enter your username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleStartGame();
                  }
                }}
                placeholder="Enter username..."
                maxLength={50}
                className="w-full px-4 py-4 rounded-2xl bg-white/15 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/30 transition-all text-lg font-medium shadow-lg"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-red-400 text-sm text-center font-medium">{error}</p>
              )}
            </div>

            <GameButton
              color="gold"
              onClick={handleStartGame}
              fullWidth
              disabled={!username.trim()}
              size="lg"
            >
              🚀 Start Game
            </GameButton>
          </div>
        </div>
      </div>
    </div>
  );
}












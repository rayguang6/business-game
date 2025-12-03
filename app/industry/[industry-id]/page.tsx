'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { getCachedIndustryById, type Industry } from '@/lib/features/industries';
import { fetchIndustriesFromSupabase } from '@/lib/data/industryRepository';
import GameButton from '@/app/components/ui/GameButton';
import { useAudio } from '@/hooks/useAudio';
import Image from 'next/image';

export default function IndustryPage() {
  const router = useRouter();
  const params = useParams();
  const industryId = params['industry-id'] as string;
  
  const setSelectedIndustry = useGameStore((state) => state.setSelectedIndustry);
  const setUsername = useGameStore((state) => state.setUsername);
  
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [username, setUsernameInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Play selection music
  useAudio('selection', true);

  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      setIsLoading(true);
      setError(null);
      
      // First try cached
      const cached = getCachedIndustryById(industryId);
      if (cached) {
        // Check if industry is available
        if (!cached.isAvailable) {
          if (isMounted) {
            setError('This industry is not currently available');
            setIsLoading(false);
          }
          return;
        }
        if (isMounted) {
          setIndustry(cached);
          setIsLoading(false);
        }
        return;
      }
      
      // Fetch from database to check availability
      const industries = await fetchIndustriesFromSupabase();
      if (!isMounted) return;
      
      if (!industries) {
        setError('Failed to load industry data');
        setIsLoading(false);
        return;
      }
      
      const found = industries.find((i) => i.id === industryId);
      if (!found) {
        setError('Industry not found');
        setIsLoading(false);
        return;
      }
      
      // Check availability
      if (!found.isAvailable) {
        setError('This industry is not currently available');
        setIsLoading(false);
        return;
      }
      
      setIndustry(found);
      setIsLoading(false);
    })();
    
    return () => {
      isMounted = false;
    };
  }, [industryId]);

  const handleStartGame = () => {
    if (!industry) return;
    
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Please enter a username');
      return;
    }
    
    if (trimmedUsername.length > 50) {
      setError('Username must be 50 characters or less');
      return;
    }
    
    // Store username in game store (no DB call - just memory)
    setUsername(trimmedUsername);
    
    // Set industry and navigate to game
    setSelectedIndustry(industry);
    router.push(`/game/${industry.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 to-blue-700 text-white text-lg font-semibold">
        Loading industry...
      </div>
    );
  }

  if (error && !industry) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-sky-400 to-blue-700 text-white text-center px-6">
        <p className="text-2xl font-semibold">Industry Not Available</p>
        <p className="text-base max-w-md text-blue-100">{error}</p>
        <GameButton color="blue" href="/select-industry">
          Back to Industries
        </GameButton>
      </div>
    );
  }

  if (!industry) {
    return null;
  }

  return (
    <div 
      className="min-h-screen p-4 sm:p-6 md:p-8 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, 
          rgba(10, 14, 26, 0.95) 0%,
          rgba(26, 31, 46, 0.98) 50%,
          rgba(10, 14, 26, 0.95) 100%
        )`
      }}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0 animate-pulse-slow"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(35, 170, 246, 0.3) 0%, transparent 50%),
                              radial-gradient(circle at 80% 80%, rgba(255, 215, 0, 0.2) 0%, transparent 50%),
                              radial-gradient(circle at 40% 20%, rgba(35, 170, 246, 0.2) 0%, transparent 50%)`,
            backgroundSize: '100% 100%'
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto z-10">
        {/* Header */}
        <header className="text-center mb-8 sm:mb-12 pt-6 sm:pt-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-1 w-16 sm:w-24 bg-gradient-to-r from-transparent via-[var(--game-secondary)] to-[var(--game-secondary)] rounded-full" />
            <div className="w-3 h-3 bg-[var(--game-secondary)] rounded-full shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
            <div className="h-1 w-16 sm:w-24 bg-gradient-to-l from-transparent via-[var(--game-secondary)] to-[var(--game-secondary)] rounded-full" />
          </div>

          <h1 
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 text-white relative inline-block"
            style={{
              textShadow: `
                0 0 20px rgba(35, 170, 246, 0.5),
                0 4px 20px rgba(0, 0, 0, 0.8),
                0 2px 8px rgba(0, 0, 0, 0.6)
              `
            }}
          >
            {industry.icon} {industry.name}
          </h1>

          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8">
            {industry.description}
          </p>
        </header>

        {/* Industry Image (if available) */}
        {industry.image && (
          <div className="mb-8 flex justify-center">
            <div className="relative w-full max-w-md h-64 rounded-xl overflow-hidden border-2 border-[var(--game-primary)]/30 shadow-lg">
              <Image
                src={industry.image}
                alt={industry.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {/* Username Input Form */}
        <div className="bg-gradient-to-br from-[var(--bg-secondary)]/90 to-[var(--bg-tertiary)]/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 md:p-10 border-2 border-[var(--border-primary)] shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 text-center">
            Enter Your Username
          </h2>
          <p className="text-white/70 text-center mb-6">
            Choose a username to track your progress
          </p>

          <div className="space-y-4">
            <div>
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
                placeholder="Enter your username"
                maxLength={50}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-[var(--border-primary)] text-white placeholder-white/50 focus:outline-none focus:border-[var(--game-primary)] focus:ring-4 focus:ring-[var(--game-primary)]/30 transition-all text-lg"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-red-400 text-sm text-center">{error}</p>
              )}
            </div>

            <GameButton
              color="blue"
              onClick={handleStartGame}
              fullWidth
              disabled={!username.trim()}
              size="lg"
            >
              🚀 Start Game
            </GameButton>
          </div>
        </div>

        {/* Back Button - Commented out for now, can be restored later */}
        {/* <div className="text-center mt-8">
          <GameButton
            color="blue"
            href="/select-industry"
            size="sm"
          >
            ← Back to Industries
          </GameButton>
        </div> */}
      </div>
    </div>
  );
}


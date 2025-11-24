'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

interface LeadProgressProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-left';
}

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
}

interface FeedbackItem {
  id: string;
  value: number;
}

export function LeadProgress({ position = 'bottom-right' }: LeadProgressProps) {
  const { leadProgress, conversionRate, customers } = useGameStore();
  const [previousProgress, setPreviousProgress] = useState(leadProgress);
  const [previousCustomerCount, setPreviousCustomerCount] = useState(() => customers?.length || 0);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showCustomerGenerated, setShowCustomerGenerated] = useState(false);
  const [customerMessageKey, setCustomerMessageKey] = useState(0);
  const [celebrationParticles, setCelebrationParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);
  const feedbackIdRef = useRef(0);
  const celebrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect when a customer is actually generated (better detection)
  useEffect(() => {
    const currentCustomerCount = customers?.length || 0;
    
    // Only trigger if customer count actually increased
    if (currentCustomerCount > previousCustomerCount) {
      // Clear any existing timeouts first
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
        celebrationTimeoutRef.current = null;
      }
      
      // Force reset by incrementing key and clearing state
      setShowCustomerGenerated(false);
      setCelebrationParticles([]);
      setCustomerMessageKey(prev => prev + 1);
      
      // Use requestAnimationFrame to ensure state updates are processed
      requestAnimationFrame(() => {
        setShowCustomerGenerated(true);
        
        // Create gold particles (same style as lead particles, just gold color)
        const celebrationParticles: Particle[] = [];
        const particleCount = 5;
        for (let i = 0; i < particleCount; i++) {
          // Spread particles more evenly to avoid overlap
          const angle = (i / particleCount) * Math.PI * 2;
          const spread = 20; // Distance from center
          celebrationParticles.push({
            id: particleIdRef.current++,
            x: 50 + Math.cos(angle) * spread,
            y: 50 + Math.sin(angle) * spread,
            delay: i * 50, // Stagger particles
          });
        }
        setCelebrationParticles(celebrationParticles);
        
        // Remove celebration particles after animation
        setTimeout(() => {
          setCelebrationParticles(prev => prev.filter(p => !celebrationParticles.some(cp => cp.id === p.id)));
        }, 2000);
        
        // Hide message after animation completes
        celebrationTimeoutRef.current = setTimeout(() => {
          setShowCustomerGenerated(false);
          celebrationTimeoutRef.current = null;
        }, 2000);
      });
    }
    
    // Always update previous count
    setPreviousCustomerCount(currentCustomerCount);
    
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
        celebrationTimeoutRef.current = null;
      }
    };
  }, [customers?.length, previousCustomerCount]);

  // Detect when progress increases and show feedback + particles
  useEffect(() => {
    const progressDiff = leadProgress - previousProgress;
    
    if (progressDiff > 0 && leadProgress < 100) {
      // Calculate how many leads contributed (each lead adds conversionRate)
      const leadsContributed = Math.round(progressDiff / conversionRate);
      
      // Add feedback for each lead contribution (show +10, +10, +10 if 3 leads spawn)
      const newFeedbackItems: FeedbackItem[] = [];
      for (let i = 0; i < leadsContributed; i++) {
        newFeedbackItems.push({
          id: `feedback-${feedbackIdRef.current++}-${Date.now()}-${i}`,
          value: conversionRate,
        });
      }
      setFeedbackItems(prev => [...prev, ...newFeedbackItems]);
      
      // Remove feedback items after animation
      newFeedbackItems.forEach((item) => {
        setTimeout(() => {
          setFeedbackItems(prev => prev.filter(f => f.id !== item.id));
        }, 1500);
      });
      
      // Create particles
      const newParticles: Particle[] = [];
      const particleCount = Math.min(5, Math.ceil(progressDiff / 2));
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: particleIdRef.current++,
          x: 50 + (Math.random() - 0.5) * 30, // Random position around center
          y: 50,
          delay: i * 50, // Stagger particles
        });
      }
      setParticles(prev => [...prev, ...newParticles]);
      
      // Remove particles after animation
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.includes(p)));
      }, 2000);
    }
    
    setPreviousProgress(leadProgress);
    
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }
    };
  }, [leadProgress, previousProgress, conversionRate]);

  const isComplete = leadProgress >= 100;
  const progressPercent = Math.min(100, Math.round(leadProgress));
  const isNearComplete = progressPercent >= 90 && progressPercent < 100;

  const positionClasses = position === 'bottom-right'
    ? 'bottom-2 right-2 md:bottom-4 md:right-4'
    : position === 'bottom-left'
    ? 'bottom-2 left-2 md:bottom-4 md:left-4'
    : 'top-20 left-4';

  return (
    <div className={`absolute ${positionClasses} z-40 pointer-events-none`}>
      <div className="relative bg-black/60 backdrop-blur-lg text-white px-2 py-1.5 md:px-4 md:py-3.5 rounded-lg md:rounded-xl shadow-2xl border border-blue-500/30 min-w-[120px] md:min-w-[190px] overflow-hidden">
        {/* Animated background glow */}
        <div 
          className={`absolute inset-0 transition-opacity duration-500 ${
            isComplete ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{
            background: isComplete 
              ? 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.3), transparent 70%)'
              : 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.2), transparent 70%)',
            opacity: 0.2,
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        />

        {/* Particles container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-1.5 h-1.5 rounded-full bg-blue-400 pointer-events-none"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                boxShadow: '0 0 4px rgba(59, 130, 246, 0.8), 0 0 8px rgba(59, 130, 246, 0.6)',
                animation: `particle-float 1.5s ease-out ${particle.delay}ms forwards`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
          
          {/* Celebration particles when customer is generated - gold version of lead particles */}
          {celebrationParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-1.5 h-1.5 rounded-full bg-yellow-400 pointer-events-none"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                boxShadow: '0 0 4px rgba(251, 191, 36, 0.8), 0 0 8px rgba(251, 191, 36, 0.6)',
                animation: `particle-float 1.5s ease-out ${particle.delay}ms forwards`,
                transform: 'translate(-50%, -50%)',
                zIndex: 15,
              }}
            />
          ))}
        </div>
        
        {/* Customer Generated Message - ensure it's always on top */}
        {showCustomerGenerated && (
          <div 
            key={`customer-msg-${customerMessageKey}`}
            className="absolute inset-0 flex items-center justify-center pointer-events-none" 
            style={{ zIndex: 50 }}
          >
            <div 
              className="text-[9px] md:text-xs font-bold text-green-300"
              style={{
                textShadow: '0 0 4px rgba(34, 197, 94, 0.8), 0 2px 4px rgba(0,0,0,0.8)',
                animation: 'float-up 1.5s ease-out forwards',
              }}
            >
              Customer +1
            </div>
          </div>
        )}

        {/* Feedback animations - floating text at progress bar */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {feedbackItems.map((item, index) => (
            <div
              key={item.id}
              className="absolute text-[9px] md:text-xs font-bold text-blue-300 pointer-events-none"
              style={{
                top: 'calc(50% + 8px)',
                left: '50%',
                textShadow: '0 0 4px rgba(59, 130, 246, 0.8), 0 2px 4px rgba(0,0,0,0.8)',
                animation: 'float-up 1.5s ease-out forwards',
                transform: `translate(-50%, -50%) translate(${index * 6}px, ${index * -3}px)`,
              }}
            >
              +{Math.round(item.value)}%
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="mb-1.5 md:mb-3.5">
            <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1.5">
              <span className="text-xs md:text-base drop-shadow-[0_0_4px_rgba(59,130,246,0.6)]">👥</span>
              <span className="text-[9px] md:text-xs font-bold text-blue-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Lead Conversion
              </span>
            </div>
            <div className="text-[8px] md:text-[10px] text-gray-300 pl-4 md:pl-6 leading-tight">
              {conversionRate.toFixed(1)}% conversion rate
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative mb-0.5 md:mb-1">
            <div className="w-full bg-gray-800/60 rounded-full h-2 md:h-3 overflow-hidden border border-gray-700/50">
              <div
                className={`h-2 md:h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
                  isComplete ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
                } ${isNearComplete ? 'animate-[pulse-bar_1s_ease-in-out_infinite]' : ''}`}
                style={{
                  width: `${progressPercent}%`,
                  boxShadow: isComplete 
                    ? '0 0 12px rgba(34, 197, 94, 0.7), inset 0 1px 0 rgba(255,255,255,0.2)' 
                    : isNearComplete
                    ? '0 0 10px rgba(59, 130, 246, 0.8), inset 0 1px 0 rgba(255,255,255,0.2)'
                    : '0 0 8px rgba(59, 130, 246, 0.6), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                {/* Shimmer effect */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  style={{
                    animation: 'shimmer 2s ease-in-out infinite',
                    transform: 'translateX(-100%)',
                  }}
                />
              </div>
            </div>
            
            {/* Percentage overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className={`text-[8px] md:text-[11px] font-bold ${
                isComplete ? 'text-green-200' : 'text-white'
              }`} style={{
                textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 8px rgba(59, 130, 246, 0.5)',
              }}>
                {progressPercent}%
              </span>
            </div>
          </div>

          {/* Completion indicator */}
          {isComplete && (
            <div className="mt-1 md:mt-2.5 text-center">
              <div className="text-[8px] md:text-xs text-green-300 font-bold animate-pulse drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">
                ✓ Ready to close!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


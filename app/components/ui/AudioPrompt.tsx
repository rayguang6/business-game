'use client';

import React from 'react';
import { useAudioControls } from '@/hooks/useAudio';

interface AudioPromptProps {
  className?: string;
}

export function AudioPrompt({ className = '' }: AudioPromptProps) {
  const { audioState, enableAudio } = useAudioControls();

  // Don't show if user has already interacted or if audio is playing
  if (audioState.userHasInteracted || audioState.isPlaying) {
    return null;
  }

  const handleEnableAudio = () => {
    enableAudio();
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg border border-blue-500">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🎵</div>
          <div>
            <div className="font-semibold text-sm">Enable Music</div>
            <div className="text-xs text-blue-100">
              Click to start background music
            </div>
          </div>
          <button
            onClick={handleEnableAudio}
            className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Enable
          </button>
        </div>
      </div>
    </div>
  );
}

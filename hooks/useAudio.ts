import { useEffect, useRef, useState } from 'react';
import { audioManager, AudioTrack, AudioState } from '@/lib/audio/audioManager';

/**
 * Hook for managing background music in React components
 */
export function useAudio(track: AudioTrack, autoPlay: boolean = true) {
  const [audioState, setAudioState] = useState<AudioState>(audioManager.getState());
  const isInitialized = useRef(false);

  // Update audio state when it changes
  useEffect(() => {
    const updateState = () => {
      setAudioState(audioManager.getState());
    };

    // Listen for audio events (we'll add these to the audio manager if needed)
    // For now, we'll update state when the hook is used
    updateState();

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Handle track changes
  useEffect(() => {
    if (autoPlay && track !== audioState.currentTrack) {
      audioManager.playTrack(track);
      setAudioState(audioManager.getState());
    }
  }, [track, autoPlay, audioState.currentTrack]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't stop audio on unmount - let the next component handle it
      // This allows smooth transitions between screens
    };
  }, []);

  return {
    audioState,
    playTrack: (newTrack: AudioTrack) => {
      audioManager.playTrack(newTrack);
      setAudioState(audioManager.getState());
    },
    stopTrack: () => {
      audioManager.stopCurrentTrack();
      setAudioState(audioManager.getState());
    },
    pauseTrack: () => {
      audioManager.pauseCurrentTrack();
      setAudioState(audioManager.getState());
    },
    resumeTrack: () => {
      audioManager.resumeCurrentTrack();
      setAudioState(audioManager.getState());
    },
    setVolume: (volume: number) => {
      audioManager.setVolume(volume);
      setAudioState(audioManager.getState());
    },
    toggleMute: () => {
      audioManager.toggleMute();
      setAudioState(audioManager.getState());
    },
  };
}

/**
 * Hook for audio controls (volume, mute, etc.)
 */
export function useAudioControls() {
  const [audioState, setAudioState] = useState<AudioState>(audioManager.getState());

  useEffect(() => {
    const updateState = () => {
      setAudioState(audioManager.getState());
    };

    // Update state periodically to keep it in sync
    const interval = setInterval(updateState, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    audioState,
    setVolume: (volume: number) => {
      audioManager.setVolume(volume);
      setAudioState(audioManager.getState());
    },
    toggleMute: () => {
      audioManager.toggleMute();
      setAudioState(audioManager.getState());
    },
    playTrack: (track: AudioTrack) => {
      audioManager.playTrack(track);
      setAudioState(audioManager.getState());
    },
    stopTrack: () => {
      audioManager.stopCurrentTrack();
      setAudioState(audioManager.getState());
    },
    isAudioReady: () => {
      return audioManager.isAudioReady();
    },
    enableAudio: () => {
      audioManager.enableAudio();
      setAudioState(audioManager.getState());
    },
  };
}

import { audioManager, AudioFx } from '@/lib/audio/audioManager';

/**
 * Hook for playing sound effects
 */
export function useSoundEffects() {
  const playSound = (effect: AudioFx) => {
    audioManager.playSoundEffect(effect);
  };

  return {
    // UI Actions
    playButtonClick: () => playSound('buttonClick'),
    playButtonClickDisabled: () => playSound('buttonClickDisabled'),
    playClickButton: () => playSound('clickButton'),

    // Business Actions
    playHireLetsDoThis: () => playSound('hireLetsDoThis'),
    playHireLetsGo: () => playSound('hireLetsGo'),
    playHireWooHoo: () => playSound('hireWooHoo'),
    playRandomHireSound: () => {
      const hireSounds = ['hireLetsDoThis', 'hireLetsGo', 'hireWooHoo'] as const;
      const randomSound = hireSounds[Math.floor(Math.random() * hireSounds.length)];
      playSound(randomSound);
    },
    playUpgrade: () => playSound('upgrade'),

    // Service & Customer
    playServiceFinished: () => playSound('serviceFinished'),
    playJobDone: () => playSound('jobDone'),
    playJobLost: () => playSound('jobLost'),

    // Game Events
    playEventCardPopup: () => playSound('eventCardPopup'),
    // playEventCardGood: () => playSound('eventCardGood'),
    // playEventCardBad: () => playSound('eventCardBad'),

    // Progression
    playLevelUp: () => playSound('levelUp'),
    playMonthChange: () => playSound('monthChange'),
  };
}
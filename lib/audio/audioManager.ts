/**
 * Audio Manager
 * Handles background music and sound effects for the game
 */

export type AudioTrack = 'welcome' | 'selection' | 'game' | 'none';
export type AudioFx =
  // UI Actions
  | 'buttonClick'
  | 'buttonClickDisabled'
  | 'clickButton'
  // Business Actions
  | 'hireLetsDoThis'
  | 'hireLetsGo'
  | 'hireWooHoo'
  | 'upgrade'
  // Service & Customer
  | 'serviceFinished'
  | 'jobDone'
  | 'jobLost'
  // Game Events
  | 'eventCardPopup'
  | 'eventCardGood'
  | 'eventCardBad'
  // Progression
  | 'levelUp'
  | 'monthChange';

export interface AudioState {
  currentTrack: AudioTrack;
  isPlaying: boolean;
  volume: number;
  soundEffectVolume: number;
  isMusicMuted: boolean;
  isSoundEffectsMuted: boolean;
  // Legacy property for backward compatibility
  isMuted: boolean;
}

class AudioManager {
  private audioElements: Map<AudioTrack, HTMLAudioElement> = new Map();
  private currentTrack: AudioTrack = 'none';
  private isPlaying: boolean = false;
  private volume: number = 0.5; // Default volume (50%)
  private soundEffectVolume: number = 0.8; // Default sound effect volume (80%)
  private isMusicMuted: boolean = false;
  private isSoundEffectsMuted: boolean = false;
  // Legacy property for backward compatibility
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private soundEffectElements: Map<AudioFx, HTMLAudioElement> = new Map();

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initializeAudioElements();
      this.initializeSoundEffectElements();
    }
  }

  private initializeAudioElements() {
    // Only initialize on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Create audio elements for different tracks
    const tracks: { track: AudioTrack; src: string }[] = [
      { track: 'welcome', src: '/audio/welcome-music.mp3' },
      { track: 'selection', src: '/audio/selection-music.mp3' },
      { track: 'game', src: '/audio/game-music.mp3' },
    ];

    tracks.forEach(({ track, src }) => {
      try {
        const audio = new Audio(src);
        audio.loop = true;
        audio.volume = this.volume;
        audio.preload = 'auto';
        
        // Handle audio loading errors gracefully
        audio.addEventListener('error', () => {
          console.warn(`Failed to load audio track: ${track} (${src})`);
        });

        // Handle successful loading
        audio.addEventListener('canplaythrough', () => {
          // Audio track loaded successfully
        });

        this.audioElements.set(track, audio);
      } catch (error) {
        console.warn(`Failed to create audio element for track: ${track}`, error);
      }
    });

    this.isInitialized = true;
  }

  private initializeSoundEffectElements() {
    if (typeof window === 'undefined') {
      return;
    }

    const soundEffects: { effect: AudioFx; src: string }[] = [
      // UI Actions
      { effect: 'buttonClick', src: '/audio/button-click.mp3' },
      { effect: 'buttonClickDisabled', src: '/audio/Click Button Disabled_effect.MP3' },

      // Business Actions
      { effect: 'hireLetsDoThis', src: '/audio/Hiring_Lets_Do_This.MP3' },
      { effect: 'hireLetsGo', src: '/audio/Hiring_Lets_Go.MP3' },
      { effect: 'hireWooHoo', src: '/audio/Hiring_Woo_Hoo.MP3' },
      { effect: 'upgrade', src: '/audio/Upgrade_effect.MP3' },

      // Service & Customer
      { effect: 'serviceFinished', src: '/audio/service-finished.mp3' },
      { effect: 'jobDone', src: '/audio/Job Done_effect.mp3' },
      { effect: 'jobLost', src: '/audio/Job Lost_effect.MP3' },

      // Game Events
      { effect: 'eventCardPopup', src: '/audio/Event Card Pop-up_effect.MP3' },
      // { effect: 'eventCardGood', src: '/audio/Event Card-Good_effect.MP3' },
      // { effect: 'eventCardBad', src: '/audio/Event Card-Bad_effect.MP3' },

      // Progression
      { effect: 'levelUp', src: '/audio/Level Up_effect.MP3' },
      { effect: 'monthChange', src: '/audio/Month Change_effect.MP3' },
    ];

    soundEffects.forEach(({ effect, src }) => {
      try {
        const audio = new Audio(src);
        audio.volume = this.soundEffectVolume;
        audio.preload = 'auto';

        audio.addEventListener('error', () => {
          console.warn(`Failed to load sound effect: ${effect} (${src})`);
        });

        this.soundEffectElements.set(effect, audio);
      } catch (error) {
        console.warn(`Failed to create audio element for sound effect: ${effect}`, error);
      }
    });
  }

  /**
   * Play a specific track
   */
  async playTrack(track: AudioTrack): Promise<void> {
    // Only work on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Initialize if not already done
    if (!this.isInitialized) {
      this.initializeAudioElements();
    }

    if (track === 'none') {
      this.stopCurrentTrack();
      return;
    }

    // Stop current track if different or if current track is not playing
    if (this.currentTrack !== track || !this.isPlaying) {
      this.stopCurrentTrack();
    }

    const audio = this.audioElements.get(track);
    if (!audio) {
      console.warn(`Audio track not found: ${track}`);
      return;
    }

    try {
      this.currentTrack = track;
      this.isPlaying = true;
      
      // Set volume and mute state
      audio.volume = this.isMuted ? 0 : this.volume;

      await audio.play();
    } catch (error) {
      console.warn(`Failed to play audio track: ${track}`, error);
      this.isPlaying = false;
    }
  }

  /**
   * Play a specific sound effect
   */
  async playSoundEffect(effect: AudioFx): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    if (!this.isInitialized) {
      this.initializeAudioElements();
      this.initializeSoundEffectElements();
    }

    const audio = this.soundEffectElements.get(effect);
    if (!audio) {
      console.warn(`Sound effect not found: ${effect}`);
      return;
    }

    try {
      audio.currentTime = 0; // Reset to start for immediate playback
      audio.volume = this.isMuted ? 0 : this.soundEffectVolume;
      await audio.play();
    } catch (error) {
      console.warn(`Failed to play sound effect: ${effect}`, error);
    }
  }

  /**
   * Stop the current track
   */
  stopCurrentTrack(): void {
    // Only work on client side
    if (typeof window === 'undefined') {
      return;
    }

    if (this.currentTrack !== 'none') {
      const audio = this.audioElements.get(this.currentTrack);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
    this.currentTrack = 'none';
    this.isPlaying = false;
  }

  /**
   * Pause the current track
   */
  pauseCurrentTrack(): void {
    // Only work on client side
    if (typeof window === 'undefined') {
      return;
    }

    if (this.currentTrack !== 'none') {
      const audio = this.audioElements.get(this.currentTrack);
      if (audio) {
        audio.pause();
      }
    }
    this.isPlaying = false;
  }

  /**
   * Resume the current track
   */
  async resumeCurrentTrack(): Promise<void> {
    // Only work on client side
    if (typeof window === 'undefined') {
      return;
    }

    if (this.currentTrack !== 'none') {
      const audio = this.audioElements.get(this.currentTrack);
      if (audio) {
        try {
          await audio.play();
          this.isPlaying = true;
        } catch (error) {
          console.warn(`Failed to resume audio track: ${this.currentTrack}`, error);
        }
      }
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Only update on client side
    if (typeof window !== 'undefined') {
      // Update all audio elements
      this.audioElements.forEach((audio) => {
        audio.volume = this.isMuted ? 0 : this.volume;
      });
    }
  }

  /**
   * Toggle music mute state
   */
  toggleMusicMute(): void {
    this.isMusicMuted = !this.isMusicMuted;

    // Only update on client side
    if (typeof window !== 'undefined') {
      // Update all music audio elements
      this.audioElements.forEach((audio) => {
        audio.volume = this.isMusicMuted ? 0 : this.volume;
      });
    }
  }

  /**
   * Toggle sound effects mute state
   */
  toggleSoundEffectsMute(): void {
    this.isSoundEffectsMuted = !this.isSoundEffectsMuted;

    // Only update on client side
    if (typeof window !== 'undefined') {
      // Update all sound effect elements
      this.soundEffectElements.forEach((audio) => {
        audio.volume = this.isSoundEffectsMuted ? 0 : this.soundEffectVolume;
      });
    }
  }

  /**
   * Toggle mute state (legacy method for backward compatibility)
   */
  toggleMute(): void {
    this.isMuted = !this.isMuted;

    // Only update on client side
    if (typeof window !== 'undefined') {
      // Update all audio elements
      this.audioElements.forEach((audio) => {
        audio.volume = this.isMuted ? 0 : this.volume;
      });
      this.soundEffectElements.forEach((audio) => {
        audio.volume = this.isMuted ? 0 : this.soundEffectVolume;
      });
    }
  }

  /**
   * Get current audio state
   */
  getState(): AudioState {
    return {
      currentTrack: this.currentTrack,
      isPlaying: this.isPlaying,
      volume: this.volume,
      soundEffectVolume: this.soundEffectVolume,
      isMusicMuted: this.isMusicMuted,
      isSoundEffectsMuted: this.isSoundEffectsMuted,
      // Legacy property for backward compatibility
      isMuted: this.isMuted,
    };
  }


  /**
   * Clean up audio resources
   */
  destroy(): void {
    // Only work on client side
    if (typeof window === 'undefined') {
      return;
    }

    this.stopCurrentTrack();
    this.audioElements.forEach((audio) => {
      audio.src = '';
    });
    this.audioElements.clear();
  }
}

// Create singleton instance
export const audioManager = new AudioManager();

// Export types and manager
export { AudioManager };

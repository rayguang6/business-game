/**
 * Audio Manager
 * Handles background music and sound effects for the game
 */

export type AudioTrack = 'welcome' | 'game' | 'none';

export interface AudioState {
  currentTrack: AudioTrack;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  userHasInteracted: boolean;
  pendingTrack: AudioTrack | null;
}

class AudioManager {
  private audioElements: Map<AudioTrack, HTMLAudioElement> = new Map();
  private currentTrack: AudioTrack = 'none';
  private isPlaying: boolean = false;
  private volume: number = 0.5; // Default volume (50%)
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private userHasInteracted: boolean = false;
  private pendingTrack: AudioTrack | null = null;

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initializeAudioElements();
      this.setupUserInteractionHandler();
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
          console.log(`Audio track loaded successfully: ${track}`);
        });

        this.audioElements.set(track, audio);
      } catch (error) {
        console.warn(`Failed to create audio element for track: ${track}`, error);
      }
    });

    this.isInitialized = true;
  }

  private setupUserInteractionHandler() {
    // Listen for first user interaction to enable audio
    const enableAudio = () => {
      console.log('🎵 User interaction detected - enabling audio');
      this.userHasInteracted = true;
      
      // Play pending track if there is one
      if (this.pendingTrack) {
        console.log(`🎵 Playing pending track: ${this.pendingTrack}`);
        this.playTrack(this.pendingTrack);
        this.pendingTrack = null;
      }
      
      // Remove event listeners after first interaction
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };

    // Listen for various user interactions
    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });
    document.addEventListener('touchstart', enableAudio, { once: true });
    
    console.log('🎵 Audio interaction listeners set up');
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

    // If user hasn't interacted yet, store the track to play later
    if (!this.userHasInteracted) {
      this.pendingTrack = track;
      console.log(`Audio will start after user interaction: ${track}`);
      return;
    }

    // Stop current track if different
    if (this.currentTrack !== track) {
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
      console.log(`Audio track playing: ${track}`);
    } catch (error) {
      console.warn(`Failed to play audio track: ${track}`, error);
      this.isPlaying = false;
      
      // If it's a user interaction error, store the track for later
      if (error instanceof Error && error.name === 'NotAllowedError') {
        this.pendingTrack = track;
        console.log(`Audio blocked by browser, will retry after user interaction: ${track}`);
      }
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
   * Toggle mute state
   */
  toggleMute(): void {
    this.isMuted = !this.isMuted;
    
    // Only update on client side
    if (typeof window !== 'undefined') {
      // Update all audio elements
      this.audioElements.forEach((audio) => {
        audio.volume = this.isMuted ? 0 : this.volume;
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
      isMuted: this.isMuted,
      userHasInteracted: this.userHasInteracted,
      pendingTrack: this.pendingTrack,
    };
  }

  /**
   * Check if audio is ready to play (user has interacted)
   */
  isAudioReady(): boolean {
    return this.userHasInteracted;
  }

  /**
   * Manually enable audio (for testing or special cases)
   */
  enableAudio(): void {
    this.userHasInteracted = true;
    if (this.pendingTrack) {
      this.playTrack(this.pendingTrack);
      this.pendingTrack = null;
    }
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

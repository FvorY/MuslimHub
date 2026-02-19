import { Ayah, getAyahAudioUrl } from './quran-api';
import { screenWakeLockService } from '@/shared/services/screen-wake-lock';

export interface AudioPlayerState {
  isPlaying: boolean;
  currentAyahIndex: number | null;
  currentSurahNumber: number | null;
  isLoading: boolean;
  error: string | null;
}

export interface AudioPlayerCallbacks {
  onAyahChange?: (ayahIndex: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
  onScrollToAyah?: (ayahIndex: number) => void;
}

class QuranAudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private ayahs: Ayah[] = [];
  private currentAyahIndex: number | null = null;
  private currentSurahNumber: number | null = null;
  private isPlaying = false;
  private isLoading = false;
  private error: string | null = null;
  private callbacks: AudioPlayerCallbacks = {};

  // Get audio URL from ayah data (similar to existing logic)
  private getAudioUrl(ayah: Ayah): string {
    return getAyahAudioUrl(ayah);
  }

  private updateState(updates: Partial<AudioPlayerState>) {
    if (updates.isPlaying !== undefined && this.callbacks.onPlayStateChange) {
      this.callbacks.onPlayStateChange(updates.isPlaying);
    }
    if (updates.currentAyahIndex !== undefined && this.callbacks.onAyahChange) {
      this.callbacks.onAyahChange(updates.currentAyahIndex!);
      // Trigger scroll callback when ayah changes
      if (this.callbacks.onScrollToAyah) {
        this.callbacks.onScrollToAyah(updates.currentAyahIndex!);
      }
    }
    if (updates.error !== undefined && this.callbacks.onError && updates.error !== null) {
      this.callbacks.onError(updates.error);
    }
  }

  private async playAyah(ayahIndex: number): Promise<void> {
    if (!this.ayahs.length || ayahIndex < 0 || ayahIndex >= this.ayahs.length) {
      this.updateState({ error: 'Invalid ayah index' });
      return;
    }

    const ayah = this.ayahs[ayahIndex];
    const audioUrl = this.getAudioUrl(ayah);
    
    if (!audioUrl) {
      this.updateState({ error: 'No audio available for this ayah' });
      return;
    }

    // Stop current audio if playing
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }

    this.isLoading = true;
    this.currentAyahIndex = ayahIndex;

    try {
      // Request wake lock when starting to play
      await screenWakeLockService.requestWakeLock();
      
      this.audio = new Audio(audioUrl);
      
      this.audio.onended = () => {
        // Auto-play next ayah
        if (ayahIndex + 1 < this.ayahs.length) {
          this.playAyah(ayahIndex + 1);
        } else {
          // Surah completed
          this.stop();
          if (this.callbacks.onComplete) {
            this.callbacks.onComplete();
          }
        }
      };

      this.audio.onerror = (e) => {
        console.error('Audio playback error', e);
        this.updateState({ error: 'Failed to play audio' });
        this.isPlaying = false;
        this.isLoading = false;
        // Release wake lock on error
        screenWakeLockService.releaseWakeLock();
      };

      this.audio.oncanplay = () => {
        this.isLoading = false;
        this.isPlaying = true;
        this.updateState({ 
          isPlaying: true, 
          currentAyahIndex: ayahIndex,
          isLoading: false 
        });
      };

      await this.audio.play();
    } catch (error) {
      console.error('Error playing audio', error);
      this.updateState({ error: 'Failed to play audio' });
      this.isLoading = false;
      // Release wake lock on error
      screenWakeLockService.releaseWakeLock();
    }
  }

  // Public methods
  playSurah(ayahs: Ayah[], surahNumber: number, startAyahIndex = 0): void {
    this.ayahs = ayahs;
    this.currentSurahNumber = surahNumber;
    this.playAyah(startAyahIndex);
  }

  pause(): void {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
      this.updateState({ isPlaying: false });
      // Release wake lock when pausing
      screenWakeLockService.releaseWakeLock();
    }
  }

  resume(): void {
    if (this.audio && !this.isPlaying) {
      this.audio.play();
      this.isPlaying = true;
      this.updateState({ isPlaying: true });
      // Request wake lock when resuming
      screenWakeLockService.requestWakeLock();
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    this.isPlaying = false;
    this.isLoading = false;
    this.currentAyahIndex = null;
    this.updateState({ 
      isPlaying: false, 
      currentAyahIndex: null,
      isLoading: false 
    });
    // Release wake lock when stopping
    screenWakeLockService.releaseWakeLock();
  }

  nextAyah(): void {
    if (this.currentAyahIndex !== null && this.currentAyahIndex + 1 < this.ayahs.length) {
      this.playAyah(this.currentAyahIndex + 1);
    }
  }

  previousAyah(): void {
    if (this.currentAyahIndex !== null && this.currentAyahIndex > 0) {
      this.playAyah(this.currentAyahIndex - 1);
    }
  }

  seekToAyah(ayahIndex: number): void {
    if (ayahIndex >= 0 && ayahIndex < this.ayahs.length) {
      this.playAyah(ayahIndex);
    }
  }

  // Getters
  getState(): AudioPlayerState {
    return {
      isPlaying: this.isPlaying,
      currentAyahIndex: this.currentAyahIndex,
      currentSurahNumber: this.currentSurahNumber,
      isLoading: this.isLoading,
      error: this.error
    };
  }

  getCurrentAyah(): Ayah | null {
    if (this.currentAyahIndex !== null && this.ayahs[this.currentAyahIndex]) {
      return this.ayahs[this.currentAyahIndex];
    }
    return null;
  }

  // Callbacks
  setCallbacks(callbacks: AudioPlayerCallbacks): void {
    this.callbacks = callbacks;
  }

  // Cleanup
  destroy(): void {
    this.stop();
    this.ayahs = [];
    this.callbacks = {};
  }
}

// Export singleton instance
export const quranAudioPlayer = new QuranAudioPlayer();

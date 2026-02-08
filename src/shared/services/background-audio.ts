export interface BackgroundAudioService {
  enableBackgroundAudio(): void;
  disableBackgroundAudio(): void;
  setupMediaSession(title: string, artist: string, artwork?: { src: string; sizes: string; type: string }[]): void;
}

class WebBackgroundAudioService implements BackgroundAudioService {
  private isEnabled = false;
  private originalAudioSession: any = null;

  enableBackgroundAudio(): void {
    if (this.isEnabled) return;

    try {
      // Set audio session type for background playback
      if ('audioSession' in navigator) {
        this.originalAudioSession = (navigator as any).audioSession.type;
        (navigator as any).audioSession.type = 'playback';
      }
      
      // Request audio focus on mobile devices
      if ('mediaSession' in navigator) {
        this.setupMediaSessionHandlers();
      }
      
      // Set audio category for iOS Safari
      if ('audio' in document.createElement('audio')) {
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
          audio.setAttribute('muted', 'false');
          audio.setAttribute('autoplay', 'false');
          // Enable background audio for iOS
          (audio as any).webkitPreservesPitch = true;
        });
      }
      
      this.isEnabled = true;
      console.log('Background audio enabled');
    } catch (error) {
      console.error('Failed to enable background audio:', error);
    }
  }

  disableBackgroundAudio(): void {
    if (!this.isEnabled) return;

    try {
      // Restore original audio session
      if ('audioSession' in navigator && this.originalAudioSession) {
        (navigator as any).audioSession.type = this.originalAudioSession;
      }
      
      this.isEnabled = false;
      console.log('Background audio disabled');
    } catch (error) {
      console.error('Failed to disable background audio:', error);
    }
  }

  setupMediaSession(title: string, artist: string, artwork?: { src: string; sizes: string; type: string }[]): void {
    if ('mediaSession' in navigator) {
      (navigator as any).mediaSession.metadata = new (window as any).MediaMetadata({
        title,
        artist,
        album: 'Al-Quran',
        artwork: artwork || [
          { src: '/assets/icon/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/assets/icon/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });
      
      console.log('Media session setup completed');
    }
  }

  private setupMediaSessionHandlers(): void {
    if ('mediaSession' in navigator) {
      // These will be set by the QuranAudioPlayer
      (navigator as any).mediaSession.setActionHandler('play', () => {
        console.log('Media session play requested');
      });
      
      (navigator as any).mediaSession.setActionHandler('pause', () => {
        console.log('Media session pause requested');
      });
      
      (navigator as any).mediaSession.setActionHandler('previoustrack', () => {
        console.log('Media session previous requested');
      });
      
      (navigator as any).mediaSession.setActionHandler('nexttrack', () => {
        console.log('Media session next requested');
      });
      
      // Enable seek backward/forward (10 seconds)
      (navigator as any).mediaSession.setActionHandler('seekbackward', () => {
        console.log('Media session seek backward requested');
      });
      
      (navigator as any).mediaSession.setActionHandler('seekforward', () => {
        console.log('Media session seek forward requested');
      });
    }
  }
}

// Create singleton instance
export const backgroundAudioService = new WebBackgroundAudioService();
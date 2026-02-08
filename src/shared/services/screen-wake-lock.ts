export interface ScreenWakeLockService {
  requestWakeLock(): Promise<void>;
  releaseWakeLock(): void;
  isSupported(): boolean;
}

class WebScreenWakeLockService implements ScreenWakeLockService {
  private wakeLock: WakeLockSentinel | null = null;

  isSupported(): boolean {
    return 'wakeLock' in navigator;
  }

  async requestWakeLock(): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Screen Wake Lock API not supported');
      return;
    }

    try {
      this.wakeLock = await (navigator as any).wakeLock.request('screen');
      console.log('Screen wake lock activated');

      // Handle wake lock release
      this.wakeLock!.addEventListener('release', () => {
        console.log('Screen wake lock released');
        this.wakeLock = null;
      });
    } catch (error) {
      console.error('Failed to acquire wake lock:', error);
    }
  }

  releaseWakeLock(): void {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }
}

// For environments without Wake Lock API, provide a fallback
class FallbackWakeLockService implements ScreenWakeLockService {
  private videoElement: HTMLVideoElement | null = null;
  private isActive = false;

  isSupported(): boolean {
    return true; // Always supported as fallback
  }

  async requestWakeLock(): Promise<void> {
    if (this.isActive) return;

    try {
      // Create a hidden video element to prevent screen sleep
      this.videoElement = document.createElement('video');
      this.videoElement.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAACKBtZGF0AAAC';
      this.videoElement.loop = true;
      this.videoElement.muted = true;
      this.videoElement.style.position = 'absolute';
      this.videoElement.style.left = '-1000px';
      this.videoElement.style.top = '-1000px';
      this.videoElement.style.width = '1px';
      this.videoElement.style.height = '1px';
      
      document.body.appendChild(this.videoElement);
      
      // Play the video to prevent screen sleep
      await this.videoElement.play();
      this.isActive = true;
      
      console.log('Fallback wake lock activated');
    } catch (error) {
      console.error('Failed to activate fallback wake lock:', error);
    }
  }

  releaseWakeLock(): void {
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.remove();
      this.videoElement = null;
      this.isActive = false;
      console.log('Fallback wake lock released');
    }
  }
}

// Create the appropriate service based on environment
const createWakeLockService = (): ScreenWakeLockService => {
  if ('wakeLock' in navigator) {
    return new WebScreenWakeLockService();
  } else {
    return new FallbackWakeLockService();
  }
};

export const screenWakeLockService = createWakeLockService();
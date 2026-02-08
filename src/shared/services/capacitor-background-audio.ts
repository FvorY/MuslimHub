import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export interface CapacitorBackgroundAudioService {
  enableBackgroundMode(): Promise<void>;
  disableBackgroundMode(): Promise<void>;
  setupAudioSession(): Promise<void>;
  isBackgroundModeEnabled(): boolean;
}

class CapacitorBackgroundAudioServiceImpl implements CapacitorBackgroundAudioService {
  private isEnabled = false;
  private appStateChangeListener: any = null;

  async enableBackgroundMode(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Not running on native platform, skipping background mode');
      return;
    }

    try {
      // Add app state change listener to handle background/foreground transitions
      this.appStateChangeListener = App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive && this.isEnabled) {
          console.log('App going to background, audio should continue');
          // The audio should continue playing automatically
        } else if (isActive) {
          console.log('App coming to foreground');
        }
      });

      // Configure iOS audio session for background playback
      if (Capacitor.getPlatform() === 'ios') {
        await this.setupIOSAudioSession();
      }

      // Configure Android for background playback
      if (Capacitor.getPlatform() === 'android') {
        await this.setupAndroidAudioSession();
      }

      this.isEnabled = true;
      console.log('Background audio mode enabled');
    } catch (error) {
      console.error('Failed to enable background mode:', error);
      throw error;
    }
  }

  async disableBackgroundMode(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // Remove app state change listener
      if (this.appStateChangeListener) {
        this.appStateChangeListener.remove();
        this.appStateChangeListener = null;
      }

      this.isEnabled = false;
      console.log('Background audio mode disabled');
    } catch (error) {
      console.error('Failed to disable background mode:', error);
      throw error;
    }
  }

  async setupAudioSession(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      if (Capacitor.getPlatform() === 'ios') {
        await this.setupIOSAudioSession();
      } else if (Capacitor.getPlatform() === 'android') {
        await this.setupAndroidAudioSession();
      }
    } catch (error) {
      console.error('Failed to setup audio session:', error);
      throw error;
    }
  }

  isBackgroundModeEnabled(): boolean {
    return this.isEnabled;
  }

  private async setupIOSAudioSession(): Promise<void> {
    // iOS-specific audio session configuration
    // This would typically be handled by native code, but we can prepare the configuration
    console.log('Setting up iOS audio session for background playback');
    
    // Configure audio session category for playback
    // The actual implementation would be in native iOS code
    // AVAudioSessionCategoryPlayback allows audio to continue when device is locked/silent
  }

  private async setupAndroidAudioSession(): Promise<void> {
    // Android-specific audio session configuration
    console.log('Setting up Android audio session for background playback');
    
    // Configure Android audio focus and media session
    // The actual implementation would be in native Android code
    // AudioManager and MediaSession should be configured for background playback
  }
}

// Create singleton instance
export const capacitorBackgroundAudioService = new CapacitorBackgroundAudioServiceImpl();
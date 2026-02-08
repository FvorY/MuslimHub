
import { BackgroundRunner } from '@capacitor/background-runner';

export const BackgroundRunnerService = {
  async init() {
    try {
      await BackgroundRunner.dispatchEvent({
        label: 'com.muslimhub.app.task.fetch-prayer-times',
        event: 'fetch-prayer-times',
        details: {},
      });
    } catch (e) {
      console.error('Failed to dispatch background task', e);
    }
  },
};

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.imagetruthai.app',
  appName: 'ImageTruth AI',
  webDir: 'dist',
  server: {
    url: 'https://7d21c6fe-2c2c-4dd5-a1c3-f7bb4a95ff55.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;

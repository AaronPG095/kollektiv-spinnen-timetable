import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.37c50176120f4e58b7e6f5ebc448d1f1',
  appName: 'kollektiv-spinnen-timetable',
  webDir: 'dist',
  server: {
    url: 'https://37c50176-120f-4e58-b7e6-f5ebc448d1f1.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.kollektivspinnen.timetable',
  appName: 'Kollektiv Spinnen',
  webDir: 'dist',
  server: {
    url: 'https://37c50176-120f-4e58-b7e6-f5ebc448d1f1.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;
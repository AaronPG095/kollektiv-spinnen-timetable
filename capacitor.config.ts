import type { CapacitorConfig } from '@capacitor/cli';

// Update this URL when you deploy to a new hosting platform
// For development, you can keep the Lovable URL
// For production, replace with your new domain
const serverUrl = 'https://37c50176-120f-4e58-b7e6-f5ebc448d1f1.lovableproject.com?forceHideBadge=true';

const config: CapacitorConfig = {
  appId: 'app.kollektivspinnen.timetable',
  appName: 'Kollektiv Spinnen Website',
  webDir: 'dist',
  server: {
    url: serverUrl,
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;
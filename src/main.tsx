import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { testSupabaseConnection } from './integrations/supabase/client'
import { logError } from './lib/errorHandler'

// Defer connection test to background - don't block app initialization
setTimeout(() => {
  testSupabaseConnection().then(result => {
    if (import.meta.env.DEV) {
      if (result.success) {
        console.log('[Main] Supabase connection verified');
      } else {
        logError('Main', result.error, { operation: 'connectionTest' });
      }
    }
  }).catch(err => {
    logError('Main', err, { operation: 'connectionTest' });
  });
}, 0);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(<App />);

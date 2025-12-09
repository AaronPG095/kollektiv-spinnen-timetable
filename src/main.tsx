import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { testSupabaseConnection } from './integrations/supabase/client'

// Test Supabase connection on startup
testSupabaseConnection().then(result => {
  if (result.success) {
    console.log('[Main] Supabase connection verified');
  } else {
    console.error('[Main] Supabase connection failed:', result.error);
  }
}).catch(err => {
  console.error('[Main] Failed to test Supabase connection:', err);
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(<App />);

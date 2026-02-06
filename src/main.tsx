import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { hydrate, startSync } from './persistence'
import './ai'  // Register AI providers

// Hydrate stores from IndexedDB before rendering, then start syncing changes back.
hydrate().then(() => {
  startSync();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

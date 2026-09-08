import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx'

window.addEventListener('error', (e) => {
  console.error('GLOBAL ERROR:', e.error?.message, e.error?.stack);
});
window.addEventListener('unhandledrejection', (e) => {
  // Suppress harmless DOM exceptions from video autoplay and focus
  if (e.reason && (e.reason.name === 'NotAllowedError' || e.reason.name === 'AbortError' || (typeof e.reason === 'string' && e.reason.includes('play()')))) {
    e.preventDefault();
    return;
  }
  // Print full reason to ensure we don't get undefined
  console.error('GLOBAL PROMISE REJECTION:', e.reason);
});
;
import './index.css';
import { AuthProvider } from './Auth.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

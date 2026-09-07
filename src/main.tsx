import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx'

window.addEventListener('error', (e) => {
  console.error('GLOBAL ERROR:', e.error?.message, e.error?.stack);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('GLOBAL PROMISE REJECTION:', e.reason?.message, e.reason?.stack);
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

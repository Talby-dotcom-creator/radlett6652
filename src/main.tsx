import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { runSupabaseDebug } from './utils/debugSupabase';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Expose runSupabaseDebug to the global window object for easy debugging
declare global {
  interface Window {
    runSupabaseDebug: typeof runSupabaseDebug;
  }
}
window.runSupabaseDebug = runSupabaseDebug;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);
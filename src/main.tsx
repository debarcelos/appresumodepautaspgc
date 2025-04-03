import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useStore } from './store';

// Initialize auth state
useStore.getState().initializeAuth();

// Forçar autenticação para preview
useStore.getState().forceAuthForPreview();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
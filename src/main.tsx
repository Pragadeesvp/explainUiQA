import './polyfills';
import '@/components/keenicons/assets/styles.css';
import './css/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// import { AuthProvider } from './contexts/AuthContext'; // No longer needed here

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <AuthProvider> */}
    <App />
    {/* </AuthProvider> */}
  </StrictMode>,
);

// Polyfill for amazon-cognito-identity-js to work with Vite
if (typeof global === 'undefined') {
  (window as any).global = window;
} 
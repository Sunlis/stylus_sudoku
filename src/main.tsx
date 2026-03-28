import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Only register the service worker in production builds so
// local dev (Vite on localhost) always sees fresh code.
// Use Vite's BASE_URL so it works under /stylus_sudoku/ on GitHub Pages.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', import.meta.env.BASE_URL).toString();
    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}

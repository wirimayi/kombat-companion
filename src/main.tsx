import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const registerOffline = () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
    window.dispatchEvent(new CustomEvent('offline-error'));
  });
  if (document.readyState === 'complete') registerOffline();
  else window.addEventListener('load', registerOffline, { once: true });
}

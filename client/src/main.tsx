import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryProvider } from './providers/QueryProvider';

// Simple logger mock since we removed the complex logger setup
console.log('🚀 Starting Zyeuté app (Mockup Mode)...');

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryProvider>
        <App />
      </QueryProvider>
    </React.StrictMode>,
  );
} else {
  console.error('Root element not found');
}

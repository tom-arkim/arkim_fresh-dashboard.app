import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { initDemoSession } from '@/lib/demoData'; // DEV-ONLY DEMO — remove before shipping

initDemoSession(); // DEV-ONLY DEMO — no-op unless VITE_DEMO_MODE=true

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

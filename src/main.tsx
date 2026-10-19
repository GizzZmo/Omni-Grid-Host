import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { sidecarBridge } from './services/sidecarBridge';

// Connect C++ Network-Analyzer and Python FastAPI sidecars into the Cross-Talk bus
sidecarBridge.init();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

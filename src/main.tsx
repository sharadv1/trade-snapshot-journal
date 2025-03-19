
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeStrategies } from './utils/strategyStorage.ts'
import { restoreServerConnection } from './utils/storage/serverSync.ts'

// Initialize strategies on app startup
initializeStrategies();

// Attempt to restore server connection on app startup
restoreServerConnection();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

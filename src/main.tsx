
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { restoreServerConnection } from './utils/tradeStorage';

// Try to restore server connection on startup
restoreServerConnection();

createRoot(document.getElementById("root")!).render(<App />);

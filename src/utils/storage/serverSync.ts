
import { toast } from '@/utils/toast';
import { 
  setServerSync, 
  SERVER_URL_KEY, 
  isUsingServerSync, 
  getServerUrl 
} from './serverConnection';
import { getTrades, saveTrades } from './storageOperations';

// Re-export the isUsingServerSync function
export { isUsingServerSync, getServerUrl };

// Initialize server connection
export const initializeServerSync = (url: string): Promise<boolean> => {
  if (!url) {
    setServerSync(false, '');
    return Promise.resolve(false);
  }

  console.log('Attempting to connect to server at:', url);
  
  // Extract base URL for the ping endpoint (removing /trades if present)
  const baseUrl = url.replace(/\/trades$/, '');
  const pingUrl = `${baseUrl}/api/ping`;
  
  console.log('Pinging server at:', pingUrl);
  
  return fetch(pingUrl)
    .then(response => {
      if (response.ok) {
        console.log('Successfully connected to trade server');
        setServerSync(true, url);
        toast.success('Connected to trade server successfully');
        return true;
      } else {
        console.error('Server returned an error status', response.status);
        setServerSync(false, '');
        toast.error('Failed to connect to trade server');
        return false;
      }
    })
    .catch(error => {
      console.error('Error connecting to trade server:', error);
      setServerSync(false, '');
      toast.error('Cannot reach trade server, using local storage only');
      return false;
    });
};

// Configure server connection
export const configureServerConnection = async (url: string): Promise<boolean> => {
  if (!url) {
    setServerSync(false, '');
    localStorage.removeItem(SERVER_URL_KEY);
    toast.info('Server sync disabled');
    return false;
  }
  
  localStorage.setItem(SERVER_URL_KEY, url);
  const success = await initializeServerSync(url);
  
  // If connection is successful, immediately sync with server to get latest data
  if (success) {
    await syncWithServer(true); // Force refresh from server
  }
  
  return success;
};

// On app initialization, try to restore server connection
export const restoreServerConnection = async (): Promise<void> => {
  const savedServerUrl = localStorage.getItem(SERVER_URL_KEY);
  
  // If no saved URL but running in Docker container, try to auto-configure
  if (!savedServerUrl) {
    const origin = window.location.origin;
    // If not a localhost dev server, try to auto-connect
    if (origin !== 'http://localhost:3000' && 
        origin !== 'http://localhost:5173' && 
        origin !== 'http://127.0.0.1:5173') {
      const apiUrl = `${origin}/api/trades`;
      console.log('Auto-configuring Docker server URL:', apiUrl);
      const success = await configureServerConnection(apiUrl);
      if (success) {
        console.log('Auto-connected to server');
        // Already synced in configureServerConnection
      }
    }
    return;
  }
  
  // Otherwise use the saved server URL
  const success = await initializeServerSync(savedServerUrl);
  if (success) {
    console.log('Restored server connection to:', savedServerUrl);
    // Force a sync to get latest data
    await syncWithServer(true);
    // Also sync all other data types
    await syncAllData();
  }
};

// Sync all data types with the server
export const syncAllData = async (): Promise<boolean> => {
  let success = true;
  
  try {
    // Import all sync functions
    const { syncIdeasWithServer } = await import('@/utils/ideaStorage');
    const { syncStrategiesWithServer } = await import('@/utils/strategyStorage');
    const { syncSymbolsWithServer } = await import('@/utils/symbolStorage');

    try {
      // Sync trades
      await syncWithServer(true);
      // Sync ideas
      await syncIdeasWithServer();
      // Sync strategies
      await syncStrategiesWithServer();
      // Sync symbols
      await syncSymbolsWithServer();
      
      // Dispatch a storage event to notify other components
      window.dispatchEvent(new Event('storage'));
      toast.success('All data synced with server successfully');
    } catch (error) {
      console.error('Error during full sync:', error);
      toast.error('Error syncing some data with server');
      success = false;
    }
  } catch (error) {
    console.error('Error syncing all data types:', error);
    toast.error('Failed to sync data with server');
    success = false;
  }
  
  return success;
};

// Force sync with server (pull server data)
export const syncWithServer = async (forceRefresh: boolean = false): Promise<boolean> => {
  const serverUrl = localStorage.getItem(SERVER_URL_KEY);
  if (!serverUrl) {
    console.log('Server sync is not enabled');
    return false;
  }
  
  try {
    console.log('Syncing trades with server at:', serverUrl);
    
    // If forceRefresh is true, always get from server
    if (forceRefresh) {
      const response = await fetch(serverUrl);
      if (response.ok) {
        const serverTrades = await response.json();
        localStorage.setItem('trade-journal-trades', JSON.stringify(serverTrades));
        window.dispatchEvent(new Event('storage'));
        console.log('Successfully pulled trades from server');
        return true;
      } else {
        console.error('Server returned an error status', response.status);
        toast.error('Failed to sync trades with server');
        return false;
      }
    } else {
      // Normal two-way sync
      // First get current trades
      const localTrades = await getTrades();
      
      // Try to get server trades
      const response = await fetch(serverUrl);
      if (response.ok) {
        const serverTrades = await response.json();
        
        // Check which is newer (more trades usually means newer)
        // This is a simple heuristic that could be improved
        if (serverTrades.length >= localTrades.length) {
          // Server has same or more trades, use server data
          localStorage.setItem('trade-journal-trades', JSON.stringify(serverTrades));
          window.dispatchEvent(new Event('storage'));
          console.log('Using server trades (same or more trades)');
        } else {
          // Local has more trades, push to server
          await fetch(serverUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(localTrades),
          });
          console.log('Pushed local trades to server (more local trades)');
        }
        return true;
      } else {
        console.error('Server returned an error status', response.status);
        toast.error('Failed to sync trades with server');
        return false;
      }
    }
  } catch (error) {
    console.error('Error syncing with server:', error);
    toast.error('Failed to connect to server');
    return false;
  }
};

// Fix the DialogTrigger in TradeDetail.tsx
export const handleDialogDisplayProblem = (): void => {
  // This is just a marker function for the TradeDetail.tsx issue
  console.log('Dialog display issue handler registered');
};

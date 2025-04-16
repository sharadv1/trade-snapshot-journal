
import { toast } from '@/utils/toast';
import { 
  setServerSync, 
  SERVER_URL_KEY, 
  isUsingServerSync, 
  getServerUrl,
  isValidJsonResponse,
  getLastConnectionError,
  clearConnectionError
} from './serverConnection';
import { getTrades, saveTrades } from './storageOperations';
import { checkStorageQuota, safeGetItem } from './storageUtils';

// Re-export the isUsingServerSync function
export { isUsingServerSync, getServerUrl };

// Initialize server connection with improved error handling
export const initializeServerSync = (url: string): Promise<boolean> => {
  if (!url) {
    setServerSync(false, '');
    return Promise.resolve(false);
  }

  console.log('Attempting to connect to server at:', url);
  
  // Extract base URL for the ping endpoint (removing /trades if present)
  const baseUrl = url.replace(/\/trades$/, '');
  const pingUrl = `${baseUrl}/ping`; // Ensure we're not duplicating "api"
  
  console.log('Pinging server at:', pingUrl);
  
  // Add a timeout for the fetch to prevent long hanging connections
  const timeout = 10000; // 10 seconds
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(pingUrl, { signal: controller.signal })
    .then(async response => {
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error('Server returned an error status', response.status);
        setServerSync(false, '');
        toast.error(`Failed to connect to trade server (status: ${response.status})`);
        return false;
      }

      // Validate that the response is actually JSON, not HTML
      const isJson = await isValidJsonResponse(response);
      if (!isJson) {
        const errorMessage = getLastConnectionError() || 'Server returned invalid content';
        console.error(errorMessage);
        setServerSync(false, '');
        toast.error(errorMessage);
        return false;
      }
      
      try {
        const pingData = await response.json();
        if (pingData && pingData.status === 'ok') {
          console.log('Successfully connected to trade server');
          setServerSync(true, url);
          toast.success('Connected to trade server successfully');
          clearConnectionError();
          return true;
        } else {
          throw new Error('Invalid ping response format');
        }
      } catch (e) {
        console.error('Error parsing server response:', e);
        setServerSync(false, '');
        toast.error('Server returned invalid data. Check server configuration.');
        return false;
      }
    })
    .catch(error => {
      clearTimeout(timeoutId);
      console.error('Error connecting to trade server:', error);
      
      let errorMessage = 'Cannot reach trade server';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Connection to server timed out';
      } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error - server unreachable';
      }
      
      setServerSync(false, '');
      toast.error(`${errorMessage}, using local storage only`);
      return false;
    });
};

// Configure server connection
export const configureServerConnection = async (url: string): Promise<boolean> => {
  if (!url) {
    setServerSync(false, '');
    try {
      localStorage.removeItem(SERVER_URL_KEY);
    } catch (error) {
      console.error('Error removing server URL from localStorage:', error);
    }
    toast.info('Server sync disabled');
    return false;
  }
  
  try {
    // Check if localStorage is nearly full
    const { isNearLimit } = checkStorageQuota();
    
    if (isNearLimit) {
      console.warn('Storage is nearly full, server sync is recommended');
      toast.warning('Storage space is low, server sync is recommended');
    }
    
    // Clean up URL - make sure it has the correct structure for API access
    const cleanUrl = url.trim();
    
    // Try to save the URL in localStorage BEFORE trying to connect to server
    try {
      setServerSync(true, cleanUrl); // Set this BEFORE trying localStorage to ensure memory fallback works
    } catch (storageError) {
      console.error('Failed to save server URL:', storageError);
      toast.warning('Could not save server settings, but proceeding with connection');
    }
    
    const success = await initializeServerSync(cleanUrl);
    
    // If connection is successful, immediately sync with server to get latest data
    if (success) {
      await syncWithServer(true); // Force refresh from server
    }
    
    return success;
  } catch (error) {
    console.error('Error configuring server connection:', error);
    toast.error('Failed to configure server connection');
    return false;
  }
};

// On app initialization, try to restore server connection
export const restoreServerConnection = async (): Promise<void> => {
  try {
    const savedServerUrl = safeGetItem(SERVER_URL_KEY);
    
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
    console.log('Restoring server connection with URL:', savedServerUrl);
    const success = await initializeServerSync(savedServerUrl);
    if (success) {
      console.log('Restored server connection to:', savedServerUrl);
      // Force a sync to get latest data
      await syncWithServer(true);
      // Also sync all other data types
      await syncAllData();
    }
  } catch (error) {
    console.error('Error in restoreServerConnection:', error);
    toast.error('Failed to restore server connection');
  }
};

// Sync all data types with the server
export const syncAllData = async (): Promise<boolean> => {
  // First check if server sync is actually enabled
  if (!isUsingServerSync()) {
    console.log('Server sync is not enabled, cannot sync data');
    return false;
  }

  let success = true;
  
  try {
    // Import all sync functions
    const { syncIdeasWithServer } = await import('@/utils/ideaStorage');
    const { syncStrategiesWithServer } = await import('@/utils/strategyStorage');
    const { syncSymbolsWithServer } = await import('@/utils/symbolStorage');
    const { syncLessonsWithServer } = await import('@/utils/lessonStorage');

    try {
      // Sync trades
      await syncWithServer(true);
      // Sync ideas
      await syncIdeasWithServer();
      // Sync strategies
      await syncStrategiesWithServer();
      // Sync symbols
      await syncSymbolsWithServer();
      // Sync lessons
      await syncLessonsWithServer();
      
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

// Force sync with server (pull server data) with enhanced validation
export const syncWithServer = async (forceRefresh: boolean = false): Promise<boolean> => {
  const serverUrl = getServerUrl();
  
  if (!serverUrl || !isUsingServerSync()) {
    console.log('Server sync is not enabled or no server URL available');
    return false;
  }
  
  try {
    console.log('Syncing trades with server at:', serverUrl);
    
    // Add a timeout for the fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
    
    try {
      // If forceRefresh is true, always get from server
      if (forceRefresh) {
        const response = await fetch(serverUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error('Server returned an error status', response.status);
          toast.error('Failed to sync trades with server');
          return false;
        }
        
        // Validate that we have a JSON response, not HTML
        const isJson = await isValidJsonResponse(response);
        if (!isJson) {
          const errorMessage = getLastConnectionError() || 'Server returned invalid content';
          console.error(errorMessage);
          toast.error(errorMessage);
          return false;
        }
        
        try {
          const serverTrades = await response.json();
          
          if (Array.isArray(serverTrades)) {
            localStorage.setItem('trade-journal-trades', JSON.stringify(serverTrades));
            window.dispatchEvent(new Event('storage'));
            console.log('Successfully pulled trades from server');
            return true;
          } else {
            throw new Error('Server returned invalid data format (not an array)');
          }
        } catch (e) {
          console.error('Error parsing server response:', e);
          toast.error('Server returned invalid data. Check server configuration.');
          return false;
        }
      } else {
        // Normal two-way sync
        // First get current trades
        const localTrades = await getTrades();
        
        // Try to get server trades
        const response = await fetch(serverUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error('Server returned an error status', response.status);
          toast.error('Failed to sync trades with server');
          return false;
        }
        
        // Validate that we have a JSON response, not HTML
        const isJson = await isValidJsonResponse(response);
        if (!isJson) {
          const errorMessage = getLastConnectionError() || 'Server returned invalid content';
          console.error(errorMessage);
          toast.error(errorMessage);
          return false;
        }
        
        try {
          const serverTrades = await response.json();
          
          if (!Array.isArray(serverTrades)) {
            throw new Error('Server returned invalid data format (not an array)');
          }

          // Check which is newer (more trades usually means newer)
          // This is a simple heuristic that could be improved
          if (serverTrades.length >= localTrades.length) {
            // Server has same or more trades, use server data
            localStorage.setItem('trade-journal-trades', JSON.stringify(serverTrades));
            window.dispatchEvent(new Event('storage'));
            console.log('Using server trades (same or more trades)');
          } else {
            // Local has more trades, push to server
            const pushController = new AbortController();
            const pushTimeoutId = setTimeout(() => pushController.abort(), 10000);
            
            try {
              await fetch(serverUrl, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(localTrades),
                signal: pushController.signal
              });
              console.log('Pushed local trades to server (more local trades)');
            } catch (pushError) {
              console.error('Error pushing trades to server:', pushError);
              toast.error('Failed to push local trades to server');
              clearTimeout(pushTimeoutId);
              return false;
            } finally {
              clearTimeout(pushTimeoutId);
            }
          }
          return true;
        } catch (e) {
          console.error('Error processing server data:', e);
          toast.error('Error processing server data');
          return false;
        }
      }
    } finally {
      clearTimeout(timeoutId);
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


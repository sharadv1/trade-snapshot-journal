
import { toast } from '@/utils/toast';
import { setServerSync, SERVER_URL_KEY, isUsingServerSync, getServerUrl } from './storageCore';

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
  return initializeServerSync(url);
};

// On app initialization, try to restore server connection
export const restoreServerConnection = (): void => {
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
      configureServerConnection(apiUrl)
        .then(success => {
          if (success) {
            console.log('Auto-connected to server');
            // Force a sync to get latest data
            syncWithServer();
            // Also sync ideas
            import('@/utils/ideaStorage').then(module => {
              module.syncIdeasWithServer();
            });
          }
        });
    }
    return;
  }
  
  // Otherwise use the saved server URL
  initializeServerSync(savedServerUrl)
    .then(success => {
      if (success) {
        console.log('Restored server connection to:', savedServerUrl);
        // Force a sync to get latest data
        syncWithServer();
        // Also sync ideas
        import('@/utils/ideaStorage').then(module => {
          module.syncIdeasWithServer();
        });
      }
    })
    .catch(err => {
      console.error('Failed to restore server connection:', err);
    });
};

// Force sync with server (pull server data)
export const syncWithServer = async (): Promise<boolean> => {
  const serverUrl = localStorage.getItem(SERVER_URL_KEY);
  if (!serverUrl) {
    toast.error('Server sync is not enabled');
    return false;
  }
  
  try {
    console.log('Syncing trades with server at:', serverUrl);
    const response = await fetch(serverUrl);
    if (response.ok) {
      const serverTrades = await response.json();
      localStorage.setItem('trade-journal-trades', JSON.stringify(serverTrades));
      window.dispatchEvent(new Event('storage'));
      console.log('Successfully synced trades with server');
      return true;
    } else {
      console.error('Server returned an error status', response.status);
      toast.error('Failed to sync trades with server');
      return false;
    }
  } catch (error) {
    console.error('Error syncing with server:', error);
    toast.error('Failed to connect to server');
    return false;
  }
};

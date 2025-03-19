
import { toast } from '@/utils/toast';
import { setServerSync, SERVER_URL_KEY } from './storageCore';

// Initialize server connection
export const initializeServerSync = (url: string): Promise<boolean> => {
  if (url) {
    // Fixed the ping endpoint to match server implementation
    return fetch(`${url.replace('/trades', '')}/ping`)
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
  }
  
  setServerSync(false, '');
  return Promise.resolve(false);
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
  if (savedServerUrl) {
    initializeServerSync(savedServerUrl)
      .then(success => {
        if (success) {
          console.log('Restored server connection to:', savedServerUrl);
        }
      })
      .catch(err => {
        console.error('Failed to restore server connection:', err);
      });
  }
};

// Force sync with server (pull server data)
export const syncWithServer = async (): Promise<boolean> => {
  const serverUrl = localStorage.getItem(SERVER_URL_KEY);
  if (!serverUrl) {
    toast.error('Server sync is not enabled');
    return false;
  }
  
  try {
    const response = await fetch(serverUrl);
    if (response.ok) {
      const serverTrades = await response.json();
      localStorage.setItem('trade-journal-trades', JSON.stringify(serverTrades));
      window.dispatchEvent(new Event('storage'));
      toast.success('Successfully synced with server');
      return true;
    } else {
      console.error('Server returned an error status', response.status);
      toast.error('Failed to sync with server');
      return false;
    }
  } catch (error) {
    console.error('Error syncing with server:', error);
    toast.error('Failed to connect to server');
    return false;
  }
};

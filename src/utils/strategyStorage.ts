
import { Strategy, Trade } from '@/types';
import { toast } from './toast';
import { getTradesSync, updateTrade } from '@/utils/tradeStorage';
import { isUsingServerSync, getServerUrl } from './storage/serverSync';

const STRATEGIES_STORAGE_KEY = 'trading-journal-strategies';

// Default strategies to populate initially
export const DEFAULT_STRATEGIES: Strategy[] = [
  { id: '1', name: 'Trend Following', description: 'Following established market trends', color: '#4CAF50' },
  { id: '2', name: 'Breakout', description: 'Trading price movements through support or resistance levels', color: '#2196F3' },
  { id: '3', name: 'Momentum', description: 'Trading in the direction of price movement', color: '#F44336' },
  { id: '4', name: 'Mean Reversion', description: 'Trading price returns to average/mean value', color: '#9C27B0' },
  { id: '5', name: 'Scalping', description: 'Making small profits on small price changes', color: '#FF9800' },
  { id: '6', name: 'Swing Trading', description: 'Capturing short to medium term gains over days or weeks', color: '#795548' },
  { id: '7', name: 'Position Trading', description: 'Long-term strategy based on macro trends', color: '#607D8B' },
  { id: '8', name: 'Gap Trading', description: 'Trading price gaps between market sessions', color: '#E91E63' },
  { id: '9', name: 'Range Trading', description: 'Trading between support and resistance levels', color: '#00BCD4' },
  { id: '10', name: 'Arbitrage', description: 'Exploiting price differences between markets', color: '#CDDC39' },
  { id: '11', name: 'News-Based', description: 'Trading based on news and announcements', color: '#FF5722' },
  { id: '12', name: 'Technical Pattern', description: 'Trading based on chart patterns', color: '#3F51B5' },
];

// Save strategies to storage (localStorage and server)
const saveStrategies = (strategies: Strategy[]): void => {
  try {
    // Always save to localStorage as a fallback
    localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(strategies));
    
    // If server sync is enabled, also save to server
    if (isUsingServerSync() && getServerUrl()) {
      const serverUrl = `${getServerUrl().replace(/\/trades$/, '')}/strategies`;
      console.log('Saving strategies to server:', serverUrl);
      
      fetch(serverUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(strategies),
      })
      .then(response => {
        if (!response.ok) {
          console.error('Error saving strategies to server:', response.statusText);
          toast.error('Failed to sync strategies with server');
        } else {
          console.log('Strategies synced with server successfully');
        }
      })
      .catch(error => {
        console.error('Error syncing strategies with server:', error);
        toast.error('Server sync failed for strategies, but saved locally');
      });
    }
    
    // Dispatch a storage event to notify other tabs
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error saving strategies:', error);
    toast.error('Failed to save strategies');
  }
};

// Sync strategies with server (force pull)
export const syncStrategiesWithServer = async (): Promise<boolean> => {
  if (!isUsingServerSync() || !getServerUrl()) {
    return false;
  }
  
  try {
    const serverUrl = `${getServerUrl().replace(/\/trades$/, '')}/strategies`;
    console.log('Syncing strategies with server at:', serverUrl);
    const response = await fetch(serverUrl);
    
    if (response.ok) {
      const serverStrategies = await response.json();
      localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(serverStrategies));
      window.dispatchEvent(new Event('storage'));
      console.log('Strategies synced with server successfully');
      return true;
    } else {
      console.error('Server returned an error status when syncing strategies', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error syncing strategies with server:', error);
    return false;
  }
};

// Initialize strategies with defaults if none exist
export function initializeStrategies(): Strategy[] {
  try {
    const storedStrategies = localStorage.getItem(STRATEGIES_STORAGE_KEY);
    
    if (!storedStrategies) {
      saveStrategies(DEFAULT_STRATEGIES);
      return DEFAULT_STRATEGIES;
    }
    
    return JSON.parse(storedStrategies);
  } catch (error) {
    console.error('Error initializing strategies:', error);
    // If there's an error, reset to defaults
    try {
      saveStrategies(DEFAULT_STRATEGIES);
    } catch (storageError) {
      console.error('Error setting localStorage:', storageError);
    }
    return DEFAULT_STRATEGIES;
  }
}

// Get all strategies
export function getStrategies(): Strategy[] {
  try {
    // If server sync is enabled, try to sync first
    if (isUsingServerSync()) {
      syncStrategiesWithServer().catch(error => {
        console.error('Error syncing strategies:', error);
      });
    }

    const storedStrategies = localStorage.getItem(STRATEGIES_STORAGE_KEY);
    
    if (!storedStrategies) {
      return initializeStrategies();
    }
    
    return JSON.parse(storedStrategies);
  } catch (error) {
    console.error('Error parsing stored strategies:', error);
    return initializeStrategies();
  }
}

// Add a new strategy
export function addStrategy(strategy: Omit<Strategy, 'id'>): Strategy {
  if (!strategy || !strategy.name) {
    throw new Error("Strategy name is required");
  }

  const strategies = getStrategies();
  
  // Check if name already exists
  if (strategies.some(s => s.name.toLowerCase() === strategy.name.toLowerCase())) {
    throw new Error(`Strategy with name "${strategy.name}" already exists`);
  }
  
  // Generate a UUID for the new strategy
  const newId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  
  const newStrategy: Strategy = {
    ...strategy,
    id: newId,
    // Ensure description is not undefined
    description: strategy.description || '',
    // Ensure color has a valid format
    color: strategy.color || ('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'))
  };
  
  const updatedStrategies = [...strategies, newStrategy];
  
  try {
    saveStrategies(updatedStrategies);
    console.log('Strategy added successfully:', newStrategy);
    return newStrategy;
  } catch (error) {
    console.error('Error saving strategy:', error);
    throw new Error('Failed to save strategy to local storage');
  }
}

// Update an existing strategy
export function updateStrategy(updatedStrategy: Strategy): Strategy {
  if (!updatedStrategy || !updatedStrategy.id || !updatedStrategy.name) {
    throw new Error("Invalid strategy data");
  }

  const strategies = getStrategies();
  
  // Get the original strategy to check if name changed
  const originalStrategy = strategies.find(s => s.id === updatedStrategy.id);
  if (!originalStrategy) {
    throw new Error(`Strategy with ID "${updatedStrategy.id}" not found`);
  }
  
  const nameChanged = originalStrategy.name !== updatedStrategy.name;
  
  // Check if updated name conflicts with another strategy
  const nameConflict = strategies.some(
    s => s.id !== updatedStrategy.id && 
    s.name.toLowerCase() === updatedStrategy.name.toLowerCase()
  );
  
  if (nameConflict) {
    throw new Error(`Another strategy with name "${updatedStrategy.name}" already exists`);
  }
  
  // Update the strategy in our strategies array
  const updatedStrategies = strategies.map(s => 
    s.id === updatedStrategy.id ? {
      ...updatedStrategy,
      // Ensure we always have required fields
      description: updatedStrategy.description || '',
      color: updatedStrategy.color || originalStrategy.color
    } : s
  );
  
  try {
    saveStrategies(updatedStrategies);
    console.log('Strategy updated successfully:', updatedStrategy);
  
    // If name has changed, update all trades using this strategy
    if (nameChanged) {
      try {
        const trades = getTradesSync();
        let updatedCount = 0;
        
        trades.forEach(trade => {
          if (trade.strategy === originalStrategy.name) {
            const updatedTrade = {
              ...trade,
              strategy: updatedStrategy.name
            };
            updateTrade(updatedTrade);
            updatedCount++;
          }
        });
        
        if (updatedCount > 0) {
          console.log(`Updated strategy name in ${updatedCount} trades`);
        }
      } catch (error) {
        console.error('Error updating trades with new strategy name:', error);
        toast.error('Strategy updated but failed to update some trades');
      }
    }
  
    return updatedStrategy;
  } catch (error) {
    console.error('Error updating strategy:', error);
    throw new Error('Failed to update strategy in local storage');
  }
}

// Check if a strategy is in use by any trades
export function isStrategyInUse(strategyId: string): boolean {
  const trades = getTradesSync();
  
  // Get the strategy name from ID
  const strategies = getStrategies();
  const strategy = strategies.find(s => s.id === strategyId);
  
  if (!strategy) return false;
  
  // Check if any trade is using this strategy
  return trades.some(trade => trade.strategy === strategy.name);
}

// Delete a strategy
export function deleteStrategy(strategyId: string): boolean {
  // Only check if strategy is in use
  const strategies = getStrategies();
  const strategy = strategies.find(s => s.id === strategyId);
  
  if (!strategy) {
    return false;
  }
  
  // Check if strategy is in use
  if (isStrategyInUse(strategyId)) {
    throw new Error("Cannot delete strategy that is being used by existing trades");
  }
  
  const updatedStrategies = strategies.filter(s => s.id !== strategyId);
  
  // Make sure we actually found and removed a strategy
  if (updatedStrategies.length === strategies.length) {
    return false;
  }
  
  try {
    saveStrategies(updatedStrategies);
    return true;
  } catch (error) {
    console.error('Error deleting strategy:', error);
    throw new Error('Failed to delete strategy from local storage');
  }
}

// Get all strategy names as an array (for dropdowns, etc.)
export function getStrategyNames(): string[] {
  const strategies = getStrategies();
  return strategies.map(s => s.name);
}

// Get strategy by ID
export function getStrategyById(id: string): Strategy | undefined {
  const strategies = getStrategies();
  return strategies.find(s => s.id === id);
}

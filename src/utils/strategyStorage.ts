
import { Strategy } from '@/types';
import { getTradesSync } from '@/utils/storage/storageCore';

const STRATEGIES_KEY = 'trading-journal-strategies';

export const getStrategies = (): Strategy[] => {
  const strategiesJson = localStorage.getItem(STRATEGIES_KEY);
  if (!strategiesJson) {
    // If no strategies found, create and save defaults
    const defaults = getDefaultStrategies();
    saveStrategies(defaults);
    return defaults;
  }
  
  try {
    // Parse the strategies
    const strategies = JSON.parse(strategiesJson);
    
    // Validation: make sure we have a valid array
    if (!Array.isArray(strategies)) {
      console.error('Retrieved strategies is not an array');
      return getDefaultStrategies();
    }
    
    // Return the parsed strategies
    return strategies;
  } catch (error) {
    console.error('Error parsing strategies:', error);
    
    // If there's a parsing error, log but don't replace data
    console.warn('Preserving original strategy data despite parse error');
    return [];
  }
};

export const syncStrategiesWithServer = async (): Promise<boolean> => {
  return true;
};

export const saveStrategies = (strategies: Strategy[]): void => {
  // Ensure we're saving an array
  if (!Array.isArray(strategies)) {
    console.error('Attempting to save invalid strategies data (not an array)');
    return;
  }
  
  localStorage.setItem(STRATEGIES_KEY, JSON.stringify(strategies));
  // Dispatch storage event to notify other components
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('strategies-updated'));
};

export const addStrategy = (strategy: Strategy): void => {
  const strategies = getStrategies();
  
  // Validate ID - make sure we don't have duplicates
  if (strategies.some(s => s.id === strategy.id)) {
    console.warn(`Strategy with ID ${strategy.id} already exists. Using a new ID.`);
    // Generate a new ID to avoid conflicts
    strategy.id = `strategy-${Date.now()}`;
  }
  
  strategies.push(strategy);
  saveStrategies(strategies);
  console.log(`Added new strategy: ${strategy.name} (${strategy.id})`);
};

export const updateStrategy = (updatedStrategy: Strategy): void => {
  const strategies = getStrategies();
  const index = strategies.findIndex(s => s.id === updatedStrategy.id);
  if (index !== -1) {
    strategies[index] = updatedStrategy;
    saveStrategies(strategies);
    console.log(`Updated strategy: ${updatedStrategy.name} (${updatedStrategy.id})`);
  } else {
    console.warn(`Strategy with ID ${updatedStrategy.id} not found for update`);
  }
};

export const deleteStrategy = (strategyId: string): void => {
  const strategies = getStrategies();
  const filteredStrategies = strategies.filter(s => s.id !== strategyId);
  
  // Only save if we actually removed something
  if (filteredStrategies.length !== strategies.length) {
    saveStrategies(filteredStrategies);
    console.log(`Deleted strategy with ID: ${strategyId}`);
  } else {
    console.warn(`Strategy with ID ${strategyId} not found for deletion`);
  }
};

export const getStrategyById = (strategyId: string): Strategy | undefined => {
  if (!strategyId) return undefined;
  
  const strategies = getStrategies();
  const strategy = strategies.find(s => s.id === strategyId);
  
  if (!strategy) {
    console.warn(`Strategy with ID ${strategyId} not found`);
  }
  
  return strategy;
};

export const getStrategyUsage = (strategyId: string): number => {
  const trades = getTradesSync();
  return trades.filter(t => t.strategy === strategyId).length;
};

export const isStrategyInUse = (strategyId: string): boolean => {
  return getStrategyUsage(strategyId) > 0;
};

export const getDefaultStrategies = (): Strategy[] => {
  return [
    {
      id: 'strategy-1',
      name: 'Trend Following',
      description: 'Following established market trends',
      color: '#4CAF50'
    },
    {
      id: 'strategy-2',
      name: 'Breakout',
      description: 'Trading breakouts from consolidation patterns',
      color: '#2196F3'
    },
    {
      id: 'strategy-3',
      name: 'Mean Reversion',
      description: 'Trading price returns to the mean',
      color: '#F44336'
    },
    {
      id: 'strategy-4',
      name: 'Momentum',
      description: 'Trading strong price movements',
      color: '#9C27B0'
    }
  ];
};

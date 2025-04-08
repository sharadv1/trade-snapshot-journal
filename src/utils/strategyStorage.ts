
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
    return JSON.parse(strategiesJson);
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
  localStorage.setItem(STRATEGIES_KEY, JSON.stringify(strategies));
  // Dispatch storage event to notify other components
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('strategies-updated'));
};

export const addStrategy = (strategy: Strategy): void => {
  const strategies = getStrategies();
  strategies.push(strategy);
  saveStrategies(strategies);
};

export const updateStrategy = (updatedStrategy: Strategy): void => {
  const strategies = getStrategies();
  const index = strategies.findIndex(s => s.id === updatedStrategy.id);
  if (index !== -1) {
    strategies[index] = updatedStrategy;
    saveStrategies(strategies);
  }
};

export const deleteStrategy = (strategyId: string): void => {
  const strategies = getStrategies();
  const filteredStrategies = strategies.filter(s => s.id !== strategyId);
  saveStrategies(filteredStrategies);
};

export const getStrategyById = (strategyId: string): Strategy | undefined => {
  const strategies = getStrategies();
  return strategies.find(s => s.id === strategyId);
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

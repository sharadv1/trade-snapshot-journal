import { Strategy } from '@/types';
import { generateUUID } from '@/utils/generateUUID';
import { getItemFromStorage, saveItemToStorage, STRATEGIES_STORAGE_KEY } from './storage/storageCore';

// Get all strategies
export const getStrategies = async (): Promise<Strategy[]> => {
  return getItemFromStorage<Strategy[]>(STRATEGIES_STORAGE_KEY, []);
};

// Get strategies sync version for component rendering
export const getStrategiesSync = (): Strategy[] => {
  return getItemFromStorage<Strategy[]>(STRATEGIES_STORAGE_KEY, []);
};

// Save all strategies
export const saveStrategies = async (strategies: Strategy[]): Promise<void> => {
  saveItemToStorage(STRATEGIES_STORAGE_KEY, strategies);
};

// Add a new strategy
export const addStrategy = async (strategy: Omit<Strategy, 'id'>): Promise<Strategy> => {
  const strategies = await getStrategies();
  
  const newStrategy: Strategy = {
    ...strategy,
    id: generateUUID(),
    createdAt: new Date()
  };
  
  strategies.push(newStrategy);
  await saveStrategies(strategies);
  
  return newStrategy;
};

// Update an existing strategy
export const updateStrategy = async (updatedStrategy: Strategy): Promise<void> => {
  const strategies = await getStrategies();
  const index = strategies.findIndex(strategy => strategy.id === updatedStrategy.id);
  
  if (index !== -1) {
    strategies[index] = updatedStrategy;
    await saveStrategies(strategies);
  } else {
    throw new Error('Strategy not found');
  }
};

// Delete a strategy
export const deleteStrategy = async (strategyId: string): Promise<void> => {
  const strategies = await getStrategies();
  const filteredStrategies = strategies.filter(strategy => strategy.id !== strategyId);
  
  await saveStrategies(filteredStrategies);
};

// Sync strategies with server if needed
export const syncStrategiesWithServer = async (): Promise<void> => {
  // Implementation for server sync
  console.log('Strategy server sync not implemented yet');
};

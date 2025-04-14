import { Strategy } from '@/types';
import { getLocalStorage, setLocalStorage } from './storageCore';
import { generateUUID } from './generateUUID';

const STRATEGIES_KEY = 'trade-journal-strategies';

// Function to initialize default strategies if none exist
export const initializeDefaultStrategies = () => {
  let strategies = getStrategies();
  if (!strategies || strategies.length === 0) {
    const defaultStrategies: Strategy[] = [
      {
        id: 'support-resistance',
        name: 'Support & Resistance',
        description: 'Trading key levels where price has historically reversed',
        color: '#3B82F6',
        createdAt: new Date()
      },
      {
        id: 'trend-following',
        name: 'Trend Following',
        description: 'Going with the established market trend using moving averages or other trend indicators',
        color: '#10B981',
        createdAt: new Date()
      },
      {
        id: 'breakout',
        name: 'Breakouts',
        description: 'Entering when price breaks above resistance or below support',
        color: '#F59E0B',
        createdAt: new Date()
      },
      {
        id: 'reversal',
        name: 'Reversals',
        description: 'Looking for price to change direction after extended moves',
        color: '#EF4444',
        createdAt: new Date()
      },
    ];
    saveStrategies(defaultStrategies);
  }
};

// Function to get all strategies from local storage
export const getStrategies = (): Strategy[] => {
  const strategiesString = getLocalStorage(STRATEGIES_KEY);
  return strategiesString ? JSON.parse(strategiesString) : [];
};

// Function to save strategies to local storage
export const saveStrategies = (strategies: Strategy[]): void => {
  setLocalStorage(STRATEGIES_KEY, JSON.stringify(strategies));
};

// Function to add a new strategy
export const addStrategy = (strategy: Omit<Strategy, 'id'>): Strategy | null => {
  try {
    const newStrategy: Strategy = {
      id: generateUUID(),
      ...strategy,
    };
    const strategies = getStrategies();
    strategies.push(newStrategy);
    saveStrategies(strategies);
    return newStrategy;
  } catch (error) {
    console.error("Error adding strategy:", error);
    return null;
  }
};

// Function to update an existing strategy
export const updateStrategy = (updatedStrategy: Strategy): boolean => {
  try {
    const strategies = getStrategies();
    const updatedStrategies = strategies.map(strategy =>
      strategy.id === updatedStrategy.id ? updatedStrategy : strategy
    );
    saveStrategies(updatedStrategies);
    return true;
  } catch (error) {
    console.error("Error updating strategy:", error);
    return false;
  }
};

// Function to delete a strategy by ID
export const deleteStrategy = (id: string): boolean => {
  try {
    const strategies = getStrategies();
    const filteredStrategies = strategies.filter(strategy => strategy.id !== id);
    saveStrategies(filteredStrategies);
    return true;
  } catch (error) {
    console.error("Error deleting strategy:", error);
    return false;
  }
};

// Function to get a strategy by ID
export const getStrategyById = (id: string): Strategy | undefined => {
  const strategies = getStrategies();
  return strategies.find(strategy => strategy.id === id);
};

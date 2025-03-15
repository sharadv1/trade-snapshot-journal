
import { Strategy } from '@/types';
import { toast } from './toast';
import { getTradesSync } from './tradeStorage';

const STRATEGIES_STORAGE_KEY = 'trading-journal-strategies';

// Default strategies to populate initially
export const DEFAULT_STRATEGIES: Strategy[] = [
  { id: '1', name: 'Trend Following', description: 'Following established market trends', color: '#4CAF50', isDefault: true },
  { id: '2', name: 'Breakout', description: 'Trading price movements through support or resistance levels', color: '#2196F3', isDefault: true },
  { id: '3', name: 'Momentum', description: 'Trading in the direction of price movement', color: '#F44336', isDefault: true },
  { id: '4', name: 'Mean Reversion', description: 'Trading price returns to average/mean value', color: '#9C27B0', isDefault: true },
  { id: '5', name: 'Scalping', description: 'Making small profits on small price changes', color: '#FF9800', isDefault: true },
  { id: '6', name: 'Swing Trading', description: 'Capturing short to medium term gains over days or weeks', color: '#795548', isDefault: true },
  { id: '7', name: 'Position Trading', description: 'Long-term strategy based on macro trends', color: '#607D8B', isDefault: true },
  { id: '8', name: 'Gap Trading', description: 'Trading price gaps between market sessions', color: '#E91E63', isDefault: true },
  { id: '9', name: 'Range Trading', description: 'Trading between support and resistance levels', color: '#00BCD4', isDefault: true },
  { id: '10', name: 'Arbitrage', description: 'Exploiting price differences between markets', color: '#CDDC39', isDefault: true },
  { id: '11', name: 'News-Based', description: 'Trading based on news and announcements', color: '#FF5722', isDefault: true },
  { id: '12', name: 'Technical Pattern', description: 'Trading based on chart patterns', color: '#3F51B5', isDefault: true },
];

// Initialize strategies with defaults if none exist
export function initializeStrategies(): Strategy[] {
  const storedStrategies = localStorage.getItem(STRATEGIES_STORAGE_KEY);
  
  if (!storedStrategies) {
    localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(DEFAULT_STRATEGIES));
    return DEFAULT_STRATEGIES;
  }
  
  return JSON.parse(storedStrategies);
}

// Get all strategies
export function getStrategies(): Strategy[] {
  const storedStrategies = localStorage.getItem(STRATEGIES_STORAGE_KEY);
  
  if (!storedStrategies) {
    return initializeStrategies();
  }
  
  return JSON.parse(storedStrategies);
}

// Add a new strategy
export function addStrategy(strategy: Omit<Strategy, 'id'>): Strategy {
  const strategies = getStrategies();
  
  // Check if name already exists
  if (strategies.some(s => s.name.toLowerCase() === strategy.name.toLowerCase())) {
    throw new Error(`Strategy with name "${strategy.name}" already exists`);
  }
  
  const newStrategy: Strategy = {
    ...strategy,
    id: crypto.randomUUID()
  };
  
  const updatedStrategies = [...strategies, newStrategy];
  localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(updatedStrategies));
  
  return newStrategy;
}

// Update an existing strategy
export function updateStrategy(updatedStrategy: Strategy): Strategy {
  const strategies = getStrategies();
  
  // Check if updated name conflicts with another strategy
  const nameConflict = strategies.some(
    s => s.id !== updatedStrategy.id && 
    s.name.toLowerCase() === updatedStrategy.name.toLowerCase()
  );
  
  if (nameConflict) {
    throw new Error(`Another strategy with name "${updatedStrategy.name}" already exists`);
  }
  
  const updatedStrategies = strategies.map(s => 
    s.id === updatedStrategy.id ? updatedStrategy : s
  );
  
  localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(updatedStrategies));
  
  return updatedStrategy;
}

// Check if a strategy is in use by any trades
export function isStrategyInUse(strategyId: string): boolean {
  const trades = getTradesSync();
  
  // Get the strategy name from ID
  const strategies = getStrategies();
  const strategy = strategies.find(s => s.id === strategyId);
  
  if (!strategy) return false;
  
  // Check if any trade is using this strategy
  return trades.some(trade => 
    trade.strategy === strategy.name || 
    (trade.strategy === 'custom' && trade.customStrategy === strategy.name)
  );
}

// Delete a strategy
export function deleteStrategy(strategyId: string): boolean {
  // Don't allow deleting default strategies
  const strategies = getStrategies();
  const strategy = strategies.find(s => s.id === strategyId);
  
  if (!strategy) {
    return false;
  }
  
  if (strategy.isDefault) {
    throw new Error("Cannot delete default strategies");
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
  
  localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(updatedStrategies));
  
  return true;
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

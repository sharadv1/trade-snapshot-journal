
import { Strategy } from '@/types';
import { generateUUID } from '@/utils/generateUUID';
import { getStrategies, saveStrategies } from '@/utils/strategyStorage';
import { toast } from '@/utils/toast';
import { getRandomColor } from '@/utils/colors';

// Default strategies that will be added if none exist
const DEFAULT_STRATEGIES: Omit<Strategy, 'id' | 'createdAt'>[] = [
  {
    name: 'Breakout',
    description: 'Trading breakouts from key levels',
    color: '#4299E1' // Blue
  },
  {
    name: 'Pullback',
    description: 'Trading pullbacks to moving averages or trend lines',
    color: '#48BB78' // Green
  },
  {
    name: 'Reversal',
    description: 'Trading reversals at key levels',
    color: '#ED8936' // Orange
  },
  {
    name: 'Trend Following',
    description: 'Trading in the direction of the trend',
    color: '#9F7AEA' // Purple
  }
];

// Create default strategies if none exist
export const createDefaultStrategiesIfNoneExist = async (): Promise<boolean> => {
  try {
    // Get existing strategies
    const existingStrategies = getStrategies();
    
    // If strategies already exist, do nothing
    if (existingStrategies.length > 0) {
      console.log('Strategies already exist, not creating defaults');
      return false;
    }
    
    console.log('No strategies found, creating default strategies');
    
    // Create new strategies with IDs and timestamps
    const newStrategies: Strategy[] = DEFAULT_STRATEGIES.map(strategy => ({
      ...strategy,
      id: generateUUID(),
      createdAt: new Date()
    }));
    
    // Save the new strategies
    await saveStrategies(newStrategies);
    
    console.log(`Created ${newStrategies.length} default strategies`);
    toast.success('Default trading strategies have been created');
    
    return true;
  } catch (error) {
    console.error('Error creating default strategies:', error);
    toast.error('Failed to create default strategies');
    return false;
  }
};

// Create a single default strategy
export const createSingleDefaultStrategy = async (): Promise<Strategy | null> => {
  try {
    // Get existing strategies to avoid duplicates
    const existingStrategies = getStrategies();
    
    // Pick a random strategy from the defaults that doesn't already exist
    const existingNames = existingStrategies.map(s => s.name.toLowerCase());
    
    const availableDefaults = DEFAULT_STRATEGIES.filter(
      s => !existingNames.includes(s.name.toLowerCase())
    );
    
    // If all defaults already exist, create a generic one
    let newStrategy: Strategy;
    
    if (availableDefaults.length > 0) {
      // Pick a random one from available defaults
      const template = availableDefaults[Math.floor(Math.random() * availableDefaults.length)];
      
      newStrategy = {
        ...template,
        id: generateUUID(),
        createdAt: new Date()
      };
    } else {
      // Create a generic strategy with a random number
      const num = Math.floor(Math.random() * 100);
      newStrategy = {
        id: generateUUID(),
        name: `Strategy ${num}`,
        description: 'Custom trading strategy',
        color: getRandomColor(),
        createdAt: new Date()
      };
    }
    
    // Add to existing strategies
    const updatedStrategies = [...existingStrategies, newStrategy];
    await saveStrategies(updatedStrategies);
    
    toast.success(`Added new strategy: ${newStrategy.name}`);
    return newStrategy;
  } catch (error) {
    console.error('Error creating default strategy:', error);
    toast.error('Failed to create strategy');
    return null;
  }
};

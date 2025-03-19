
import { Trade } from '@/types';
import { saveTrades } from './storageCore';
import { toast } from '@/utils/toast';

// Add dummy trades for testing
export const addDummyTrades = async (): Promise<void> => {
  // Sample trades for testing
  const dummyTrades: Trade[] = [
    {
      id: crypto.randomUUID(),
      symbol: 'AAPL',
      direction: 'long',
      type: 'equity',
      status: 'closed',
      entryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      entryPrice: 150.25,
      exitDate: new Date().toISOString(),
      exitPrice: 165.75,
      quantity: 10,
      fees: 9.99,
      strategy: 'Trend Following',
      notes: 'Strong earnings report',
      tags: ['tech', 'earnings'],
      images: [],
      partialExits: []
    },
    {
      id: crypto.randomUUID(),
      symbol: 'MSFT',
      direction: 'long',
      type: 'equity',
      status: 'open',
      entryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      entryPrice: 310.20,
      quantity: 5,
      fees: 9.99,
      strategy: 'Momentum',
      notes: 'Following tech uptrend',
      tags: ['tech'],
      images: [],
      partialExits: []
    },
    {
      id: crypto.randomUUID(),
      symbol: 'ES',
      direction: 'short',
      type: 'futures',
      status: 'closed',
      entryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      entryPrice: 4580.25,
      exitDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      exitPrice: 4530.50,
      quantity: 1,
      fees: 4.50,
      strategy: 'Reversal',
      notes: 'Short-term overbought',
      tags: ['index', 'overnight'],
      images: [],
      partialExits: [],
      contractDetails: {
        exchange: 'CME',
        contractSize: 1,
        tickSize: 0.25,
        tickValue: 12.50
      }
    }
  ];
  
  // Remove any existing trades
  localStorage.removeItem('trade-journal-trades');
  
  // Save the dummy trades
  await saveTrades(dummyTrades);
  console.log('Added dummy trades for testing');
  toast.success('Added dummy trades for testing');
};

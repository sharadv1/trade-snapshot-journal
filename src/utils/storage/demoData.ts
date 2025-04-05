
import { Trade } from '@/types';
import { saveTrades } from './storageCore';

// Function to add dummy trades to localStorage
export const addDummyTrades = (): void => {
  const today = new Date();
  const demoTrades = [
    {
      id: "demo-1",
      symbol: "AAPL",
      type: "stock",
      direction: "long",
      quantity: 100,
      entryDate: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      entryPrice: 185.25,
      exitDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      exitPrice: 192.53,
      status: "closed",
      stopLoss: 180.00,
      takeProfit: 195.00,
      fees: 2.95,
      strategy: "Breakout",
      notes: "Earnings beat expectations, strong uptrend formed.",
      grade: "A",
      images: [],
      tags: ["tech", "long-term"],
      partialExits: [
        {
          id: "pe-demo-1-1",
          quantity: 50,
          price: 190.25,
          date: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          fees: 1.50,
          notes: "Partial profit taking at first target"
        },
        {
          id: "pe-demo-1-2",
          quantity: 50,
          price: 192.53,
          date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          fees: 1.45,
          notes: "Final exit at second target"
        }
      ]
    },
    {
      id: "demo-2",
      symbol: "MSFT",
      type: "stock",
      direction: "long",
      quantity: 50,
      entryDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      entryPrice: 380.45,
      status: "open",
      stopLoss: 370.00,
      takeProfit: 400.00,
      fees: 1.99,
      strategy: "Trend Following",
      notes: "Following uptrend, waiting for cloud services news catalyst.",
      grade: "B",
      images: [],
      tags: ["tech", "cloud"],
      partialExits: []
    },
    {
      id: "demo-3",
      symbol: "TSLA",
      type: "stock",
      direction: "short",
      quantity: 25,
      entryDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      entryPrice: 785.50,
      exitDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      exitPrice: 760.00,
      status: "closed",
      stopLoss: 800.00,
      takeProfit: 750.00,
      fees: 0.99,
      strategy: "Mean Reversion",
      notes: "Overbought conditions, expecting pullback.",
      grade: "C",
      images: [],
      tags: ["auto", "overvalued"],
      partialExits: [
        {
          id: "pe-demo-3-1",
          quantity: 25,
          price: 760.00,
          date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          fees: 0.99,
          notes: "Full exit on target"
        }
      ]
    },
    {
      id: "demo-4",
      symbol: "ES",
      type: "futures",
      direction: "long",
      quantity: 2,
      entryDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      entryPrice: 4520.25,
      exitDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      exitPrice: 4535.50,
      status: "closed",
      stopLoss: 4510.00,
      takeProfit: 4540.00,
      fees: 2.50,
      strategy: "Scalping",
      notes: "Quick profit from overnight session.",
      grade: "B",
      images: [],
      tags: ["index", "overnight"],
      contractDetails: {
        exchange: "CME",
        tickSize: 0.25,
        contractSize: 50,
        tickValue: 12.50
      },
      partialExits: [
        {
          id: "pe-demo-4-1",
          quantity: 1,
          price: 4530.25,
          date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          fees: 1.25,
          notes: "First contract out at initial target"
        },
        {
          id: "pe-demo-4-2",
          quantity: 1,
          price: 4535.50,
          date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          fees: 1.25,
          notes: "Second contract at final target"
        }
      ]
    },
    {
      id: "demo-5",
      symbol: "GC",
      type: "futures",
      direction: "long",
      quantity: 1,
      entryDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      entryPrice: 1950.50,
      status: "open",
      stopLoss: 1940.00,
      takeProfit: 1970.00,
      fees: 3.00,
      strategy: "Trend Following",
      notes: "Gold prices rising due to inflation fears.",
      grade: "A",
      images: [],
      tags: ["gold", "inflation"],
      contractDetails: {
        exchange: "COMEX",
        tickSize: 0.1,
        contractSize: 100,
        tickValue: 10
      },
      partialExits: []
    },
    {
      id: "demo-6",
      symbol: "EURUSD",
      type: "forex",
      direction: "short",
      quantity: 10000,
      entryDate: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      entryPrice: 1.1050,
      exitDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      exitPrice: 1.1025,
      status: "closed",
      stopLoss: 1.1075,
      takeProfit: 1.1000,
      fees: 0.00,
      strategy: "News Event",
      notes: "ECB rate decision caused Euro to weaken.",
      grade: "B",
      images: [],
      tags: ["currency", "ECB"],
      partialExits: [
        {
          id: "pe-demo-6-1",
          quantity: 10000,
          price: 1.1025,
          date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          fees: 0.00,
          notes: "Full position exit on target"
        }
      ]
    },
    {
      id: "demo-7",
      symbol: "BTCUSD",
      type: "crypto",
      direction: "long",
      quantity: 0.5,
      entryDate: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      entryPrice: 45000,
      status: "open",
      stopLoss: 44000,
      takeProfit: 47000,
      fees: 15.00,
      strategy: "Hodl",
      notes: "Long-term investment in Bitcoin.",
      grade: "B",
      images: [],
      tags: ["crypto", "long-term"],
      partialExits: []
    },
    {
      id: "demo-8",
      symbol: "SPY",
      type: "options",
      direction: "long",
      quantity: 5,
      entryDate: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      entryPrice: 450.00,
      exitDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      exitPrice: 455.00,
      status: "closed",
      stopLoss: 445.00,
      takeProfit: 460.00,
      fees: 1.50,
      strategy: "Covered Call",
      notes: "Collecting premium on SPY holdings.",
      grade: "C",
      images: [],
      tags: ["options", "income"],
      partialExits: [
        {
          id: "pe-demo-8-1",
          quantity: 3,
          price: 453.50,
          date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          fees: 0.90,
          notes: "Partial exit as option approached expiration"
        },
        {
          id: "pe-demo-8-2",
          quantity: 2,
          price: 455.00,
          date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          fees: 0.60,
          notes: "Final exit at expiration"
        }
      ]
    }
  ];

  saveTrades(demoTrades as Trade[]);
};

// Function to initialize sample data in localStorage if needed
export const initializeDemoDataIfNeeded = (): void => {
  try {
    const storedTrades = localStorage.getItem('trade-journal-trades');
    if (!storedTrades || JSON.parse(storedTrades).length === 0) {
      addDummyTrades();
      console.log('Demo data initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing demo data:', error);
    // Force adding demo data even if there was an error
    addDummyTrades();
  }
};

// Function to force reset all demo data
export const resetDemoData = (): void => {
  try {
    addDummyTrades();
    console.log('Demo data reset successfully');
    // Dispatch event to notify components that data has changed
    document.dispatchEvent(new CustomEvent('trade-updated'));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'trade-journal-trades'
    }));
  } catch (error) {
    console.error('Error resetting demo data:', error);
  }
};

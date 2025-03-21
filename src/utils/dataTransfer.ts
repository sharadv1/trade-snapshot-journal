import { Trade, COMMON_FUTURES_CONTRACTS, Strategy, TradeIdea } from '@/types';
import { getTrades, saveTrades, getTradesSync } from '@/utils/storage/storageCore';
import { getStrategies } from './strategyStorage';
import { saveStrategies } from './strategyStorage'; 
import { getAllSymbols, addCustomSymbol } from './symbolStorage';

// Define a local interface that matches what we're actually using
interface SymbolDetails {
  symbol: string;
  type?: 'equity' | 'futures' | 'option';
  description?: string;
}

export interface ImportData {
  trades: Trade[];
  strategies: Strategy[];
  symbols: SymbolDetails[];
  ideas: TradeIdea[];
}

// Export all data
export const exportAllData = async (): Promise<ImportData> => {
  const trades = await getTrades();
  const strategies = getStrategies();
  const symbols = getAllSymbols();
  const ideas = localStorage.getItem('tradeIdeas') ? 
    JSON.parse(localStorage.getItem('tradeIdeas') || '[]') : [];
  
  return {
    trades,
    strategies,
    symbols,
    ideas
  };
};

// Import all data
export const importAllData = async (data: ImportData): Promise<boolean> => {
  try {
    // Validate data structure
    if (!data.trades || !Array.isArray(data.trades)) {
      throw new Error('Invalid trades data');
    }
    
    // Import trades
    await saveTrades(data.trades);
    
    // Import strategies
    if (data.strategies && Array.isArray(data.strategies)) {
      saveStrategies(data.strategies);
    }
    
    // Import symbols
    if (data.symbols && Array.isArray(data.symbols)) {
      data.symbols.forEach(symbol => {
        if (symbol.symbol) {
          addCustomSymbol({
            symbol: symbol.symbol,
            type: symbol.type
          });
        }
      });
    }
    
    // Import ideas
    if (data.ideas && Array.isArray(data.ideas)) {
      localStorage.setItem('tradeIdeas', JSON.stringify(data.ideas));
    }
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

// Generate some demo data
export const generateDemoData = async (): Promise<boolean> => {
  const demoTrades: Trade[] = [
    {
      id: 'demo-trade-1',
      symbol: 'AAPL',
      direction: 'long',
      type: 'equity',
      status: 'open',
      entryDate: new Date().toISOString(),
      entryPrice: 150.00,
      quantity: 10,
      strategy: 'Trend Following',
      tags: ['tech', 'long-term'],
      images: [],
      partialExits: []
    },
    {
      id: 'demo-trade-2',
      symbol: 'TSLA',
      direction: 'short',
      type: 'equity',
      status: 'closed',
      entryDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
      entryPrice: 800.00,
      exitDate: new Date().toISOString(),
      exitPrice: 750.00,
      quantity: 5,
      strategy: 'Mean Reversion',
      tags: ['auto', 'short-term'],
      images: [],
      partialExits: []
    },
    {
      id: 'demo-trade-3',
      symbol: 'ES',
      direction: 'long',
      type: 'futures',
      status: 'open',
      entryDate: new Date().toISOString(),
      entryPrice: 4200.00,
      quantity: 2,
      strategy: 'Breakout',
      tags: ['index', 'day-trade'],
      images: [],
      partialExits: []
    }
  ];
  
  const demoStrategies: Strategy[] = [
    {
      id: 'strategy-1',
      name: 'Trend Following',
      description: 'Following established market trends',
      color: '#4CAF50'
    },
    {
      id: 'strategy-2',
      name: 'Mean Reversion',
      description: 'Trading price returns to the mean',
      color: '#F44336'
    },
    {
      id: 'strategy-3',
      name: 'Breakout',
      description: 'Trading breakouts from consolidation patterns',
      color: '#2196F3'
    }
  ];
  
  const demoSymbols: SymbolDetails[] = [
    {
      symbol: 'AAPL',
      type: 'equity',
      description: 'Apple Inc.'
    },
    {
      symbol: 'TSLA',
      type: 'equity',
      description: 'Tesla, Inc.'
    },
    {
      symbol: 'ES',
      type: 'futures',
      description: 'E-mini S&P 500'
    }
  ];
  
  const demoIdeas: TradeIdea[] = [
    {
      id: 'idea-1',
      date: new Date().toISOString(),
      symbol: 'GOOGL',
      description: 'Potential long position based on upcoming product launch',
      status: 'still valid',
      direction: 'long',
      images: []
    },
    {
      id: 'idea-2',
      date: new Date().toISOString(),
      symbol: 'AMZN',
      description: 'Short position due to disappointing earnings report',
      status: 'invalidated',
      direction: 'short',
      images: []
    }
  ];
  
  try {
    await saveTrades(demoTrades);
    saveStrategies(demoStrategies);
    
    demoSymbols.forEach(symbol => {
      addCustomSymbol({
        symbol: symbol.symbol,
        type: symbol.type
      });
    });
    
    localStorage.setItem('tradeIdeas', JSON.stringify(demoIdeas));
    
    return true;
  } catch (error) {
    console.error('Error generating demo data:', error);
    return false;
  }
};

// Function to parse CSV data
export const parseCSVData = (csvText: string): any[] => {
  const rows: any[] = [];
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  for (let i = 1; i < lines.length; i++) {
    const data: { [key: string]: string } = {};
    const values = lines[i].split(',').map(value => value.trim());
    
    if (values.length !== headers.length) {
      console.warn(`Skipping row ${i + 1} due to inconsistent number of columns`);
      continue;
    }
    
    for (let j = 0; j < headers.length; j++) {
      data[headers[j]] = values[j];
    }
    
    rows.push(data);
  }
  
  return rows;
};

// Import trades from CSV
export const importTradesFromCSV = async (csvText: string): Promise<boolean> => {
  try {
    const parsedData = parseCSVData(csvText);
    
    const trades: Trade[] = parsedData.map(item => ({
      id: item.id || `trade-${crypto.randomUUID()}`,
      symbol: item.symbol || '',
      direction: (item.direction === 'long' || item.direction === 'short') ? item.direction : 'long',
      type: (item.type === 'equity' || item.type === 'futures' || item.type === 'option') ? item.type : 'equity',
      status: (item.status === 'open' || item.status === 'closed') ? item.status : 'open',
      entryDate: item.entryDate || new Date().toISOString(),
      entryPrice: parseFloat(item.entryPrice || '0'),
      exitDate: item.exitDate || undefined,
      exitPrice: item.exitPrice ? parseFloat(item.exitPrice) : undefined,
      quantity: parseInt(item.quantity || '1', 10),
      fees: item.fees ? parseFloat(item.fees) : undefined,
      stopLoss: item.stopLoss ? parseFloat(item.stopLoss) : undefined,
      takeProfit: item.takeProfit ? parseFloat(item.takeProfit) : undefined,
      strategy: item.strategy || undefined,
      notes: item.notes || undefined,
      tags: item.tags ? item.tags.split(';').map(tag => tag.trim()) : [],
      images: item.images ? item.images.split(';').map(image => image.trim()) : [],
      partialExits: item.partialExits ? JSON.parse(item.partialExits) : [],
      contractDetails: item.contractDetails ? JSON.parse(item.contractDetails) : undefined,
      pspTime: item.pspTime || undefined,
      timeframe: item.timeframe || undefined,
      ideaId: item.ideaId || undefined,
      grade: item.grade || undefined
    }));
    
    await saveTrades(trades);
    
    return true;
  } catch (error) {
    console.error('Error importing trades from CSV:', error);
    return false;
  }
};

// Export trades to CSV
export const exportTradesToCSV = async (): Promise<string> => {
  const trades = await getTrades();
  
  const headers = [
    'id', 'symbol', 'direction', 'type', 'status', 'entryDate', 'entryPrice',
    'exitDate', 'exitPrice', 'quantity', 'fees', 'stopLoss', 'takeProfit',
    'strategy', 'notes', 'tags', 'images', 'partialExits', 'contractDetails',
    'pspTime', 'timeframe', 'ideaId', 'grade'
  ];
  
  const csvRows = [
    headers.join(',')
  ];
  
  trades.forEach(trade => {
    const values = [
      trade.id,
      trade.symbol,
      trade.direction,
      trade.type,
      trade.status,
      trade.entryDate,
      trade.entryPrice,
      trade.exitDate || '',
      trade.exitPrice || '',
      trade.quantity,
      trade.fees || '',
      trade.stopLoss || '',
      trade.takeProfit || '',
      trade.strategy || '',
      trade.notes || '',
      trade.tags ? trade.tags.join(';') : '',
      trade.images ? trade.images.join(';') : '',
      trade.partialExits ? JSON.stringify(trade.partialExits) : '',
      trade.contractDetails ? JSON.stringify(trade.contractDetails) : '',
      trade.pspTime || '',
      trade.timeframe || '',
      trade.ideaId || '',
      trade.grade || ''
    ];
    
    csvRows.push(values.map(value => `"${value}"`).join(','));
  });
  
  const csvContent = csvRows.join('\n');
  
  return csvContent;
};

// Reset all data
export const resetAllData = async (): Promise<boolean> => {
  try {
    localStorage.removeItem('trades');
    localStorage.removeItem('tradeStrategies');
    localStorage.removeItem('customSymbols');
    localStorage.removeItem('tradeIdeas');
    
    return true;
  } catch (error) {
    console.error('Error resetting data:', error);
    return false;
  }
};

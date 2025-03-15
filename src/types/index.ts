
export interface Trade {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  type: 'equity' | 'futures' | 'option';
  status: 'open' | 'closed';
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  quantity: number;
  fees?: number;
  stopLoss?: number;
  takeProfit?: number;
  strategy?: string;
  customStrategy?: string;
  notes?: string;
  tags?: string[];
  images?: string[];
  partialExits?: PartialExit[];
  contractDetails?: FuturesContractDetails;
  pspTime?: string; // PSP time in HH:MM AM/PM format
  timeframe?: 'm5' | 'm15' | 'H1' | 'H4' | 'D1' | 'W1' | 'M1';
}

export interface PartialExit {
  id: string;
  exitDate: string;
  exitPrice: number;
  quantity: number;
  fees?: number;
  notes?: string;
}

export interface FuturesContractDetails {
  exchange: string;
  contractSize: number;
  tickSize: number;
  tickValue: number;
}

export interface TradeMetrics {
  profitLoss: number;
  profitLossPercentage: number;
  riskedAmount?: number;
  maxPotentialGain?: number;
  riskRewardRatio?: number;
  calculationExplanation?: string;
  weightedExitPrice?: number;
  latestExitDate?: string;
}

export interface TradeWithMetrics extends Trade {
  metrics: TradeMetrics;
}

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  color: string;
}

export const COMMON_FUTURES_CONTRACTS = [
  {
    symbol: 'ES',
    name: 'E-mini S&P 500',
    exchange: 'CME',
    tickSize: 0.25,
    pointValue: 50
  },
  {
    symbol: 'NQ',
    name: 'E-mini NASDAQ-100',
    exchange: 'CME',
    tickSize: 0.25,
    pointValue: 20
  },
  {
    symbol: 'YM',
    name: 'E-mini Dow',
    exchange: 'CBOT',
    tickSize: 1.00,
    pointValue: 5
  },
  {
    symbol: 'RTY',
    name: 'E-mini Russell 2000',
    exchange: 'CME',
    tickSize: 0.10,
    pointValue: 50
  },
  {
    symbol: 'CL',
    name: 'Crude Oil',
    exchange: 'NYMEX',
    tickSize: 0.01,
    pointValue: 1000
  },
  {
    symbol: 'GC',
    name: 'Gold',
    exchange: 'COMEX',
    tickSize: 0.10,
    pointValue: 100
  },
  {
    symbol: 'SI',
    name: 'Silver',
    exchange: 'COMEX',
    tickSize: 0.005,
    pointValue: 5000
  },
  {
    symbol: 'ZC',
    name: 'Corn',
    exchange: 'CBOT',
    tickSize: 0.25,
    pointValue: 50
  },
  {
    symbol: 'ZS',
    name: 'Soybeans',
    exchange: 'CBOT',
    tickSize: 0.25,
    pointValue: 50
  },
  {
    symbol: 'ZW',
    name: 'Wheat',
    exchange: 'CBOT',
    tickSize: 0.25,
    pointValue: 50
  },
  {
    symbol: '6E',
    name: 'Euro FX',
    exchange: 'CME',
    tickSize: 0.00005,
    pointValue: 125000
  },
  {
    symbol: '6J',
    name: 'Japanese Yen',
    exchange: 'CME',
    tickSize: 0.0000005,
    pointValue: 12500000
  },
  {
    symbol: 'MES',
    name: 'Micro E-mini S&P 500',
    exchange: 'CME',
    tickSize: 0.25,
    pointValue: 5
  },
  {
    symbol: 'MNQ',
    name: 'Micro E-mini NASDAQ-100',
    exchange: 'CME',
    tickSize: 0.25,
    pointValue: 2
  },
  {
    symbol: 'M2K',
    name: 'Micro E-mini Russell 2000',
    exchange: 'CME',
    tickSize: 0.10,
    pointValue: 5
  },
  {
    symbol: 'MYM',
    name: 'Micro E-mini Dow',
    exchange: 'CBOT',
    tickSize: 1.00,
    pointValue: 0.50
  }
];

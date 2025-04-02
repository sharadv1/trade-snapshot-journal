export interface Trade {
  id: string;
  symbol: string;
  type: 'stock' | 'option' | 'futures' | 'crypto' | 'forex';
  direction: 'long' | 'short';
  entryPrice: number;
  entryDate: string;
  quantity: number;
  exitPrice?: number;
  exitDate?: string;
  stopLoss?: number;
  takeProfit?: number;
  fees?: number;
  commissions?: number;
  slippage?: number;
  profitLoss?: number;
  notes?: string;
  images?: string[];
  status: 'open' | 'closed' | 'cancelled';
  strategy?: string;
  timeframe?: string;
  ssmtQuarters?: string; // New field for SSMT Quarters
  mistakes?: string[];
  partialExits?: PartialExit[];
  ideaId?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  tags?: string[];
  // For futures contracts only
  contractDetails?: FuturesContractDetails;
  grade?: string; // Add grade field
  pspTime?: string; // Add pspTime field
}

export interface TradeWithMetrics extends Trade {
  metrics: {
    profitLoss?: number;
    profitLossPercentage?: number;
    riskedAmount?: number;
    maxPotentialGain?: number;
    riskRewardRatio?: number;
    calculationExplanation?: string;
    weightedExitPrice?: number;
    latestExitDate?: string;
  };
}

export interface PartialExit {
  id: string;
  exitDate: string;
  exitPrice: number;
  quantity: number;
  fees?: number;
  notes?: string;
}

export interface TradeIdea {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  notes?: string;
  date: string;
  image?: string;
  isTaken: boolean;
  status?: 'still valid' | 'invalidated' | 'taken' | 'missed';
  description?: string;
  images?: string[];
  reflection?: string;
  weekId?: string;
  monthId?: string;
}

export interface FuturesContractDetails {
  exchange?: string;
  tickSize?: number;
  contractSize?: number;
  tickValue?: number;
}

export interface WeeklyReflection {
  id: string;
  date: string;
  wins: string;
  losses: string;
  improvements: string;
  weekId: string;
  weekStart?: string;
  weekEnd?: string;
  grade?: string;
  reflection?: string;
  weeklyPlan?: string;
  tradeIds?: string[];
  lastUpdated?: string;
}

export interface MonthlyReflection {
  id: string;
  date: string;
  summary: string;
  lessons: string;
  goals: string;
  monthId: string;
  monthStart?: string;
  monthEnd?: string;
  grade?: string;
  reflection?: string;
  tradeIds?: string[];
  lastUpdated?: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
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
    symbol: 'MES',
    name: 'Micro E-mini S&P 500',
    exchange: 'CME',
    tickSize: 0.25,
    pointValue: 5
  },
  {
    symbol: 'NQ',
    name: 'E-mini Nasdaq-100',
    exchange: 'CME',
    tickSize: 0.25,
    pointValue: 20
  },
  {
    symbol: 'MNQ',
    name: 'Micro E-mini Nasdaq-100',
    exchange: 'CME',
    tickSize: 0.25,
    pointValue: 2
  },
  {
    symbol: 'YM',
    name: 'E-mini Dow',
    exchange: 'CBOT',
    tickSize: 1.0,
    pointValue: 5
  },
  {
    symbol: 'MYM',
    name: 'Micro E-mini Dow',
    exchange: 'CBOT',
    tickSize: 1.0,
    pointValue: 0.5
  },
  {
    symbol: 'RTY',
    name: 'E-mini Russell 2000',
    exchange: 'CME',
    tickSize: 0.1,
    pointValue: 50
  },
  {
    symbol: 'M2K',
    name: 'Micro E-mini Russell 2000',
    exchange: 'CME',
    tickSize: 0.1,
    pointValue: 5
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
    tickSize: 0.1,
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
    symbol: 'ZB',
    name: '30-Year U.S. Treasury Bond',
    exchange: 'CBOT',
    tickSize: 1/32,
    pointValue: 1000
  },
  {
    symbol: 'ZN',
    name: '10-Year U.S. Treasury Note',
    exchange: 'CBOT',
    tickSize: 1/32,
    pointValue: 1000
  },
  {
    symbol: 'ZF',
    name: '5-Year U.S. Treasury Note',
    exchange: 'CBOT',
    tickSize: 1/32,
    pointValue: 1000
  }
];

export interface Trade {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  positionSize: number;
  quantity: number;
  status: 'open' | 'closed';
  type?: 'stock' | 'futures' | 'forex' | 'crypto' | 'options';
  fees?: number;
  notes?: string;
  strategyId?: string;
  strategy?: string;
  createdAt?: string;
  updatedAt?: string;
  images?: string[];
  riskRewardRatio?: number;
  stopLoss?: number;
  takeProfit?: number;
  partialExits?: PartialExit[];
  ideaId?: string;
  contractDetails?: FuturesContractDetails;
  account?: string;
  grade?: string;
  mistakes?: string[];
  timeframe?: string;
  pspTime?: string;
  ssmtQuarters?: string;
  tags?: string[];
}

export interface TradeWithMetrics extends Trade {
  metrics: {
    profitLoss: number;
    riskRewardRatio: number;
    rMultiple: number;
    riskedAmount?: number;
    maxPotentialGain?: number;
    profitLossPercentage?: number;
    calculationExplanation?: string;
    latestExitDate?: string;
    weightedExitPrice?: number;
  };
}

export interface WeeklyReflection {
  id: string;
  weekId: string;
  weekStart: string;
  weekEnd: string;
  reflection: string;
  weeklyPlan: string;
  grade: string;
  tradeIds: string[];
  totalPnL?: number;
  totalR?: number;
  isPlaceholder?: boolean;
  lastUpdated?: string;
}

export interface MonthlyReflection {
  id: string;
  monthId: string;
  monthStart: string;
  monthEnd: string;
  reflection: string;
  grade: string;
  tradeIds: string[];
  totalPnL?: number;
  totalR?: number;
  isPlaceholder?: boolean;
  lastUpdated?: string;
}

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  color?: string;
}

export interface FuturesContractDetails {
  symbol: string;
  name: string;
  exchange: string;
  tickSize?: number;
  pointValue?: number;
  marginRequirement?: number;
  expirationDate?: string;
  contractSize?: number;
  tradingHours?: string;
  tickValue?: number;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  category: string;
  description?: string;
  media?: LessonMedia[];
  createdAt: string;
  updatedAt?: string;
  types?: string[];
}

export interface LessonMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  title?: string;
  description?: string;
  caption?: string;
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
    symbol: 'ZB',
    name: '30-Year U.S. Treasury Bond',
    exchange: 'CBOT',
    tickSize: 1/32,
    pointValue: 1000
  }
];

export interface TradeIdea {
  id: string;
  symbol: string;
  direction: 'long' | 'short' | string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  description: string;
  status: 'active' | 'executed' | 'expired' | 'canceled' | 'taken' | 'still valid' | 'invalidated' | 'missed' | 'open' | 'invalid';
  createdAt: string;
  date?: string;
  updatedAt?: string;
  images?: string[];
}

export interface PartialExit {
  id: string;
  exitDate: string;
  date?: string;
  exitPrice: number;
  price?: number;
  quantity: number;
  fees?: number;
  notes?: string;
}

export const TRADE_TYPES = ['stock', 'futures', 'forex', 'crypto', 'options'] as const;
export type TradeType = typeof TRADE_TYPES[number];

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
  // New fields for tracking initial risk and price extremes
  initialStopLoss?: number; // Stop loss at trade entry
  maxFavorablePrice?: number; // Best price reached during the trade
  maxAdversePrice?: number; // Worst price reached during the trade
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
  targetReached?: boolean; // New field to track if price reached target
}

export interface TradeWithMetrics extends Trade {
  metrics: {
    profitLoss: number;
    riskRewardRatio: number;
    rMultiple: number;
    riskedAmount?: number;
    initialRiskedAmount?: number; // Initial risk amount based on initial stop
    maxPotentialGain?: number;
    profitLossPercentage?: number;
    calculationExplanation?: string;
    latestExitDate?: string;
    weightedExitPrice?: number;
    maxFavorableExcursion?: number; // How much the trade went in your favor
    maxAdverseExcursion?: number; // How much heat the trade took
    capturedProfitPercent?: number; // What percentage of the max move you captured
  };
}

export interface BaseReflection {
  id: string;
  reflection: string;
  grade?: string;
  lastUpdated?: string;
  tradeIds: string[];
  isPlaceholder?: boolean;
  totalPnL?: number;
  totalR?: number;
}

export interface WeeklyReflection extends BaseReflection {
  weekId: string;
  weekStart: string;
  weekEnd: string;
  weeklyPlan?: string;
}

export interface MonthlyReflection extends BaseReflection {
  monthId: string;
  monthStart: string;
  monthEnd: string;
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

export interface CommonFuturesContract {
  symbol: string;
  name: string;
  exchange: string;
  tickSize: number;
  pointValue: number;
  contractSize?: number;
  description?: string;
}

export const COMMON_FUTURES_CONTRACTS: CommonFuturesContract[] = [
  {
    symbol: 'ES',
    name: 'E-mini S&P 500',
    exchange: 'CME',
    tickSize: 0.25,
    pointValue: 50,
    contractSize: 1,
    description: 'E-mini S&P 500 Futures'
  },
  {
    symbol: 'NQ',
    name: 'E-mini NASDAQ-100',
    exchange: 'CME',
    tickSize: 0.25,
    pointValue: 20,
    contractSize: 1,
    description: 'E-mini NASDAQ-100 Futures'
  },
  {
    symbol: 'CL',
    name: 'Crude Oil',
    exchange: 'NYMEX',
    tickSize: 0.01,
    pointValue: 1000,
    contractSize: 1,
    description: 'Crude Oil Futures'
  },
  {
    symbol: 'GC',
    name: 'Gold',
    exchange: 'COMEX',
    tickSize: 0.10,
    pointValue: 100,
    contractSize: 1,
    description: 'Gold Futures'
  },
  {
    symbol: 'ZB',
    name: '30-Year U.S. Treasury Bond',
    exchange: 'CBOT',
    tickSize: 1/32,
    pointValue: 1000,
    contractSize: 1,
    description: '30-Year U.S. Treasury Bond Futures'
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

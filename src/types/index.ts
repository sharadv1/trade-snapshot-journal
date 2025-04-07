export interface Trade {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  positionSize: number;
  fees?: number;
  notes?: string;
  strategyId?: string;
  createdAt?: string;
  updatedAt?: string;
  images?: string[];
  riskRewardRatio?: number;
  stopLoss?: number;
  takeProfit?: number;
  partialExits?: PartialExit[];
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
  media?: LessonMedia[];
  createdAt: string;
  updatedAt?: string;
  types?: string[];
  description?: string;
}

export interface LessonMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  title?: string;
  description?: string;
  caption?: string;
}

// Define common futures contracts
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
  direction: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  description: string;
  status: 'active' | 'executed' | 'expired' | 'canceled';
  createdAt: string;
  updatedAt?: string;
  images?: string[];
}

export interface PartialExit {
  id: string;
  exitDate: string;
  exitPrice: number;
  quantity: number;
  fees?: number;
  notes?: string;
}

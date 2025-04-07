export interface Trade {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  positionSize: number;
  stopLoss: number;
  takeProfit?: number;
  notes?: string;
  accountName?: string;
  tags?: string[];
  
  // Additional properties used throughout the codebase
  quantity?: number;
  status?: 'open' | 'closed' | 'pending';
  type?: 'stock' | 'futures' | 'forex' | 'crypto' | 'option' | 'options';
  strategy?: string;
  fees?: number;
  grade?: string;
  timeframe?: string;
  partialExits?: PartialExit[];
  images?: string[];
  mistakes?: string[];
  ideaId?: string;
  ssmtQuarters?: string;
  account?: string;
  pspTime?: string;
  contractDetails?: FuturesContractDetails;
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
  weekStart?: string;
  weekEnd?: string;
  reflection: string;
  weeklyPlan?: string;
  grade?: string;
  lastUpdated?: string;
  tradeIds?: string[];
  totalPnL?: number;
  totalR?: number;
  isPlaceholder?: boolean;
}

export interface MonthlyReflection {
  id: string;
  monthId: string;
  monthStart?: string;
  monthEnd?: string;
  reflection: string;
  grade?: string;
  lastUpdated?: string;
  tradeIds?: string[];
  totalPnL?: number;
  totalR?: number;
  isPlaceholder?: boolean;
}

export interface PartialExit {
  id: string;
  date: string;
  exitDate: string;
  price: number;
  exitPrice: number;
  quantity: number;
  fees?: number;
  notes?: string;
}

export interface TradeIdea {
  id: string;
  date: string;
  symbol: string;
  description: string;
  status: 'still valid' | 'invalidated' | 'taken' | 'missed' | 'open' | 'expired' | 'invalid';
  direction: 'long' | 'short';
  images: string[];
  linkedTradeIds?: string[];
}

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  rules?: string;
  setups?: string[];
  entryConditions?: string[];
  exitConditions?: string[];
  riskManagement?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  color?: string;
}

export interface FuturesContractDetails {
  symbol: string;
  name: string;
  exchange: string;
  tickSize: number;
  valuePerTick: number;
  pointValue: number;
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
  tags?: string[];
  source?: string;
  media?: LessonMedia[];
  createdAt: string;
  updatedAt?: string;
  types?: string[];
  description?: string;
}

export interface LessonMedia {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  title?: string;
  description?: string;
  caption?: string;
}

// Define common futures contracts
export const COMMON_FUTURES_CONTRACTS = [
  { symbol: 'ES', name: 'E-mini S&P 500', exchange: 'CME' },
  { symbol: 'NQ', name: 'E-mini NASDAQ-100', exchange: 'CME' },
  { symbol: 'YM', name: 'E-mini Dow', exchange: 'CBOT' },
  { symbol: 'RTY', name: 'E-mini Russell 2000', exchange: 'CME' },
  { symbol: 'CL', name: 'Crude Oil', exchange: 'NYMEX' },
  { symbol: 'GC', name: 'Gold', exchange: 'COMEX' },
  { symbol: 'SI', name: 'Silver', exchange: 'COMEX' },
  { symbol: 'ZB', name: '30-Year U.S. Treasury Bond', exchange: 'CBOT' },
  { symbol: 'ZN', name: '10-Year U.S. Treasury Note', exchange: 'CBOT' },
  { symbol: 'ZF', name: '5-Year U.S. Treasury Note', exchange: 'CBOT' },
  { symbol: 'ZT', name: '2-Year U.S. Treasury Note', exchange: 'CBOT' },
  { symbol: '6E', name: 'Euro FX', exchange: 'CME' },
  { symbol: '6J', name: 'Japanese Yen', exchange: 'CME' },
  { symbol: '6B', name: 'British Pound', exchange: 'CME' },
  { symbol: '6A', name: 'Australian Dollar', exchange: 'CME' },
  { symbol: '6C', name: 'Canadian Dollar', exchange: 'CME' },
  { symbol: 'ZC', name: 'Corn', exchange: 'CBOT' },
  { symbol: 'ZS', name: 'Soybeans', exchange: 'CBOT' },
  { symbol: 'ZW', name: 'Wheat', exchange: 'CBOT' },
  { symbol: 'KC', name: 'Coffee', exchange: 'ICE' },
  { symbol: 'CT', name: 'Cotton', exchange: 'ICE' },
  { symbol: 'NG', name: 'Natural Gas', exchange: 'NYMEX' },
  { symbol: 'HO', name: 'Heating Oil', exchange: 'NYMEX' },
  { symbol: 'RB', name: 'RBOB Gasoline', exchange: 'NYMEX' }
];

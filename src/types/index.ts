export interface Trade {
  id: string;
  symbol: string;
  entryDate: string;
  exitDate?: string;
  entryPrice: number | string;
  exitPrice?: number | string;
  quantity: number | string;
  stopLoss?: number | string;
  initialStopLoss?: number | string;
  takeProfit?: number | string;
  direction: 'long' | 'short';
  type: 'stock' | 'futures' | 'forex' | 'options' | 'crypto';
  status: 'open' | 'closed';
  notes?: string;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  timeframe?: string;
  fees?: number;
  strategy?: string;
  images?: string[];
  contractDetails?: any;
  partialExits?: PartialExit[];
  mistakes?: string[];
  account?: string;
  pspTime?: string;
  ssmtQuarters?: string;
  maxFavorablePrice?: number | string;
  maxAdversePrice?: number | string;
  targetReached?: boolean;
  targetReachedBeforeExit?: boolean;
}

export interface TradeWithMetrics extends Trade {
  metrics?: {
    profitLoss: number;
    riskRewardRatio: number;
    rMultiple: number;
    profitLossPercentage: number;
    riskedAmount: number;
    initialRiskedAmount: number;
    maxPotentialGain: number;
    calculationExplanation: string;
    weightedExitPrice?: number;
    latestExitDate?: string;
    maxFavorableExcursion: number;
    maxAdverseExcursion: number;
    capturedProfitPercent: number;
  };
}

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  rules?: string;
  createdAt: Date;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: string;
}

export interface WeeklyReflection {
  id: string;
  date: string;
  reflection: string;
  weeklyPlan?: string;
  grade?: string;
  weekId?: string;
  weekStart?: string;
  weekEnd?: string;
  totalPnL?: number;
  totalR?: number;
  tradeIds?: string[];
  isPlaceholder?: boolean;
  lastUpdated?: string;
  actions?: React.ReactNode;
}

export interface MonthlyReflection {
  id: string;
  date: string;
  reflection: string;
  monthlyPlan?: string;
  grade?: string;
  monthId?: string;
  monthStart?: string;
  monthEnd?: string;
  totalPnL?: number;
  totalR?: number;
  tradeIds?: string[];
  isPlaceholder?: boolean;
  lastUpdated?: string;
  actions?: React.ReactNode;
}

export interface PartialExit {
  id: string;
  exitPrice: number | string;
  quantity: number | string;
  exitDate: string;
}

export interface ContractDetails {
  exchange: string;
  tickSize: string;
  contractSize: string;
  tickValue: string;
}

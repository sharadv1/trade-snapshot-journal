

export interface Trade {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  quantity: number;
  status: 'open' | 'closed';
  type: 'stock' | 'futures' | 'options' | 'forex';
  strategy?: string;
  stopLoss?: number;
  initialStopLoss?: number;
  takeProfit?: number;
  fees?: number;
  notes?: string;
  images?: string[];
  riskRewardRatio?: number;
  account?: string;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  mistakes?: string[];
  timeframe?: string;
  pspTime?: string;
  ssmtQuarters?: string;
  tags?: string[];
  ideaId?: string;
  partialExits?: PartialExit[];
  contractDetails?: Record<string, any>;
  maxFavorablePrice?: number;
  maxAdversePrice?: number;
  targetReached?: boolean;
  targetReachedBeforeExit?: boolean;
}

export interface PartialExit {
  id: string;
  exitDate: string;
  exitPrice: number;
  quantity: number;
  notes?: string;
}

export interface TradeMetrics {
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
}

export interface TradeWithMetrics extends Trade {
  metrics: TradeMetrics;
}

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: Date;
  updatedAt?: Date;
  rules?: string[];
  setupCriteria?: string[];
  entryRules?: string[];
  exitRules?: string[];
  timeframes?: string[];
  markets?: string[];
  tags?: string[];
  isActive?: boolean;
  winRate?: number;
  profitFactor?: number;
  expectancy?: number;
  averageRMultiple?: number;
}

export interface TradeIdea {
  id: string;
  symbol: string;
  direction: 'long' | 'short' | 'neutral';
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  description?: string;
  images?: string[];
  createdAt: Date;
  updatedAt?: Date;
  status: 'open' | 'taken' | 'expired' | 'invalid';
  expiryDate?: Date;
  strategy?: string;
  timeframe?: string;
  tags?: string[];
  tradeId?: string;
}

export interface TradeLesson {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  tags?: string[];
  tradeIds?: string[];
  category?: string;
}

export interface WeeklyReflection {
  id: string;
  weekId?: string;
  weekStart?: string;
  weekEnd?: string;
  reflection?: string;
  weeklyPlan?: string;
  grade?: string;
  lastUpdated?: string;
  tradeIds?: string[];
  isFutureWeek?: boolean;
  metrics?: {
    totalTrades: number;
    winRate: number;
    profitLoss: number;
    largestWin: number;
    largestLoss: number;
    averageR: number;
  };
}

export interface MonthlyReflection {
  id: string;
  monthId?: string;
  monthStart?: string;
  monthEnd?: string;
  reflection?: string;
  monthlyPlan?: string;
  monthlyGoals?: string;
  grade?: string;
  lastUpdated?: string;
  tradeIds?: string[];
  metrics?: {
    totalTrades: number;
    winRate: number;
    profitLoss: number;
    largestWin: number;
    largestLoss: number;
    averageR: number;
  };
}

export interface TradeComment {
  id: string;
  tradeId: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export type MediaFileType = "image" | "video" | "pdf";

export interface MediaFile {
  url: string;
  type: MediaFileType;
}


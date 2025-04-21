

export interface Trade {
  id: string;
  symbol: string;
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  quantity: number;
  type: 'stock' | 'futures' | 'options' | 'forex' | string;
  direction: 'long' | 'short' | string;
  stopLoss: number;
  takeProfit?: number;
  account?: string;
  strategy?: string;
  notes?: string;
  images: string[];
  fees?: number;
  timeframe?: string;
  pspTime?: string;
  ssmtQuarters?: string;
  grade?: string;
  status: 'open' | 'closed';
  targetReached?: boolean;
  targetReachedBeforeExit?: boolean;
  initialStopLoss?: number;
  mistakes?: string[];
  contractDetails?: ContractDetails;
  partialExits?: PartialExit[];
}

export interface ContractDetails {
  exchange?: string;
  tickSize?: number;
  contractSize?: number;
  tickValue?: number;
}

export interface PartialExit {
  id: string;
  exitPrice: number;
  quantity: number;
  timestamp: string;
}

export interface TradeWithMetrics extends Trade {
  profitLoss: number;
  profitLossPercentage: number;
  riskRewardRatio: number;
  rMultiple: number;
  riskedAmount: number;
}

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  rules?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  trades?: Trade[];
}

export interface WeeklyReflection {
  id: string;
  weekId: string;
  reflection: string;
  grade?: string;
  weeklyPlan?: string;
  isFutureWeek?: boolean;
  lastUpdated?: string;
}

export interface MonthlyReflection {
  id: string;
  monthId: string;
  reflection: string;
  grade?: string;
  monthlyPlan?: string;
  lastUpdated?: string;
}

export interface MaxRiskSettings {
  maxRiskPerTrade: number | null;
  maxRiskPerDay: number | null;
}

export interface MediaFile {
  url: string;
  type: 'image' | 'video' | 'pdf';
}


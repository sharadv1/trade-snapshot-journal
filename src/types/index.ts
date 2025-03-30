export interface Trade {
  id: string;
  symbol: string;
  type: 'stock' | 'futures' | 'forex' | 'crypto' | 'options';
  direction: 'long' | 'short';
  quantity: number;
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  exitReason?: string; // Adding exitReason property
  status: 'open' | 'closed';
  stopLoss?: number;
  takeProfit?: number;
  fees?: number;
  notes?: string;
  strategy?: string;
  timeframe?: string;
  grade?: string;
  pspTime?: string; 
  images?: string[];
  ideaId?: string;
  partialExits?: PartialExit[];
  contractDetails?: FuturesContractDetails;
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
}

export interface MonthlyReflection {
  id: string;
  date: string;
  summary: string;
  lessons: string;
  goals: string;
}

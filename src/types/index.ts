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
}

export interface TradeWithMetrics extends Trade {
  metrics: {
    profitLoss: number;
    riskRewardRatio: number;
    rMultiple: number;
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

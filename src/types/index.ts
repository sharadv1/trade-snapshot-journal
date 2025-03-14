
export interface Trade {
  id: string;
  symbol: string;
  type: 'futures' | 'equity' | 'option';
  direction: 'long' | 'short';
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  quantity: number;
  fees?: number;
  stopLoss?: number;
  takeProfit?: number;
  strategy?: string;
  notes?: string;
  images: string[]; // Base64 encoded images
  tags?: string[];
  status: 'open' | 'closed';
}

export interface TradeMetrics {
  profitLoss: number;
  profitLossPercentage: number;
  riskRewardRatio?: number;
  riskedAmount?: number;
  maxPotentialGain?: number;
}

export interface TradeWithMetrics extends Trade {
  metrics: TradeMetrics;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  expectancy: number;
  largestWin: number;
  largestLoss: number;
  netProfit: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ChartData {
  name: string;
  value: number;
}

export type TimeFrame = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';


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
  customStrategy?: string;
  notes?: string;
  images: string[]; // Base64 encoded images
  tags?: string[];
  status: 'open' | 'closed';
  partialExits?: PartialExit[];
  contractDetails?: FuturesContractDetails;
}

export interface PartialExit {
  id: string;
  exitDate: string;
  exitPrice: number;
  quantity: number;
  fees?: number;
  notes?: string;
}

export interface FuturesContractDetails {
  exchange: string;
  contractSize: number;
  tickSize: number;
  tickValue: number;
  expirationDate?: string;
  initialMargin?: number;
  maintenanceMargin?: number;
}

export interface TradeMetrics {
  profitLoss: number;
  profitLossPercentage: number;
  riskRewardRatio?: number;
  riskedAmount?: number;
  maxPotentialGain?: number;
  calculationExplanation?: string;
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
  sortinoRatio: number;
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

export interface FuturesContract {
  symbol: string;
  exchange: string;
  description: string;
  tickSize: number;
  tickValue: number;
}

export const COMMON_FUTURES_CONTRACTS: FuturesContract[] = [
  { symbol: 'MES', exchange: 'CME', description: 'Micro E-mini S&P 500', tickSize: 0.25, tickValue: 5 },
  { symbol: 'MNQ', exchange: 'CME', description: 'Micro E-mini Nasdaq-100', tickSize: 0.25, tickValue: 2 },
  { symbol: 'MYM', exchange: 'CBOT', description: 'Micro E-mini Dow', tickSize: 1, tickValue: 0.5 },
  { symbol: 'MGC', exchange: 'COMEX', description: 'Micro Gold', tickSize: 0.1, tickValue: 10 },
  { symbol: 'SIL', exchange: 'COMEX', description: 'Silver', tickSize: 0.005, tickValue: 5 },
  { symbol: 'M6E', exchange: 'CME', description: 'Micro Euro FX', tickSize: 0.0001, tickValue: 12500 },
  { symbol: 'M6B', exchange: 'CME', description: 'Micro British Pound', tickSize: 0.0001, tickValue: 6500 },
];

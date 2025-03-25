
// Define types used across calendar components
export interface DailyPnL {
  [key: string]: {
    pnl: number;
    tradeCount: number;
    tradeIds: string[];
  };
}

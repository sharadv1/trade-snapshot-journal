
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { TradeWithMetrics } from '@/types';
import { formatCurrency } from '@/utils/tradeCalculations';
import { getStrategyById } from '@/utils/strategyStorage';

interface StrategyPerformanceTableProps {
  trades: TradeWithMetrics[];
}

interface StrategyPerformance {
  id: string;
  name: string;
  color: string;
  pnl: number;
  count: number;
  winCount: number;
  winRate: number;
  avgPerTrade: number;
}

export function StrategyPerformanceTable({ trades }: StrategyPerformanceTableProps) {
  // Get only closed trades
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  
  // Group trades by strategy
  const strategyData: Record<string, StrategyPerformance> = {};
  
  closedTrades.forEach(trade => {
    if (!trade.strategy) return;
    
    if (!strategyData[trade.strategy]) {
      const strategyInfo = getStrategyById(trade.strategy);
      strategyData[trade.strategy] = {
        id: trade.strategy,
        name: strategyInfo?.name || 'Unknown Strategy',
        color: strategyInfo?.color || '#888888',
        pnl: 0,
        count: 0,
        winCount: 0,
        winRate: 0,
        avgPerTrade: 0
      };
    }
    
    strategyData[trade.strategy].pnl += trade.metrics.profitLoss;
    strategyData[trade.strategy].count += 1;
    
    if (trade.metrics.profitLoss > 0) {
      strategyData[trade.strategy].winCount += 1;
    }
  });
  
  // Calculate win rates and averages
  Object.values(strategyData).forEach(strategy => {
    strategy.winRate = strategy.count > 0 ? (strategy.winCount / strategy.count) * 100 : 0;
    strategy.avgPerTrade = strategy.count > 0 ? strategy.pnl / strategy.count : 0;
  });
  
  // Convert to array and sort by P&L
  const sortedStrategies = Object.values(strategyData).sort((a, b) => b.pnl - a.pnl);
  
  if (sortedStrategies.length === 0) {
    return (
      <Card className="shadow-subtle border mb-8">
        <CardHeader>
          <CardTitle className="text-base font-medium">Strategy Performance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <p className="text-muted-foreground">
            No strategy data available. Add trades with strategy information to see performance.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-subtle border mb-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Strategy Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Strategy</TableHead>
              <TableHead className="text-right">Trades</TableHead>
              <TableHead className="text-right">Win Rate</TableHead>
              <TableHead className="text-right">Avg per Trade</TableHead>
              <TableHead className="text-right">P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStrategies.map(strategy => (
              <TableRow key={strategy.id}>
                <TableCell className="font-medium">
                  <span style={{ color: strategy.color }}>{strategy.name}</span>
                </TableCell>
                <TableCell className="text-right">{strategy.count}</TableCell>
                <TableCell className="text-right">{strategy.winRate.toFixed(1)}%</TableCell>
                <TableCell className="text-right">
                  <span className={strategy.avgPerTrade >= 0 ? 'text-profit' : 'text-loss'}>
                    {formatCurrency(strategy.avgPerTrade)}
                  </span>
                </TableCell>
                <TableCell className={`text-right font-medium ${strategy.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {formatCurrency(strategy.pnl)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

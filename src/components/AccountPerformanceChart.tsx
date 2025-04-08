import React, { useMemo } from 'react';
import { TradeWithMetrics } from '@/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { formatCurrency } from '@/utils/calculations/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart/ChartContainer';

type AccountMetrics = {
  profit: number;
  loss: number;
  totalPnL: number;
  tradeCount: number;
  winCount: number;
  winRate: number;
};

interface AccountPerformanceChartProps {
  trades: TradeWithMetrics[];
}

export function AccountPerformanceChart({ trades }: AccountPerformanceChartProps) {
  const accountsData = useMemo(() => {
    // Only use closed trades for performance metrics
    const closedTrades = trades.filter(trade => trade.status === 'closed');
    
    // Group trades by account
    const accountGroups = closedTrades.reduce((acc, trade) => {
      const account = trade.account || 'Unassigned';
      if (!acc[account]) {
        acc[account] = [];
      }
      acc[account].push(trade);
      return acc;
    }, {} as Record<string, TradeWithMetrics[]>);
    
    // Calculate metrics for each account
    const accountMetrics = Object.entries(accountGroups).map(([account, accountTrades]) => {
      const metrics: AccountMetrics = {
        profit: 0,
        loss: 0,
        totalPnL: 0,
        tradeCount: accountTrades.length,
        winCount: 0,
        winRate: 0
      };
      
      accountTrades.forEach(trade => {
        const pnl = trade.metrics.profitLoss;
        metrics.totalPnL += pnl;
        
        if (pnl >= 0) {
          metrics.profit += pnl;
          metrics.winCount++;
        } else {
          metrics.loss += Math.abs(pnl);
        }
      });
      
      metrics.winRate = metrics.tradeCount > 0 
        ? (metrics.winCount / metrics.tradeCount) * 100 
        : 0;
      
      return {
        name: account,
        ...metrics
      };
    });
    
    // Sort by total P&L
    return accountMetrics.sort((a, b) => b.totalPnL - a.totalPnL);
  }, [trades]);
  
  const chartColors = {
    profit: "hsl(142, 76%, 36%)", // Green
    loss: "hsl(0, 84%, 60%)",     // Red
    pnl: "hsl(202, 88%, 56%)"     // Blue
  };
  
  // No data view
  if (accountsData.length === 0) {
    return (
      <Card className="shadow-subtle border">
        <CardHeader>
          <CardTitle>Account Performance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">
            No account data available. Add trades with account information to see performance.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-subtle border">
      <CardHeader>
        <CardTitle>Account Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ChartContainer 
            config={{
              profit: { color: chartColors.profit, label: "Profit" },
              loss: { color: chartColors.loss, label: "Loss" },
              pnl: { color: chartColors.pnl, label: "P&L" },
              grid: { label: "Show Grid" },
              tooltip: { label: "Show Tooltip" },
              legend: { label: "Show Legend" }
            }}
          >
            <BarChart
              data={accountsData}
              margin={{ top: 10, right: 30, left: 40, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'winRate') {
                    return [`${value.toFixed(1)}%`, 'Win Rate'];
                  }
                  return [formatCurrency(value), name.charAt(0).toUpperCase() + name.slice(1)];
                }}
                labelFormatter={(label) => `Account: ${label}`}
              />
              <Legend />
              <Bar dataKey="profit" name="Gross Profit" fill={chartColors.profit} />
              <Bar dataKey="loss" name="Gross Loss" fill={chartColors.loss} />
              <Bar dataKey="totalPnL" name="Net P&L">
                {accountsData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.totalPnL >= 0 ? chartColors.profit : chartColors.loss} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
        
        {/* Account metrics table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Account</th>
                <th className="text-right py-2 px-3">Trades</th>
                <th className="text-right py-2 px-3">Win Rate</th>
                <th className="text-right py-2 px-3">Profit</th>
                <th className="text-right py-2 px-3">Loss</th>
                <th className="text-right py-2 px-3">Net P&L</th>
              </tr>
            </thead>
            <tbody>
              {accountsData.map((account) => (
                <tr key={account.name} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">{account.name}</td>
                  <td className="text-right py-2 px-3">{account.tradeCount}</td>
                  <td className="text-right py-2 px-3">{account.winRate.toFixed(1)}%</td>
                  <td className="text-right py-2 px-3 text-profit">{formatCurrency(account.profit)}</td>
                  <td className="text-right py-2 px-3 text-loss">({formatCurrency(account.loss)})</td>
                  <td className={`text-right py-2 px-3 font-medium ${account.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {formatCurrency(account.totalPnL)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

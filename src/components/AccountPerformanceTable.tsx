
import React, { useMemo } from 'react';
import { TradeWithMetrics } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface AccountPerformanceTableProps {
  trades: TradeWithMetrics[];
}

export function AccountPerformanceTable({ trades }: AccountPerformanceTableProps) {
  const accountData = useMemo(() => {
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
      let profit = 0;
      let loss = 0;
      let totalPnL = 0;
      let winCount = 0;
      
      accountTrades.forEach(trade => {
        const pnl = trade.metrics.profitLoss;
        totalPnL += pnl;
        
        if (pnl >= 0) {
          profit += pnl;
          winCount++;
        } else {
          loss += Math.abs(pnl);
        }
      });
      
      const winRate = accountTrades.length > 0 
        ? (winCount / accountTrades.length) * 100 
        : 0;
      
      return {
        name: account,
        profit,
        loss,
        totalPnL,
        tradeCount: accountTrades.length,
        winCount,
        winRate
      };
    });
    
    // Sort by total P&L
    return accountMetrics.sort((a, b) => b.totalPnL - a.totalPnL);
  }, [trades]);
  
  // No data view
  if (accountData.length === 0) {
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
    <Card className="shadow-subtle border mb-8">
      <CardHeader>
        <CardTitle>Account Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Trades</TableHead>
              <TableHead className="text-right">Win Rate</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="text-right">Loss</TableHead>
              <TableHead className="text-right">Net P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountData.map((account) => (
              <TableRow key={account.name}>
                <TableCell className="font-medium">{account.name}</TableCell>
                <TableCell className="text-right">{account.tradeCount}</TableCell>
                <TableCell className="text-right">{account.winRate.toFixed(1)}%</TableCell>
                <TableCell className="text-right text-profit">{formatCurrency(account.profit)}</TableCell>
                <TableCell className="text-right text-loss">({formatCurrency(account.loss)})</TableCell>
                <TableCell className={`text-right font-medium ${account.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {formatCurrency(account.totalPnL)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

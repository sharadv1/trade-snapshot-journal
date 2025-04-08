
import React, { useMemo, useState } from 'react';
import { TradeWithMetrics } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '@/utils/calculations/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [viewType, setViewType] = useState<'monthly' | 'total'>('total');
  
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
  
  const monthlyAccountData = useMemo(() => {
    // Only use closed trades
    const closedTrades = trades.filter(trade => trade.status === 'closed');
    
    // Group trades by month and then by account
    const monthlyGroups = closedTrades.reduce((months, trade) => {
      if (!trade.entryDate) return months;
      
      const date = parseISO(trade.entryDate);
      const monthKey = format(date, 'MMM yyyy');
      const account = trade.account || 'Unassigned';
      
      if (!months[monthKey]) {
        months[monthKey] = {};
      }
      
      if (!months[monthKey][account]) {
        months[monthKey][account] = [];
      }
      
      months[monthKey][account].push(trade);
      return months;
    }, {} as Record<string, Record<string, TradeWithMetrics[]>>);
    
    // Calculate metrics for each month and account
    const monthlyData = Object.entries(monthlyGroups).map(([month, accounts]) => {
      const monthData: any = { month };
      
      Object.entries(accounts).forEach(([account, accountTrades]) => {
        let totalPnL = 0;
        let winCount = 0;
        
        accountTrades.forEach(trade => {
          const pnl = trade.metrics.profitLoss;
          totalPnL += pnl;
          
          if (pnl > 0) {
            winCount++;
          }
        });
        
        monthData[account] = totalPnL;
        monthData[`${account}-count`] = accountTrades.length;
        monthData[`${account}-winRate`] = accountTrades.length > 0 
          ? (winCount / accountTrades.length) * 100 
          : 0;
      });
      
      return monthData;
    });
    
    // Sort by date (earliest first)
    return monthlyData.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  }, [trades]);
  
  const getUniqueAccounts = useMemo(() => {
    const accounts = new Set<string>();
    
    trades.forEach(trade => {
      if (trade.account) {
        accounts.add(trade.account);
      } else {
        accounts.add('Unassigned');
      }
    });
    
    return Array.from(accounts);
  }, [trades]);
  
  const chartColors = {
    profit: "hsl(142, 76%, 36%)", // Green
    loss: "hsl(0, 84%, 60%)",     // Red
    pnl: "hsl(202, 88%, 56%)"     // Blue
  };
  
  // Generate colors for different accounts
  const accountColorScale = [
    "#8884d8", "#82ca9d", "#ffc658", "#0088FE", "#00C49F", 
    "#FFBB28", "#FF8042", "#a4de6c", "#d0ed57", "#83a6ed"
  ];
  
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
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Account Performance</CardTitle>
        <Select
          value={viewType}
          onValueChange={(value) => setViewType(value as 'monthly' | 'total')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="View Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="total">Total Performance</SelectItem>
            <SelectItem value="monthly">Monthly Breakdown</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          {viewType === 'total' ? (
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
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyAccountData}
                margin={{ top: 10, right: 30, left: 40, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
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
                    if (name.includes('-count')) return [value, 'Trades'];
                    if (name.includes('-winRate')) return [`${value.toFixed(1)}%`, 'Win Rate'];
                    return [formatCurrency(value), 'P&L'];
                  }}
                  labelFormatter={(label) => `Month: ${label}`}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2 bg-background border rounded shadow-md">
                          <p className="font-medium">{label}</p>
                          {getUniqueAccounts.map(account => {
                            const pnlItem = payload.find(p => p.name === account);
                            const countItem = payload.find(p => p.name === `${account}-count`);
                            const winRateItem = payload.find(p => p.name === `${account}-winRate`);
                            
                            if (!pnlItem) return null;
                            
                            return (
                              <div key={account} className="mt-1">
                                <p className="font-medium">{account}</p>
                                <p className={`text-sm ${Number(pnlItem.value) >= 0 ? 'text-profit' : 'text-loss'}`}>
                                  P&L: {formatCurrency(Number(pnlItem.value))}
                                </p>
                                {countItem && (
                                  <p className="text-sm">Trades: {countItem.value}</p>
                                )}
                                {winRateItem && (
                                  <p className="text-sm">Win Rate: {Number(winRateItem.value).toFixed(1)}%</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {getUniqueAccounts.map((account, index) => (
                  <Bar 
                    key={account}
                    dataKey={account} 
                    name={account} 
                    fill={accountColorScale[index % accountColorScale.length]}
                    stackId="a"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Account metrics table - only show for total view */}
        {viewType === 'total' && (
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
        )}
        
        {/* Monthly view table */}
        {viewType === 'monthly' && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Month</th>
                  {getUniqueAccounts.map(account => (
                    <th key={account} className="text-right py-2 px-3">{account}</th>
                  ))}
                  <th className="text-right py-2 px-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {monthlyAccountData.map((monthData) => {
                  // Calculate total for this month
                  let monthTotal = 0;
                  getUniqueAccounts.forEach(account => {
                    if (monthData[account] !== undefined) {
                      monthTotal += monthData[account];
                    }
                  });
                  
                  return (
                    <tr key={monthData.month} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium">{monthData.month}</td>
                      {getUniqueAccounts.map(account => (
                        <td 
                          key={account} 
                          className={`text-right py-2 px-3 ${
                            monthData[account] >= 0 ? 'text-profit' : 
                            monthData[account] < 0 ? 'text-loss' : 'text-muted-foreground'
                          }`}
                        >
                          {monthData[account] !== undefined 
                            ? formatCurrency(monthData[account]) 
                            : '-'}
                        </td>
                      ))}
                      <td className={`text-right py-2 px-3 font-medium ${
                        monthTotal >= 0 ? 'text-profit' : 'text-loss'
                      }`}>
                        {formatCurrency(monthTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

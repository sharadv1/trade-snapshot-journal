
import React, { memo, useCallback } from 'react';
import { WeeklyReflection, MonthlyReflection } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Pencil } from 'lucide-react';
import { getTradesForWeek } from '@/utils/tradeCalculations';
import { startOfWeek, endOfWeek, parseISO } from 'date-fns';

interface ReflectionCardProps {
  reflection: WeeklyReflection | MonthlyReflection;
  type: 'weekly' | 'monthly';
  stats: {
    pnl: number;
    rValue: number;
    tradeCount: number;
    hasContent: boolean;
  };
  dateRange: string;
  reflectionWordCount: number;
  planWordCount: number;
  canDelete: boolean;
  onDelete: (id: string, e: React.MouseEvent) => void;
  hasContent: boolean;
}

export const ReflectionCard = memo(function ReflectionCard({
  reflection,
  type,
  stats,
  dateRange,
  reflectionWordCount,
  planWordCount,
  canDelete,
  onDelete,
  hasContent
}: ReflectionCardProps) {
  if (!reflection || !reflection.id) return null;
  
  const handleDelete = useCallback((e: React.MouseEvent) => {
    if (onDelete) {
      e.preventDefault();
      e.stopPropagation();
      onDelete(reflection.id, e);
    }
  }, [reflection.id, onDelete]);

  // Get the actual trades for the week
  let weeklyTrades = [];
  if (type === 'weekly' && (reflection as WeeklyReflection).weekStart) {
    const weekStart = startOfWeek(parseISO((reflection as WeeklyReflection).weekStart), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    weeklyTrades = getTradesForWeek(weekStart, weekEnd);
  }

  // Calculate metrics
  const totalPnL = weeklyTrades.reduce((sum, trade) => sum + (trade.metrics?.profitLoss || 0), 0);
  const totalR = weeklyTrades.reduce((sum, trade) => sum + (trade.metrics?.rMultiple || 0), 0);
  const tradeCount = weeklyTrades.length;
  const winCount = weeklyTrades.filter(trade => (trade.metrics?.profitLoss || 0) > 0).length;
  const lossCount = weeklyTrades.filter(trade => (trade.metrics?.profitLoss || 0) < 0).length;
  const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;
  
  return (
    <Card className="p-6 hover:bg-accent/10 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-medium mb-1">{dateRange}</h3>
          {reflection.grade && (
            <div className="inline-flex bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Grade: {reflection.grade}
            </div>
          )}
        </div>
        <div className={`text-xl font-semibold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(totalPnL)}
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div className="bg-accent/10 rounded-lg p-3">
          <div className="text-sm text-muted-foreground mb-1">Trades</div>
          <div className="font-semibold">{tradeCount}</div>
        </div>
        
        <div className="bg-accent/10 rounded-lg p-3">
          <div className="text-sm text-muted-foreground mb-1">R-Multiple</div>
          <div className={`font-semibold ${totalR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalR > 0 ? '+' : ''}{totalR.toFixed(2)}R
          </div>
        </div>
        
        <div className="bg-accent/10 rounded-lg p-3">
          <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
          <div className="font-semibold">{winRate.toFixed(1)}%</div>
        </div>
        
        <div className="bg-accent/10 rounded-lg p-3">
          <div className="text-sm text-muted-foreground mb-1">W/L</div>
          <div className="font-semibold">{winCount}/{lossCount}</div>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground mb-4">
        {type === 'weekly' && `Plan: ${planWordCount} words • `}
        Reflection: {reflectionWordCount} words
      </div>
      
      <div className="flex justify-end items-center gap-2">
        {canDelete && onDelete && (
          <Button 
            variant="outline" 
            size="sm"
            className="text-red-500 border-red-200 hover:bg-red-50"
            onClick={handleDelete}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" x2="10" y1="11" y2="17" />
              <line x1="14" x2="14" y1="11" y2="17" />
            </svg>
          </Button>
        )}
        
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
        
        <ExternalLink className="h-5 w-5 text-muted-foreground" />
      </div>
    </Card>
  );
});


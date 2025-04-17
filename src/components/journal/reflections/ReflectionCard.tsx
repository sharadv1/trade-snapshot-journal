
import React, { memo, useCallback } from 'react';
import { WeeklyReflection, MonthlyReflection } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';
import { Card } from '@/components/ui/card';
import { getTradesForWeek } from '@/utils/tradeCalculations';
import { startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ReflectionGradeBadge } from './ReflectionGradeBadge';
import { ReflectionMetrics } from './ReflectionMetrics';
import { ReflectionActions } from './ReflectionActions';

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
  onDelete?: (id: string, e: React.MouseEvent) => void;
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
  const navigate = useNavigate();

  if (!reflection || !reflection.id) return null;
  
  const handleEdit = useCallback(() => {
    if (type === 'weekly') {
      navigate(`/journal/weekly/${reflection.id}`);
    } else {
      navigate(`/journal/monthly/${reflection.id}`);
    }
  }, [navigate, reflection.id, type]);

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
  const avgRPerTrade = tradeCount > 0 ? totalR / tradeCount : 0;
  
  return (
    <Card className="p-6 hover:bg-accent/10 transition-colors">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-medium mb-1">{dateRange}</h3>
          <ReflectionGradeBadge grade={reflection.grade} />
        </div>
        <div className={`text-xl font-semibold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(totalPnL)}
        </div>
      </div>
      
      <ReflectionMetrics
        tradeCount={tradeCount}
        totalPnL={totalPnL}
        totalR={totalR}
        winCount={winCount}
        lossCount={lossCount}
        winRate={winRate}
        avgRPerTrade={avgRPerTrade}
      />
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {type === 'weekly' && `Plan: ${planWordCount} words • `}
          Reflection: {reflectionWordCount} words
        </div>
        
        <ReflectionActions
          canDelete={canDelete}
          onDelete={onDelete}
          onEdit={handleEdit}
          reflectionId={reflection.id}
        />
      </div>
    </Card>
  );
});

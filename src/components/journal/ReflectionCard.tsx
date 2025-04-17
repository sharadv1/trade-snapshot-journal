
import React, { memo, useCallback } from 'react';
import { WeeklyReflection, MonthlyReflection } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';
import { Card } from '@/components/ui/card';
import { ReflectionActions } from './reflections/ReflectionActions';
import { ReflectionGradeBadge } from './reflections/ReflectionGradeBadge';
import { ReflectionMetrics } from './reflections/ReflectionMetrics';

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
  if (!reflection || !reflection.id) return null;

  const handleEdit = useCallback(() => {
    // Let parent click handler navigate instead
  }, []);

  const { pnl, rValue, tradeCount, hasContent: hasContentStat } = stats;
  const winCount = reflection.winCount || 0;
  const lossCount = reflection.lossCount || 0;
  const winRate = reflection.winRate || 0;
  const avgRPerTrade = tradeCount > 0 ? rValue / tradeCount : 0;

  return (
    <Card className="p-6 hover:bg-accent/10 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-medium">{dateRange}</h3>
        <div className={`text-xl font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(pnl)}
        </div>
      </div>

      {tradeCount > 0 && (
        <ReflectionMetrics
          tradeCount={tradeCount}
          totalPnL={pnl}
          totalR={rValue}
          winCount={winCount}
          lossCount={lossCount}
          winRate={winRate} 
          avgRPerTrade={avgRPerTrade}
        />
      )}

      <div className="space-y-1 mb-3">
        <div className="text-muted-foreground">
          Trades: {tradeCount}
        </div>
        <div className="text-muted-foreground">
          R-Value: <span className={rValue >= 0 ? 'text-green-600' : 'text-red-600'}>
            {rValue > 0 ? '+' : ''}{rValue.toFixed(2)}R
          </span>
        </div>
        <div className="text-muted-foreground">
          Reflection: {reflectionWordCount} words
          {type === 'weekly' && ` • Plan: ${planWordCount} words`}
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <ReflectionGradeBadge grade={reflection.grade} />
        
        <ReflectionActions
          reflectionId={reflection.id}
          onEdit={handleEdit}
          onDelete={onDelete}
          canDelete={canDelete}
        />
      </div>
    </Card>
  );
});

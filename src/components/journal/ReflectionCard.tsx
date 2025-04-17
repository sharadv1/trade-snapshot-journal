
import React, { memo, useCallback } from 'react';
import { WeeklyReflection, MonthlyReflection } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { countWords } from '@/utils/journal/reflectionUtils';
import { ExternalLink } from 'lucide-react';

interface ReflectionCardProps {
  reflection: WeeklyReflection | MonthlyReflection;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  type: 'weekly' | 'monthly';
}

export const ReflectionCard = memo(function ReflectionCard({ reflection, onDelete, type }: ReflectionCardProps) {
  if (!reflection || !reflection.id) return null;
  
  const formatDateRange = (reflection: WeeklyReflection | MonthlyReflection) => {
    try {
      if (type === 'weekly') {
        const weeklyReflection = reflection as WeeklyReflection;
        if (!weeklyReflection.weekStart || !weeklyReflection.weekEnd) return 'Unknown date range';
        
        const startDate = parseISO(weeklyReflection.weekStart);
        const endDate = parseISO(weeklyReflection.weekEnd);
        return `Week of ${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
      } else {
        const monthlyReflection = reflection as MonthlyReflection;
        if (!monthlyReflection.monthId) return 'Unknown month';
        
        const date = new Date(monthlyReflection.monthId);
        return format(date, 'MMMM yyyy');
      }
    } catch (error) {
      console.error("Error formatting date range:", error);
      return 'Unknown date range';
    }
  };
  
  const dateRange = formatDateRange(reflection);
  
  const reflectionWordCount = countWords(reflection.reflection || '');
  const planWordCount = type === 'weekly' ? countWords((reflection as WeeklyReflection).weeklyPlan || '') : 0;
  
  // Safely access trade data, ensuring we have default values to prevent NaN issues
  const tradeCount = Array.isArray(reflection.tradeIds) ? reflection.tradeIds.length : 0;
  const rValue = typeof reflection.totalR === 'number' ? reflection.totalR : 0;
  const totalPnL = typeof reflection.totalPnL === 'number' ? reflection.totalPnL : 0;
  
  // Memoize the delete handler to prevent unnecessary re-renders
  const handleDelete = useCallback((e: React.MouseEvent) => {
    if (onDelete) {
      e.preventDefault();
      e.stopPropagation();
      onDelete(reflection.id, e);
    }
  }, [reflection.id, onDelete]);
  
  return (
    <Card className="p-6 hover:bg-accent/10 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-medium">{dateRange}</h3>
        <div className={`text-xl font-semibold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(totalPnL)}
        </div>
      </div>
      
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
        <div>
          {reflection.grade && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium inline-flex">
              Grade: {reflection.grade}
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          {tradeCount === 0 && onDelete && (
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
          
          <ExternalLink className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </Card>
  );
});

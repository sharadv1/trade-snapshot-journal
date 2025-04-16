
import React, { memo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MonthlyReflection, WeeklyReflection } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';
import { ArrowRight, Calendar, Check } from 'lucide-react';
import { getGradeColorClass } from '@/utils/journal/reflectionUtils';
import { useNavigate } from 'react-router-dom';

export interface ReflectionCardProps {
  reflection: WeeklyReflection | MonthlyReflection;
  type: 'weekly' | 'monthly';
  dateRange: string;
  stats: {
    pnl: number;
    rValue: number;
    tradeCount: number;
    hasContent: boolean;
  };
  // Optional props that were causing the type error
  hasContent?: boolean;
  reflectionWordCount?: number;
  planWordCount?: number;
  canDelete?: boolean;
  onDelete?: (reflectionId: string) => Promise<void>;
}

// Using memo with a custom comparison function to prevent unnecessary re-renders
export const ReflectionCard = memo(({
  reflection,
  type,
  dateRange,
  stats,
  hasContent,
}: ReflectionCardProps) => {
  const navigate = useNavigate();
  
  // Get grade
  const grade = reflection.grade;
  
  // Determine if reflection is profitable
  const isProfitable = stats.pnl > 0;
  
  // Content preview with memoization
  const contentPreview = useCallback(() => {
    if (!reflection.reflection || typeof reflection.reflection !== 'string') return '';
    
    try {
      // Extract plain text and limit to first 100 characters
      const plainText = reflection.reflection.replace(/<[^>]*>/g, ' ').trim();
      return plainText.length > 100 ? `${plainText.substring(0, 100)}...` : plainText;
    } catch (e) {
      console.error('Error parsing reflection content:', e);
      return '';
    }
  }, [reflection.reflection]);
  
  // Ultra-optimized navigation handler to prevent UI freezing
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const reflectionId = type === 'weekly' 
      ? (reflection as WeeklyReflection).weekId || reflection.id
      : (reflection as MonthlyReflection).monthId || reflection.id;
    
    if (!reflectionId) {
      console.error('Cannot navigate to reflection with empty ID');
      return;
    }
    
    // Apply visual feedback immediately
    const card = e.currentTarget;
    if (card) {
      card.classList.add('opacity-80');
    }
    
    // Prepare the route ahead of time
    const route = `/journal/${type}/${reflectionId}`;
    console.log(`Preparing to navigate to: ${route}`);
    
    // Use window.requestIdleCallback if available, or setTimeout as fallback
    // This ensures navigation happens during an idle period, preventing UI freeze
    const navigateWhenIdle = () => {
      // Remove visual feedback before navigating
      if (card) {
        card.classList.remove('opacity-80');
      }
      console.log(`Navigating to: ${route}`);
      navigate(route);
    };
    
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => navigateWhenIdle(), { timeout: 100 });
    } else {
      // Fallback to setTimeout with a minimal delay
      setTimeout(navigateWhenIdle, 20);
    }
  }, [reflection, type, navigate]);

  return (
    <Card 
      className={`hover:bg-accent/10 transition-colors cursor-pointer ${
        reflection.isPlaceholder ? 'border-dashed' : ''
      }`}
      onClick={handleClick}
    >
      <div className="block p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-medium inline-flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              {dateRange}
              
              {grade && (
                <Badge 
                  variant="outline" 
                  className={`ml-2 ${getGradeColorClass(grade)}`}
                >
                  {grade}
                </Badge>
              )}
              
              {hasContent && (
                <Badge 
                  variant="outline" 
                  className="bg-green-100 text-green-800 ml-2"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </h3>
          </div>
          
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex flex-wrap gap-4 mt-4">
          <div className={`text-sm ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            <span className="text-muted-foreground mr-1">P&L:</span>
            <span className="font-medium">
              {formatCurrency(stats.pnl)}
            </span>
          </div>
          
          <div className={`text-sm ${stats.rValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <span className="text-muted-foreground mr-1">R Value:</span>
            <span className="font-medium">
              {stats.rValue > 0 ? '+' : ''}{stats.rValue.toFixed(1)}R
            </span>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground mr-1">Trades:</span>
            <span className="font-medium">
              {stats.tradeCount}
            </span>
          </div>
        </div>
        
        {reflection.reflection && (
          <div className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {contentPreview()}
          </div>
        )}
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.reflection.id === nextProps.reflection.id &&
    prevProps.dateRange === nextProps.dateRange &&
    prevProps.stats.pnl === nextProps.stats.pnl &&
    prevProps.stats.rValue === nextProps.stats.rValue &&
    prevProps.stats.tradeCount === nextProps.stats.tradeCount &&
    prevProps.hasContent === nextProps.hasContent
  );
});

// Display name for debugging
ReflectionCard.displayName = 'ReflectionCard';

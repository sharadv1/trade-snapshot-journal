
import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MonthlyReflection, WeeklyReflection } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';
import { ArrowRight, Calendar, Check } from 'lucide-react';
import { getGradeColorClass } from '@/utils/journal/reflectionUtils';

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

// Using memo to prevent unnecessary re-renders of reflection cards
export const ReflectionCard = memo(({
  reflection,
  type,
  dateRange,
  stats,
  hasContent,
}: ReflectionCardProps) => {
  // Get grade
  const grade = reflection.grade;
  
  // Determine if reflection is profitable
  const isProfitable = stats.pnl > 0;
  
  // Avoid stringifying the entire reflection content - only take a short preview
  const getContentPreview = () => {
    if (!reflection.reflection || typeof reflection.reflection !== 'string') return '';
    
    try {
      // Extract plain text and limit to first 100 characters
      const plainText = reflection.reflection.replace(/<[^>]*>/g, ' ').trim();
      return plainText.length > 100 ? `${plainText.substring(0, 100)}...` : plainText;
    } catch (e) {
      console.error('Error parsing reflection content:', e);
      return '';
    }
  };

  return (
    <Card 
      className={`hover:bg-accent/10 transition-colors ${
        reflection.isPlaceholder ? 'border-dashed' : ''
      }`}
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
            {getContentPreview()}
          </div>
        )}
      </div>
    </Card>
  );
});

// Display name for debugging
ReflectionCard.displayName = 'ReflectionCard';

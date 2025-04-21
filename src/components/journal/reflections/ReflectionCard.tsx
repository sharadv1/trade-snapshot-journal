
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/calculations/formatters';
import { ReflectionGradeBadge } from './ReflectionGradeBadge';
import { WeeklyReflection, MonthlyReflection } from '@/types';

interface ReflectionCardProps {
  reflection: WeeklyReflection | MonthlyReflection;
  type: 'weekly' | 'monthly';
  dateRange: string;
  stats: {
    pnl: number;
    rValue: number;
    tradeCount: number;
    hasContent: boolean;
    winCount: number;
    lossCount: number;
    winRate: number;
  };
  canDelete?: boolean;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  hasContent?: boolean;
  isDuplicate?: boolean;
  showWordCounts?: boolean;
  showGrade?: boolean;
  wordCounts?: {
    reflection: number;
    weeklyPlan?: number;
    monthlyPlan?: number;
    monthlyGoals?: number;
  };
  isFutureWeek?: boolean;
}

export function ReflectionCard({ 
  reflection, 
  type, 
  dateRange, 
  stats, 
  canDelete, 
  onDelete,
  hasContent,
  isDuplicate,
  showWordCounts = false,
  showGrade = true,
  wordCounts,
  isFutureWeek = false
}: ReflectionCardProps) {
  // Extract grade for highlighting
  const grade = 'grade' in reflection ? reflection.grade : undefined;
  
  // Extract content for wordcounts
  const reflectionText = 'reflection' in reflection ? reflection.reflection : '';
  const weeklyPlan = 'weeklyPlan' in reflection ? reflection.weeklyPlan : '';
  const monthlyPlan = 'monthlyPlan' in reflection ? reflection.monthlyPlan : '';
  const monthlyGoals = 'monthlyGoals' in reflection ? reflection.monthlyGoals : '';
  
  // Check if this is a future week (either passed in or from the reflection)
  const isReflectionFutureWeek = type === 'weekly' && 
    ('isFutureWeek' in reflection && reflection.isFutureWeek);
  const isFuture = isFutureWeek || isReflectionFutureWeek;
  
  return (
    <Card className={`overflow-hidden transition-all ${
      isFuture ? 'border-blue-300 bg-blue-50/50' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex-1">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-lg flex items-center">
                  {dateRange}
                  {isFuture && (
                    <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200">
                      Future Week
                    </Badge>
                  )}
                  {isDuplicate && (
                    <Badge variant="outline" className="ml-2 bg-red-100 text-red-600 hover:bg-red-200">
                      Duplicate
                    </Badge>
                  )}
                </h3>
                <div className="text-sm text-muted-foreground flex items-center mt-1">
                  <span className="mr-4">
                    {isFuture ? 'Planning' : `${stats.tradeCount} trade${stats.tradeCount !== 1 ? 's' : ''}`}
                  </span>
                  {showGrade && grade && (
                    <ReflectionGradeBadge grade={grade} />
                  )}
                </div>
              </div>
              
              {canDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => onDelete(reflection.id, e)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {showWordCounts && (
              <div className="text-xs text-muted-foreground mb-2 flex flex-wrap gap-2">
                <span>Reflection: {wordCounts?.reflection || 0} words</span>
                {type === 'weekly' && (
                  <span>Weekly Plan: {wordCounts?.weeklyPlan || 0} words</span>
                )}
                {type === 'monthly' && (
                  <>
                    <span>Monthly Plan: {wordCounts?.monthlyPlan || 0} words</span>
                    <span>Monthly Goals: {wordCounts?.monthlyGoals || 0} words</span>
                  </>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="text-center p-2 bg-muted/30 rounded-md">
                <div className="text-xs font-medium text-muted-foreground">P&L</div>
                <div className={`text-sm font-semibold ${
                  isFuture ? 'text-blue-600' : stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isFuture ? 'Planned' : formatCurrency(stats.pnl)}
                </div>
              </div>
              
              <div className="text-center p-2 bg-muted/30 rounded-md">
                <div className="text-xs font-medium text-muted-foreground">R Value</div>
                <div className={`text-sm font-semibold ${
                  isFuture ? 'text-blue-600' : stats.rValue >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isFuture ? 'Planned' : `${stats.rValue.toFixed(2)}R`}
                </div>
              </div>
              
              <div className="text-center p-2 bg-muted/30 rounded-md">
                <div className="text-xs font-medium text-muted-foreground">Win Rate</div>
                <div className="text-sm font-semibold">
                  {isFuture ? 'Planned' : stats.tradeCount > 0 ? `${stats.winRate.toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              
              <div className="text-center p-2 bg-muted/30 rounded-md">
                <div className="text-xs font-medium text-muted-foreground">W/L</div>
                <div className="text-sm font-semibold">
                  {isFuture ? 'Planned' : `${stats.winCount}/${stats.lossCount}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

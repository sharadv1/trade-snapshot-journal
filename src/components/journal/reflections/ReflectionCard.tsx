
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MonthlyReflection, WeeklyReflection } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';
import { Calendar, ArrowRight, Trash, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReflectionCardProps {
  reflection: WeeklyReflection | MonthlyReflection;
  type: 'weekly' | 'monthly';
  stats: {
    pnl: number;
    rValue: number;
    tradeCount: number;
    hasContent: boolean;
    winCount?: number;
    lossCount?: number;
    winRate?: number;
  };
  dateRange: string;
  canDelete?: boolean;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  hasContent: boolean;
  isDuplicate?: boolean;
  showWordCounts?: boolean;
  showGrade?: boolean;
}

export function ReflectionCard({
  reflection,
  type,
  stats,
  dateRange,
  canDelete,
  onDelete,
  hasContent,
  isDuplicate,
  showWordCounts = true,
  showGrade = true
}: ReflectionCardProps) {
  const isProfitable = stats.pnl > 0;
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDelete) {
      onDelete(reflection.id, e);
    }
  };
  
  return (
    <Card className={`cursor-pointer hover:bg-muted/40 transition-colors ${
      reflection.isPlaceholder ? 'border-dashed' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-medium inline-flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              {dateRange}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {canDelete && onDelete && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDelete}
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
            
            {isDuplicate && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            
            {reflection.actions}
            
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
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
          
          {stats.winCount !== undefined && stats.lossCount !== undefined && stats.winRate !== undefined && (
            <div className="text-sm">
              <span className="text-muted-foreground mr-1">Win Rate:</span>
              <span className="font-medium">
                {Math.round(stats.winRate)}% ({stats.winCount}W / {stats.lossCount}L)
              </span>
            </div>
          )}
        </div>
        
        {reflection.reflection && (
          <div className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {reflection.reflection.replace(/<[^>]*>/g, ' ')}
          </div>
        )}
        
        {!hasContent && !reflection.isPlaceholder && (
          <div className="mt-3 text-sm text-muted-foreground italic">
            No {type} reflection content yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}

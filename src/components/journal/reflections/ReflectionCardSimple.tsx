
import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { MonthlyReflection, WeeklyReflection } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';
import { ArrowRight } from 'lucide-react';

interface ReflectionCardSimpleProps {
  reflection: WeeklyReflection | MonthlyReflection;
  type: 'weekly' | 'monthly';
  dateRange: string;
  pnl: number;
  rValue: number;
  tradeCount: number;
  grade?: string;
  hasContent: boolean;
}

export function ReflectionCardSimple({
  reflection,
  type,
  dateRange,
  pnl,
  rValue,
  tradeCount,
  hasContent
}: ReflectionCardSimpleProps) {
  // Get the reflection ID (weekId or monthId)
  const id = type === 'weekly' 
    ? (reflection as WeeklyReflection).weekId 
    : (reflection as MonthlyReflection).monthId;
  
  // Determine if reflection is profitable
  const isProfitable = pnl > 0;

  return (
    <Card 
      className="cursor-pointer hover:bg-muted/40 transition-colors border"
    >
      <Link 
        to={`/journal/${type}/${id}`}
        className="block p-4"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-medium">{dateRange}</h3>
          </div>
          
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex flex-wrap gap-4 mt-4">
          <div className={`text-sm ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            <span className="text-muted-foreground mr-1">P&L:</span>
            <span className="font-medium">
              {formatCurrency(pnl)}
            </span>
          </div>
          
          <div className={`text-sm ${rValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <span className="text-muted-foreground mr-1">R Value:</span>
            <span className="font-medium">
              {rValue > 0 ? '+' : ''}{rValue.toFixed(1)}R
            </span>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground mr-1">Trades:</span>
            <span className="font-medium">
              {tradeCount}
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}


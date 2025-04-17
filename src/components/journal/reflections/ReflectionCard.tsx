
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, Check, ExternalLink, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/calculations/formatters';
import { WeeklyReflection, MonthlyReflection } from '@/types';

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
  onDelete: (id: string, e?: React.MouseEvent) => void;
  hasContent: boolean;
}

export function ReflectionCard({
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
  const isProfitable = stats.pnl > 0;
  const reflectionId = type === 'weekly' 
    ? (reflection as WeeklyReflection).weekId || reflection.id 
    : (reflection as MonthlyReflection).monthId || reflection.id;

  const getGradeColor = (grade?: string) => {
    if (!grade) return 'bg-gray-100 text-gray-800';
    
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(reflection.id, e);
  };

  return (
    <Card 
      className="hover:bg-muted/40 transition-colors cursor-pointer"
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-medium inline-flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              {dateRange}
              
              {reflection.grade && (
                <Badge 
                  variant="outline" 
                  className={`${getGradeColor(reflection.grade)} ml-2`}
                >
                  {reflection.grade}
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
          
          <div className="flex items-center gap-2">
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:bg-red-50 hover:text-red-600 p-0 h-8 w-8"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            <Link to={`/journal/${type}/${reflectionId}`}>
              <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
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
          
          <div className="text-sm">
            <span className="text-muted-foreground mr-1">Words:</span>
            <span className="font-medium">
              {reflectionWordCount}
              {type === 'weekly' && planWordCount > 0 && ` / ${planWordCount}`}
            </span>
          </div>
        </div>
        
        {reflection.reflection && (
          <div className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {reflection.reflection.replace(/<[^>]*>/g, ' ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

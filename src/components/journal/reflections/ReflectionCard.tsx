
import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MonthlyReflection, WeeklyReflection } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ReflectionDeleteDialog } from './ReflectionDeleteDialog';

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
  planWordCount?: number;
  canDelete: boolean;
  onDelete: (id: string) => void;
  hasContent: boolean;
}

// Helper to get grade color class
const getGradeColor = (grade: string) => {
  if (!grade) return '';
  
  if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
  if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
  if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

export const ReflectionCard: React.FC<ReflectionCardProps> = ({
  reflection,
  type,
  stats,
  dateRange,
  reflectionWordCount,
  planWordCount = 0,
  canDelete,
  onDelete,
  hasContent
}) => {
  // Get the reflection ID (weekId or monthId)
  const id = type === 'weekly' 
    ? (reflection as WeeklyReflection).weekId 
    : (reflection as MonthlyReflection).monthId;
  
  // Get the grade
  const grade = type === 'weekly' 
    ? (reflection as WeeklyReflection).grade 
    : (reflection as MonthlyReflection).grade;

  return (
    <Card 
      className={`hover:bg-accent/10 transition-colors ${stats.tradeCount > 0 || hasContent ? '' : 'opacity-70'}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex justify-between">
          <div className="flex items-center">
            <span>{type === 'weekly' ? `Week of ${dateRange}` : `${dateRange}`}</span>
            {grade && (
              <Badge variant="outline" className={`ml-3 ${getGradeColor(grade)}`}>
                Grade: {grade}
              </Badge>
            )}
          </div>
          <span className={stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatCurrency(stats.pnl)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            <div>Trades: {stats.tradeCount}</div>
            <div>R-Value: {stats.rValue > 0 ? '+' : ''}{stats.rValue.toFixed(2)}R</div>
            
            {/* Word count information */}
            <div className="mt-2 text-xs">
              <span>Reflection: {reflectionWordCount} words</span>
              {type === 'weekly' && (
                <span className="ml-2">Plan: {planWordCount} words</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-500 border-red-300 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <ReflectionDeleteDialog 
                  type={type} 
                  onConfirm={() => onDelete(id)}
                />
              </AlertDialog>
            )}
            
            <Button 
              asChild
              variant={hasContent ? "outline" : "default"}
              size="sm"
              className={hasContent ? "border-blue-400 hover:bg-blue-50 hover:text-blue-600" : "bg-green-600 hover:bg-green-700"}
            >
              <Link to={`/journal/${type}/${id}`}>
                {hasContent ? (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Reflection
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Reflection
                  </>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

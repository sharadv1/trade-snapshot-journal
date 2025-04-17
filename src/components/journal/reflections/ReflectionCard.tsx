
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/calculations/formatters";
import { Trash, AlertTriangle } from "lucide-react";
import { MonthlyReflection, WeeklyReflection } from '@/types';

interface ReflectionStats {
  pnl: number;
  rValue: number;
  tradeCount: number;
  hasContent: boolean;
  winCount?: number;
  lossCount?: number;
  winRate?: number;
}

interface ReflectionCardProps {
  reflection: WeeklyReflection | MonthlyReflection;
  type: 'weekly' | 'monthly';
  stats: ReflectionStats;
  dateRange: string;
  reflectionWordCount: number;
  planWordCount?: number;
  canDelete: boolean;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  hasContent: boolean;
  isDuplicate?: boolean;
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
  hasContent,
  isDuplicate
}: ReflectionCardProps) {
  
  if (!reflection || !reflection.id) {
    console.error('Invalid reflection data:', reflection);
    return null;
  }
  
  const handleDelete = (e: React.MouseEvent) => {
    if (onDelete) {
      onDelete(reflection.id, e);
    }
  };
  
  const getPnlColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };
  
  const getGradeColor = (grade: string) => {
    if (!grade) return "bg-gray-200 text-gray-700";
    
    if (grade.startsWith('A')) return "bg-green-100 text-green-800";
    if (grade.startsWith('B')) return "bg-blue-100 text-blue-800";
    if (grade.startsWith('C')) return "bg-yellow-100 text-yellow-800";
    if (grade.startsWith('D')) return "bg-orange-100 text-orange-800";
    if (grade.startsWith('F')) return "bg-red-100 text-red-800";
    
    return "bg-gray-100 text-gray-800";
  };
  
  const getGrade = () => {
    if (type === 'weekly') {
      return (reflection as WeeklyReflection).grade;
    }
    return (reflection as MonthlyReflection).grade;
  };
  
  const grade = getGrade();
  
  return (
    <Card className={`hover:shadow-md transition-shadow ${isDuplicate ? 'border-red-200 bg-red-50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{dateRange}</CardTitle>
            <CardDescription className="flex flex-wrap gap-1 mt-1">
              {reflectionWordCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {reflectionWordCount} words in reflection
                </Badge>
              )}
              
              {planWordCount && planWordCount > 0 && type === 'weekly' && (
                <Badge variant="outline" className="text-xs">
                  {planWordCount} words in plan
                </Badge>
              )}
              
              {stats.tradeCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {stats.tradeCount} trades
                </Badge>
              )}
              
              {grade && (
                <Badge variant="outline" className={`${getGradeColor(grade)} text-xs`}>
                  Grade: {grade}
                </Badge>
              )}
            </CardDescription>
          </div>
          
          {isDuplicate && (
            <div className="flex items-center text-red-600 bg-red-50 rounded px-2 py-1">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">Duplicate</span>
            </div>
          )}
          
          {canDelete && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700 hover:bg-red-100"
              onClick={handleDelete}
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap gap-3 mt-2">
            <div className="flex-1 min-w-[160px]">
              <p className="text-sm text-muted-foreground">P&L</p>
              <p className={`text-lg font-medium ${getPnlColor(stats.pnl)}`}>
                {formatCurrency(stats.pnl)}
              </p>
            </div>
            
            <div className="flex-1 min-w-[120px]">
              <p className="text-sm text-muted-foreground">R Value</p>
              <p className={`text-lg font-medium ${getPnlColor(stats.rValue)}`}>
                {stats.rValue.toFixed(2)}R
              </p>
            </div>
            
            {stats.winCount !== undefined && stats.lossCount !== undefined && (
              <div className="flex-1 min-w-[140px]">
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-lg font-medium">
                  {stats.winRate ? stats.winRate.toFixed(0) : 0}%
                  <span className="text-xs text-muted-foreground ml-1">
                    ({stats.winCount}W / {stats.lossCount}L)
                  </span>
                </p>
              </div>
            )}
          </div>
          
          {!hasContent && (
            <p className="text-sm italic text-muted-foreground mt-2">
              No {type} reflection content yet
            </p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="w-full">
          {isDuplicate && (
            <p className="text-xs text-red-600 mt-2">
              This appears to be a duplicate entry. Use the "Remove Duplicates" button to clean up.
            </p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

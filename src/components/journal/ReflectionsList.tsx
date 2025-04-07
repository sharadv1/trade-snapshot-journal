
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/utils/calculations/formatters';
import { WeeklyReflection, MonthlyReflection } from '@/types';

interface ReflectionsListProps {
  reflections: (WeeklyReflection | MonthlyReflection)[];
  type: 'weekly' | 'monthly';
  getStats: (reflection: WeeklyReflection | MonthlyReflection) => { 
    pnl: number;
    rValue: number;
    tradeCount: number;
  };
}

export function ReflectionsList({ reflections, type, getStats }: ReflectionsListProps) {
  if (!reflections || reflections.length === 0) {
    return (
      <div className="container mx-auto">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No {type} reflections found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (date: string) => {
    try {
      return format(parseISO(date), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return 'Unknown';
    
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } catch (error) {
      console.error("Error formatting date range:", error);
      return 'Invalid dates';
    }
  };
  
  const getGradeColor = (grade: string = '') => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{type === 'weekly' ? 'Weekly' : 'Monthly'} Reflections</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{type === 'weekly' ? 'Week' : 'Month'}</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>R Value</TableHead>
                <TableHead>Trades</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reflections.map((reflection) => {
                const stats = getStats(reflection);
                
                return (
                  <TableRow key={reflection.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link 
                        to={`/journal/${type}/${type === 'weekly' ? reflection.weekId : reflection.monthId}`}
                        className="hover:underline text-primary"
                      >
                        {type === 'weekly' 
                          ? formatDateRange(reflection.weekStart, reflection.weekEnd)
                          : format(parseISO(reflection.monthId), 'MMMM yyyy')}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getGradeColor(reflection.grade)}>
                        {reflection.grade || 'No Grade'}
                      </Badge>
                    </TableCell>
                    <TableCell className={stats.pnl >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {formatCurrency(stats.pnl)}
                    </TableCell>
                    <TableCell className={stats.rValue >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {stats.rValue > 0 ? '+' : ''}{stats.rValue.toFixed(1)}R
                    </TableCell>
                    <TableCell>
                      {stats.tradeCount} {stats.tradeCount === 1 ? 'trade' : 'trades'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

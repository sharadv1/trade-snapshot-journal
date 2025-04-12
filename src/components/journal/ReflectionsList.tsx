import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  parseISO, 
  isSameMonth, 
  isSameYear 
} from 'date-fns';
import { WeeklyReflection, MonthlyReflection } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/calculations/formatters';
import { ReflectionDeleteDialog } from './reflections/ReflectionDeleteDialog';
import { ReflectionCard } from './reflections/ReflectionCard';
import { Check, Filter, Calendar, Plus, ArrowRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReflectionsListProps {
  reflections: WeeklyReflection[] | MonthlyReflection[];
  type: 'weekly' | 'monthly';
  getStats: (reflection: WeeklyReflection | MonthlyReflection) => {
    pnl: number;
    rValue: number;
    tradeCount: number;
    hasContent: boolean;
  };
}

export function ReflectionsList({ reflections, type, getStats }: ReflectionsListProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reflectionToDelete, setReflectionToDelete] = useState<WeeklyReflection | MonthlyReflection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleReflectionClick = (reflection: WeeklyReflection | MonthlyReflection) => {
    if (type === 'weekly') {
      navigate(`/journal/weekly/${(reflection as WeeklyReflection).weekId}`);
    } else {
      navigate(`/journal/monthly/${(reflection as MonthlyReflection).monthId}`);
    }
  };
  
  const handleNewReflectionClick = () => {
    if (type === 'weekly') {
      navigate('/journal/weekly/new-week');
    } else {
      navigate('/journal/monthly/new-month');
    }
  };
  
  const handleOpenDeleteDialog = (reflection: WeeklyReflection | MonthlyReflection) => {
    setReflectionToDelete(reflection);
    setIsDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setReflectionToDelete(null);
  };
  
  const handleReflectionDeleted = () => {
    handleCloseDeleteDialog();
  };
  
  const getFormattedDate = (reflection: WeeklyReflection | MonthlyReflection): string => {
    if (type === 'weekly') {
      const weekStart = (reflection as WeeklyReflection).weekStart;
      const weekEnd = (reflection as WeeklyReflection).weekEnd;
      
      if (!weekStart || !weekEnd) return 'Unknown week';
      
      const start = parseISO(weekStart);
      const end = parseISO(weekEnd);
      
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      const monthId = (reflection as MonthlyReflection).monthId;
      if (!monthId) return 'Unknown month';
      
      const date = parseISO(monthId);
      return format(date, 'MMMM yyyy');
    }
  };
  
  const getGradeColor = (grade?: string) => {
    if (!grade) return 'bg-gray-100 text-gray-800';
    
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  const filteredReflections = reflections.filter(reflection => {
    const formattedDate = getFormattedDate(reflection).toLowerCase();
    const searchText = searchQuery.toLowerCase();
    
    if (searchText && !formattedDate.includes(searchText)) {
      return false;
    }
    
    if (selectedMonth !== null) {
      let reflectionDate;
      if (type === 'weekly') {
        const weekStart = (reflection as WeeklyReflection).weekStart;
        if (!weekStart) return false;
        reflectionDate = parseISO(weekStart);
      } else {
        const monthId = (reflection as MonthlyReflection).monthId;
        if (!monthId) return false;
        reflectionDate = parseISO(monthId);
      }
      
      if (!isSameMonth(reflectionDate, new Date(2000, selectedMonth, 1))) {
        return false;
      }
    }
    
    if (selectedYear !== null) {
      let reflectionDate;
      if (type === 'weekly') {
        const weekStart = (reflection as WeeklyReflection).weekStart;
        if (!weekStart) return false;
        reflectionDate = parseISO(weekStart);
      } else {
        const monthId = (reflection as MonthlyReflection).monthId;
        if (!monthId) return false;
        reflectionDate = parseISO(monthId);
      }
      
      if (!isSameYear(reflectionDate, new Date(selectedYear, 0, 1))) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedMonth(null)}>
                Clear Month Filter
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {[...Array(12)].map((_, i) => (
                <DropdownMenuItem key={i} onClick={() => setSelectedMonth(i)}>
                  {format(new Date(2000, i, 1), 'MMMM')}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedYear(null)}>
                Clear Year Filter
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <DropdownMenuItem key={year} onClick={() => setSelectedYear(year)}>
                    {year}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Button variant="outline" size="sm" onClick={handleNewReflectionClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {filteredReflections.length > 0 ? (
          filteredReflections.map((reflection) => {
            const stats = getStats(reflection);
            const formattedDate = getFormattedDate(reflection);
            const isProfitable = stats.pnl > 0;
            
            return (
              <Card 
                key={reflection.id} 
                className={`cursor-pointer hover:bg-muted/40 transition-colors ${
                  reflection.isPlaceholder ? 'border-dashed' : ''
                }`}
                onClick={() => handleReflectionClick(reflection)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-medium inline-flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {formattedDate}
                        
                        {reflection.grade && (
                          <Badge 
                            variant="outline" 
                            className={getGradeColor(reflection.grade)}
                            style={{ marginLeft: '8px' }}
                          >
                            {reflection.grade}
                          </Badge>
                        )}
                        
                        {stats.hasContent && (
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
                      {/* Display any custom actions if provided */}
                      {'actions' in reflection && reflection.actions}
                      
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
                  </div>
                  
                  {reflection.reflection && (
                    <div className="mt-3 text-sm text-muted-foreground line-clamp-2">
                      {reflection.reflection.replace(/<[^>]*>/g, ' ')}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-16 border border-dashed rounded-md">
            <h3 className="text-xl font-semibold mb-2">No Reflections Found</h3>
            <p className="text-muted-foreground">
              It seems like there are no reflections matching your criteria.
            </p>
          </div>
        )}
      </div>
      
      <ReflectionDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        reflection={reflectionToDelete}
        onReflectionDeleted={handleReflectionDeleted}
      />
    </div>
  );
}

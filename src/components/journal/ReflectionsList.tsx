
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Pencil, Calendar } from 'lucide-react';
import { WeeklyReflection, getWeeklyReflections } from '@/utils/journalStorage';

export function ReflectionsList() {
  const navigate = useNavigate();
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  
  useEffect(() => {
    loadReflections();
    
    // Listen for storage changes to reload reflections
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'trade-journal-reflections') {
        loadReflections();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const loadReflections = () => {
    const allReflections = getWeeklyReflections();
    // Sort by date, newest first
    allReflections.sort((a, b) => 
      new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    );
    setReflections(allReflections);
  };
  
  const handleEditReflection = (weekId: string) => {
    navigate(`/journal/${weekId}`);
  };
  
  const handleCreateNew = () => {
    navigate('/journal/new');
  };
  
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Weekly Trading Journal Reflections</CardTitle>
        <Button onClick={handleCreateNew}>
          <Calendar className="mr-2 h-4 w-4" />
          Current Week
        </Button>
      </CardHeader>
      <CardContent>
        {reflections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You haven't created any weekly reflections yet.
            </p>
            <Button onClick={handleCreateNew}>
              Create Your First Reflection
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Trades</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reflections.map((reflection) => (
                <TableRow key={reflection.id}>
                  <TableCell>
                    {format(parseISO(reflection.weekStart), 'MMM d')} - {format(parseISO(reflection.weekEnd), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getGradeColor(reflection.grade)}>
                      {reflection.grade}
                    </Badge>
                  </TableCell>
                  <TableCell>{reflection.tradeIds.length} trades</TableCell>
                  <TableCell>{format(parseISO(reflection.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditReflection(reflection.id)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

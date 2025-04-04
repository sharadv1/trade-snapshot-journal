
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface LessonFiltersProps {
  allTypes: string[];
  selectedTypes: string[];
  setSelectedTypes: React.Dispatch<React.SetStateAction<string[]>>;
}

export function LessonFilters({ 
  allTypes, 
  selectedTypes, 
  setSelectedTypes 
}: LessonFiltersProps) {
  
  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
  };

  if (allTypes.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Filter Lessons</CardTitle>
          {selectedTypes.length > 0 && (
            <button 
              onClick={handleClearFilters}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Clear all
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {allTypes.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox 
                id={`filter-${type}`} 
                checked={selectedTypes.includes(type)}
                onCheckedChange={() => handleTypeToggle(type)}
              />
              <Label 
                htmlFor={`filter-${type}`}
                className="text-sm cursor-pointer"
              >
                {type}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

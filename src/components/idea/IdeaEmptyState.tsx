
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IdeaDialog } from './IdeaDialog';

interface IdeaEmptyStateProps {
  onIdeaAdded: () => void;
}

export function IdeaEmptyState({ onIdeaAdded }: IdeaEmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-10 text-center">
        <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">No trade ideas yet</p>
        <IdeaDialog 
          trigger={<Button>Add Your First Idea</Button>} 
          onIdeaAdded={onIdeaAdded}
        />
      </CardContent>
    </Card>
  );
}

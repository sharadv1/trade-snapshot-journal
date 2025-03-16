
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradeIdea } from '@/types';
import { addIdea, updateIdea } from '@/utils/ideaStorage';
import { toast } from '@/utils/toast';

interface IdeaDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialIdea?: TradeIdea;
  onIdeaAdded?: () => void;
  trigger?: React.ReactNode;
}

export function IdeaDialog({ 
  open, 
  onOpenChange, 
  initialIdea, 
  onIdeaAdded,
  trigger 
}: IdeaDialogProps) {
  const [isOpen, setIsOpen] = useState(open || false);
  const [idea, setIdea] = useState<Partial<TradeIdea>>({
    date: new Date().toISOString().slice(0, 16),
    symbol: '',
    description: '',
    status: 'still valid'
  });

  useEffect(() => {
    if (initialIdea) {
      setIdea(initialIdea);
    }
  }, [initialIdea]);

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  const handleChange = (field: keyof TradeIdea, value: any) => {
    setIdea(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!idea.symbol || !idea.date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (initialIdea) {
        // Update existing idea
        updateIdea({
          ...initialIdea,
          ...idea
        } as TradeIdea);
        toast.success("Trade idea updated successfully");
      } else {
        // Add new idea
        addIdea({
          ...idea,
          id: crypto.randomUUID(),
        } as TradeIdea);
        toast.success("Trade idea added successfully");
      }

      // Reset form and close dialog
      setIdea({
        date: new Date().toISOString().slice(0, 16),
        symbol: '',
        description: '',
        status: 'still valid'
      });
      
      handleOpenChange(false);
      
      if (onIdeaAdded) {
        onIdeaAdded();
      }
    } catch (error) {
      console.error("Error saving trade idea:", error);
      toast.error("Failed to save trade idea");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialIdea ? 'Edit Trade Idea' : 'Add Trade Idea'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="datetime-local"
              value={idea.date}
              onChange={(e) => handleChange('date', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol <span className="text-destructive">*</span></Label>
            <Input
              id="symbol"
              type="text"
              value={idea.symbol}
              onChange={(e) => handleChange('symbol', e.target.value.toUpperCase())}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={idea.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={idea.status || 'still valid'}
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="still valid">Still Valid</SelectItem>
                <SelectItem value="invalidated">Invalidated</SelectItem>
                <SelectItem value="taken">Taken</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {initialIdea ? 'Update' : 'Add'} Idea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

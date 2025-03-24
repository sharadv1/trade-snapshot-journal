import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { TradeIdea } from '@/types';
import { addIdea, updateIdea } from '@/utils/ideaStorage';
import { toast } from '@/utils/toast';
import { ImageUpload } from '@/components/ImageUpload';

// Simple UUID generator that doesn't rely on crypto.randomUUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, 
          v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface IdeaDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialIdea?: TradeIdea;
  onIdeaAdded?: () => void;
  trigger?: React.ReactNode;
  mode?: 'edit' | 'view' | 'add';
}

export function IdeaDialog({ 
  open, 
  onOpenChange, 
  initialIdea, 
  onIdeaAdded,
  trigger,
  mode = 'add'
}: IdeaDialogProps) {
  const [isOpen, setIsOpen] = useState(open || false);
  const [idea, setIdea] = useState<Partial<TradeIdea>>({
    date: new Date().toISOString().slice(0, 16),
    symbol: '',
    description: '',
    status: 'still valid',
    direction: 'long',
    images: []
  });
  const [images, setImages] = useState<string[]>([]);
  
  const isReadOnly = mode === 'view';

  useEffect(() => {
    if (initialIdea) {
      setIdea(initialIdea);
      setImages(initialIdea.images || []);
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

  const handleImageUpload = (base64Image: string) => {
    const newImages = [...images, base64Image];
    setImages(newImages);
    handleChange('images', newImages);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    handleChange('images', newImages);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!idea.symbol || !idea.date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (initialIdea) {
        // Update existing idea
        updateIdea({
          ...initialIdea,
          ...idea,
          images
        } as TradeIdea);
        toast.success("Trade idea updated successfully");
      } else {
        // Add new idea
        addIdea({
          ...idea,
          id: generateUUID(), // Use our custom UUID generator
          images
        } as TradeIdea);
        toast.success("Trade idea added successfully");
      }

      // Reset form and close dialog
      setIdea({
        date: new Date().toISOString().slice(0, 16),
        symbol: '',
        description: '',
        status: 'still valid',
        direction: 'long',
        images: []
      });
      setImages([]);
      
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
          <DialogTitle>
            {mode === 'view' ? 'View Trade Idea' : mode === 'edit' ? 'Edit Trade Idea' : 'Add Trade Idea'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="datetime-local"
              value={idea.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
              disabled={isReadOnly}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol <span className="text-destructive">*</span></Label>
            <Input
              id="symbol"
              name="symbol"
              type="text"
              value={idea.symbol}
              onChange={(e) => handleChange('symbol', e.target.value.toUpperCase())}
              required
              disabled={isReadOnly}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Direction</Label>
            <RadioGroup
              value={idea.direction || 'long'}
              onValueChange={(value) => handleChange('direction', value as 'long' | 'short')}
              className="flex space-x-4"
              disabled={isReadOnly}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="long" id="long" />
                <Label htmlFor="long" className="flex items-center cursor-pointer">
                  <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                  Long
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="short" id="short" />
                <Label htmlFor="short" className="flex items-center cursor-pointer">
                  <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
                  Short
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={idea.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              disabled={isReadOnly}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={idea.status || 'still valid'}
              onValueChange={(value) => handleChange('status', value)}
              disabled={isReadOnly}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="still valid">Still Valid</SelectItem>
                <SelectItem value="invalidated">Invalidated</SelectItem>
                <SelectItem value="taken">Taken</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Images</Label>
            <ImageUpload
              images={images}
              onImageUpload={handleImageUpload}
              onImageRemove={handleRemoveImage}
              disabled={isReadOnly}
            />
          </div>
          
          {!isReadOnly && (
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {initialIdea ? 'Update' : 'Add'} Idea
              </Button>
            </DialogFooter>
          )}
          
          {isReadOnly && (
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

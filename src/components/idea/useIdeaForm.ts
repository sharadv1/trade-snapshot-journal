
import { useState, useEffect } from 'react';
import { TradeIdea } from '@/types';
import { toast } from '@/utils/toast';
import { addIdea, updateIdea } from '@/utils/ideaStorage';
import { generateUUID } from '@/utils/generateUUID';
import { IdeaFormData } from './types';

export function useIdeaForm({
  initialIdea,
  onIdeaAdded,
  onOpenChange
}: {
  initialIdea?: TradeIdea;
  onIdeaAdded?: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [idea, setIdea] = useState<IdeaFormData>({
    date: new Date().toISOString().slice(0, 16),
    symbol: '',
    description: '',
    status: 'still valid',
    direction: 'long',
    images: []
  });
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (initialIdea) {
      setIdea(initialIdea);
      setImages(initialIdea.images || []);
    }
  }, [initialIdea]);

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
          id: generateUUID(),
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
      
      onOpenChange(false);
      
      if (onIdeaAdded) {
        onIdeaAdded();
      }
    } catch (error) {
      console.error("Error saving trade idea:", error);
      toast.error("Failed to save trade idea");
    }
  };

  return {
    idea,
    images,
    handleChange,
    handleImageUpload,
    handleRemoveImage,
    handleSubmit
  };
}


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
    direction: 'long', // Always set a default direction
    images: []
  });
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialIdea) {
      // Convert TradeIdea to IdeaFormData, ensuring all required fields are present
      setIdea({
        ...initialIdea,
        date: initialIdea.date || initialIdea.createdAt || new Date().toISOString().slice(0, 16),
        description: initialIdea.description || '',
        direction: initialIdea.direction || 'long',
        status: initialIdea.status || 'still valid',
        images: initialIdea.images || []
      });
      setImages(initialIdea.images || []);
    }
  }, [initialIdea]);

  const handleChange = (field: keyof TradeIdea, value: any) => {
    setIdea(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (base64Image: string) => {
    // Limit to 3 images maximum
    if (images.length >= 3) {
      toast.error("Maximum 3 images allowed");
      return;
    }
    
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
    
    if (isSubmitting) {
      return; // Prevent multiple submissions
    }
    
    setIsSubmitting(true);
    
    try {
      // Make sure direction is set before saving
      const ideaToSave = {
        ...idea,
        direction: idea.direction || 'long',
        images
      };
      
      let success = false;
      
      if (initialIdea) {
        // Update existing idea
        success = updateIdea({
          ...initialIdea,
          ...ideaToSave,
        } as TradeIdea);
        
        if (success) {
          toast.success("Trade idea updated successfully");
        }
      } else {
        // Add new idea
        success = addIdea({
          ...ideaToSave,
          id: generateUUID(),
        } as TradeIdea);
        
        if (success) {
          toast.success("Trade idea added successfully");
        }
      }
      
      if (success) {
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
      }
    } catch (error) {
      console.error("Error saving trade idea:", error);
      toast.error("Failed to save trade idea");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    idea,
    images,
    isSubmitting,
    handleChange,
    handleImageUpload,
    handleRemoveImage,
    handleSubmit
  };
}

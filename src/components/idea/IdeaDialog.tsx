
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IdeaDialogProps } from './types';
import { useIdeaForm } from './useIdeaForm';
import { IdeaDateField } from './IdeaDateField';
import { IdeaSymbolField } from './IdeaSymbolField';
import { IdeaDirectionField } from './IdeaDirectionField';
import { IdeaDescriptionField } from './IdeaDescriptionField';
import { IdeaStatusField } from './IdeaStatusField';
import { IdeaImagesField } from './IdeaImagesField';
import { IdeaFormActions } from './IdeaFormActions';

export function IdeaDialog({ 
  open, 
  onOpenChange, 
  initialIdea, 
  onIdeaAdded,
  trigger,
  mode = 'add'
}: IdeaDialogProps) {
  const [isOpen, setIsOpen] = useState(open || false);
  const isReadOnly = mode === 'view';

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

  const {
    idea,
    images,
    isSubmitting,
    handleChange,
    handleImageUpload,
    handleRemoveImage,
    handleSubmit
  } = useIdeaForm({
    initialIdea,
    onIdeaAdded,
    onOpenChange: handleOpenChange
  });

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
          <IdeaDateField 
            value={idea.date} 
            onChange={(value) => handleChange('date', value)} 
            isReadOnly={isReadOnly} 
          />
          
          <IdeaSymbolField 
            value={idea.symbol} 
            onChange={(value) => handleChange('symbol', value)} 
            isReadOnly={isReadOnly} 
          />
          
          <IdeaDirectionField 
            value={idea.direction || 'long'} 
            onChange={(value) => handleChange('direction', value)} 
            isReadOnly={isReadOnly} 
          />
          
          <IdeaDescriptionField 
            value={idea.description || ''} 
            onChange={(value) => handleChange('description', value)} 
            isReadOnly={isReadOnly} 
          />
          
          <IdeaStatusField 
            value={idea.status || 'still valid'} 
            onChange={(value) => handleChange('status', value)} 
            isReadOnly={isReadOnly} 
          />
          
          <IdeaImagesField 
            images={images} 
            onImageUpload={handleImageUpload} 
            onImageRemove={handleRemoveImage} 
            isReadOnly={isReadOnly} 
          />
          
          <IdeaFormActions 
            isReadOnly={isReadOnly} 
            hasInitialIdea={!!initialIdea} 
            onCancel={() => handleOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

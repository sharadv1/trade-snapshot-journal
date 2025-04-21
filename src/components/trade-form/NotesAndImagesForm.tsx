
import React, { useState, useEffect } from 'react';
import { Trade } from '@/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MediaUpload } from '@/components/MediaUpload';
import { Switch } from '@/components/ui/switch';
import { MediaViewerDialog } from '@/components/MediaViewerDialog';
import { testImageUrl } from '@/utils/storage/imageOperations';
import { toast } from '@/utils/toast';

interface NotesAndImagesFormProps {
  trade: Trade;
  handleChange: (field: keyof Trade, value: any) => void;
  images: string[];
  onImageUpload: (file: File) => Promise<void>;
  onImageRemove: (urlOrIndex: string | number) => void;
}

export function NotesAndImagesForm({
  trade,
  handleChange,
  images,
  onImageUpload,
  onImageRemove,
}: NotesAndImagesFormProps) {
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [validatedImages, setValidatedImages] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(true);
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleChange('notes', e.target.value);
  };

  const handleTargetReachedChange = (checked: boolean) => {
    handleChange('targetReached', checked);
  };
  
  // Validate images when the component mounts or images change
  useEffect(() => {
    const validateImages = async () => {
      setIsValidating(true);
      
      // Log all image URLs for debugging
      console.log('NotesAndImagesForm: Processing images:', images);
      
      if (!images || images.length === 0) {
        setValidatedImages([]);
        setIsValidating(false);
        return;
      }
      
      // Use the existing images array directly
      // We'll trust the images from the trade object as valid
      setValidatedImages(images);
      setIsValidating(false);
    };
    
    validateImages();
  }, [images]);
  
  const handleImageClick = (index: number) => {
    if (validatedImages && validatedImages.length > 0) {
      setCurrentImageIndex(index);
      setViewingImage(validatedImages[index]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={trade.notes || ''}
          onChange={handleNotesChange}
          placeholder="Add notes about this trade..."
          className="min-h-32 resize-y w-full whitespace-pre-wrap overflow-wrap-break-word"
          style={{ maxWidth: '100%', wordBreak: 'break-word' }}
        />
      </div>

      {trade.takeProfit && trade.status === 'closed' && (
        <div className="flex items-center space-x-2">
          <Switch 
            id="targetReached"
            checked={trade.targetReached || false}
            onCheckedChange={handleTargetReachedChange}
          />
          <Label htmlFor="targetReached" className="cursor-pointer">
            Target price was reached (even if exited early)
          </Label>
        </div>
      )}

      <div className="space-y-2">
        <Label>Images</Label>
        {isValidating ? (
          <div className="text-sm text-muted-foreground py-2">Validating images...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-2">
              {validatedImages.map((url, index) => (
                <div 
                  key={index} 
                  className="relative w-full h-24 border rounded overflow-hidden cursor-pointer bg-gray-50"
                  onClick={() => handleImageClick(index)}
                >
                  <img 
                    src={url} 
                    alt={`Image ${index + 1}`} 
                    className="w-full h-full object-cover"
                    onLoad={() => console.log(`Image loaded successfully: ${url}`)}
                    onError={(e) => {
                      console.error('Image failed to load in NotesAndImagesForm:', url);
                      // Don't immediately set placeholder - let the image try to load
                      // Only set placeholder after a short delay if it fails
                      setTimeout(() => {
                        if (!e.currentTarget.complete || e.currentTarget.naturalWidth === 0) {
                          const imgElement = e.currentTarget;
                          imgElement.src = '/placeholder.svg';
                          imgElement.style.opacity = '0.6';
                        }
                      }, 500);
                    }}
                  />
                </div>
              ))}
            </div>
            <MediaUpload
              images={validatedImages}
              onImageUpload={onImageUpload}
              onImageRemove={onImageRemove}
              acceptVideos={false}
              acceptPdfs={false}
              maxFiles={10}
            />
          </>
        )}
      </div>
      
      {viewingImage && (
        <MediaViewerDialog 
          images={validatedImages}
          currentIndex={currentImageIndex}
          isOpen={!!viewingImage} 
          onClose={() => setViewingImage(null)}
          onIndexChange={setCurrentImageIndex}
        />
      )}
    </div>
  );
}

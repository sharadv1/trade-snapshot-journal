
import { Trade } from '@/types';
import { Label } from '@/components/ui/label';
import { MediaUpload } from '@/components/MediaUpload';
import { useEffect, useState } from 'react';
import { RichTextEditor } from '@/components/journal/RichTextEditor';

interface NotesAndImagesFormProps {
  trade: Trade;
  handleChange: (field: keyof Trade, value: any) => void;
  images: string[];
  onImageUpload: (file: File) => void;
  onImageRemove: (url: string) => void;
}

export function NotesAndImagesForm({
  trade,
  handleChange,
  images,
  onImageUpload,
  onImageRemove
}: NotesAndImagesFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Detect if an item is a video (basic check, could be enhanced)
  const isVideo = (url: string) => {
    return url.includes('video') || 
           url.startsWith('data:video') || 
           url.endsWith('.mp4') || 
           url.endsWith('.webm') || 
           url.endsWith('.mov');
  };
  
  // Transform string URLs to MediaFile objects
  const mediaFiles = images.map(url => ({
    url,
    type: isVideo(url) ? 'video' : 'image' as 'video' | 'image'
  }));

  // Improved handler for file upload with debounce
  const handleFileUpload = (file: File) => {
    if (isProcessing) {
      console.log('NotesAndImagesForm: Already processing an upload, ignoring');
      return;
    }
    
    console.log('NotesAndImagesForm: File upload requested', file.name);
    setIsProcessing(true);
    
    if (file) {
      onImageUpload(file);
      
      // Reset processing state after a delay
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    } else {
      setIsProcessing(false);
    }
  };

  // Adapter for image removal by index to removal by URL
  const handleImageRemoveByIndex = (index: number) => {
    onImageRemove(images[index]);
  };

  // Reset processing state when component unmounts
  useEffect(() => {
    return () => {
      setIsProcessing(false);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="notes">Trade Notes</Label>
        <RichTextEditor
          id="notes"
          content={trade.notes || ''}
          onChange={(content) => handleChange('notes', content)}
          placeholder="Enter your notes about this trade..."
          className="min-h-[150px]"
        />
        <p className="text-xs text-muted-foreground">
          Supports Markdown: **bold**, *italic*, lists, and more
        </p>
      </div>
      
      <div className="space-y-2">
        <Label>Media Files</Label>
        <MediaUpload 
          media={mediaFiles}
          onMediaUpload={handleFileUpload}
          onMediaRemove={handleImageRemoveByIndex}
          onImageUpload={handleFileUpload}
          onImageRemove={handleImageRemoveByIndex}
          disabled={isProcessing}
          maxFiles={5}
        />
        <p className="text-xs text-muted-foreground">
          Upload images or videos to document your trade setup, execution, and results.
        </p>
      </div>
    </div>
  );
}

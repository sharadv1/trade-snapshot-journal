
import { useState } from 'react';
import { Trade } from '@/types';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/journal/RichTextEditor';
import { MediaUpload } from '@/components/MediaUpload';
import { toast } from '@/utils/toast';

interface MediaFile {
  url: string;
  type: 'image' | 'video';
}

interface NotesAndImagesFormProps {
  trade: Partial<Trade>;
  handleChange: (field: keyof Trade, value: any) => void;
  images: string[];
  onImageUpload: (file: File) => void;
  onImageRemove: (index: number) => void;
}

export function NotesAndImagesForm({
  trade,
  handleChange,
  images,
  onImageUpload,
  onImageRemove
}: NotesAndImagesFormProps) {
  const [notes, setNotes] = useState(trade.notes || '');
  const [isUploading, setIsUploading] = useState(false);

  // Convert legacy images array to media format, and properly detect video types
  const media: MediaFile[] = images.map(url => ({
    url,
    type: isVideoUrl(url) ? 'video' : 'image'
  }));
  
  function isVideoUrl(url: string): boolean {
    // Check if it's a server path or data URL
    return url.endsWith('.mp4') || 
           url.endsWith('.webm') || 
           url.endsWith('.mov') ||
           url.includes('/media/') && (
             url.includes('.mp4') || 
             url.includes('.webm') || 
             url.includes('.mov')
           ) ||
           url.includes('/video/') ||
           url.startsWith('data:video/');
  }
  
  const handleMediaUpload = async (file: File) => {
    setIsUploading(true);
    try {
      await onImageUpload(file);
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Failed to upload media');
    } finally {
      setIsUploading(false);
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    handleChange('notes', value);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <div className="min-h-[200px]">
          <RichTextEditor
            content={notes}
            onChange={handleNotesChange}
            placeholder="Add your trade notes here..."
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="media">Images & Videos</Label>
        <MediaUpload
          media={media}
          onMediaUpload={handleMediaUpload}
          onMediaRemove={onImageRemove}
        />
        {isUploading && (
          <div className="text-sm text-muted-foreground">Uploading media...</div>
        )}
      </div>
    </div>
  );
}

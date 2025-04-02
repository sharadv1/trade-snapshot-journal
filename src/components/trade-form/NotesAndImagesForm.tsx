import { useState } from 'react';
import { Trade } from '@/types';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/journal/RichTextEditor';
import { MediaUpload } from '@/components/MediaUpload';
import { toast } from '@/utils/toast';
import { v4 as uuidv4 } from 'uuid';

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

  // Convert legacy images array to media format
  const media: MediaFile[] = images.map(url => ({
    url,
    type: 'image'
  }));
  
  // Function to handle media uploads (both images and videos)
  const handleMediaUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // For backwards compatibility, keep using the images array
        // but it now contains URLs to the server instead of base64
        onImageUpload(file);
        
        // Notify the user
        toast.success(`${file.type.startsWith('image/') ? 'Image' : 'Video'} uploaded successfully`);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
      
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

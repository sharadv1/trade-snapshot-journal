
import { useState } from 'react';
import { toast } from '@/utils/toast';

export function useTradeImages(initialImages: string[] = []) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!file) return images;
    
    setIsUploading(true);
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload to server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Add the file path to images array
        const newImages = [...images, result.filePath];
        setImages(newImages);
        toast.success(`File uploaded successfully`);
        setIsUploading(false);
        return newImages;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload media');
      setIsUploading(false);
      return images;
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    return newImages;
  };

  return {
    images,
    setImages,
    isUploading,
    handleImageUpload,
    handleRemoveImage
  };
}

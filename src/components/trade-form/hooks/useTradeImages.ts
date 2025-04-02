
import { useState } from 'react';
import { toast } from '@/utils/toast';

export function useTradeImages(initialImages: string[] = []) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!file) return images;
    
    setIsUploading(true);
    try {
      // For now, since the server upload is not working,
      // we'll use a data URL approach for both images and videos
      return new Promise<string[]>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            if (!e.target || typeof e.target.result !== 'string') {
              throw new Error('Failed to read file');
            }
            
            // Add the file path to images array
            const newImages = [...images, e.target.result];
            setImages(newImages);
            toast.success('File uploaded successfully');
            resolve(newImages);
          } catch (error) {
            reject(error);
          } finally {
            setIsUploading(false);
          }
        };
        
        reader.onerror = (error) => {
          setIsUploading(false);
          reject(error);
        };
        
        reader.readAsDataURL(file);
      });
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

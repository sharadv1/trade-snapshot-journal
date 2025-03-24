
import { useState } from 'react';
import { Trade } from '@/types';

export function useTradeImages(initialImages: string[] = []) {
  const [images, setImages] = useState<string[]>(initialImages);

  const handleImageUpload = (base64Image: string) => {
    const newImages = [...images, base64Image];
    setImages(newImages);
    return newImages;
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
    handleImageUpload,
    handleRemoveImage
  };
}

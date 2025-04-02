
import { useState } from 'react';

export function useTradeImages(initialImages: string[] = []) {
  const [images, setImages] = useState<string[]>(initialImages);

  const handleImageUpload = (file: File) => {
    // Convert File to base64 string
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const newImages = [...images, base64String];
      setImages(newImages);
    };
    reader.readAsDataURL(file);
    return images;
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

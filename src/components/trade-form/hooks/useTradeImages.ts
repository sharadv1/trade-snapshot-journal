
import { useState, useCallback } from 'react';
import { toast } from '@/utils/toast';
import { isUsingServerSync, getServerUrl } from '@/utils/storage/serverConnection';

export function useTradeImages(initialImages: string[] = []) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = useCallback(async (file: File): Promise<string[]> => {
    if (isUploading) {
      console.log('Already uploading an image, ignoring duplicate request');
      return images;
    }
    
    console.log('useTradeImages: Processing file upload:', file.name, file.type);
    
    // Check if it's a video file
    const isVideo = file.type.startsWith('video/');
    
    // Check file size - warn if it's large but still try to process it
    if (isVideo && file.size > 50 * 1024 * 1024) {
      toast.warning('Video is larger than 50MB and might cause performance issues');
    } else if (!isVideo && file.size > 10 * 1024 * 1024) {
      toast.warning('File is larger than 10MB and might cause storage issues');
    }
    
    setIsUploading(true);
    try {
      // Check if we're using server sync (Docker environment)
      if (isUsingServerSync() && getServerUrl()) {
        // Extract the base URL for API calls
        const baseUrl = getServerUrl().replace(/\/trades$/, '');
        const uploadUrl = `${baseUrl}/upload`;
        
        console.log('Uploading file to server:', uploadUrl);
        
        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', file);
        
        // Send file to server
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Server returned status: ${response.status}`);
        }
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to upload file');
        }
        
        // Use the returned file path
        const serverFilePath = result.filePath;
        console.log('File uploaded to server path:', serverFilePath);
        
        // Add the file path to images array
        const newImages = [...images, serverFilePath];
        setImages(newImages);
        toast.success(`${isVideo ? 'Video' : 'Image'} uploaded successfully`);
        setIsUploading(false);
        return newImages;
      } else {
        // For local storage, use data URL approach
        return new Promise<string[]>((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = (e) => {
            try {
              if (!e.target || typeof e.target.result !== 'string') {
                throw new Error('Failed to read file');
              }
              
              console.log('File read successfully, creating data URL');
              const dataUrl = e.target.result;
              
              // Check if the data URL is too large for localStorage
              if (dataUrl.length > 5 * 1024 * 1024) { // 5MB limit for individual files
                toast.warning('This file is too large to store in browser storage and may cause issues when saving');
              }
              
              // Add the file path to images array
              const newImages = [...images, dataUrl];
              setImages(newImages);
              toast.success(`${isVideo ? 'Video' : 'Image'} uploaded successfully`);
              resolve(newImages);
            } catch (error) {
              console.error('Error processing file:', error);
              reject(error);
            } finally {
              setIsUploading(false);
            }
          };
          
          reader.onerror = (error) => {
            console.error('Error reading file:', error);
            setIsUploading(false);
            toast.error('Failed to read file');
            reject(error);
          };
          
          console.log('Starting to read file as data URL');
          reader.readAsDataURL(file);
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload media');
      setIsUploading(false);
      return images;
    }
  }, [images, isUploading]);

  const handleRemoveImage = useCallback((indexOrUrl: number | string): string[] => {
    let index: number;
    
    // If a string URL is provided, find its index
    if (typeof indexOrUrl === 'string') {
      index = images.findIndex(img => img === indexOrUrl);
      if (index === -1) return images; // URL not found
    } else {
      index = indexOrUrl;
    }
    
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    return newImages;
  }, [images]);

  return {
    images,
    setImages,
    isUploading,
    handleImageUpload,
    handleRemoveImage
  };
}

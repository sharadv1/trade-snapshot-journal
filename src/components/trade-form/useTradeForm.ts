
import { useState, useEffect, useCallback } from 'react';
import { Trade } from '@/types';
import { useTradeState } from './hooks/useTradeState';
import { useTradeImages } from './hooks/useTradeImages';
import { useTradeSubmit } from './hooks/useTradeSubmit';
import { generateUUID } from '@/utils/generateUUID';
import { toast } from '@/utils/toast';

export function useTradeForm(initialTrade?: Trade, isEditing = false, ideaId: string | null = null) {
  // Initialize trade state with proper defaults
  const {
    trade,
    setTrade,
    handleChange,
    handleTypeChange,
    contractDetails,
    handleContractDetailsChange,
    pointValue,
  } = useTradeState(initialTrade, isEditing, ideaId);

  // Initialize images state
  const {
    images,
    setImages,
    isUploading,
    handleImageUpload: handleUploadImage,
    handleRemoveImage: handleRemoveImageFromState
  } = useTradeImages(initialTrade?.images || []);

  // Initialize submit logic
  const { handleSubmit } = useTradeSubmit(trade, images, contractDetails, isEditing, initialTrade);

  // Track active tab
  const [activeTab, setActiveTab] = useState<string>('details');

  // Handle image upload with proper error handling and logging
  const handleImageUpload = useCallback(async (file: File) => {
    console.log('useTradeForm: Handling image upload for file:', file.name);
    
    try {
      return await handleUploadImage(file);
    } catch (error) {
      console.error('Error in handleImageUpload:', error);
      toast.error('Failed to upload image');
      return images;
    }
  }, [handleUploadImage, images]);

  // Handle image removal with proper error handling
  const handleRemoveImage = useCallback((index: number) => {
    console.log('useTradeForm: Removing image at index:', index);
    
    try {
      return handleRemoveImageFromState(index);
    } catch (error) {
      console.error('Error in handleRemoveImage:', error);
      toast.error('Failed to remove image');
      return images;
    }
  }, [handleRemoveImageFromState, images]);

  // Set initial images from trade on mount
  useEffect(() => {
    if (initialTrade?.images && initialTrade.images.length > 0) {
      setImages(initialTrade.images);
    }
  }, [initialTrade, setImages]);

  // Return all the state and handlers
  return {
    trade,
    setTrade,
    activeTab,
    setActiveTab,
    handleChange,
    handleTypeChange,
    contractDetails,
    handleContractDetailsChange,
    images,
    isUploading,
    handleImageUpload,
    handleRemoveImage,
    handleSubmit,
    pointValue,
  };
}

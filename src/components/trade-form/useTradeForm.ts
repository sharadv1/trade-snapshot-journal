
import { useState } from 'react';
import { Trade } from '@/types';
import { useTradeState } from './hooks/useTradeState';
import { useTradeImages } from './hooks/useTradeImages';
import { useTradeSubmit } from './hooks/useTradeSubmit';

export function useTradeForm(initialTrade?: Trade, isEditing = false, ideaIdFromProps?: string | null) {
  const [activeTab, setActiveTab] = useState('details');
  
  // Use our extracted hooks
  const {
    trade,
    contractDetails,
    pointValue,
    handleChange,
    handleTypeChange,
    handleContractDetailsChange
  } = useTradeState(initialTrade, isEditing, ideaIdFromProps);
  
  const {
    images,
    handleImageUpload,
    handleRemoveImage
  } = useTradeImages(initialTrade?.images || []);
  
  const { handleSubmit } = useTradeSubmit(
    trade,
    images,
    contractDetails,
    isEditing,
    initialTrade
  );

  return {
    trade,
    contractDetails,
    activeTab,
    setActiveTab,
    images,
    handleChange,
    handleTypeChange,
    handleContractDetailsChange,
    handleImageUpload,
    handleRemoveImage,
    handleSubmit,
    pointValue,
  };
}

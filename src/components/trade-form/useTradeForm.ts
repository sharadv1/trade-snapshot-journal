
import { useState, useEffect } from 'react';
import { Trade, PartialExit } from '@/types';
import { useTradeSubmit } from './hooks/useTradeSubmit';
import { useTradeState } from './hooks/useTradeState';
import { useTradeImages } from './hooks/useTradeImages';
import { toast } from '@/utils/toast';
import { getIdeaById } from '@/utils/ideaStorage';
import { getContractPointValue } from '@/utils/calculations/contractUtils';
import { formatInTimeZone } from 'date-fns-tz';

export const useTradeForm = (
  initialTrade?: Trade,
  isEditing = false,
  ideaId?: string | null
) => {
  // Get current date/time in Central Time format
  const now = new Date();
  const centralTimeISOString = formatInTimeZone(now, 'America/Chicago', "yyyy-MM-dd'T'HH:mm");
  
  const defaultTrade: Partial<Trade> = {
    id: '',
    symbol: '',
    direction: 'long',
    entryDate: centralTimeISOString,
    entryPrice: 0,
    quantity: 1,
    status: 'open',
    type: 'stock',
    strategy: '',
    stopLoss: 0,
    initialStopLoss: 0, // Initialize both stop loss fields to the same value
    takeProfit: 0,
    fees: 0,
    notes: '',
    images: [],
    riskRewardRatio: 0,
    account: '',
    grade: undefined, // Use undefined instead of empty string for optional enum
    mistakes: [],
    timeframe: '',
    pspTime: '',
    ssmtQuarters: '',
    tags: [],
    maxFavorablePrice: 0,
    maxAdversePrice: 0
  };
  
  const [contractDetails, setContractDetails] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('details');
  const [pointValue, setPointValue] = useState<number | undefined>(1);
  const [ideaDetails, setIdeaDetails] = useState<any>(null);
  
  // Use custom hooks
  const { trade, setTradeState, handleChange } = useTradeState(
    initialTrade || defaultTrade as Trade // Type assertion here
  );
  
  // Setup image handling first so it can be used in the useEffect below
  const { images, setImages, handleImageUpload, handleRemoveImage } = useTradeImages(
    initialTrade?.images || []
  );
  
  // Define handleTypeChange function
  const handleTypeChange = (type: string) => {
    setTradeState(prev => ({
      ...prev,
      type: type as Trade['type']
    }));
  };
  
  // Initialize from idea if ideaId is provided
  useEffect(() => {
    if (ideaId && !isEditing) {
      const idea = getIdeaById(ideaId);
      if (idea) {
        setIdeaDetails(idea);
        
        setTradeState(prev => ({
          ...prev,
          symbol: idea.symbol || '',
          direction: idea.direction === 'long' || idea.direction === 'short' 
            ? idea.direction 
            : 'long',
          ideaId: idea.id,
          entryPrice: idea.entryPrice || prev.entryPrice || 0,
          stopLoss: idea.stopLoss || prev.stopLoss || 0,
          initialStopLoss: idea.stopLoss || prev.stopLoss || 0, // Initialize initial stop loss too
          takeProfit: idea.takeProfit || prev.takeProfit || 0,
          images: idea.images || [],
          notes: idea.description || ''
        }));
        
        if (idea.images) {
          setImages(idea.images);
        }
      }
    }
  }, [ideaId, isEditing, setTradeState, setImages]);
  
  // When stopLoss changes and initialStopLoss is not set, update initialStopLoss too
  useEffect(() => {
    if (trade.stopLoss && !trade.initialStopLoss && !isEditing) {
      setTradeState(prev => ({
        ...prev,
        initialStopLoss: trade.stopLoss
      }));
    }
  }, [trade.stopLoss, isEditing, setTradeState]);
  
  // Calculate and update the point value when needed
  useEffect(() => {
    if (trade.type === 'futures' && trade.symbol) {
      const pv = getContractPointValue(trade as Trade);
      setPointValue(pv);
    } else {
      setPointValue(1);
    }
  }, [trade.type, trade.symbol, contractDetails]);
  
  // Handle contract details change
  const handleContractDetailsChange = (details: Record<string, any>) => {
    setContractDetails(details);
  };
  
  // Setup submit handler
  const { handleSubmit } = useTradeSubmit(
    trade,
    images,
    contractDetails,
    isEditing,
    initialTrade
  );
  
  return {
    trade,
    setTrade: setTradeState,
    images,
    setImages,
    handleChange,
    handleTypeChange,
    handleImageUpload,
    handleRemoveImage,
    handleSubmit,
    activeTab,
    setActiveTab,
    contractDetails,
    handleContractDetailsChange,
    pointValue,
    ideaDetails
  };
};

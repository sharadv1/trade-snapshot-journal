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
    positionSize: 0,
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
    grade: '',
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
  const { trade, setTrade, handleChange, handleTypeChange } = useTradeState(
    initialTrade || defaultTrade as Trade, // Type assertion here
    isEditing
  );
  
  const { images, setImages, handleImageUpload, handleRemoveImage } = useTradeImages(
    initialTrade?.images || []
  );
  
  const { handleSubmit } = useTradeSubmit(
    trade,
    images,
    contractDetails,
    isEditing,
    initialTrade
  );
  
  // Initialize from idea if ideaId is provided
  useEffect(() => {
    if (ideaId && !isEditing) {
      const idea = getIdeaById(ideaId);
      if (idea) {
        setIdeaDetails(idea);
        
        setTrade(prev => ({
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
  }, [ideaId, isEditing, setTrade, setImages]);
  
  // When stopLoss changes and initialStopLoss is not set, update initialStopLoss too
  useEffect(() => {
    if (trade.stopLoss && !trade.initialStopLoss && !isEditing) {
      setTrade(prev => ({
        ...prev,
        initialStopLoss: trade.stopLoss
      }));
    }
  }, [trade.stopLoss, isEditing, setTrade]);
  
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
  
  return {
    trade,
    setTrade,
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

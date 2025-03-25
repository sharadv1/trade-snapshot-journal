
import { useState, useEffect } from 'react';
import { Trade } from '@/types';
import { getTradeIdea } from '@/utils/tradeOperations';
import { getSymbolData } from '@/utils/symbolStorage';
import { useTradeSubmit } from './hooks/useTradeSubmit';
import { useTradeImages } from './hooks/useTradeImages';
import { useTradeState } from './hooks/useTradeState';

export function useTradeForm(initialTrade?: Trade, isEditing = false, ideaId?: string | null) {
  // Get initial trade state
  const {
    trade,
    contractDetails,
    setTrade,
    setContractDetails
  } = useTradeState(initialTrade, ideaId);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<string>('details');
  
  // Image handling
  const {
    images,
    handleImageUpload,
    handleRemoveImage
  } = useTradeImages(initialTrade?.images || []);
  
  // Symbol point value for futures
  const [pointValue, setPointValue] = useState<number | undefined>(
    initialTrade?.type === 'futures' 
      ? initialTrade.contractDetails?.tickValue
      : undefined
  );
  
  // Submit handler
  const { handleSubmit: submitHandler } = useTradeSubmit(
    trade,
    images,
    contractDetails,
    isEditing,
    initialTrade
  );
  
  // Update pointValue when symbol changes for futures
  useEffect(() => {
    if (trade.type === 'futures' && trade.symbol) {
      const symbolData = getSymbolData(trade.symbol);
      if (symbolData?.tickValue) {
        setPointValue(symbolData.tickValue);
      }
    }
  }, [trade.type, trade.symbol]);
  
  // Load idea data if ideaId is provided
  useEffect(() => {
    if (ideaId && !isEditing) {
      const idea = getTradeIdea(ideaId);
      if (idea) {
        setTrade(prevTrade => ({
          ...prevTrade,
          symbol: idea.symbol,
          direction: idea.direction || 'long',
          notes: idea.description || '',
          ideaId: ideaId
        }));
      }
    }
  }, [ideaId, isEditing, setTrade]);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setTrade({
        ...trade,
        [name]: value === '' ? '' : Number(value)
      });
    } else if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setTrade({
        ...trade,
        [name]: target.checked
      });
    } else {
      setTrade({
        ...trade,
        [name]: value
      });
    }
  };
  
  const handleTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newType = e.target.value as Trade['type'];
    
    setTrade({
      ...trade,
      type: newType
    });
    
    // Reset contract details if changing from futures to stock
    if (newType !== 'futures') {
      setContractDetails({});
    }
  };
  
  const handleContractDetailsChange = (details: any) => {
    setContractDetails(details);
  };
  
  const handleSubmit = (e: React.FormEvent, onSuccess?: (tradeId: string) => void) => {
    const { handleSubmit } = useTradeSubmit(
      trade,
      images,
      contractDetails,
      isEditing,
      initialTrade,
      onSuccess
    );
    
    return handleSubmit(e);
  };
  
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
    pointValue
  };
}

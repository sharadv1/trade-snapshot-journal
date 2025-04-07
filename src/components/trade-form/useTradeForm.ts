
import { useState, useEffect } from 'react';
import { Trade } from '@/types';
import { getTradeIdea } from '@/utils/tradeStorage';
import { getAllSymbols } from '@/utils/symbolStorage';
import { useTradeSubmit } from './hooks/useTradeSubmit';
import { useTradeImages } from './hooks/useTradeImages';

export function useTradeForm(initialTrade?: Trade, isEditing = false, ideaId?: string | null) {
  // Get initial trade state
  const [trade, setTrade] = useState<Partial<Trade>>(
    initialTrade || {
      account: 'default',
      type: 'futures', // Default to futures since that's what we have most symbols for
      direction: 'long',
      entryDate: new Date().toISOString().slice(0, 16),
      status: 'open'
    }
  );
  
  const [contractDetails, setContractDetails] = useState(
    initialTrade?.contractDetails || {}
  );
  
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
      // Get all symbols and find the matching one to get its details
      const allSymbols = getAllSymbols();
      const symbolData = allSymbols.find(s => s.symbol === trade.symbol);
      
      if (symbolData && contractDetails.tickValue) {
        setPointValue(contractDetails.tickValue);
      }
    }
  }, [trade.type, trade.symbol, contractDetails.tickValue]);
  
  // Load idea data if ideaId is provided
  useEffect(() => {
    if (ideaId && !isEditing) {
      const idea = getTradeIdea(ideaId);
      if (idea) {
        setTrade(prevTrade => ({
          ...prevTrade,
          symbol: idea.symbol,
          direction: (idea.direction as 'long' | 'short') || 'long',
          notes: idea.description || '',
          ideaId: ideaId || '',
          account: 'default', // Always set default account for new trades from ideas
          // If we have a known symbol type, set the trade type to match
          type: getSymbolType(idea.symbol) || prevTrade.type || 'futures'
        }));
      }
    }
  }, [ideaId, isEditing]);

  // Helper to get symbol type
  const getSymbolType = (symbol?: string): 'stock' | 'futures' | 'forex' | 'crypto' | 'options' | undefined => {
    if (!symbol) return undefined;
    
    const allSymbols = getAllSymbols();
    const foundSymbol = allSymbols.find(s => s.symbol === symbol);
    return foundSymbol?.type;
  };
  
  const handleChange = (
    field: keyof Trade,
    value: any
  ) => {
    setTrade(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleTypeChange = (
    type: Trade['type']
  ) => {
    setTrade(prev => ({
      ...prev,
      type,
      // Clear the symbol if changing type
      ...(prev.type !== type ? { symbol: '' } : {})
    }));
    
    // Reset contract details when changing from futures
    if (type !== 'futures') {
      setContractDetails({});
      setPointValue(undefined);
    }
  };
  
  const handleContractDetailsChange = (details: any) => {
    setContractDetails(details);
  };
  
  const handleSubmit = (e: React.FormEvent, onSuccess?: (tradeId: string) => void) => {
    e.preventDefault();
    return submitHandler(e, onSuccess);
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

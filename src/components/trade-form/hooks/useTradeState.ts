
import { useState, useEffect } from 'react';
import { Trade, FuturesContractDetails, COMMON_FUTURES_CONTRACTS } from '@/types';
import { getIdeaById } from '@/utils/ideaStorage';

export function useTradeState(initialTrade?: Trade, isEditing = false, ideaIdFromProps?: string | null) {
  const [trade, setTrade] = useState<Partial<Trade>>(
    initialTrade || {
      symbol: '',
      type: 'stock', // Changed from 'equity' to 'stock'
      direction: 'long',
      entryDate: new Date().toISOString().slice(0, 16),
      entryPrice: 0,
      quantity: 0,
      fees: 0,
      status: 'open',
      strategy: 'default-strategy', // Ensure strategy always has a default value
      images: [],
      tags: [],
      partialExits: [],
      pspTime: '',
      timeframe: undefined,
      ideaId: ideaIdFromProps || undefined
    }
  );

  const [contractDetails, setContractDetails] = useState<Partial<FuturesContractDetails>>(
    initialTrade?.contractDetails || {
      exchange: '',
      contractSize: 1,
      tickSize: 0.01,
      tickValue: 0.01
    }
  );

  // Handle pre-filling from trade idea
  useEffect(() => {
    if (!isEditing && ideaIdFromProps) {
      console.log('Loading idea data for ID:', ideaIdFromProps);
      const idea = getIdeaById(ideaIdFromProps);
      if (idea) {
        console.log('Idea found:', idea);
        setTrade(prev => ({
          ...prev,
          symbol: idea.symbol,
          ideaId: idea.id,
          direction: idea.direction || 'long',
          notes: prev.notes ? `${prev.notes}\n\nBased on trade idea: ${idea.description || 'No description'}` : `Based on trade idea: ${idea.description || 'No description'}`
        }));
      } else {
        console.log('No idea found for ID:', ideaIdFromProps);
      }
    }
  }, [ideaIdFromProps, isEditing]);

  // Update contract details when symbol changes for futures contracts
  useEffect(() => {
    if (trade.type === 'futures' && trade.symbol) {
      const contract = COMMON_FUTURES_CONTRACTS.find(c => c.symbol === trade.symbol);
      if (contract) {
        setContractDetails({
          exchange: contract.exchange,
          contractSize: 1,
          tickSize: contract.tickSize,
          tickValue: contract.tickSize * contract.pointValue
        });
      }
    }
  }, [trade.type, trade.symbol]);

  // Calculate point value for futures contracts
  const pointValue = trade.type === 'futures' && contractDetails.tickSize && contractDetails.tickValue
    ? contractDetails.tickValue / contractDetails.tickSize
    : 0;

  const handleChange = (field: keyof Trade, value: any) => {
    console.log(`Changing ${field} to:`, value);
    
    if (field === 'strategy' && value === 'custom' && !isEditing) {
      return;
    }

    setTrade(prev => ({ ...prev, [field]: value }));
  };

  const handleContractDetailsChange = (field: keyof FuturesContractDetails, value: any) => {
    setContractDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (type: Trade['type']) => {
    // Always use the normalized type, never directly compare with 'equity'
    const normalizedType = type === 'equity' ? 'stock' : type;
    handleChange('type', normalizedType as Trade['type']);
    
    if (normalizedType !== 'futures' && trade.type === 'futures') {
      handleChange('symbol', '');
    }
  };

  return {
    trade,
    setTrade,
    contractDetails,
    setContractDetails,
    pointValue,
    handleChange,
    handleContractDetailsChange,
    handleTypeChange
  };
}

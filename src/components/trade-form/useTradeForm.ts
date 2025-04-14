
import { useState, useEffect, useCallback } from 'react';
import { Trade, ContractDetails } from '@/types';
import { generateUUID } from '@/utils/generateUUID';

const DEFAULT_TRADE: Trade = {
  id: generateUUID(),
  symbol: '',
  direction: 'long',
  entryDate: new Date().toISOString(),
  entryPrice: 0,
  exitDate: '',
  exitPrice: 0,
  quantity: 0,
  status: 'open',
  type: 'stock',
  strategy: '',
  stopLoss: 0,
  takeProfit: 0,
  fees: 0,
  notes: '',
  images: [],
  riskRewardRatio: 0,
  account: '',
  grade: 'A',
  mistakes: [],
  timeframe: '',
  pspTime: '',
  ssmtQuarters: '',
  tags: [],
  ideaId: '',
  partialExits: [],
  contractDetails: {} as ContractDetails,
  maxFavorablePrice: 0,
  maxAdversePrice: 0,
  targetReached: false,
  targetReachedBeforeExit: false
};

// Changing to a named export to match the import in TradeForm.tsx
export const useTradeForm = (initialTrade: Trade = DEFAULT_TRADE) => {
  const [trade, setTrade] = useState<Trade>(initialTrade);

  useEffect(() => {
    setTrade(initialTrade);
  }, [initialTrade]);

  const setTradeState = useCallback((newState: Trade) => {
    setTrade(newState);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTrade(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Fix the error by ensuring correct type compatibility
  return {
    trade,
    setTradeState, // Renamed to match expectations
    handleChange,
  };
};

// Also export as default for backward compatibility
export default useTradeForm;

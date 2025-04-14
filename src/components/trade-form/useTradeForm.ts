
import { useState, useEffect, useCallback } from 'react';
import { Trade, ContractDetails, TradeType, TRADE_TYPES } from '@/types';
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

// Define a more comprehensive hook that provides all the necessary functionality
export const useTradeForm = (initialTrade: Trade = DEFAULT_TRADE, isEditing = false, ideaId?: string | null) => {
  const [trade, setTrade] = useState<Trade>(initialTrade);
  const [contractDetails, setContractDetails] = useState<any>(initialTrade.contractDetails || {});
  const [activeTab, setActiveTab] = useState<string>("details");
  const [images, setImages] = useState<string[]>(initialTrade?.images || []);
  const [pointValue, setPointValue] = useState<number>(0);

  useEffect(() => {
    setTrade(initialTrade);
    setImages(initialTrade?.images || []);
    setContractDetails(initialTrade?.contractDetails || {});
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

  const handleTypeChange = (type: TradeType) => { // Changed to accept TradeType only
    setTrade(prevState => ({
      ...prevState,
      type,
    }));
  };

  const handleContractDetailsChange = (details: any) => {
    setContractDetails(details);
    setTrade(prevTrade => ({
      ...prevTrade,
      contractDetails: details
    }));
  };

  const handleImageUpload = async (file: File): Promise<void> => {
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = (e) => {
        if (e.target?.result) {
          const newImages = [...images, e.target.result.toString()];
          setImages(newImages);
          setTrade(prevTrade => ({
            ...prevTrade,
            images: newImages
          }));
          resolve();
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setTrade(prevTrade => ({
      ...prevTrade,
      images: newImages
    }));
  };

  // Mock submit function for completeness
  const submitForm = (e: React.FormEvent, callback?: (tradeId: string) => void) => {
    e.preventDefault();
    // In a real implementation, this would save the trade
    if (callback) callback(trade.id);
    return true;
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
    handleSubmit: submitForm,
    pointValue,
    setTradeState,
  };
};

// Also export as default for backward compatibility
export default useTradeForm;

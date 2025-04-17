
import { useState, useEffect, useCallback } from 'react';
import { Trade, ContractDetails, TradeType, TRADE_TYPES } from '@/types';
import { generateUUID } from '@/utils/generateUUID';
import { normalizeTrade } from '@/utils/storage/tradeValidation';
import { toast } from '@/utils/toast';
import { addTrade, updateTrade } from '@/utils/tradeStorage';

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
  initialStopLoss: 0,
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

  // Actual submit function that adds/updates trade
  const submitForm = (e: React.FormEvent, callback?: (tradeId: string) => void) => {
    e.preventDefault();
    
    try {
      // Prepare trade data - copy from current stopLoss to initialStopLoss if needed
      let tradeToSave = { ...trade };
      
      // If initialStopLoss is not set but stopLoss is set, copy stopLoss to initialStopLoss
      if ((!tradeToSave.initialStopLoss || tradeToSave.initialStopLoss === 0) && 
          (tradeToSave.stopLoss && tradeToSave.stopLoss !== 0)) {
        tradeToSave.initialStopLoss = tradeToSave.stopLoss;
      }
      
      // If stopLoss is not set but initialStopLoss is set, copy initialStopLoss to stopLoss
      if ((!tradeToSave.stopLoss || tradeToSave.stopLoss === 0) && 
          (tradeToSave.initialStopLoss && tradeToSave.initialStopLoss !== 0)) {
        tradeToSave.stopLoss = tradeToSave.initialStopLoss;
      }
      
      const normalizedTrade = normalizeTrade(tradeToSave);
      
      if (ideaId) {
        normalizedTrade.ideaId = ideaId;
      }
      
      // Save or update the trade
      if (isEditing) {
        console.log('Updating trade:', normalizedTrade.id);
        updateTrade(normalizedTrade);
      } else {
        console.log('Adding new trade with ID:', normalizedTrade.id);
        addTrade(normalizedTrade);
      }
      
      // Trigger an event to refresh trade lists
      window.dispatchEvent(new Event('trades-updated'));
      
      // Execute callback if provided
      if (callback) {
        callback(normalizedTrade.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error submitting trade form:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'add'} trade`);
      return false;
    }
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

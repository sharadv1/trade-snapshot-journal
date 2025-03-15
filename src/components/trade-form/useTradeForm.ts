
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trade, FuturesContractDetails, COMMON_FUTURES_CONTRACTS } from '@/types';
import { addTrade, updateTrade } from '@/utils/tradeStorage';
import { toast } from '@/utils/toast';

export function useTradeForm(initialTrade?: Trade, isEditing = false) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [images, setImages] = useState<string[]>(initialTrade?.images || []);

  const [trade, setTrade] = useState<Partial<Trade>>(
    initialTrade || {
      symbol: '',
      type: 'equity',
      direction: 'long',
      entryDate: new Date().toISOString().slice(0, 16),
      entryPrice: 0,
      quantity: 0,
      fees: 0,
      status: 'open',
      images: [],
      tags: [],
      partialExits: []
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

  // Calculate point value for futures contracts
  const pointValue = trade.type === 'futures' && contractDetails.tickSize && contractDetails.tickValue
    ? contractDetails.tickValue / contractDetails.tickSize
    : 0;

  // Update contract details when a futures symbol is selected
  useEffect(() => {
    if (trade.type === 'futures' && trade.symbol) {
      const contract = COMMON_FUTURES_CONTRACTS.find(c => c.symbol === trade.symbol);
      if (contract) {
        setContractDetails({
          exchange: contract.exchange,
          contractSize: 1,
          tickSize: contract.tickSize,
          tickValue: contract.tickSize * contract.pointValue // Calculate tickValue from tickSize and pointValue
        });
      }
    }
  }, [trade.type, trade.symbol]);

  const handleChange = (field: keyof Trade, value: any) => {
    // If changing strategy, ensure we don't set to "custom" on a new trade
    if (field === 'strategy' && value === 'custom' && !isEditing) {
      toast.error("Custom strategies are not allowed for new trades");
      return;
    }

    setTrade(prev => ({ ...prev, [field]: value }));
  };

  const handleContractDetailsChange = (field: keyof FuturesContractDetails, value: any) => {
    setContractDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (base64Image: string) => {
    const newImages = [...images, base64Image];
    setImages(newImages);
    handleChange('images', newImages);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    handleChange('images', newImages);
  };

  const handleTypeChange = (type: 'equity' | 'futures' | 'option') => {
    handleChange('type', type);
    // Reset symbol if changing away from futures to avoid invalid symbols
    if (type !== 'futures' && trade.type === 'futures') {
      handleChange('symbol', '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trade.symbol || !trade.entryPrice || !trade.quantity) {
      toast.error("Please fill in all required fields");
      return false;
    }
    
    try {
      const tradeToSave = {
        ...trade,
        images,
        contractDetails: trade.type === 'futures' ? contractDetails : undefined
      };
      
      if (isEditing && initialTrade) {
        // Ensure we preserve the partial exits if they exist
        const updatedTrade = { 
          ...initialTrade, 
          ...tradeToSave,
          partialExits: initialTrade.partialExits || [] 
        } as Trade;
        updateTrade(updatedTrade);
        toast.success("Trade updated successfully");
      } else {
        const newTrade = {
          ...tradeToSave,
          id: crypto.randomUUID(),
          partialExits: []
        } as Trade;
        addTrade(newTrade);
        toast.success("Trade added successfully");
        navigate('/');
      }
      
      return true;
    } catch (error) {
      console.error("Error saving trade:", error);
      toast.error("Failed to save trade");
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
    handleSubmit,
    pointValue,
  };
}

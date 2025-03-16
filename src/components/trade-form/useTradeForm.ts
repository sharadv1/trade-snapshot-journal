
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trade, FuturesContractDetails, COMMON_FUTURES_CONTRACTS } from '@/types';
import { addTrade, updateTrade } from '@/utils/tradeStorage';
import { getIdeaById } from '@/utils/ideaStorage';
import { toast } from '@/utils/toast';

export function useTradeForm(initialTrade?: Trade, isEditing = false) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('details');
  const [images, setImages] = useState<string[]>(initialTrade?.images || []);

  // Parse query params for ideaId
  const searchParams = new URLSearchParams(location.search);
  const ideaIdFromUrl = searchParams.get('ideaId');
  
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
      partialExits: [],
      pspTime: '',
      timeframe: undefined,
      ideaId: ideaIdFromUrl || undefined
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
    if (!isEditing && ideaIdFromUrl) {
      const idea = getIdeaById(ideaIdFromUrl);
      if (idea) {
        setTrade(prev => ({
          ...prev,
          symbol: idea.symbol,
          ideaId: idea.id,
          notes: prev.notes ? `${prev.notes}\n\nBased on trade idea: ${idea.description}` : `Based on trade idea: ${idea.description}`
        }));
      }
    }
  }, [ideaIdFromUrl, isEditing]);

  const pointValue = trade.type === 'futures' && contractDetails.tickSize && contractDetails.tickValue
    ? contractDetails.tickValue / contractDetails.tickSize
    : 0;

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

  const handleChange = (field: keyof Trade, value: any) => {
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

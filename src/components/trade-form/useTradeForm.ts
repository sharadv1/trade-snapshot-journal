
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trade, FuturesContractDetails, COMMON_FUTURES_CONTRACTS } from '@/types';
import { addTrade, updateTrade } from '@/utils/tradeStorage';
import { getIdeaById, markIdeaAsTaken } from '@/utils/ideaStorage';
import { toast } from '@/utils/toast';

export function useTradeForm(initialTrade?: Trade, isEditing = false) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('details');
  const [images, setImages] = useState<string[]>(initialTrade?.images || []);

  // Parse query params for ideaId
  const searchParams = new URLSearchParams(location.search);
  const ideaIdFromUrl = searchParams.get('ideaId');
  
  console.log('useTradeForm initializing with ideaId:', ideaIdFromUrl);
  
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
      strategy: 'default-strategy', // Ensure strategy always has a default value
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
      console.log('Loading idea data for ID:', ideaIdFromUrl);
      const idea = getIdeaById(ideaIdFromUrl);
      if (idea) {
        console.log('Idea found:', idea);
        setTrade(prev => ({
          ...prev,
          symbol: idea.symbol,
          ideaId: idea.id,
          direction: idea.direction || 'long',
          notes: prev.notes ? `${prev.notes}\n\nBased on trade idea: ${idea.description}` : `Based on trade idea: ${idea.description}`
        }));
      } else {
        console.log('No idea found for ID:', ideaIdFromUrl);
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
    console.log(`Changing ${field} to:`, value);
    
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
    console.log('Trade form submitted with data:', trade);
    
    if (!trade.symbol || !trade.entryPrice || !trade.quantity) {
      toast.error("Please fill in all required fields");
      return false;
    }
    
    try {
      // Ensure strategy has a default value if empty
      const finalStrategy = trade.strategy || 'default-strategy';
      
      const tradeToSave = {
        ...trade,
        strategy: finalStrategy,
        images,
        contractDetails: trade.type === 'futures' ? contractDetails : undefined
      };
      
      console.log('Processing trade data before save:', tradeToSave);
      
      // Update idea status if an idea is associated with this trade
      if (trade.ideaId) {
        markIdeaAsTaken(trade.ideaId);
      }
      
      if (isEditing && initialTrade) {
        const updatedTrade = { 
          ...initialTrade, 
          ...tradeToSave,
          partialExits: initialTrade.partialExits || [] 
        } as Trade;
        
        console.log('Updating existing trade:', updatedTrade);
        updateTrade(updatedTrade);
        toast.success("Trade updated successfully");
      } else {
        const newTrade = {
          ...tradeToSave,
          id: crypto.randomUUID(),
          partialExits: []
        } as Trade;
        
        console.log('Adding new trade:', newTrade);
        addTrade(newTrade);
        toast.success("Trade added successfully");
        navigate('/');
      }
      
      return true;
    } catch (error) {
      console.error("Error saving trade:", error);
      toast.error("Failed to save trade: " + (error instanceof Error ? error.message : "Unknown error"));
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

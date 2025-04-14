import { useState, useEffect } from 'react';
import { Trade } from '@/types';

interface UseTradeStateProps {
  initialTrade?: Trade;
}

export const useTradeState = (props: UseTradeStateProps = {}) => {
  const { initialTrade } = props;
  
  const [tradeState, setTradeState] = useState<Trade>({
    id: initialTrade?.id || '',
    symbol: initialTrade?.symbol || '',
    entryDate: initialTrade?.entryDate || '',
    exitDate: initialTrade?.exitDate || '',
    entryPrice: initialTrade?.entryPrice || 0,
    exitPrice: initialTrade?.exitPrice || 0,
    quantity: initialTrade?.quantity || 0,
    stopLoss: initialTrade?.stopLoss || 0,
    initialStopLoss: initialTrade?.initialStopLoss || 0,
    takeProfit: initialTrade?.takeProfit || 0,
    direction: initialTrade?.direction || 'long',
    type: initialTrade?.type || 'stock',
    status: initialTrade?.status || 'open',
    notes: initialTrade?.notes || '',
    grade: initialTrade?.grade,
    timeframe: initialTrade?.timeframe || '',
    fees: initialTrade?.fees || 0,
    strategy: initialTrade?.strategy || '',
    images: initialTrade?.images || [],
    contractDetails: initialTrade?.contractDetails || {
      exchange: '',
      tickSize: 0,
      contractSize: 1,
      tickValue: 0
    },
    partialExits: initialTrade?.partialExits || [],
    mistakes: initialTrade?.mistakes || [],
    account: initialTrade?.account || '',
    pspTime: initialTrade?.pspTime || '',
    ssmtQuarters: initialTrade?.ssmtQuarters || '',
    maxFavorablePrice: initialTrade?.maxFavorablePrice || 0,
    maxAdversePrice: initialTrade?.maxAdversePrice || 0,
    targetReached: initialTrade?.targetReached || false,
    targetReachedBeforeExit: initialTrade?.targetReachedBeforeExit || false,
    ideaId: initialTrade?.ideaId || '',
    tags: initialTrade?.tags || [],
    riskRewardRatio: initialTrade?.riskRewardRatio || 0,
  });

  useEffect(() => {
    // Calculate risk reward ratio
    if (tradeState.takeProfit && tradeState.initialStopLoss) {
      const takeProfit = typeof tradeState.takeProfit === 'string' ? parseFloat(tradeState.takeProfit) : tradeState.takeProfit;
      const entryPrice = typeof tradeState.entryPrice === 'string' ? parseFloat(tradeState.entryPrice.toString()) : tradeState.entryPrice;
      const initialStopLoss = typeof tradeState.initialStopLoss === 'string' ? parseFloat(tradeState.initialStopLoss.toString()) : tradeState.initialStopLoss;
      
      // Only proceed if all values are valid numbers
      if (!isNaN(takeProfit) && !isNaN(entryPrice) && !isNaN(initialStopLoss)) {
        const potentialProfit = Math.abs(takeProfit - entryPrice);
        const risk = Math.abs(entryPrice - initialStopLoss);
        
        if (risk > 0) {
          const riskRewardRatio = (potentialProfit / risk).toFixed(2);
          setTradeState(prev => ({
            ...prev,
            riskRewardRatio: parseFloat(riskRewardRatio)
          }));
        }
      }
    }
  }, [tradeState.takeProfit, tradeState.initialStopLoss, tradeState.entryPrice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTradeState(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  return {
    trade: tradeState,
    setTradeState,
    handleChange
  };
};

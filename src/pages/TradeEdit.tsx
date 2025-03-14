
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TradeForm } from '@/components/TradeForm';
import { Trade } from '@/types';
import { getTradeById } from '@/utils/tradeStorage';
import { toast } from '@/utils/toast';

export default function TradeEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  
  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }
    
    const tradeData = getTradeById(id);
    if (tradeData) {
      setTrade(tradeData);
    } else {
      toast.error('Trade not found');
      navigate('/');
    }
  }, [id, navigate]);
  
  if (!trade) {
    return (
      <div className="py-8 text-center">
        <p>Loading trade details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Edit Trade: {trade.symbol}
      </h1>
      <TradeForm initialTrade={trade} isEditing={true} />
    </div>
  );
}

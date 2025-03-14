
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TradeForm } from '@/components/TradeForm';
import { ExitTradeForm } from '@/components/ExitTradeForm';
import { Trade } from '@/types';
import { getTradeById } from '@/utils/tradeStorage';
import { toast } from '@/utils/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PartialExitsList } from '@/components/PartialExitsList';

export default function TradeEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('edit');
  
  const loadTradeData = () => {
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
    setIsLoading(false);
  };
  
  useEffect(() => {
    loadTradeData();
  }, [id, navigate]);
  
  const handleTradeUpdate = () => {
    loadTradeData();
  };
  
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p>Loading trade details...</p>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="py-8 text-center">
        <p>Trade not found</p>
      </div>
    );
  }

  // Calculate total quantity exited from partial exits
  const totalExitedQuantity = (trade.partialExits || []).reduce(
    (total, exit) => total + exit.quantity, 
    0
  );
  
  // Calculate remaining quantity
  const remainingQuantity = trade.quantity - totalExitedQuantity;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Manage Trade: {trade.symbol} {trade.type === 'futures' ? '(Futures)' : ''}
      </h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="edit">Edit Details</TabsTrigger>
          <TabsTrigger value="exit" disabled={trade.status === 'closed' && remainingQuantity === 0}>
            Exit Position
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="mt-6">
          <TradeForm initialTrade={trade} isEditing={true} />
        </TabsContent>
        
        <TabsContent value="exit" className="mt-6">
          <ExitTradeForm 
            trade={trade} 
            onClose={() => setActiveTab('edit')}
            onUpdate={handleTradeUpdate}
          />
        </TabsContent>
      </Tabs>
      
      {trade.partialExits && trade.partialExits.length > 0 && (
        <div className="mt-8">
          <PartialExitsList trade={trade} />
        </div>
      )}
    </div>
  );
}

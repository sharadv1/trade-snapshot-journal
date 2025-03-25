
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TradeForm } from '@/components/TradeForm';
import { ExitTradeForm } from '@/components/ExitTradeForm';
import { Trade } from '@/types';
import { getTradeById } from '@/utils/storage/tradeOperations';
import { toast } from '@/utils/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PartialExitsList } from '@/components/PartialExitsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TradeEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('edit');
  
  const loadTradeData = () => {
    if (!id) {
      console.error('No trade ID provided in URL');
      toast.error('No trade ID found');
      navigate('/');
      return;
    }
    
    console.log('Loading trade data for ID:', id);
    const tradeData = getTradeById(id);
    if (tradeData) {
      setTrade(tradeData);
    } else {
      console.error('Trade not found with ID:', id);
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

  const totalExitedQuantity = (trade.partialExits || []).reduce(
    (total, exit) => total + exit.quantity, 
    0
  );
  
  const remainingQuantity = trade.quantity - totalExitedQuantity;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Manage Trade: {trade.symbol} {trade.type === 'futures' ? '(Futures)' : ''}
      </h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Edit Trade</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="edit">Edit Details</TabsTrigger>
              <TabsTrigger value="exit" disabled={totalExitedQuantity === trade.quantity}>
                Exit Position
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="pt-2">
              <TradeForm initialTrade={trade} isEditing={true} />
            </TabsContent>
            
            <TabsContent value="exit" className="pt-2">
              <ExitTradeForm 
                trade={trade} 
                onClose={() => setActiveTab('edit')}
                onUpdate={handleTradeUpdate}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {trade.partialExits && trade.partialExits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Partial Exits</CardTitle>
          </CardHeader>
          <CardContent>
            <PartialExitsList 
              trade={trade} 
              onUpdate={handleTradeUpdate}
              allowEditing={true}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

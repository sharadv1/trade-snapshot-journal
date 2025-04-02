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
        Manage Trade: {trade.symbol}
      </h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="edit">Edit Details</TabsTrigger>
          <TabsTrigger value="exit" disabled={trade.status === 'closed'}>
            {trade.status === 'closed' ? 'Trade Closed' : 'Exit Position'}
          </TabsTrigger>
          <TabsTrigger value="partials">Partial Exits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-lg">Update Trade Details</CardTitle>
            </CardHeader>
            <CardContent>
              <TradeForm 
                initialTrade={trade} 
                isEditing={true}
                onSuccess={handleTradeUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="exit">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-lg">Exit Position</CardTitle>
            </CardHeader>
            <CardContent>
              <ExitTradeForm 
                trade={trade} 
                onClose={() => {}} 
                onUpdate={handleTradeUpdate}
                remainingQuantity={remainingQuantity}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="partials">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-lg">Partial Exits</CardTitle>
            </CardHeader>
            <CardContent>
              <PartialExitsList 
                trade={trade}
                onUpdate={handleTradeUpdate}
                allowEditing={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

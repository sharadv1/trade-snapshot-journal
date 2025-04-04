
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TradeForm } from '@/components/TradeForm';
import { ExitTradeForm } from '@/components/ExitTradeForm';
import { Trade } from '@/types';
import { getTradeById } from '@/utils/storage/tradeOperations';
import { toast } from '@/utils/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { isTradeFullyExited, getRemainingQuantity } from '@/utils/calculations/tradeStatus';

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
  }, [id]);
  
  useEffect(() => {
    // Listen for storage events to refresh trade data
    const handleStorageChange = () => {
      loadTradeData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('trade-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('trade-updated', handleStorageChange);
    };
  }, [id]);
  
  const handleTradeUpdate = () => {
    loadTradeData();
    toast.success("Trade data refreshed");
  };

  const handleCloseModal = () => {
    // Navigate back to the trade detail page after closing or completing operations
    console.log('ExitTradeForm close callback called, navigating to trade detail');
    navigate(`/trade/${id}`);
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

  const isClosed = trade.status === 'closed';
  const isFullyExited = isTradeFullyExited(trade);
  const remainingQuantity = getRemainingQuantity(trade);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Manage Trade: {trade.symbol}
        </h1>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="edit">Edit Details</TabsTrigger>
          <TabsTrigger value="exit">
            {isClosed ? 'Exit Info' : 'Exit Position'}
          </TabsTrigger>
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
              <CardTitle className="text-lg">
                {isClosed ? 'Exit Information' : 'Exit Position'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExitTradeForm 
                trade={trade} 
                onClose={handleCloseModal} 
                onUpdate={handleTradeUpdate}
                remainingQuantity={remainingQuantity}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

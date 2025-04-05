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
import { DeleteTradeButton } from '@/components/trade-exit/DeleteTradeButton';

export default function TradeEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('edit');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
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
      console.log('Trade loaded successfully:', tradeData.id, 'Status:', tradeData.status);
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
    const handleStorageChange = () => {
      console.log('Storage event detected, reloading trade data');
      loadTradeData();
    };
    
    const handleTradeUpdated = () => {
      console.log('Trade-updated event detected, reloading trade data');
      loadTradeData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('trade-updated', handleTradeUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('trade-updated', handleTradeUpdated);
    };
  }, [id]);
  
  const handleTradeUpdate = (tradeId?: string) => {
    console.log('handleTradeUpdate called, refreshing trade data for ID:', tradeId || id);
    loadTradeData();
    setUpdateSuccess(true);
    
    // Only navigate if we're in the edit tab, not the exit tab
    if (activeTab === 'edit') {
      // Navigate back to the trade detail view after a short delay
      setTimeout(() => {
        if (id) {
          navigate(`/trade/${id}`);
        }
      }, 500);
    }
  };

  const handleCloseModal = () => {
    console.log('ExitTradeForm close callback called, refreshing trade data');
    loadTradeData();
    
    // No automatic navigation - we'll stay on the current page
    // This ensures users stay on the exit page after recording an exit
    // If the user wants to navigate away, they'll use the Back button
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

  console.log('Trade edit rendering with status:', trade.status, 'Remaining quantity:', remainingQuantity, 'Is fully exited:', isFullyExited);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Manage Trade: {trade.symbol}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <DeleteTradeButton trade={trade} size="sm" />
        </div>
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

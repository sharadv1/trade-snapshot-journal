
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trade } from '@/types';
import { TradeDetailsForm } from './trade-form/TradeDetailsForm';
import { RiskParametersForm } from './trade-form/RiskParametersForm';
import { NotesAndImagesForm } from './trade-form/NotesAndImagesForm';
import { useTradeForm } from './trade-form/useTradeForm';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from '@/utils/toast';

interface TradeFormProps {
  initialTrade?: Trade;
  isEditing?: boolean;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  ideaId?: string | null;
}

export function TradeForm({ initialTrade, isEditing = false, onSuccess, onError, ideaId }: TradeFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const ideaIdFromProps = ideaId || searchParams.get('ideaId');
  
  console.log('TradeForm rendering. Idea ID from props or URL:', ideaIdFromProps);
  
  const {
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
  } = useTradeForm(initialTrade, isEditing, ideaIdFromProps);

  useEffect(() => {
    // Validate essential components
    if (!trade) {
      console.error('Trade object is undefined or null');
      toast.error('There was an error loading the trade form');
      return;
    }
  }, [trade]);

  console.log('Current trade state:', {
    symbol: trade.symbol,
    direction: trade.direction,
    strategy: trade.strategy,
    ideaId: trade.ideaId
  });

  const handleCancel = () => {
    // If we came from the ideas page (has ideaId), go back to ideas
    if (ideaIdFromProps) {
      navigate('/ideas');
      return;
    }
    
    // If editing, go back to trade detail
    if (isEditing && initialTrade) {
      navigate(`/trade/${initialTrade.id}`);
      return;
    }
    
    // Default: go to dashboard
    navigate('/');
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting trade form with data:', trade);
    
    try {
      const success = handleSubmit(e);
      
      if (success) {
        // Call the onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        } else if (isEditing && initialTrade) {
          // If this is an edit and submission was successful, navigate to the trade detail page
          navigate(`/trade/${initialTrade.id}`);
        } else {
          // Default success behavior
          toast.success('Trade saved successfully!');
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      // Call the onError callback if provided
      if (onError) {
        onError(error);
      } else {
        toast.error('Failed to submit trade form');
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="animate-scale-in" id="trade-form" name="trade-form">
      <Card className="shadow-subtle border">
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Trade" : "New Trade"}</CardTitle>
          <CardDescription>
            {isEditing 
              ? "Update the details of your existing trade" 
              : ideaIdFromProps 
                ? "Create a trade based on your idea" 
                : "Enter the details of your new trade"
            }
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="details">Trade Details</TabsTrigger>
              <TabsTrigger value="risk">Risk Parameters</TabsTrigger>
              <TabsTrigger value="notes">Notes & Images</TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent className="pt-6">
            <TabsContent value="details" className="space-y-4 mt-0">
              <TradeDetailsForm 
                trade={trade}
                handleChange={handleChange}
                handleTypeChange={handleTypeChange}
                contractDetails={contractDetails}
                pointValue={pointValue}
              />
            </TabsContent>
            
            <TabsContent value="risk" className="space-y-4 mt-0">
              <RiskParametersForm 
                trade={trade}
                handleChange={handleChange}
              />
            </TabsContent>
            
            <TabsContent value="notes" className="space-y-4 mt-0">
              <NotesAndImagesForm 
                trade={trade}
                handleChange={handleChange}
                images={images}
                onImageUpload={handleImageUpload}
                onImageRemove={handleRemoveImage}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
        
        <CardFooter className="flex justify-between border-t pt-6">
          <Button 
            variant="outline" 
            type="button" 
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button type="submit" form="trade-form">
            {isEditing ? "Update Trade" : "Save Trade"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

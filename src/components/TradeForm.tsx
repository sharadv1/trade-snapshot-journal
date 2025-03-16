
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trade } from '@/types';
import { TradeDetailsForm } from './trade-form/TradeDetailsForm';
import { RiskParametersForm } from './trade-form/RiskParametersForm';
import { NotesAndImagesForm } from './trade-form/NotesAndImagesForm';
import { useTradeForm } from './trade-form/useTradeForm';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface TradeFormProps {
  initialTrade?: Trade;
  isEditing?: boolean;
}

export function TradeForm({ initialTrade, isEditing = false }: TradeFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ideaIdFromUrl = searchParams.get('ideaId');
  
  console.log('TradeForm rendering. Idea ID from URL:', ideaIdFromUrl);
  
  const {
    trade,
    contractDetails,
    activeTab,
    setActiveTab,
    images,
    handleChange,
    handleTypeChange,
    handleImageUpload,
    handleRemoveImage,
    handleSubmit,
    pointValue,
  } = useTradeForm(initialTrade, isEditing);

  console.log('Current trade state:', {
    symbol: trade.symbol,
    direction: trade.direction,
    strategy: trade.strategy,
    ideaId: trade.ideaId
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting trade form');
    const success = handleSubmit(e);
    
    // If this is an edit and submission was successful, navigate to the trade detail page
    if (success && isEditing && initialTrade) {
      navigate(`/trade/${initialTrade.id}`);
      return;
    }
    
    // For new trades or if submission failed, navigate as determined by the form handler
  };

  return (
    <form onSubmit={onSubmit} className="animate-scale-in">
      <Card className="shadow-subtle border">
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Trade" : "New Trade"}</CardTitle>
          <CardDescription>
            {isEditing 
              ? "Update the details of your existing trade" 
              : ideaIdFromUrl 
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
            onClick={() => isEditing && initialTrade 
              ? navigate(`/trade/${initialTrade.id}`) 
              : navigate('/')
            }
          >
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? "Update Trade" : "Save Trade"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

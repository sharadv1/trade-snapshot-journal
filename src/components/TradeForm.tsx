
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trade } from '@/types';
import { TradeDetailsForm } from './trade-form/TradeDetailsForm';
import { NotesAndImagesForm } from './trade-form/NotesAndImagesForm';
import { useTradeForm } from './trade-form/useTradeForm';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from '@/utils/toast';
import { AlertCircle } from 'lucide-react';
import { MaxRiskField } from './trade-form/MaxRiskField';
import { Label } from '@/components/ui/label';

interface TradeFormProps {
  initialTrade?: Trade;
  isEditing?: boolean;
  onSuccess?: (tradeId: string) => void;
  onError?: (error: unknown) => void;
  ideaId?: string | null;
}

export function TradeForm({ initialTrade, isEditing = false, onSuccess, onError, ideaId }: TradeFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ideaIdFromProps = ideaId || searchParams.get('ideaId');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maxRisk, setMaxRisk] = useState<number | undefined>(undefined);
  
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
    handleSubmit: submitForm,
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

  useEffect(() => {
    // Clear validation errors when user changes tab
    setValidationErrors([]);
  }, [activeTab]);

  console.log('Current trade state:', {
    symbol: trade.symbol,
    direction: trade.direction,
    strategy: trade.strategy,
    ideaId: trade.ideaId || 'none'
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

  const handleFormSuccess = (tradeId: string) => {
    // If onSuccess prop is provided, call it
    if (onSuccess) {
      onSuccess(tradeId);
    } else {
      // Otherwise, navigate to the trade detail page
      navigate(`/trade/${tradeId}`);
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!trade.symbol) errors.push('Symbol is required');
    if (!trade.entryPrice) errors.push('Entry price is required');
    if (!trade.quantity) errors.push('Quantity is required');
    if (!trade.entryDate) errors.push('Entry date is required');
    if (!trade.stopLoss) errors.push('Stop loss is required'); // Added stop loss as required
    
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      // Always switch to details tab on errors since all required fields are now there
      setActiveTab('details');
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting trade form with data:', trade);
    
    setIsSubmitting(true);
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const success = submitForm(e, handleFormSuccess);
      
      if (success) {
        // Dispatch a storage event to notify other components to refresh
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      // Call the onError callback if provided
      if (onError) {
        onError(error);
      } else {
        toast.error('Failed to submit trade form');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full" id="trade-form" name="trade-form">
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{isEditing ? "Edit Trade Details" : "New Trade"}</CardTitle>
          <CardDescription>
            {isEditing 
              ? "Update the details of your existing trade" 
              : ideaIdFromProps 
                ? "Create a trade based on your idea" 
                : "Enter the details of your new trade"
            }
          </CardDescription>

          {/* Max Risk Selection */}
          <div className="mt-4 space-y-2">
            <Label htmlFor="maxRisk">Max Risk Per Trade</Label>
            <MaxRiskField
              value={maxRisk}
              onChange={setMaxRisk}
            />
          </div>
        </CardHeader>
        
        {validationErrors.length > 0 && (
          <div className="px-6 pb-2">
            <div className="bg-destructive/15 text-destructive rounded-md p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">Please correct the following errors:</p>
              </div>
              <ul className="mt-2 ml-6 text-sm list-disc">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="details">Trade Details</TabsTrigger>
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
                maxRisk={maxRisk}
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? 'Saving...' 
              : isEditing 
                ? "Update Trade" 
                : "Save Trade"
            }
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

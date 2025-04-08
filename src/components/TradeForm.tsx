
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trade } from '@/types';
import { TradeDetailsForm } from './trade-form/TradeDetailsForm';
import { NotesAndImagesForm } from './trade-form/NotesAndImagesForm';
import { RiskParametersForm } from './trade-form/RiskParametersForm';
import { useTradeForm } from './trade-form/useTradeForm';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from '@/utils/toast';
import { AlertCircle, Check } from 'lucide-react';
import { MaxRiskField } from './trade-form/MaxRiskField';
import { Label } from '@/components/ui/label';
import { getCurrentMaxRisk } from '@/utils/maxRiskStorage';

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
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  useEffect(() => {
    const storedMaxRisk = getCurrentMaxRisk();
    if (storedMaxRisk !== null) {
      setMaxRisk(storedMaxRisk);
    }
  }, []);
  
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
    if (!trade) {
      console.error('Trade object is undefined or null');
      toast.error('There was an error loading the trade form');
      return;
    }
  }, [trade]);

  useEffect(() => {
    setValidationErrors([]);
  }, [activeTab]);

  console.log('Current trade state:', {
    symbol: trade.symbol,
    direction: trade.direction,
    strategy: trade.strategy,
    ideaId: trade.ideaId || 'none'
  });

  const handleCancel = () => {
    if (ideaIdFromProps) {
      navigate('/ideas');
      return;
    }
    
    if (isEditing && initialTrade) {
      navigate(`/trade/${initialTrade.id}`);
      return;
    }
    
    navigate('/');
  };

  const handleFormSuccess = (tradeId: string) => {
    setUpdateSuccess(true);
    toast.success(isEditing ? "Trade updated successfully!" : "Trade created successfully!");
    
    // Reset success state after a delay
    setTimeout(() => {
      setUpdateSuccess(false);
    }, 3000);
    
    // Add a small delay before navigation to ensure the toast is visible
    setTimeout(() => {
      if (onSuccess) {
        onSuccess(tradeId);
      } else {
        navigate(`/trade/${tradeId}`);
      }
    }, 500);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!trade.symbol) errors.push('Symbol is required');
    if (!trade.entryPrice) errors.push('Entry price is required');
    if (!trade.quantity) errors.push('Quantity is required');
    if (!trade.entryDate) errors.push('Entry date is required');
    if (!trade.stopLoss) errors.push('Stop loss is required');
    
    setValidationErrors(errors);
    
    if (errors.length > 0) {
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
        window.dispatchEvent(new Event('storage'));
        setUpdateSuccess(true);
        
        // Reset success state after a delay
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      if (onError) {
        onError(error);
      } else {
        toast.error('Failed to submit trade form');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUploadAdapter = (files: FileList) => {
    if (files.length > 0) {
      return handleImageUpload(files[0]);
    }
  };

  const handleRemoveImageAdapter = (url: string) => {
    const index = images.findIndex(img => img === url);
    if (index !== -1) {
      handleRemoveImage(index);
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
          
          <div className="mt-4 space-y-2">
            <Label htmlFor="maxRisk">Max Risk Per Trade</Label>
            <MaxRiskField
              value={maxRisk}
              onChange={setMaxRisk}
              isReadOnly={true}
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
            <TabsContent value="details" className="space-y-4 mt-0 w-full">
              <TradeDetailsForm 
                trade={trade}
                onTradeChange={handleChange}
                onTradeTypeChange={handleTypeChange}
                contractDetails={contractDetails}
                onContractDetailsChange={handleContractDetailsChange}
                pointValue={pointValue}
                maxRisk={maxRisk}
                disableEdits={false}
              />
              
              <div className="mt-8 pt-4 border-t">
                <RiskParametersForm 
                  trade={trade}
                  handleChange={handleChange}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="notes" className="space-y-4 mt-0 w-full">
              <NotesAndImagesForm 
                trade={trade as Trade}  
                handleChange={handleChange}
                images={images}
                onImageUpload={handleImageUploadAdapter}
                onImageRemove={handleRemoveImageAdapter}
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
          <div className="flex items-center gap-3">
            {updateSuccess && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
                <Check className="h-4 w-4" />
                <span>Updated successfully!</span>
              </div>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? 'Saving...' 
                : isEditing 
                  ? "Update Trade" 
                  : "Save Trade"
              }
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}

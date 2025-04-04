
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash } from 'lucide-react';
import { toast } from '@/utils/toast';
import { getMaxRiskValues, saveMaxRiskValues, getCurrentMaxRisk, setCurrentMaxRisk } from '@/utils/maxRiskStorage';
import { getMaxLossValues, saveMaxLossValues, getCurrentMaxLoss, setCurrentMaxLoss } from '@/utils/maxLossStorage';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Configs() {
  const [maxRiskValues, setMaxRiskValues] = useState<number[]>([]);
  const [newMaxRiskValue, setNewMaxRiskValue] = useState('');
  const [selectedMaxRisk, setSelectedMaxRisk] = useState<number | null>(null);
  
  const [maxLossValues, setMaxLossValues] = useState<number[]>([]);
  const [newMaxLossValue, setNewMaxLossValue] = useState('');
  const [selectedMaxLoss, setSelectedMaxLoss] = useState<number | null>(null);

  useEffect(() => {
    // Load max risk values
    const loadedRiskValues = getMaxRiskValues();
    setMaxRiskValues(loadedRiskValues);
    
    // Load current max risk setting
    const currentMaxRisk = getCurrentMaxRisk();
    setSelectedMaxRisk(currentMaxRisk);
    
    // Load max loss values
    const loadedLossValues = getMaxLossValues();
    setMaxLossValues(loadedLossValues);
    
    // Load current max loss setting
    const currentMaxLoss = getCurrentMaxLoss();
    setSelectedMaxLoss(currentMaxLoss);
  }, []);

  const handleAddMaxRisk = () => {
    const value = parseFloat(newMaxRiskValue);
    if (!isNaN(value) && value > 0) {
      const updatedValues = [...maxRiskValues, value].sort((a, b) => a - b);
      setMaxRiskValues(updatedValues);
      saveMaxRiskValues(updatedValues);
      setNewMaxRiskValue('');
      toast.success('Max risk value added');
    } else {
      toast.error('Please enter a valid positive number');
    }
  };

  const handleAddMaxLoss = () => {
    const value = parseFloat(newMaxLossValue);
    if (!isNaN(value) && value < 0) {
      const updatedValues = [...maxLossValues, value].sort((a, b) => a - b);
      setMaxLossValues(updatedValues);
      saveMaxLossValues(updatedValues);
      setNewMaxLossValue('');
      toast.success('Max loss value added');
    } else {
      toast.error('Please enter a valid negative number');
    }
  };
  
  const handleDeleteMaxRisk = (value: number) => {
    const updatedValues = maxRiskValues.filter(v => v !== value);
    setMaxRiskValues(updatedValues);
    saveMaxRiskValues(updatedValues);
    
    // If the selected max risk is being deleted, clear the selection
    if (selectedMaxRisk === value) {
      setSelectedMaxRisk(null);
      setCurrentMaxRisk(null);
    }
    
    toast.success('Max risk value removed');
  };
  
  const handleDeleteMaxLoss = (value: number) => {
    const updatedValues = maxLossValues.filter(v => v !== value);
    setMaxLossValues(updatedValues);
    saveMaxLossValues(updatedValues);
    
    // If the selected max loss is being deleted, clear the selection
    if (selectedMaxLoss === value) {
      setSelectedMaxLoss(null);
      setCurrentMaxLoss(null);
    }
    
    toast.success('Max loss value removed');
  };
  
  const handleSelectMaxRisk = (value: number) => {
    setSelectedMaxRisk(value);
    setCurrentMaxRisk(value);
    toast.success(`Max risk per trade set to $${value}`);
  };
  
  const handleClearMaxRisk = () => {
    setSelectedMaxRisk(null);
    setCurrentMaxRisk(null);
    toast.success('Max risk per trade cleared');
  };
  
  const handleSelectMaxLoss = (value: number) => {
    setSelectedMaxLoss(value);
    setCurrentMaxLoss(value);
    toast.success(`Weekly max loss set to $${value}`);
  };
  
  const handleClearMaxLoss = () => {
    setSelectedMaxLoss(null);
    setCurrentMaxLoss(null);
    toast.success('Weekly max loss cleared');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configuration</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Max Risk Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Max Risk Values</CardTitle>
            <CardDescription>
              Configure the max risk values for trade entries and set a warning threshold
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="max-risk">Add Max Risk Value ($)</Label>
                  <Input
                    id="max-risk"
                    type="number"
                    min="0"
                    step="25"
                    placeholder="Enter positive amount"
                    value={newMaxRiskValue}
                    onChange={(e) => setNewMaxRiskValue(e.target.value)}
                  />
                </div>
                <div className="self-end">
                  <Button onClick={handleAddMaxRisk}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Available Max Risk Values</Label>
                <div className="mt-2 space-y-2">
                  {maxRiskValues.length > 0 ? (
                    maxRiskValues.map((value) => (
                      <div 
                        key={value} 
                        className={`flex items-center justify-between p-2 rounded-md ${
                          selectedMaxRisk === value ? 'bg-primary/20 border border-primary' : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant={selectedMaxRisk === value ? "default" : "outline"} 
                            size="sm" 
                            onClick={() => handleSelectMaxRisk(value)}
                          >
                            {selectedMaxRisk === value ? 'Selected' : 'Select'}
                          </Button>
                          <span>${value}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteMaxRisk(value)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No max risk values defined</p>
                  )}
                </div>
              </div>
              
              {selectedMaxRisk && (
                <Alert>
                  <AlertDescription className="flex justify-between items-center">
                    <span>Current max risk per trade: <strong>${selectedMaxRisk}</strong></span>
                    <Button size="sm" variant="outline" onClick={handleClearMaxRisk}>Clear</Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Max Loss Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Max Loss Values</CardTitle>
            <CardDescription>
              Set a maximum weekly loss threshold to help with risk management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="max-loss">Add Max Loss Value ($)</Label>
                  <Input
                    id="max-loss"
                    type="number"
                    max="0"
                    step="100"
                    placeholder="Enter negative amount"
                    value={newMaxLossValue}
                    onChange={(e) => setNewMaxLossValue(e.target.value)}
                  />
                </div>
                <div className="self-end">
                  <Button onClick={handleAddMaxLoss}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Available Max Loss Values</Label>
                <div className="mt-2 space-y-2">
                  {maxLossValues.length > 0 ? (
                    maxLossValues.map((value) => (
                      <div 
                        key={value} 
                        className={`flex items-center justify-between p-2 rounded-md ${
                          selectedMaxLoss === value ? 'bg-primary/20 border border-primary' : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant={selectedMaxLoss === value ? "default" : "outline"} 
                            size="sm" 
                            onClick={() => handleSelectMaxLoss(value)}
                          >
                            {selectedMaxLoss === value ? 'Selected' : 'Select'}
                          </Button>
                          <span>${value}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteMaxLoss(value)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No max loss values defined</p>
                  )}
                </div>
              </div>
              
              {selectedMaxLoss && (
                <Alert>
                  <AlertDescription className="flex justify-between items-center">
                    <span>Current weekly max loss: <strong>${selectedMaxLoss}</strong></span>
                    <Button size="sm" variant="outline" onClick={handleClearMaxLoss}>Clear</Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

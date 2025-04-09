
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Info, Edit, Trash, Plus, Landmark } from 'lucide-react';
import { COMMON_FUTURES_CONTRACTS, CommonFuturesContract } from '@/types';
import { toast } from '@/utils/toast';

// Custom storage function for futures contracts
const FUTURES_CONTRACTS_KEY = 'futures_contracts';

interface FuturesContract {
  symbol: string;
  exchange: string;
  tickSize: number;
  tickValue: number;
  pointValue: number;
  contractSize: number;
  description: string;
}

export function FuturesContractManager() {
  const [contracts, setContracts] = useState<FuturesContract[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<FuturesContract | null>(null);
  const [formData, setFormData] = useState<Partial<FuturesContract>>({
    symbol: '',
    exchange: 'CME',
    tickSize: 0.25,
    tickValue: 50,
    pointValue: 1000,
    contractSize: 1,
    description: ''
  });

  // Load contracts from storage
  useEffect(() => {
    const loadContracts = () => {
      try {
        const storedContracts = localStorage.getItem(FUTURES_CONTRACTS_KEY);
        if (storedContracts) {
          setContracts(JSON.parse(storedContracts));
        } else {
          // Initialize with common contracts if none exist
          setContracts(COMMON_FUTURES_CONTRACTS.map(c => ({
            symbol: c.symbol,
            exchange: c.exchange || 'CME',
            tickSize: c.tickSize || 0.25,
            tickValue: c.pointValue || 50,
            pointValue: c.pointValue || 50,
            contractSize: c.contractSize || 1,
            description: c.description || ''
          })));
        }
      } catch (error) {
        console.error('Error loading futures contracts:', error);
        toast.error('Failed to load futures contracts');
      }
    };

    loadContracts();
  }, []);

  // Save contracts to storage
  const saveContracts = (updatedContracts: FuturesContract[]) => {
    try {
      localStorage.setItem(FUTURES_CONTRACTS_KEY, JSON.stringify(updatedContracts));
      setContracts(updatedContracts);
      toast.success('Futures contracts saved successfully');
    } catch (error) {
      console.error('Error saving futures contracts:', error);
      toast.error('Failed to save futures contracts');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Special handling for numeric fields to allow "0." and "." inputs
    if (name === 'tickSize' || name === 'tickValue' || name === 'pointValue' || name === 'contractSize') {
      // Allow input to start with "0." or "."
      if (value === '' || value === '.' || value === '0.') {
        setFormData({
          ...formData,
          [name]: value
        });
      } else {
        // Convert to number if it's a valid number
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          setFormData({
            ...formData,
            [name]: numValue
          });
        }
      }
    } else {
      // Handle non-numeric fields
      setFormData({
        ...formData,
        [name]: name === 'symbol' ? value.toUpperCase() : value
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddContract = () => {
    if (!formData.symbol || !formData.exchange || !formData.tickSize || !formData.pointValue) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if symbol already exists
    if (!editingContract && contracts.some(c => c.symbol === formData.symbol)) {
      toast.error(`Contract with symbol ${formData.symbol} already exists`);
      return;
    }

    // Handle special numeric string values
    const tickSize = typeof formData.tickSize === 'string' ? 
      (formData.tickSize === '.' ? 0 : parseFloat(formData.tickSize)) : 
      formData.tickSize!;
    
    const pointValue = typeof formData.pointValue === 'string' ? 
      (formData.pointValue === '.' ? 0 : parseFloat(formData.pointValue)) : 
      formData.pointValue!;

    const contractSize = typeof formData.contractSize === 'string' ? 
      (formData.contractSize === '.' ? 0 : parseFloat(formData.contractSize)) : 
      formData.contractSize || 1;

    const newContract: FuturesContract = {
      symbol: formData.symbol!,
      exchange: formData.exchange!,
      tickSize: tickSize,
      tickValue: pointValue / (1/tickSize), // Calculate tick value based on point value and tick size
      pointValue: pointValue,
      contractSize: contractSize,
      description: formData.description || ''
    };

    let updatedContracts: FuturesContract[];

    if (editingContract) {
      // Update existing contract
      updatedContracts = contracts.map(c => 
        c.symbol === editingContract.symbol ? newContract : c
      );
    } else {
      // Add new contract
      updatedContracts = [...contracts, newContract];
    }

    saveContracts(updatedContracts);
    setIsDialogOpen(false);
    setEditingContract(null);
    resetForm();
  };

  const handleEditContract = (contract: FuturesContract) => {
    setEditingContract(contract);
    setFormData({
      ...contract
    });
    setIsDialogOpen(true);
  };

  const handleDeleteContract = (symbol: string) => {
    const updatedContracts = contracts.filter(c => c.symbol !== symbol);
    saveContracts(updatedContracts);
  };

  const resetForm = () => {
    setFormData({
      symbol: '',
      exchange: 'CME',
      tickSize: 0.25,
      tickValue: 50,
      pointValue: 1000,
      contractSize: 1,
      description: ''
    });
  };

  const openAddDialog = () => {
    resetForm();
    setEditingContract(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" /> 
            Futures Contract Specifications
          </CardTitle>
          <CardDescription>
            Manage specifications for futures contracts including tick size and point value
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {contracts.length} contracts configured
            </p>
            <Button onClick={openAddDialog} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Contract
            </Button>
          </div>
          
          {contracts.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Exchange</TableHead>
                    <TableHead>Tick Size</TableHead>
                    <TableHead>Point Value</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.symbol}>
                      <TableCell className="font-medium font-mono">{contract.symbol}</TableCell>
                      <TableCell>{contract.exchange}</TableCell>
                      <TableCell>{contract.tickSize}</TableCell>
                      <TableCell>${contract.pointValue.toLocaleString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{contract.description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditContract(contract)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive" 
                            onClick={() => handleDeleteContract(contract.symbol)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 border rounded-md bg-muted/10">
              <p className="text-muted-foreground">No contracts configured yet.</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={openAddDialog}
              >
                Add Your First Contract
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t pt-6 flex justify-between">
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Info className="h-4 w-4" />
              <span>Properly configured contracts ensure accurate risk calculations</span>
            </div>
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingContract ? `Edit ${editingContract.symbol} Contract` : 'Add Futures Contract'}
            </DialogTitle>
            <DialogDescription>
              Enter the specifications for this futures contract to ensure accurate calculations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol*</Label>
                <Input
                  id="symbol"
                  name="symbol"
                  value={formData.symbol || ''}
                  onChange={handleInputChange}
                  placeholder="ES, NQ, SI, etc."
                  className="font-mono"
                  disabled={!!editingContract}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exchange">Exchange*</Label>
                <Select 
                  value={formData.exchange} 
                  onValueChange={(value) => handleSelectChange('exchange', value)}
                >
                  <SelectTrigger id="exchange">
                    <SelectValue placeholder="Select exchange" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CME">CME</SelectItem>
                    <SelectItem value="CBOT">CBOT</SelectItem>
                    <SelectItem value="NYMEX">NYMEX</SelectItem>
                    <SelectItem value="COMEX">COMEX</SelectItem>
                    <SelectItem value="ICE">ICE</SelectItem>
                    <SelectItem value="EUREX">EUREX</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tickSize">Tick Size*</Label>
                <Input
                  id="tickSize"
                  name="tickSize"
                  type="text"
                  inputMode="decimal"
                  value={formData.tickSize || ''}
                  onChange={handleInputChange}
                  placeholder="0.25"
                />
                <p className="text-xs text-muted-foreground">
                  e.g. 0.25, 0.01, 0.0001
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pointValue">Point Value ($)*</Label>
                <Input
                  id="pointValue"
                  name="pointValue"
                  type="text"
                  inputMode="decimal"
                  value={formData.pointValue || ''}
                  onChange={handleInputChange}
                  placeholder="50"
                />
                <p className="text-xs text-muted-foreground">
                  e.g. $50 for ES, $5000 for SI
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contractSize">Contract Size</Label>
              <Input
                id="contractSize"
                name="contractSize"
                type="text"
                inputMode="decimal"
                value={formData.contractSize || ''}
                onChange={handleInputChange}
                placeholder="1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="E-mini S&P 500, Silver, etc."
                className="w-full"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddContract}>
              {editingContract ? 'Update' : 'Add'} Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

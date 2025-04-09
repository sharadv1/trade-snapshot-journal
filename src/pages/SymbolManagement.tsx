
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash, Plus, Filter, Tag, Info, Settings, Coins } from 'lucide-react';
import { 
  getAllSymbols, 
  addCustomSymbol, 
  removeCustomSymbol, 
  updateCustomSymbol,
  SymbolDetails,
  getSymbolMeaning
} from '@/utils/symbolStorage';
import { toast } from '@/utils/toast';
import { COMMON_FUTURES_CONTRACTS } from '@/types';

// Constants
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

export default function SymbolManagement() {
  const [symbols, setSymbols] = useState<SymbolDetails[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [newSymbolType, setNewSymbolType] = useState<'stock' | 'futures' | 'options' | 'forex' | 'crypto'>('stock');
  const [newSymbolMeaning, setNewSymbolMeaning] = useState('');
  const [editingSymbol, setEditingSymbol] = useState<SymbolDetails | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [contracts, setContracts] = useState<FuturesContract[]>([]);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
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
  
  // Load all symbols and contracts on component mount
  useEffect(() => {
    loadSymbols();
    loadContracts();
  }, []);
  
  const loadSymbols = () => {
    setSymbols(getAllSymbols());
  };
  
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
          description: c.description || c.name || ''
        })));
      }
    } catch (error) {
      console.error('Error loading futures contracts:', error);
      toast.error('Failed to load futures contracts');
    }
  };
  
  // Filter symbols based on selected type
  const filteredSymbols = typeFilter === 'all' 
    ? symbols 
    : symbols.filter(symbol => symbol.type === typeFilter);
  
  // Get unique symbol types for the filter dropdown
  const symbolTypes = ['all', ...new Set(symbols.map(symbol => symbol.type))];
  
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
  
  // Get badge color based on symbol type
  const getTypeColor = (type: string): string => {
    switch(type) {
      case 'stock':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'futures':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'options':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'forex':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'crypto':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const handleAddSymbol = () => {
    if (!newSymbol.trim()) {
      toast.error('Symbol cannot be empty');
      return;
    }
    
    const formattedSymbol = newSymbol.trim().toUpperCase();
    
    if (!/^[A-Z0-9.\-_^]+$/.test(formattedSymbol)) {
      toast.error('Symbol contains invalid characters');
      return;
    }
    
    if (symbols.some(s => s.symbol === formattedSymbol)) {
      toast.info(`Symbol ${formattedSymbol} already exists`);
      setNewSymbol('');
      return;
    }
    
    const newSymbolDetails: SymbolDetails = {
      symbol: formattedSymbol,
      type: newSymbolType,
      meaning: newSymbolMeaning.trim() || undefined
    };
    
    addCustomSymbol(newSymbolDetails);
    setSymbols(getAllSymbols());
    setNewSymbol('');
    setNewSymbolMeaning('');
    
    // If this is a futures symbol, ask if they want to configure contract details
    if (newSymbolType === 'futures') {
      setFormData({
        symbol: formattedSymbol,
        exchange: 'CME',
        tickSize: 0.25,
        tickValue: 50,
        pointValue: 1000,
        contractSize: 1,
        description: newSymbolMeaning.trim() || ''
      });
      setEditingContract(null);
      setIsContractDialogOpen(true);
    } else {
      toast.success(`Added symbol: ${formattedSymbol}`);
    }
  };
  
  const handleRemoveSymbol = (symbol: string) => {
    removeCustomSymbol(symbol);
    setSymbols(getAllSymbols());
    
    // Also remove any associated futures contract
    const updatedContracts = contracts.filter(c => c.symbol !== symbol);
    if (updatedContracts.length !== contracts.length) {
      saveContracts(updatedContracts);
    }
    
    toast.success(`Removed symbol: ${symbol}`);
  };
  
  const openEditDialog = (symbol: SymbolDetails) => {
    const meaning = getSymbolMeaning(symbol.symbol);
    setEditingSymbol({
      ...symbol,
      meaning: symbol.meaning || meaning || ''
    });
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateSymbol = () => {
    if (!editingSymbol) return;
    
    if (!editingSymbol.symbol.trim()) {
      toast.error('Symbol cannot be empty');
      return;
    }
    
    const formattedSymbol = editingSymbol.symbol.trim().toUpperCase();
    
    if (!/^[A-Z0-9.\-_^]+$/.test(formattedSymbol)) {
      toast.error('Symbol contains invalid characters');
      return;
    }
    
    const updatedSymbolDetails: SymbolDetails = {
      symbol: formattedSymbol,
      type: editingSymbol.type,
      meaning: editingSymbol.meaning?.trim() || undefined
    };
    
    const originalSymbol = symbols.find(s => s.symbol === editingSymbol.symbol)?.symbol || '';
    
    updateCustomSymbol(originalSymbol, updatedSymbolDetails);
    setSymbols(getAllSymbols());
    setIsEditDialogOpen(false);
    
    // If the symbol changed, update any associated futures contract
    if (originalSymbol !== formattedSymbol) {
      const contractIndex = contracts.findIndex(c => c.symbol === originalSymbol);
      if (contractIndex >= 0) {
        const updatedContracts = [...contracts];
        updatedContracts[contractIndex] = {
          ...updatedContracts[contractIndex],
          symbol: formattedSymbol,
          description: editingSymbol.meaning?.trim() || updatedContracts[contractIndex].description
        };
        saveContracts(updatedContracts);
      }
    }
    
    toast.success(`Updated symbol: ${originalSymbol} to ${formattedSymbol}`);
  };
  
  const configureContract = (symbol: string) => {
    // Check if a contract already exists for this symbol
    const existingContract = contracts.find(c => c.symbol === symbol);
    
    if (existingContract) {
      setEditingContract(existingContract);
      setFormData({...existingContract});
    } else {
      const symbolObj = symbols.find(s => s.symbol === symbol);
      setEditingContract(null);
      setFormData({
        symbol: symbol,
        exchange: 'CME',
        tickSize: 0.25,
        tickValue: 50,
        pointValue: 1000,
        contractSize: 1,
        description: symbolObj?.meaning || ''
      });
    }
    
    setIsContractDialogOpen(true);
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
    setIsContractDialogOpen(false);
    setEditingContract(null);
    resetForm();
    
    // Make sure the symbol exists and is of futures type
    const symbolExists = symbols.some(s => s.symbol === formData.symbol);
    if (!symbolExists) {
      const newSymbolDetails: SymbolDetails = {
        symbol: formData.symbol!,
        type: 'futures',
        meaning: formData.description || undefined
      };
      addCustomSymbol(newSymbolDetails);
      loadSymbols();
    } else {
      // Update the symbol type to futures if it's not already
      const symbol = symbols.find(s => s.symbol === formData.symbol);
      if (symbol && symbol.type !== 'futures') {
        updateCustomSymbol(symbol.symbol, {
          ...symbol,
          type: 'futures'
        });
        loadSymbols();
      }
    }
    
    toast.success(`${editingContract ? 'Updated' : 'Added'} contract: ${formData.symbol}`);
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
  
  return (
    <div className="container mx-auto py-6 space-y-6 animate-fade-in">
      <Card className="shadow-md border-t-4 border-t-primary">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b rounded-t-lg">
          <CardTitle className="text-2xl font-semibold text-primary">Symbol Management</CardTitle>
          <CardDescription className="text-base">
            Add, edit, or remove symbols and configure futures contracts for your trades
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6 p-5 bg-background border rounded-lg shadow-sm">
            <div className="w-full md:flex-1 space-y-2">
              <Label htmlFor="newSymbol" className="font-medium">Symbol</Label>
              <Input
                id="newSymbol"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="Enter symbol (e.g., AAPL, ES)"
                className="w-full"
              />
            </div>
            
            <div className="w-full md:w-1/4 space-y-2">
              <Label htmlFor="symbolType" className="font-medium">Type</Label>
              <Select 
                value={newSymbolType} 
                onValueChange={(value: any) => setNewSymbolType(value)}
              >
                <SelectTrigger id="symbolType" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="futures">Futures</SelectItem>
                  <SelectItem value="options">Options</SelectItem>
                  <SelectItem value="forex">Forex</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:flex-1 space-y-2">
              <Label htmlFor="symbolMeaning" className="font-medium">Name/Meaning</Label>
              <Input
                id="symbolMeaning"
                value={newSymbolMeaning}
                onChange={(e) => setNewSymbolMeaning(e.target.value)}
                placeholder="Custom name or description (optional)"
                className="w-full"
              />
            </div>
            
            <Button onClick={handleAddSymbol} className="w-full md:w-auto gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Add Symbol
            </Button>
          </div>
          
          <div className="flex items-center justify-between mb-4 mt-8 border-b pb-3">
            <h3 className="text-lg font-medium text-primary">Symbols</h3>
            
            <div className="flex items-center space-x-2 bg-background rounded-md px-3 py-1 border">
              <Filter className="h-4 w-4 text-muted-foreground mr-1" />
              <Select 
                value={typeFilter} 
                onValueChange={setTypeFilter}
              >
                <SelectTrigger className="w-[150px] border-none shadow-none bg-transparent h-8 px-1">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {symbolTypes
                    .filter(type => type !== 'all')
                    .map(type => (
                      <SelectItem key={type} value={type}>
                        {typeof type === 'string' ? type.charAt(0).toUpperCase() + type.slice(1) : type}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredSymbols.length > 0 ? (
            <div className="border rounded-lg overflow-hidden bg-card">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold">Symbol</TableHead>
                    <TableHead className="font-semibold">Name/Meaning</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="w-28 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSymbols.map((symbol) => {
                    const meaning = getSymbolMeaning(symbol.symbol);
                    const hasFuturesContract = symbol.type === 'futures' && contracts.some(c => c.symbol === symbol.symbol);
                    
                    return (
                      <TableRow key={symbol.symbol} className="hover:bg-muted/20">
                        <TableCell>
                          <span className="font-mono text-lg font-bold text-gray-800">
                            {symbol.symbol}
                          </span>
                        </TableCell>
                        <TableCell>
                          {meaning ? (
                            <div>
                              <span className="text-gray-700">{meaning}</span>
                              {hasFuturesContract && (
                                <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200">
                                  Contract Configured
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No description available</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`capitalize ${getTypeColor(symbol.type)}`}
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {symbol.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => openEditDialog(symbol)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit symbol</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            {symbol.type === 'futures' && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => configureContract(symbol.symbol)}
                                      className="h-8 w-8 p-0 text-purple-600"
                                    >
                                      <Settings className="h-4 w-4" />
                                      <span className="sr-only">Configure Contract</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Configure Futures Contract</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            
                            <AlertDialog>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      >
                                        <Trash className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete symbol</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Symbol</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove <span className="font-mono font-bold">{symbol.symbol}</span>? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleRemoveSymbol(symbol.symbol)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/10">
              No symbols found with the selected filter.
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-500" />
                Futures Contracts
              </h3>
            </div>
            
            {contracts.length > 0 ? (
              <div className="border rounded-lg overflow-hidden bg-card">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-semibold">Symbol</TableHead>
                      <TableHead className="font-semibold">Exchange</TableHead>
                      <TableHead className="font-semibold">Tick Size</TableHead>
                      <TableHead className="font-semibold">Point Value</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="w-28 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.symbol} className="hover:bg-muted/20">
                        <TableCell className="font-mono font-medium">{contract.symbol}</TableCell>
                        <TableCell>{contract.exchange}</TableCell>
                        <TableCell>{contract.tickSize}</TableCell>
                        <TableCell>${contract.pointValue.toLocaleString()}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{contract.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                setEditingContract(contract);
                                setFormData({...contract});
                                setIsContractDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive h-8 w-8 p-0" 
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
                <p className="text-muted-foreground">No futures contracts configured yet.</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => {
                    resetForm();
                    setEditingContract(null);
                    setIsContractDialogOpen(true);
                  }}
                >
                  Configure Your First Contract
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-6 bg-gradient-to-r from-slate-50 to-white">
          <div className="text-sm text-muted-foreground">
            {symbols.length} symbols available • {contracts.length} futures contracts configured
          </div>
        </CardFooter>
      </Card>
      
      {/* Symbol Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Symbol</DialogTitle>
            <DialogDescription>
              Update the symbol name, type, and meaning. This will affect future trades using this symbol.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="symbolEdit" className="font-medium">Symbol</Label>
              <Input
                id="symbolEdit"
                value={editingSymbol?.symbol || ''}
                onChange={(e) => setEditingSymbol(prev => prev ? {...prev, symbol: e.target.value} : null)}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="symbolTypeEdit" className="font-medium">Symbol Type</Label>
              <Select 
                value={editingSymbol?.type} 
                onValueChange={(value: any) => setEditingSymbol(prev => prev ? {...prev, type: value} : null)}
              >
                <SelectTrigger id="symbolTypeEdit">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="futures">Futures</SelectItem>
                  <SelectItem value="options">Options</SelectItem>
                  <SelectItem value="forex">Forex</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="symbolMeaningEdit" className="font-medium">Name/Meaning</Label>
              <Input
                id="symbolMeaningEdit"
                value={editingSymbol?.meaning || ''}
                onChange={(e) => setEditingSymbol(prev => prev ? {...prev, meaning: e.target.value} : null)}
                placeholder="Custom name or description (optional)"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateSymbol}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Contract Specification Dialog */}
      <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingContract ? `Edit ${editingContract.symbol} Contract` : 'Add Futures Contract'}
            </DialogTitle>
            <DialogDescription>
              Enter the specifications for this futures contract to ensure accurate risk calculations.
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
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
              <div className="flex gap-2 items-center">
                <Info className="h-4 w-4 text-amber-500" />
                <span className="font-medium">Contract Specifications</span>
              </div>
              <p className="mt-1 text-muted-foreground">
                These settings directly affect risk calculations for futures trades. For Silver (SI) contracts, the standard point value is $5000.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsContractDialogOpen(false);
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


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
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash, Plus, Filter, Tag } from 'lucide-react';
import { 
  getAllSymbols, 
  addCustomSymbol, 
  removeCustomSymbol, 
  updateCustomSymbol,
  SymbolDetails
} from '@/utils/symbolStorage';
import { toast } from '@/utils/toast';
import { COMMON_FUTURES_CONTRACTS } from '@/types';

export default function SymbolManagement() {
  const [symbols, setSymbols] = useState<SymbolDetails[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [newSymbolType, setNewSymbolType] = useState<'equity' | 'futures' | 'option' | 'forex' | 'crypto'>('equity');
  const [editingSymbol, setEditingSymbol] = useState<SymbolDetails | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Load all symbols on component mount
  useEffect(() => {
    setSymbols(getAllSymbols());
  }, []);
  
  // Filter symbols based on selected type
  const filteredSymbols = typeFilter === 'all' 
    ? symbols 
    : symbols.filter(symbol => symbol.type === typeFilter);
  
  // Get unique symbol types for the filter dropdown
  const symbolTypes = ['all', ...new Set(symbols.map(symbol => symbol.type))];
  
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
      type: newSymbolType
    };
    
    addCustomSymbol(newSymbolDetails);
    setSymbols(getAllSymbols());
    setNewSymbol('');
    toast.success(`Added symbol: ${formattedSymbol}`);
  };
  
  const handleRemoveSymbol = (symbol: string) => {
    removeCustomSymbol(symbol);
    setSymbols(getAllSymbols());
    toast.success(`Removed symbol: ${symbol}`);
  };
  
  const openEditDialog = (symbol: SymbolDetails) => {
    setEditingSymbol(symbol);
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
    
    // Create updated symbol details
    const updatedSymbolDetails: SymbolDetails = {
      symbol: formattedSymbol,
      type: editingSymbol.type
    };
    
    // Original symbol for comparison
    const originalSymbol = symbols.find(s => s.symbol === editingSymbol.symbol)?.symbol || '';
    
    // Update the symbol
    updateCustomSymbol(originalSymbol, updatedSymbolDetails);
    setSymbols(getAllSymbols());
    setIsEditDialogOpen(false);
    
    toast.success(`Updated symbol: ${originalSymbol} to ${formattedSymbol}`);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Symbol Management</CardTitle>
          <CardDescription>
            Add, edit, or remove symbols for your trades
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row items-end gap-4 mb-6">
            <div className="w-full md:flex-1 space-y-2">
              <Label htmlFor="newSymbol">New Symbol</Label>
              <Input
                id="newSymbol"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="Enter symbol (e.g., AAPL, ES)"
              />
            </div>
            
            <div className="w-full md:w-1/4 space-y-2">
              <Label htmlFor="symbolType">Symbol Type</Label>
              <Select 
                value={newSymbolType} 
                onValueChange={(value: any) => setNewSymbolType(value)}
              >
                <SelectTrigger id="symbolType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="futures">Futures</SelectItem>
                  <SelectItem value="option">Option</SelectItem>
                  <SelectItem value="forex">Forex</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleAddSymbol} className="w-full md:w-auto flex gap-2">
              <Plus className="h-4 w-4" />
              Add Symbol
            </Button>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Symbols</h3>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select 
                value={typeFilter} 
                onValueChange={setTypeFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {symbolTypes
                    .filter(type => type !== 'all')
                    .map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredSymbols.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSymbols.map((symbol) => (
                  <TableRow key={symbol.symbol}>
                    <TableCell className="font-medium">
                      {symbol.symbol}
                      {symbol.isPreset && (
                        <Badge variant="outline" className="ml-2">
                          Preset
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {symbol.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEditDialog(symbol)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Symbol</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {symbol.symbol}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRemoveSymbol(symbol.symbol)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No symbols found with the selected filter.
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-6">
          <div className="text-sm text-muted-foreground">
            {symbols.length} symbols available ({symbols.filter(s => s.isPreset).length} preset, {symbols.filter(s => !s.isPreset).length} custom)
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Symbol</DialogTitle>
            <DialogDescription>
              Update the symbol name and type. This will affect future trades using this symbol.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="symbolEdit">Symbol</Label>
              <Input
                id="symbolEdit"
                value={editingSymbol?.symbol || ''}
                onChange={(e) => setEditingSymbol(prev => prev ? {...prev, symbol: e.target.value} : null)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="symbolTypeEdit">Symbol Type</Label>
              <Select 
                value={editingSymbol?.type} 
                onValueChange={(value: any) => setEditingSymbol(prev => prev ? {...prev, type: value} : null)}
              >
                <SelectTrigger id="symbolTypeEdit">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="futures">Futures</SelectItem>
                  <SelectItem value="option">Option</SelectItem>
                  <SelectItem value="forex">Forex</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateSymbol}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

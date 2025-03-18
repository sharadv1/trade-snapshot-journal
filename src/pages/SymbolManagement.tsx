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
import { Pencil, Trash, Plus, Filter, Tag, Info } from 'lucide-react';
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
  
  // Get badge color based on symbol type
  const getTypeColor = (type: string): string => {
    switch(type) {
      case 'equity':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'futures':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'option':
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
    <div className="container mx-auto py-6 space-y-6 animate-fade-in">
      <Card className="shadow-md border-t-4 border-t-primary">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b rounded-t-lg">
          <CardTitle className="text-2xl font-semibold text-primary">Symbol Management</CardTitle>
          <CardDescription className="text-base">
            Add, edit, or remove symbols for your trades
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-end gap-4 mb-6 p-5 bg-background border rounded-lg shadow-sm">
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
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="futures">Futures</SelectItem>
                  <SelectItem value="option">Option</SelectItem>
                  <SelectItem value="forex">Forex</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
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
                    return (
                    <TableRow key={symbol.symbol} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center">
                          <span className="mr-2 font-mono text-lg font-bold text-gray-800">
                            {symbol.symbol}
                          </span>
                          {symbol.isPreset && (
                            <Badge variant="secondary" className="text-xs font-normal">
                              Preset
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {meaning ? (
                          <span className="text-gray-700">{meaning}</span>
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
                  )})}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/10">
              No symbols found with the selected filter.
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t p-6 bg-gradient-to-r from-slate-50 to-white">
          <div className="text-sm text-muted-foreground">
            {symbols.length} symbols available ({symbols.filter(s => s.isPreset).length} preset, {symbols.filter(s => !s.isPreset).length} custom)
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Symbol</DialogTitle>
            <DialogDescription>
              Update the symbol name and type. This will affect future trades using this symbol.
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
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="futures">Futures</SelectItem>
                  <SelectItem value="option">Option</SelectItem>
                  <SelectItem value="forex">Forex</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
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
    </div>
  );
}

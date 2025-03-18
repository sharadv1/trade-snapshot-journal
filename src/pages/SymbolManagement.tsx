
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
  DialogTrigger,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Pencil, Trash, Plus, Info } from 'lucide-react';
import { 
  getCustomSymbols, 
  addCustomSymbol, 
  removeCustomSymbol, 
  updateCustomSymbol,
  getPresetSymbols
} from '@/utils/symbolStorage';
import { toast } from '@/utils/toast';

export default function SymbolManagement() {
  const [customSymbols, setCustomSymbols] = useState<string[]>([]);
  const [presetSymbols, setPresetSymbols] = useState<string[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [editSymbol, setEditSymbol] = useState({ original: '', updated: '' });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('custom');
  
  // Load symbols on component mount
  useEffect(() => {
    setCustomSymbols(getCustomSymbols());
    setPresetSymbols(getPresetSymbols());
  }, []);
  
  // Add a new symbol
  const handleAddSymbol = () => {
    if (!newSymbol.trim()) {
      toast.error('Symbol cannot be empty');
      return;
    }
    
    // Convert to uppercase
    const formattedSymbol = newSymbol.trim().toUpperCase();
    
    // Validate symbol (only allow letters, numbers, and some special characters)
    if (!/^[A-Z0-9.\-_^]+$/.test(formattedSymbol)) {
      toast.error('Symbol contains invalid characters');
      return;
    }
    
    // Check if symbol already exists in preset symbols
    if (presetSymbols.includes(formattedSymbol)) {
      toast.info(`${formattedSymbol} is already a preset symbol`);
      setNewSymbol('');
      return;
    }
    
    const updatedSymbols = addCustomSymbol(formattedSymbol);
    setCustomSymbols(updatedSymbols);
    setNewSymbol('');
    toast.success(`Added symbol: ${formattedSymbol}`);
  };
  
  // Remove a symbol
  const handleRemoveSymbol = (symbol: string) => {
    const updatedSymbols = removeCustomSymbol(symbol);
    setCustomSymbols(updatedSymbols);
    toast.success(`Removed symbol: ${symbol}`);
  };
  
  // Open edit dialog for a symbol
  const openEditDialog = (symbol: string) => {
    setEditSymbol({ original: symbol, updated: symbol });
    setIsEditDialogOpen(true);
  };
  
  // Update a symbol
  const handleUpdateSymbol = () => {
    if (!editSymbol.updated.trim()) {
      toast.error('Symbol cannot be empty');
      return;
    }
    
    // Convert to uppercase
    const formattedSymbol = editSymbol.updated.trim().toUpperCase();
    
    // Validate symbol
    if (!/^[A-Z0-9.\-_^]+$/.test(formattedSymbol)) {
      toast.error('Symbol contains invalid characters');
      return;
    }
    
    // Check if updated symbol is a preset
    if (presetSymbols.includes(formattedSymbol)) {
      toast.info(`${formattedSymbol} is already a preset symbol`);
      return;
    }
    
    const updatedSymbols = updateCustomSymbol(editSymbol.original, formattedSymbol);
    setCustomSymbols(updatedSymbols);
    setIsEditDialogOpen(false);
    toast.success(`Updated symbol: ${editSymbol.original} to ${formattedSymbol}`);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Symbol Management</CardTitle>
          <CardDescription>
            Add, edit, or remove custom symbols for your trades
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-end gap-4 mb-6">
            <div className="flex-1 space-y-2">
              <Label htmlFor="newSymbol">New Symbol</Label>
              <Input
                id="newSymbol"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="Enter stock or futures symbol"
              />
            </div>
            <Button onClick={handleAddSymbol} className="flex gap-2">
              <Plus className="h-4 w-4" />
              Add Symbol
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="custom">Custom Symbols</TabsTrigger>
              <TabsTrigger value="preset">Preset Symbols</TabsTrigger>
            </TabsList>
            
            <TabsContent value="custom">
              {customSymbols.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="w-28">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customSymbols.map((symbol) => (
                      <TableRow key={symbol}>
                        <TableCell className="font-medium">{symbol}</TableCell>
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
                                    Are you sure you want to remove {symbol}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleRemoveSymbol(symbol)}
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
                  No custom symbols added yet. Add your first symbol above.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="preset">
              <div className="bg-muted/30 p-4 rounded-lg mb-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Preset symbols are built into the application and cannot be modified or deleted. 
                  They include common stocks and futures contracts.
                </p>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presetSymbols.map((symbol) => {
                    const isFutures = symbol.startsWith('ES') || 
                                     symbol.startsWith('NQ') || 
                                     symbol.startsWith('MES') || 
                                     symbol.startsWith('MNQ') ||
                                     COMMON_FUTURES_CONTRACTS.some(contract => contract.symbol === symbol);
                    
                    return (
                      <TableRow key={symbol}>
                        <TableCell className="font-medium">{symbol}</TableCell>
                        <TableCell>{isFutures ? 'Futures' : 'Equity'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-6">
          <div className="text-sm text-muted-foreground">
            {customSymbols.length} custom and {presetSymbols.length} preset symbols available
          </div>
        </CardFooter>
      </Card>
      
      {/* Edit Symbol Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Symbol</DialogTitle>
            <DialogDescription>
              Update the symbol name. This will affect future trades using this symbol.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="symbolEdit">Symbol</Label>
              <Input
                id="symbolEdit"
                value={editSymbol.updated}
                onChange={(e) => setEditSymbol({ ...editSymbol, updated: e.target.value })}
              />
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

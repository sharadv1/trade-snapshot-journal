import { useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Card, CardContent, CardDescription, CardFooter, 
  CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, CheckCircle, Trash2, PenLine, AlertCircle, 
  ArrowUpRight, ChevronLeft, ImageIcon, Sparkles, Link as LinkIcon 
} from 'lucide-react';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { TradeMetrics } from '@/components/TradeMetrics';
import { ExitTradeForm } from '@/components/ExitTradeForm';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';
import { Badge } from '@/components/ui/badge';
import { getTradeById, deleteTrade, getTradeIdea } from '@/utils/tradeOperations';
import { toast } from '@/utils/toast';
import { Trade } from '@/types';
import { IdeaDialog } from '@/components/idea/IdeaDialog';

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exitFormOpen, setExitFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
  const [ideaDialogOpen, setIdeaDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const trade = id ? getTradeById(id) : null;
  const tradeIdea = trade?.ideaId ? getTradeIdea(trade.ideaId) : null;
  
  const handleDeleteTrade = async () => {
    if (id) {
      await deleteTrade(id);
      toast.success('Trade deleted successfully');
      navigate('/');
    }
  };
  
  const handleImageClick = (imageSrc: string) => {
    setCurrentImage(imageSrc);
    setImageViewerOpen(true);
  };

  const handleExitSuccess = () => {
    setExitFormOpen(false);
    setRefreshKey(prev => prev + 1); // Force refresh
    
    // If we just closed the trade, show the metrics tab
    if (trade?.status === 'open') {
      setActiveTab('metrics');
    }
    
    toast.success('Trade updated successfully');
  };
  
  if (!trade) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium mb-2">Trade not found</h2>
        <p className="text-muted-foreground mb-6">
          The trade you are looking for doesn't exist or has been deleted.
        </p>
        <Button asChild>
          <Link to="/">Go back to dashboard</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-8" key={refreshKey}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
          
          {trade.status === 'open' ? (
            <Button size="sm" onClick={() => setExitFormOpen(true)}>
              <CheckCircle className="mr-1 h-4 w-4" />
              Close Trade
            </Button>
          ) : null}
          
          <Button variant="outline" size="sm" asChild>
            <Link to={`/trade/${id}/edit`}>
              <PenLine className="mr-1 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6">
        <Card className="border shadow-sm animate-in fade-in">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl">
                    {trade.symbol}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={
                      trade.direction === 'long'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {trade.direction.toUpperCase()}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      trade.status === 'open'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }
                  >
                    {trade.status === 'open' ? (
                      <Clock className="mr-1 h-3 w-3 inline" />
                    ) : (
                      <CheckCircle className="mr-1 h-3 w-3 inline" />
                    )}
                    {trade.status === 'open' ? 'Open' : 'Closed'}
                  </Badge>
                </div>
                <CardDescription className="mt-1.5">
                  <span>
                    Entered on{' '}
                    {format(new Date(trade.entryDate), 'MMMM d, yyyy')}
                  </span>
                  {trade.exitDate && (
                    <span>
                      {' • '}
                      Exited on{' '}
                      {format(new Date(trade.exitDate), 'MMMM d, yyyy')}
                    </span>
                  )}
                </CardDescription>
                
                {/* Add linked idea if it exists */}
                {tradeIdea && (
                  <div className="mt-2 text-sm">
                    <div 
                      className="flex items-center text-primary cursor-pointer hover:underline" 
                      onClick={() => setIdeaDialogOpen(true)}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      <span>Based on idea: {tradeIdea.symbol} {tradeIdea.direction?.toUpperCase()}</span>
                      <LinkIcon className="h-3 w-3 ml-1.5" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="notes">
                  Notes & Images
                  {trade.images && trade.images.length > 0 && (
                    <span className="ml-2 flex h-3 w-3 items-center justify-center">
                      <span className="relative inline-flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-primary/20 opacity-75 animate-ping"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                      </span>
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
            
            <CardContent className="mt-4">
              {/* Details Tab */}
              <TabsContent value="details" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Trade Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Symbol
                        </div>
                        <div className="font-bold">{trade.symbol}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Direction
                        </div>
                        <div className="font-bold">{trade.direction}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Type
                        </div>
                        <div className="font-bold">{trade.type}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Strategy
                        </div>
                        <div className="font-bold">{trade.strategy || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Entry Price
                        </div>
                        <div className="font-bold">{trade.entryPrice}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Quantity
                        </div>
                        <div className="font-bold">{trade.quantity}</div>
                      </div>
                      {trade.exitPrice && (
                        <>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">
                              Exit Price
                            </div>
                            <div className="font-bold">{trade.exitPrice}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">
                              Fees
                            </div>
                            <div className="font-bold">{trade.fees || 0}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Risk Parameters</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Stop Loss
                        </div>
                        <div className="font-bold">{trade.stopLoss || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Take Profit
                        </div>
                        <div className="font-bold">{trade.takeProfit || '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Metrics Tab */}
              <TabsContent value="metrics" className="space-y-6 mt-0">
                <TradeMetrics trade={trade} />
              </TabsContent>
              
              {/* Notes & Images Tab */}
              <TabsContent value="notes" className="mt-0">
                <div className="space-y-6">
                  {/* Notes Section */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Notes</h3>
                    <div className="prose prose-sm max-w-none">
                      {trade.notes ? (
                        <div className="whitespace-pre-wrap rounded-md border p-4">
                          {trade.notes}
                        </div>
                      ) : (
                        <div className="text-muted-foreground italic">
                          No notes for this trade.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Images Section */}
                  {trade.images && trade.images.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Images</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trade.images.map((image, index) => (
                          <div
                            key={index}
                            className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-md border"
                            onClick={() => handleImageClick(image)}
                          >
                            <img
                              src={image}
                              alt={`Trade chart ${index + 1}`}
                              className="h-full w-full object-cover transition-transform hover:scale-105"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Images</h3>
                      <div className="text-muted-foreground italic flex items-center justify-center p-8 border rounded-md">
                        <ImageIcon className="mr-2 h-4 w-4" />
                        No images for this trade.
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </CardContent>
            
            <CardFooter className="flex justify-end border-t pt-6">
              {trade.status === 'open' && activeTab === 'details' && (
                <Button onClick={() => setExitFormOpen(true)}>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Close Trade
                </Button>
              )}
            </CardFooter>
          </Tabs>
        </Card>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              trade and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTrade}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Exit Trade Form Dialog */}
      <ExitTradeForm
        trade={trade}
        open={exitFormOpen}
        onOpenChange={setExitFormOpen}
        onSuccess={handleExitSuccess}
      />
      
      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        image={currentImage}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
      />
      
      {/* Idea Viewer Dialog */}
      {tradeIdea && (
        <IdeaDialog
          open={ideaDialogOpen}
          onOpenChange={setIdeaDialogOpen}
          initialIdea={tradeIdea}
          readOnly={true}
        />
      )}
    </div>
  );
}


import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trade, TradeIdea, Strategy, WeeklyReflection, MonthlyReflection } from '@/types';
import { SymbolDetails } from '@/utils/symbolStorage';

interface ImportSummaryData {
  trades: Trade[];
  ideas: TradeIdea[];
  strategies: Strategy[];
  symbols: SymbolDetails[] | string[];
  weeklyReflections: WeeklyReflection[];
  monthlyReflections: MonthlyReflection[];
}

interface DataImportSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  summaryData: ImportSummaryData;
}

export function DataImportSummary({ isOpen, onClose, summaryData }: DataImportSummaryProps) {
  const [activeTab, setActiveTab] = useState('trades');
  
  // Calculate some stats for trades
  const totalPnL = summaryData.trades.reduce((sum, trade) => {
    if (trade.status === 'closed' && trade.exitPrice && trade.entryPrice && trade.quantity) {
      const multiplier = trade.direction === 'long' ? 1 : -1;
      return sum + ((trade.exitPrice - trade.entryPrice) * trade.quantity * multiplier);
    }
    return sum;
  }, 0);

  const winningTrades = summaryData.trades.filter(trade => {
    if (trade.status !== 'closed' || !trade.exitPrice || !trade.entryPrice) return false;
    return trade.direction === 'long' 
      ? trade.exitPrice > trade.entryPrice 
      : trade.exitPrice < trade.entryPrice;
  });

  const winRate = summaryData.trades.length > 0 
    ? ((winningTrades.length / summaryData.trades.length) * 100).toFixed(2) 
    : '0';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Summary</DialogTitle>
          <DialogDescription>
            Summary of all data imported into your trade journal
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-6">
            <TabsTrigger value="trades">
              Trades ({summaryData.trades.length})
            </TabsTrigger>
            <TabsTrigger value="ideas">
              Ideas ({summaryData.ideas.length})
            </TabsTrigger>
            <TabsTrigger value="strategies">
              Strategies ({summaryData.strategies.length})
            </TabsTrigger>
            <TabsTrigger value="symbols">
              Symbols ({Array.isArray(summaryData.symbols) ? summaryData.symbols.length : 0})
            </TabsTrigger>
            <TabsTrigger value="weeklyJournal">
              Weekly ({summaryData.weeklyReflections.length})
            </TabsTrigger>
            <TabsTrigger value="monthlyJournal">
              Monthly ({summaryData.monthlyReflections.length})
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden border rounded-md mt-2">
            <TabsContent value="trades" className="h-full flex flex-col">
              <div className="bg-muted p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-card p-3 rounded-md">
                    <div className="text-sm font-medium text-muted-foreground">Total Trades</div>
                    <div className="text-2xl font-bold">{summaryData.trades.length}</div>
                  </div>
                  <div className="bg-card p-3 rounded-md">
                    <div className="text-sm font-medium text-muted-foreground">Win Rate</div>
                    <div className="text-2xl font-bold">{winRate}%</div>
                  </div>
                  <div className="bg-card p-3 rounded-md">
                    <div className="text-sm font-medium text-muted-foreground">Total P&L</div>
                    <div className={`text-2xl font-bold ${totalPnL > 0 ? 'text-green-500' : totalPnL < 0 ? 'text-red-500' : ''}`}>
                      ${totalPnL.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-2">Symbol</th>
                        <th className="text-left py-2 px-2">Direction</th>
                        <th className="text-left py-2 px-2">Entry Date</th>
                        <th className="text-left py-2 px-2">Status</th>
                        <th className="text-right py-2 pl-2">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData.trades.slice(0, 50).map((trade) => {
                        // Calculate P&L
                        let pnl = 0;
                        if (trade.status === 'closed' && trade.exitPrice && trade.entryPrice && trade.quantity) {
                          const multiplier = trade.direction === 'long' ? 1 : -1;
                          pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity * multiplier;
                        }
                        
                        return (
                          <tr key={trade.id} className="border-b border-muted hover:bg-muted/50">
                            <td className="py-2 pr-2">{trade.symbol}</td>
                            <td className="py-2 px-2">{trade.direction}</td>
                            <td className="py-2 px-2">
                              {trade.entryDate ? new Date(trade.entryDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-2 px-2">{trade.status}</td>
                            <td className={`py-2 pl-2 text-right ${pnl > 0 ? 'text-green-500' : pnl < 0 ? 'text-red-500' : ''}`}>
                              {trade.status === 'closed' ? `$${pnl.toFixed(2)}` : 'Open'}
                            </td>
                          </tr>
                        );
                      })}
                      {summaryData.trades.length > 50 && (
                        <tr>
                          <td colSpan={5} className="py-2 text-center text-muted-foreground">
                            Showing 50 of {summaryData.trades.length} trades
                          </td>
                        </tr>
                      )}
                      {summaryData.trades.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-muted-foreground">
                            No trades imported
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ideas" className="h-full">
              <ScrollArea className="h-full">
                <div className="p-4">
                  {summaryData.ideas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {summaryData.ideas.slice(0, 20).map((idea) => (
                        <div key={idea.id} className="border rounded-md p-3">
                          <div className="font-medium">{idea.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            Direction: {idea.direction} | Status: {idea.status}
                          </div>
                          {idea.description && (
                            <div className="mt-2 text-sm line-clamp-3">{idea.description}</div>
                          )}
                        </div>
                      ))}
                      {summaryData.ideas.length > 20 && (
                        <div className="col-span-2 text-center text-sm text-muted-foreground">
                          Showing 20 of {summaryData.ideas.length} ideas
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      No ideas imported
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="strategies" className="h-full">
              <ScrollArea className="h-full">
                <div className="p-4">
                  {summaryData.strategies.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {summaryData.strategies.map((strategy) => (
                        <div key={strategy.id} className="border rounded-md p-3">
                          <div className="font-medium">{strategy.name}</div>
                          {strategy.description && (
                            <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {strategy.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      No strategies imported
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="symbols" className="h-full">
              <ScrollArea className="h-full">
                <div className="p-4">
                  {Array.isArray(summaryData.symbols) && summaryData.symbols.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {summaryData.symbols.map((symbol, index) => (
                        <div key={index} className="border rounded-md p-3 text-center">
                          {typeof symbol === 'string' ? (
                            symbol
                          ) : 'symbol' in symbol ? (
                            <div>
                              <div className="font-medium">{symbol.symbol}</div>
                              {symbol.type && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Type: {symbol.type}
                                </div>
                              )}
                              {symbol.meaning && (
                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {symbol.meaning}
                                </div>
                              )}
                            </div>
                          ) : (
                            "Unknown Symbol Format"
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      No custom symbols imported
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="weeklyJournal" className="h-full">
              <ScrollArea className="h-full">
                <div className="p-4">
                  {summaryData.weeklyReflections.length > 0 ? (
                    <div className="space-y-4">
                      {summaryData.weeklyReflections.slice(0, 10).map((reflection) => (
                        <div key={reflection.id} className="border rounded-md p-3">
                          <div className="font-medium">
                            Week of {new Date(reflection.weekStart).toLocaleDateString()} to {new Date(reflection.weekEnd).toLocaleDateString()}
                          </div>
                          {reflection.grade && (
                            <div className="mt-1 text-sm">Grade: {reflection.grade}</div>
                          )}
                          <div className="mt-2 text-sm text-muted-foreground line-clamp-3">
                            {reflection.reflection || 'No content'}
                          </div>
                        </div>
                      ))}
                      {summaryData.weeklyReflections.length > 10 && (
                        <div className="text-center text-sm text-muted-foreground">
                          Showing 10 of {summaryData.weeklyReflections.length} weekly reflections
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      No weekly reflections imported
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="monthlyJournal" className="h-full">
              <ScrollArea className="h-full">
                <div className="p-4">
                  {summaryData.monthlyReflections.length > 0 ? (
                    <div className="space-y-4">
                      {summaryData.monthlyReflections.slice(0, 10).map((reflection) => (
                        <div key={reflection.id} className="border rounded-md p-3">
                          <div className="font-medium">
                            Month of {new Date(reflection.monthStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </div>
                          {reflection.grade && (
                            <div className="mt-1 text-sm">Grade: {reflection.grade}</div>
                          )}
                          <div className="mt-2 text-sm text-muted-foreground line-clamp-3">
                            {reflection.reflection || 'No content'}
                          </div>
                        </div>
                      ))}
                      {summaryData.monthlyReflections.length > 10 && (
                        <div className="text-center text-sm text-muted-foreground">
                          Showing 10 of {summaryData.monthlyReflections.length} monthly reflections
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      No monthly reflections imported
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

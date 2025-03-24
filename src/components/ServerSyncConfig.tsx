import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Cloud, CloudOff, RefreshCw, InfoIcon } from 'lucide-react';
import { 
  configureServerConnection, 
  isUsingServerSync,
  getServerUrl,
  syncWithServer,
  syncAllData
} from '@/utils/storage/serverSync';
import { syncIdeasWithServer } from '@/utils/ideaStorage';
import { syncStrategiesWithServer } from '@/utils/strategyStorage';
import { syncSymbolsWithServer } from '@/utils/symbolStorage';
import { toast } from '@/utils/toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ServerSyncConfig() {
  const [isOpen, setIsOpen] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Load saved server URL on component mount and check connection status
  useEffect(() => {
    const refreshConnectionStatus = () => {
      const savedUrl = localStorage.getItem('trade-journal-server-url') || '';
      setServerUrl(savedUrl);
      
      // Check connection status
      setIsConnected(isUsingServerSync());
      
      // If not connected but we're likely running in Docker, auto-set URL
      if (!isUsingServerSync()) {
        const origin = window.location.origin;
        // If not a localhost dev server, try to auto-configure
        if (origin !== 'http://localhost:3000' && 
            origin !== 'http://localhost:5173' && 
            origin !== 'http://127.0.0.1:5173') {
          const apiUrl = `${origin}/api/trades`;
          setServerUrl(apiUrl);
          console.log('Auto-configured Docker server URL:', apiUrl);
        }
      }
    };
    
    refreshConnectionStatus();
    
    // Also listen for storage events to update connection status
    window.addEventListener('storage', refreshConnectionStatus);
    
    return () => {
      window.removeEventListener('storage', refreshConnectionStatus);
    };
  }, []);
  
  const handleSaveConfig = async () => {
    setIsSyncing(true);
    try {
      const success = await configureServerConnection(serverUrl);
      setIsConnected(success);
      
      if (success) {
        setIsOpen(false);
        // Force a refresh from the server - this is handled in configureServerConnection now
        toast.success('Successfully connected to server and synced data');
        window.dispatchEvent(new Event('storage'));
      }
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleSyncClick = async () => {
    setIsSyncing(true);
    try {
      await syncAllData();
      window.dispatchEvent(new Event('storage'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUseDocker = () => {
    // Use the Docker API endpoint URL
    const apiUrl = window.location.origin + '/api/trades';
    setServerUrl(apiUrl);
    toast.info('Docker API URL configured. Click "Save & Connect" to connect.');
  };
  
  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={isConnected ? "text-green-500" : "text-muted-foreground"}
          >
            {isConnected ? (
              <Cloud className="h-4 w-4 mr-2" />
            ) : (
              <CloudOff className="h-4 w-4 mr-2" />
            )}
            {isConnected ? "Server Connected" : "Configure Server"}
          </Button>
        </DialogTrigger>
        
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trade Server Configuration</DialogTitle>
            <DialogDescription>
              Configure your server to sync trades, ideas, strategies and symbols across all browsers and devices.
              {isConnected && (
                <div className="mt-2 text-green-500 text-sm">
                  Connected to: {getServerUrl()}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="server-url">Server URL</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        onClick={handleUseDocker}
                      >
                        <InfoIcon className="h-3 w-3 mr-1" />
                        Use Docker API
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Set URL for Docker deployment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="server-url"
                placeholder="http://your-server-ip:8080/api/trades"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                For Docker deployment, use: {window.location.origin}/api/trades
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={async () => {
                setServerUrl('');
                await configureServerConnection('');
                setIsConnected(false);
                setIsOpen(false);
                toast.info('Server sync disabled, using local storage only');
              }}
            >
              Disable Sync
            </Button>
            <Button onClick={handleSaveConfig} disabled={isSyncing}>
              {isSyncing ? "Connecting..." : "Save & Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {isConnected && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSyncClick}
          disabled={isSyncing}
          className="ml-2"
        >
          <RefreshCw 
            className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} 
          />
          Sync Now
        </Button>
      )}
    </div>
  );
}


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
  syncWithServer
} from '@/utils/storage/serverSync';
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
  
  // Load saved server URL on component mount
  useEffect(() => {
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
  }, []);
  
  const handleSaveConfig = async () => {
    setIsSyncing(true);
    try {
      const success = await configureServerConnection(serverUrl);
      setIsConnected(success);
      
      if (success) {
        setIsOpen(false);
        // Force a sync to get latest data
        await syncWithServer();
      }
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncWithServer();
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
              Configure your server to sync trades across all browsers and devices.
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
              onClick={() => {
                setServerUrl('');
                configureServerConnection('');
                setIsConnected(false);
                setIsOpen(false);
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
          onClick={handleSync}
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

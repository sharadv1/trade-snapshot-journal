
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
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { 
  configureServerConnection, 
  isUsingServerSync, 
  syncWithServer, 
  restoreServerConnection 
} from '@/utils/tradeStorage';
import { toast } from '@/utils/toast';

export function ServerSyncConfig() {
  const [isOpen, setIsOpen] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Load saved server URL on component mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('trade-journal-server-url');
    if (savedUrl) {
      setServerUrl(savedUrl);
    }
    
    // Try to restore connection
    restoreServerConnection();
    
    // Check connection status
    setIsConnected(isUsingServerSync());
  }, []);
  
  const handleSaveConfig = async () => {
    setIsSyncing(true);
    try {
      const success = await configureServerConnection(serverUrl);
      setIsConnected(success);
      
      if (success) {
        setIsOpen(false);
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
              Configure your Docker server to sync trades across all browsers and devices.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="server-url">Server URL</Label>
              <Input
                id="server-url"
                placeholder="http://your-mac-mini-ip:port/api/trades"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the full URL to your Docker server's API endpoint
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

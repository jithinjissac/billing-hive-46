
import { useHealthCheck } from "@/contexts/HealthCheckContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function DatabaseHealthIndicator() {
  const { 
    lastCheckStatus, 
    timeSinceLastConnection, 
    isCheckingHealth, 
    forceHealthCheck,
    autoReconnectEnabled,
    toggleAutoReconnect
  } = useHealthCheck();
  
  // Local state to prevent excessive UI updates
  const [isInitialCheck, setIsInitialCheck] = useState(true);

  // Attempt to check connection once when component mounts
  useEffect(() => {
    let isMounted = true;
    
    // Only force a check if we've never checked before
    if (lastCheckStatus === null && isInitialCheck) {
      console.log("DatabaseHealthIndicator: Running initial check");
      forceHealthCheck().finally(() => {
        if (isMounted) {
          setIsInitialCheck(false);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [lastCheckStatus, forceHealthCheck, isInitialCheck]);

  // Handle manual check
  const handleCheckNow = () => {
    forceHealthCheck();
  };

  if (lastCheckStatus === null) {
    return (
      <Alert variant="default" className="mb-4 bg-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-gray-500" />
            <AlertDescription className="flex items-center">
              <span className="mr-2">Checking database connection...</span>
            </AlertDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCheckNow} 
            disabled={isCheckingHealth}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            {isCheckingHealth ? 'Checking...' : 'Check now'}
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <Alert variant={lastCheckStatus ? "default" : "destructive"} className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {lastCheckStatus ? (
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 mr-2 text-red-500" />
          )}
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center">
            <span className="mr-2">
              Database {lastCheckStatus ? "connected" : "disconnected"}
            </span>
            <span className="text-xs text-muted-foreground">
              Last check: {timeSinceLastConnection}
            </span>
            {!lastCheckStatus && (
              <span className="text-xs ml-0 sm:ml-2 mt-1 sm:mt-0">
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs underline" 
                  onClick={toggleAutoReconnect}
                >
                  {autoReconnectEnabled ? "Disable" : "Enable"} auto-reconnect
                </Button>
              </span>
            )}
          </AlertDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCheckNow} 
          disabled={isCheckingHealth}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isCheckingHealth ? 'animate-spin' : ''}`} />
          {isCheckingHealth ? 'Checking...' : 'Check now'}
        </Button>
      </div>
    </Alert>
  );
}

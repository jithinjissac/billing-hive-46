
import { useHealthCheck } from "@/contexts/HealthCheckContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export function DatabaseHealthIndicator() {
  const { 
    lastCheckStatus, 
    timeSinceLastConnection, 
    isCheckingHealth, 
    forceHealthCheck 
  } = useHealthCheck();

  if (lastCheckStatus === null) {
    return null; // Don't show anything until we have a result
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
          <AlertDescription className="flex items-center">
            <span className="mr-2">
              Database {lastCheckStatus ? "connected" : "disconnected"}
            </span>
            <span className="text-xs text-muted-foreground">
              Last check: {timeSinceLastConnection}
            </span>
          </AlertDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={forceHealthCheck} 
          disabled={isCheckingHealth}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isCheckingHealth ? 'animate-spin' : ''}`} />
          {isCheckingHealth ? 'Checking...' : 'Check now'}
        </Button>
      </div>
    </Alert>
  );
}

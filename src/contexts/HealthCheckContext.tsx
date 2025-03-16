
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { performHealthCheck, getTimeSinceLastConnection } from "@/utils/databaseHealthCheck";

// Default health check interval: 2 minutes
const DEFAULT_CHECK_INTERVAL = 2 * 60 * 1000;

interface HealthCheckContextType {
  lastCheckStatus: boolean | null;
  timeSinceLastConnection: string;
  isCheckingHealth: boolean;
  checkInterval: number;
  setCheckInterval: (interval: number) => void;
  forceHealthCheck: () => Promise<void>;
}

const HealthCheckContext = createContext<HealthCheckContextType | undefined>(undefined);

export function HealthCheckProvider({ children, initialInterval = DEFAULT_CHECK_INTERVAL }: { 
  children: ReactNode;
  initialInterval?: number;
}) {
  const [lastCheckStatus, setLastCheckStatus] = useState<boolean | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);
  const [checkInterval, setCheckInterval] = useState<number>(initialInterval);
  const [timeSinceLastConnection, setTimeSinceLastConnection] = useState<string>(getTimeSinceLastConnection());

  // Function to manually trigger a health check
  const forceHealthCheck = async () => {
    if (isCheckingHealth) return;
    
    setIsCheckingHealth(true);
    try {
      await performHealthCheck();
      setLastCheckStatus(true);
    } catch (error) {
      console.error("Manual health check failed:", error);
      setLastCheckStatus(false);
    } finally {
      setIsCheckingHealth(false);
      setTimeSinceLastConnection(getTimeSinceLastConnection());
    }
  };

  // Initialize health check on first mount
  useEffect(() => {
    // Perform initial health check
    forceHealthCheck();
    
    // Set up interval for recurring health checks
    const intervalId = setInterval(() => {
      console.log("Running scheduled health check");
      forceHealthCheck();
    }, checkInterval);
    
    // Set up timer to update "time since last connection" string
    const connectionTimeUpdateId = setInterval(() => {
      setTimeSinceLastConnection(getTimeSinceLastConnection());
    }, 30000); // Update every 30 seconds
    
    // Clean up intervals on unmount
    return () => {
      clearInterval(intervalId);
      clearInterval(connectionTimeUpdateId);
    };
  }, [checkInterval]);

  // Update interval when the checkInterval state changes
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("Running scheduled health check with new interval");
      forceHealthCheck();
    }, checkInterval);
    
    return () => clearInterval(intervalId);
  }, [checkInterval]);

  return (
    <HealthCheckContext.Provider
      value={{
        lastCheckStatus,
        timeSinceLastConnection,
        isCheckingHealth,
        checkInterval,
        setCheckInterval,
        forceHealthCheck
      }}
    >
      {children}
    </HealthCheckContext.Provider>
  );
}

export function useHealthCheck() {
  const context = useContext(HealthCheckContext);
  if (context === undefined) {
    throw new Error("useHealthCheck must be used within a HealthCheckProvider");
  }
  return context;
}

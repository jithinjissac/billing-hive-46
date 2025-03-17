
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { 
  checkDatabaseConnection, 
  getTimeSinceLastConnection, 
  performHealthCheck,
  attemptReconnect
} from "@/utils/databaseHealthCheck";

interface HealthCheckContextType {
  lastCheckStatus: boolean | null;
  timeSinceLastConnection: string;
  isCheckingHealth: boolean;
  forceHealthCheck: () => Promise<void>;
  autoReconnectEnabled: boolean;
  toggleAutoReconnect: () => void;
}

const HealthCheckContext = createContext<HealthCheckContextType>({
  lastCheckStatus: null,
  timeSinceLastConnection: "Never",
  isCheckingHealth: false,
  forceHealthCheck: async () => {},
  autoReconnectEnabled: true,
  toggleAutoReconnect: () => {}
});

export const useHealthCheck = () => useContext(HealthCheckContext);

export const HealthCheckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastCheckStatus, setLastCheckStatus] = useState<boolean | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [timeSinceLastConnection, setTimeSinceLastConnection] = useState("Never");
  const [autoReconnectEnabled, setAutoReconnectEnabled] = useState(true);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Function to update the time display
  const updateTimeDisplay = useCallback(() => {
    setTimeSinceLastConnection(getTimeSinceLastConnection());
  }, []);
  
  // Function to force a health check
  const forceHealthCheck = useCallback(async () => {
    try {
      // Prevent multiple simultaneous checks
      if (isCheckingHealth) return;
      
      setIsCheckingHealth(true);
      const status = await performHealthCheck();
      
      // Only update status if the component is still mounted
      setLastCheckStatus(status);
      updateTimeDisplay();
    } catch (error) {
      console.error("Error during health check:", error);
      setLastCheckStatus(false);
    } finally {
      setIsCheckingHealth(false);
    }
  }, [isCheckingHealth, updateTimeDisplay]);

  // Toggle auto-reconnect setting
  const toggleAutoReconnect = useCallback(() => {
    setAutoReconnectEnabled(prev => !prev);
  }, []);
  
  // Set up an interval to update the time display
  useEffect(() => {
    // Clear any existing interval first
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // Create a new interval
    const interval = setInterval(() => {
      updateTimeDisplay();
    }, 30000); // Update every 30 seconds
    
    setTimerInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [updateTimeDisplay]);
  
  // Effect for auto-reconnection attempts - fix infinite loop
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout | null = null;
    
    const startReconnectAttempts = async () => {
      if (!autoReconnectEnabled || lastCheckStatus !== false) return;
      
      console.log("Attempting to reconnect to database...");
      
      // Try to reconnect and if successful, clear the timer
      const success = await attemptReconnect();
      if (success) {
        console.log("Reconnection successful!");
        setLastCheckStatus(true);
        updateTimeDisplay();
        return;
      }
      
      console.log("Reconnection failed, scheduling next attempt...");
      
      // If not successful and we're still mounted and reconnect is still enabled,
      // schedule another attempt - but don't create nested timers
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(startReconnectAttempts, 30000); // Try every 30 seconds
    };
    
    // If connection is lost and auto-reconnect is enabled, start attempting to reconnect
    if (lastCheckStatus === false && autoReconnectEnabled) {
      console.log("Connection lost, starting reconnection process...");
      // Clear any existing timer before setting a new one
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(startReconnectAttempts, 5000); // First attempt after 5 seconds
    }
    
    return () => {
      // Clean up timer on unmount or when dependencies change
      if (reconnectTimer) {
        console.log("Clearing reconnect timer...");
        clearTimeout(reconnectTimer);
      }
    };
  }, [lastCheckStatus, autoReconnectEnabled, updateTimeDisplay]);
  
  // Perform an initial health check when the component mounts
  useEffect(() => {
    console.log("HealthCheckProvider mounted, performing initial check");
    
    // Only do initial check if not already checking
    if (!isCheckingHealth && lastCheckStatus === null) {
      forceHealthCheck();
    }
    
    // Add event listener for online/offline events
    const handleOnline = () => {
      console.log("Browser reports online status. Checking database connection...");
      forceHealthCheck();
    };
    
    window.addEventListener("online", handleOnline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [forceHealthCheck, isCheckingHealth, lastCheckStatus, timerInterval]);
  
  return (
    <HealthCheckContext.Provider 
      value={{ 
        lastCheckStatus, 
        timeSinceLastConnection,
        isCheckingHealth,
        forceHealthCheck,
        autoReconnectEnabled,
        toggleAutoReconnect
      }}
    >
      {children}
    </HealthCheckContext.Provider>
  );
};

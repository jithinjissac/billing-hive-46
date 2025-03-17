
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
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  
  // Function to update the time display
  const updateTimeDisplay = useCallback(() => {
    setTimeSinceLastConnection(getTimeSinceLastConnection());
  }, []);
  
  // Function to force a health check
  const forceHealthCheck = useCallback(async () => {
    try {
      if (isCheckingHealth) return;
      
      setIsCheckingHealth(true);
      const status = await performHealthCheck();
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
    const interval = setInterval(() => {
      updateTimeDisplay();
    }, 30000); // Update every 30 seconds
    
    setTimerInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [updateTimeDisplay]);
  
  // Effect for auto-reconnection attempts
  useEffect(() => {
    let reconnectTimer: number | null = null;
    
    const startReconnectAttempts = async () => {
      if (!autoReconnectEnabled || lastCheckStatus !== false) return;
      
      // Try to reconnect and if successful, clear the timer
      const success = await attemptReconnect();
      if (success) {
        setLastCheckStatus(true);
        updateTimeDisplay();
        if (reconnectTimer) window.clearTimeout(reconnectTimer);
        return;
      }
      
      // If not successful, schedule another attempt
      reconnectTimer = window.setTimeout(startReconnectAttempts, 30000); // Try every 30 seconds
    };
    
    // If connection is lost and auto-reconnect is enabled, start attempting to reconnect
    if (lastCheckStatus === false && autoReconnectEnabled) {
      reconnectTimer = window.setTimeout(startReconnectAttempts, 5000); // First attempt after 5 seconds
    }
    
    return () => {
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
    };
  }, [lastCheckStatus, autoReconnectEnabled, updateTimeDisplay]);
  
  // Perform an initial health check when the component mounts
  useEffect(() => {
    forceHealthCheck();
    
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
  }, [forceHealthCheck, timerInterval]);
  
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

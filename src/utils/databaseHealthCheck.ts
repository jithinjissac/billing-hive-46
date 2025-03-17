
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Store the last successful connection time
let lastSuccessfulConnection: Date | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

/**
 * Clears any app-specific caches that need periodic refreshing
 */
export const clearCaches = (): void => {
  // Clear any localStorage or sessionStorage caches that might need to be refreshed
  const cachesToClear = ['recent-invoices', 'dashboard-stats'];
  
  cachesToClear.forEach(cacheKey => {
    try {
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error(`Failed to clear cache: ${cacheKey}`, error);
    }
  });
  
  console.log("Cache clearing complete");
};

/**
 * Performs a health check on the database connection
 * @param showToasts Whether to show toast notifications
 * @returns Promise resolving to a boolean indicating if the database is accessible
 */
export const checkDatabaseConnection = async (showToasts = true): Promise<boolean> => {
  try {
    console.log("Checking database connection...");
    
    // Attempt a simple query to verify database connectivity
    const { data, error } = await supabase
      .from('company_settings')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    // Update last successful connection time
    lastSuccessfulConnection = new Date();
    reconnectAttempts = 0;
    
    console.log("Database connection successful!");
    
    // Show success toast for reconnection
    if (showToasts && reconnectAttempts > 0) {
      toast.success("Database connection restored", {
        description: "Your connection to the database has been restored.",
        duration: 3000
      });
    }
    
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    console.error("Database connectivity check failed:", errorMessage);
    
    // Only show toast for errors if we previously had a successful connection
    // or if this is the first check (lastSuccessfulConnection is null)
    if (showToasts && (lastSuccessfulConnection || lastSuccessfulConnection === null)) {
      toast.error("Database connection error", {
        description: "Failed to connect to the database. Please check your internet connection or try again later.",
        duration: 5000
      });
    }
    
    reconnectAttempts++;
    return false;
  }
};

/**
 * Performs both cache clearing and database check
 * @param showToasts Whether to show toast notifications
 */
export const performHealthCheck = async (showToasts = true): Promise<boolean> => {
  // First clear caches
  clearCaches();
  
  // Then check database connection
  return await checkDatabaseConnection(showToasts);
};

/**
 * Gets the time since the last successful database connection
 * @returns String representation of time elapsed or "Never" if no successful connection
 */
export const getTimeSinceLastConnection = (): string => {
  if (!lastSuccessfulConnection) {
    return "Never";
  }
  
  const now = new Date();
  const diffMs = now.getTime() - lastSuccessfulConnection.getTime();
  
  // Convert to seconds
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) {
    return `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;
  }
  
  // Convert to minutes
  const diffMin = Math.floor(diffSec / 60);
  
  if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  }
  
  // Convert to hours
  const diffHour = Math.floor(diffMin / 60);
  return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
};

/**
 * Attempts to reconnect to the database after a connection failure
 * @param maxAttempts Maximum number of reconnection attempts
 * @param delayMs Delay between reconnection attempts in milliseconds
 * @returns Promise that resolves to true if reconnection was successful, false otherwise
 */
export const attemptReconnect = async (
  maxAttempts = MAX_RECONNECT_ATTEMPTS, 
  delayMs = 5000
): Promise<boolean> => {
  console.log(`Attempting to reconnect to database (attempt ${reconnectAttempts}/${maxAttempts})...`);
  
  if (reconnectAttempts >= maxAttempts) {
    console.log("Maximum reconnection attempts reached. Giving up.");
    return false;
  }
  
  // Wait for the specified delay
  await new Promise(resolve => setTimeout(resolve, delayMs));
  
  // Try to reconnect
  const result = await performHealthCheck(false);
  
  if (result) {
    console.log("Reconnection successful!");
    reconnectAttempts = 0;
    return true;
  }
  
  console.log("Reconnection failed. Will try again later.");
  return false;
};

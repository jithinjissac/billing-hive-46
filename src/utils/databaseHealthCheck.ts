
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Store the last successful connection time
let lastSuccessfulConnection: Date | null = null;

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
 * @returns Promise resolving to a boolean indicating if the database is accessible
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Attempt a simple query to verify database connectivity
    const { data, error } = await supabase
      .from('company_settings')
      .select('id')
      .limit(1)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Update last successful connection time
    lastSuccessfulConnection = new Date();
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    console.error("Database connectivity check failed:", errorMessage);
    
    // Only show toast for errors if we previously had a successful connection
    // or if this is the first check (lastSuccessfulConnection is null)
    if (lastSuccessfulConnection || lastSuccessfulConnection === null) {
      toast.error("Database connection error", {
        description: "Failed to connect to the database. Please check your internet connection or try again later.",
        duration: 5000
      });
    }
    
    return false;
  }
};

/**
 * Performs both cache clearing and database check
 */
export const performHealthCheck = async (): Promise<void> => {
  // First clear caches
  clearCaches();
  
  // Then check database connection
  await checkDatabaseConnection();
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

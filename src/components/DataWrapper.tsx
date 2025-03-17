
import React from 'react';

interface DataWrapperProps<T> {
  data: T | null | undefined;
  error?: any;
  isLoading?: boolean;
  children: (data: T) => React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode | ((error: any) => React.ReactNode);
}

/**
 * A wrapper component that handles data loading, error states, and renders children only when data is available
 * This helps avoid type checking and null checks throughout the codebase
 */
function DataWrapper<T>({
  data,
  error,
  isLoading = false,
  children,
  fallback = null,
  loadingFallback = null,
  errorFallback = null
}: DataWrapperProps<T>) {
  // Show loading state if explicitly loading
  if (isLoading) {
    return loadingFallback ? (
      <>{loadingFallback}</>
    ) : (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    if (typeof errorFallback === 'function') {
      return <>{errorFallback(error)}</>;
    }
    
    return errorFallback ? (
      <>{errorFallback}</>
    ) : (
      <div className="text-red-500 p-4">
        Error loading data: {error.message || 'Unknown error'}
      </div>
    );
  }

  // Show fallback if data is missing
  if (!data) {
    return <>{fallback}</>;
  }

  // Render children with the data
  return <>{children(data)}</>;
}

export default DataWrapper;

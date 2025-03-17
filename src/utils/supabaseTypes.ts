
/**
 * Type utilities for Supabase operations
 * This helps bridge the gap between our application types and Supabase's generated types
 */

import { Database } from '@/integrations/supabase/types';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Generic type for Supabase query responses
 */
export type SupabaseResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
};

/**
 * Type for handling data that might be a Supabase error
 */
export type MaybeError<T> = T | PostgrestError;

/**
 * Helper type to make Supabase's unknown table format more explicitly typed
 */
export type SupabaseTable<TableName extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][TableName];

/**
 * Helper type to get the row type for a specific table
 */
export type TableRow<TableName extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][TableName]['Row'];

/**
 * Helper type to get the insert type for a specific table
 */
export type TableInsert<TableName extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][TableName]['Insert'];

/**
 * Helper type to get the update type for a specific table
 */
export type TableUpdate<TableName extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][TableName]['Update'];

/**
 * Assert that a value is not null or undefined
 * @param value Value to check
 * @param message Error message
 * @returns The value if it's not null or undefined
 */
export function assertDefined<T>(value: T | null | undefined, message: string = 'Value is undefined'): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value;
}

/**
 * Handle Supabase errors gracefully
 * @param response Supabase response
 * @param defaultValue Default value to return if there's an error
 * @returns Data if successful, default value otherwise
 */
export function handleSupabaseData<T>(
  response: SupabaseResponse<T>, 
  defaultValue: T
): T {
  if (response.error) {
    console.error('Supabase error:', response.error);
    return defaultValue;
  }
  return response.data || defaultValue;
}

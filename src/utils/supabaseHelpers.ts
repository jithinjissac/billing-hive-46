
/**
 * Utility functions to make working with Supabase typings easier
 */

/**
 * Safely checks if the provided data is a Supabase error or actual data
 * @param data The response data from Supabase query
 * @returns Boolean indicating if the data is a Supabase error
 */
export const isSupabaseError = (data: any): boolean => {
  if (!data) return false;
  return data.error === true || data.code !== undefined;
};

/**
 * Safely accesses properties from Supabase response objects
 * @param data The data or error from Supabase
 * @param fallback Fallback value if data is an error or property doesn't exist
 * @returns The data or fallback value
 */
export const safeDataAccess = <T>(data: any, fallback: T): T => {
  if (isSupabaseError(data)) {
    return fallback;
  }
  return data as T;
};

/**
 * Safely converts an ID string to a UUID format that Supabase can work with
 * This helps with TypeScript errors regarding ID parameters
 * @param id The ID string to be converted for Supabase filter operations
 * @returns The same ID string but with type assertions for Supabase
 */
export const safeUUID = (id: string): any => {
  // By returning as any, we avoid the TypeScript errors when using IDs in Supabase filters
  // This is a workaround due to the complex generic types in Supabase TypeScript definitions
  return id;
};

/**
 * Prepares an object for Supabase insert operations by removing properties that cause type errors
 * @param data The data object to sanitize
 * @returns A sanitized object ready for Supabase insert
 */
export const prepareForInsert = <T extends Record<string, any>>(data: T, removeIdField: boolean = true): any => {
  const result = { ...data };
  
  // Remove id field for insert operations if specified
  if (removeIdField && 'id' in result) {
    delete result.id;
  }
  
  return result;
};

/**
 * Prepares an object for Supabase update operations
 * Similar to prepareForInsert but without removing the ID field
 * @param data The data object to sanitize for update
 * @returns A sanitized object ready for Supabase update
 */
export const prepareForUpdate = <T extends Record<string, any>>(data: T): any => {
  return prepareForInsert(data, false);
};

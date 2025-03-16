
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xjsjknmyocyihutrhsyg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc2prbm15b2N5aWh1dHJoc3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwODkyNzcsImV4cCI6MjA1NzY2NTI3N30.pHPCymZBzaiSYHoNlEjiGI1cbNmJNgMNu8Q7a7MNdMM";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Function to create a public bucket via edge function
export const createPublicBucket = async (bucketName: string) => {
  try {
    console.log(`Attempting to create public bucket: ${bucketName}`);
    
    // Call the edge function to create a bucket with public access
    const { data, error } = await supabase.functions.invoke('create-storage-bucket', {
      body: { bucketName }
    });
    
    if (error) {
      console.error('Error creating public bucket:', error);
      throw error;
    }
    
    console.log('Bucket created successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to create public bucket:', error);
    throw error;
  }
};

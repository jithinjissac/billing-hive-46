
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
    
    // First check if bucket exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
    } else {
      const bucketExists = existingBuckets?.some(b => b.name === bucketName);
      
      if (bucketExists) {
        console.log(`Bucket ${bucketName} already exists, updating permissions...`);
        
        // Try to update bucket directly
        try {
          // Update existing bucket to ensure it's public
          await supabase.storage.updateBucket(bucketName, {
            public: true,
            fileSizeLimit: 5242880,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
          });
          
          console.log(`Updated bucket ${bucketName} to be public`);
          return { success: true, message: `Bucket ${bucketName} permissions updated` };
        } catch (policyError) {
          console.error('Error updating bucket policies:', policyError);
          // Continue to edge function as fallback
        }
      } else {
        // Try to create bucket directly with public access
        try {
          const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 5242880,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
          });
          
          if (!createError) {
            console.log(`Successfully created public bucket ${bucketName}`);
            return { success: true, message: `Bucket ${bucketName} created successfully` };
          }
        } catch (createBucketError) {
          console.error('Error creating bucket directly:', createBucketError);
        }
      }
    }
    
    // Use edge function as fallback if direct methods failed
    console.log(`Using edge function to ensure bucket ${bucketName} is public...`);
    const { data, error } = await supabase.functions.invoke('create-storage-bucket', {
      body: { bucketName }
    });
    
    if (error) {
      console.error('Error invoking create-storage-bucket function:', error);
      throw error;
    }
    
    console.log('Bucket creation/update response from edge function:', data);
    
    // Add delay to allow policies to propagate
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return data;
  } catch (error) {
    console.error('Failed to create/update public bucket:', error);
    throw error;
  }
};

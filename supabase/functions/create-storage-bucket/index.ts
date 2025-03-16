
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the bucket name from the request
    const { bucketName } = await req.json();
    const bucket = bucketName || 'profile-pictures'; // Default to profile-pictures if not specified
    
    console.log(`Processing request to create/update bucket: ${bucket}`);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    
    if (!supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Service role key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
    
    // First try listing buckets to check if it already exists
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return new Response(
        JSON.stringify({ error: bucketsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const bucketExists = buckets?.some(b => b.name === bucket)
    let bucketCreated = false
    
    if (!bucketExists) {
      console.log(`Creating bucket: ${bucket}`);
      // Create bucket with public access
      const { error } = await supabaseAdmin.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      })
      
      if (error) {
        console.error("Error creating bucket:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      bucketCreated = true
    } else {
      console.log(`Bucket ${bucket} already exists, updating to public and refreshing policies`);
      
      // Update existing bucket to ensure it's public
      try {
        await supabaseAdmin.storage.updateBucket(bucket, {
          public: true,
          fileSizeLimit: 5242880,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        });
      } catch (updateError) {
        console.error("Error updating bucket:", updateError);
        // Continue anyway to update policies
      }
    }
    
    // Delete any existing policies first
    try {
      const { data: policies } = await supabaseAdmin.storage.from(bucket).getPolicies();
      
      if (policies) {
        console.log(`Found ${policies.length} existing policies, removing them...`);
        for (const policy of policies) {
          console.log(`Removing policy: ${policy.name}`);
          try {
            await supabaseAdmin.storage.from(bucket).deletePolicy(policy.name);
          } catch (err) {
            console.error(`Error deleting policy ${policy.name}:`, err);
          }
        }
      }
    } catch (policiesError) {
      console.error("Error getting policies:", policiesError);
    }
    
    // Create completely open policy
    console.log("Creating new open access policy...");
    try {
      const { error: policyError } = await supabaseAdmin
        .storage
        .from(bucket)
        .createPolicy(
          'allow-public-access',
          {
            definition: "TRUE",
            allowedOperations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
          }
        );
      
      if (policyError) {
        console.error("Error creating policy:", policyError);
      } else {
        console.log("Successfully created policy: allow-public-access");
      }
    } catch (policyError) {
      console.error("Error creating policy:", policyError);
    }
    
    // Ensure RLS is disabled (just in case)
    console.log("Executing SQL to ensure bucket is fully public...");
    try {
      const { error: sqlError } = await supabaseAdmin.rpc('set_bucket_public', { 
        bucket_name: bucket 
      });
      
      if (sqlError) {
        console.error("Error running SQL fallback:", sqlError);
        
        // Try direct SQL as last resort
        try {
          const { error: directSqlError } = await supabaseAdmin.rpc('execute_sql', {
            sql: `
              -- Make bucket public
              UPDATE storage.buckets SET public = TRUE WHERE name = '${bucket}';
              
              -- Remove any RLS if present
              ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
              
              -- Re-enable with open policy
              ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
            `
          });
          
          if (directSqlError) {
            console.error("Error with direct SQL execution:", directSqlError);
          }
        } catch (directErr) {
          console.error("Error with direct SQL execution:", directErr);
        }
      }
    } catch (sqlErr) {
      console.error("Error with SQL operations:", sqlErr);
    }
    
    return new Response(
      JSON.stringify({ 
        message: `Bucket ${bucket} configured with open access policy`,
        bucket: bucket,
        created: bucketCreated,
        public: true
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

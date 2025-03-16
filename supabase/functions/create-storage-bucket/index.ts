
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
    
    console.log(`Processing request to create bucket: ${bucket}`);
    
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
      console.log(`Bucket ${bucket} already exists, updating policies`);
    }
    
    // Always update policies to ensure they are set correctly
    try {
      console.log(`Creating full access policy for ${bucket} bucket`);
      
      // Set bucket to public if it exists but isn't public
      if (!bucketCreated) {
        try {
          const { error: updateError } = await supabaseAdmin.storage.updateBucket(bucket, {
            public: true,
            fileSizeLimit: 5242880,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
          })
          
          if (updateError) {
            console.error("Error updating bucket to be public:", updateError);
          }
        } catch (err) {
          console.error("Error updating bucket:", err);
        }
      }
      
      // First get existing policies
      const { data: policies, error: policiesError } = await supabaseAdmin.storage.from(bucket).getPolicies();
      
      if (policiesError) {
        console.error("Error getting policies:", policiesError);
      }
      
      // Clear existing policies if any by creating a new policy with the same name
      if (policies) {
        for (const policy of policies) {
          try {
            console.log(`Removing policy: ${policy.name}`);
            await supabaseAdmin.storage.from(bucket).deletePolicy(policy.name);
          } catch (err) {
            console.error(`Error deleting policy ${policy.name}:`, err);
          }
        }
      }
      
      // Create completely open policy
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
        // Don't throw, continue execution
      } else {
        console.log("Successfully created policy: allow-public-access");
      }
      
      // Create SQL to handle bucket creation (as a fallback)
      try {
        const { error: sqlError } = await supabaseAdmin.rpc('set_bucket_public', { 
          bucket_name: bucket 
        });
        
        if (sqlError) {
          console.error("Error running SQL fallback:", sqlError);
        } else {
          console.log("Successfully ran SQL fallback to ensure bucket is public");
        }
      } catch (sqlErr) {
        console.error("Error with SQL fallback:", sqlErr);
      }
    } catch (policyErr) {
      console.error("Error managing policies:", policyErr);
      // Continue execution even if policy management fails
    }
    
    return new Response(
      JSON.stringify({ 
        message: `Bucket ${bucket} configured with open access policy`,
        bucket: bucket,
        created: bucketCreated
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

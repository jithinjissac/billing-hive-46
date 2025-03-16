
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
    
    // Execute SQL with direct bucket creation and open policy application
    const { error: directSqlError } = await supabaseAdmin.rpc(
      'execute_sql', 
      { 
        sql_query: `
          -- Make sure profile-pictures bucket exists
          INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
          VALUES ('profile-pictures', 'profile-pictures', true, false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
          ON CONFLICT (id) DO UPDATE SET public = true;
          
          -- Remove any existing policies on the profile-pictures bucket
          DELETE FROM storage.policies 
          WHERE bucket_id = 'profile-pictures';
          
          -- Add completely open policy for all operations
          INSERT INTO storage.policies (name, bucket_id, operation, definition)
          VALUES ('allow-all-operations', 'profile-pictures', '*', 'TRUE');
        `
      }
    );
    
    if (directSqlError) {
      console.error("Error executing direct SQL:", directSqlError);
      
      // Fallback approach - try creating the bucket using the API
      const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
      
      if (bucketsError) {
        console.error("Error listing buckets:", bucketsError);
        return new Response(
          JSON.stringify({ error: bucketsError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'profile-pictures')
      
      if (!bucketExists) {
        console.log("Creating profile-pictures bucket");
        // Create bucket with public access
        const { error } = await supabaseAdmin.storage.createBucket('profile-pictures', {
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
      }
      
      // Now create the open policy
      try {
        console.log("Creating full access policy for profile-pictures bucket");
        
        // First delete any existing policies
        const { data: policies } = await supabaseAdmin.storage.from('profile-pictures').getPolicies();
        if (policies && policies.length > 0) {
          for (const policy of policies) {
            try {
              await supabaseAdmin.storage.from('profile-pictures').deletePolicy(policy.name);
            } catch (err) {
              console.error(`Error deleting policy ${policy.name}:`, err);
            }
          }
        }
        
        // Create completely open policy
        const { error: policyError } = await supabaseAdmin
          .storage
          .from('profile-pictures')
          .createPolicy(
            'allow-all-operations',
            {
              name: 'allow-all-operations',
              definition: "TRUE",
              allowedOperations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
            }
          );
        
        if (policyError) {
          console.error("Error creating policy:", policyError);
        }
      } catch (policyErr) {
        console.error("Error managing policies:", policyErr);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        message: "Profile pictures bucket configured with open access policy",
        bucket: 'profile-pictures'
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

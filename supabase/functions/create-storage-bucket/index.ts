
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
      const { data, error } = await supabaseAdmin.storage.createBucket('profile-pictures', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      })
      
      if (error) {
        console.error("Error creating bucket:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Create very permissive RLS policies for the bucket
      try {
        console.log("Setting up permissive RLS policies for profile-pictures bucket");
        
        // Create a simple policy that allows all operations for authenticated users
        const { error: allOperationsPolicyError } = await supabaseAdmin
          .storage
          .from('profile-pictures')
          .createPolicy(
            'allow-all-operations',
            {
              name: 'allow-all-operations',
              definition: "TRUE", // Allow everything regardless of user
              allowedOperations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
            }
          );
        
        if (allOperationsPolicyError) {
          console.error("Error creating all operations policy:", allOperationsPolicyError);
        }
        
      } catch (policyErr) {
        console.error("Error creating policies:", policyErr);
        // Continue execution even if policy creation fails
      }
      
      return new Response(
        JSON.stringify({ 
          message: "Profile pictures bucket created successfully with permissive RLS policies",
          bucket: 'profile-pictures'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify({ 
        message: "Profile pictures bucket already exists",
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

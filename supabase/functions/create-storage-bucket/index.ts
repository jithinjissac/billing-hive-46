
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
        fileSizeLimit: 5242880, // 5MB (increased from 2MB)
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      })
      
      if (error) {
        console.error("Error creating bucket:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Create simplified policies without using deprecated API methods
      try {
        console.log("Creating policies for profile-pictures bucket");

        // Public policy for all operations
        const { error: policyError } = await supabaseAdmin
          .storage
          .from('profile-pictures')
          .createPolicy('public-policy', {
            name: 'public-policy',
            definition: "true", // Allow all operations for all users
            allowedOperations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
          });
        
        if (policyError) {
          console.error("Error creating public policy:", policyError);
          // Continue execution even if policy creation fails
        }
        
      } catch (policyErr) {
        console.error("Error creating policies:", policyErr);
        // Continue execution even if policy creation fails
      }
      
      return new Response(
        JSON.stringify({ 
          message: "Profile pictures bucket created successfully",
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


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
        fileSizeLimit: 2097152, // 2MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      })
      
      if (error) {
        console.error("Error creating bucket:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Create policy to allow authenticated users to upload their own files
      try {
        console.log("Creating policies for profile-pictures bucket");
        
        // Policy for authenticated uploads
        const { error: policyError1 } = await supabaseAdmin
          .storage
          .from('profile-pictures')
          .createPolicy('authenticated-uploads', {
            name: 'authenticated-uploads',
            definition: "(bucket_id = 'profile-pictures'::text) AND (auth.role() = 'authenticated'::text)"
          });
        
        if (policyError1) {
          console.error("Error creating authenticated uploads policy:", policyError1);
        }
        
        // Policy for public downloads
        const { error: policyError2 } = await supabaseAdmin
          .storage
          .from('profile-pictures')
          .createPolicy('public-downloads', {
            name: 'public-downloads',
            definition: "(bucket_id = 'profile-pictures'::text)",
            allowedOperations: ['SELECT']
          });
        
        if (policyError2) {
          console.error("Error creating public downloads policy:", policyError2);
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

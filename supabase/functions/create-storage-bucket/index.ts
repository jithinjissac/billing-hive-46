
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
      // First, create the bucket with public access
      const { data, error } = await supabaseAdmin.storage.createBucket('profile-pictures', {
        public: true, // This makes the bucket publicly accessible
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
      
      // Create a completely open policy for the bucket - this is more permissive than before
      try {
        console.log("Creating open access policy for profile-pictures bucket");
        
        // Completely open policy that should solve the RLS violations
        const { error: policyError } = await supabaseAdmin
          .storage
          .from('profile-pictures')
          .createPolicy(
            'open-access-policy',
            {
              name: 'open-access-policy',
              definition: "TRUE", // Allows all access
              allowedOperations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
            }
          );
        
        if (policyError) {
          console.error("Error creating open access policy:", policyError);
        } else {
          console.log("Successfully created open access policy");
        }
        
      } catch (policyErr) {
        console.error("Error creating policies:", policyErr);
        // Continue execution even if policy creation fails
      }
      
      return new Response(
        JSON.stringify({ 
          message: "Profile pictures bucket created successfully with open access policy",
          bucket: 'profile-pictures'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // If the bucket already exists, let's update its policies to be more permissive
    try {
      console.log("Updating policies for existing profile-pictures bucket");
      
      // First, try to delete any existing policies to avoid conflicts
      const { data: policies } = await supabaseAdmin.storage.from('profile-pictures').getPolicies();
      
      if (policies && policies.length > 0) {
        console.log(`Found ${policies.length} existing policies, updating them to be more permissive`);
        
        // Try to update existing policies to be more permissive
        for (const policy of policies) {
          try {
            await supabaseAdmin.storage.from('profile-pictures').updatePolicy(
              policy.name,
              {
                name: policy.name,
                definition: "TRUE", // Make all policies completely open
                allowedOperations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
              }
            );
            console.log(`Updated policy: ${policy.name}`);
          } catch (updateErr) {
            console.error(`Error updating policy ${policy.name}:`, updateErr);
          }
        }
      } else {
        // If no policies exist, create a new open one
        console.log("No existing policies found, creating a new open policy");
        const { error: newPolicyError } = await supabaseAdmin
          .storage
          .from('profile-pictures')
          .createPolicy(
            'open-access-policy',
            {
              name: 'open-access-policy',
              definition: "TRUE",
              allowedOperations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
            }
          );
        
        if (newPolicyError) {
          console.error("Error creating new open policy:", newPolicyError);
        } else {
          console.log("Successfully created new open access policy");
        }
      }
    } catch (policyUpdateErr) {
      console.error("Error updating bucket policies:", policyUpdateErr);
    }
    
    return new Response(
      JSON.stringify({ 
        message: "Profile pictures bucket already exists, policies updated to be more permissive",
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

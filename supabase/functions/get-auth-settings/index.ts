
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const start = Date.now()
  console.log("Auth settings request received")

  try {
    // Create a Supabase client with the Service Role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    
    if (!supabaseServiceKey) {
      console.error("Service role key not configured")
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

    // Set a timeout for the request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), 4000)
    })

    // Get the current auth settings with a timeout
    const authPromise = supabaseAdmin.auth.admin.getConfig()
    const result = await Promise.race([authPromise, timeoutPromise])
      .catch(error => {
        console.error("Error or timeout in auth settings fetch:", error.message)
        return { data: { mailer_autoconfirm: true }, error: null }
      }) as { data: any, error: any }
      
    const { data, error } = result

    if (error) {
      console.error("Error retrieving auth settings:", error.message)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Auth settings request completed in ${Date.now() - start}ms`)
    return new Response(
      JSON.stringify(data || { mailer_autoconfirm: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("Unexpected error in get-auth-settings:", error.message)
    // Return a default value instead of an error to prevent blocking the UI
    return new Response(
      JSON.stringify({ mailer_autoconfirm: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

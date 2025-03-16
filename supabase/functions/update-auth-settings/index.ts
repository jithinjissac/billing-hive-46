
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

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a Supabase client with the Service Role key
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

    // Get the public site URL from the request or fallback to a default
    const { siteUrl } = await req.json()
    const baseUrl = siteUrl || Deno.env.get("SITE_URL") || "http://localhost:5173"
    console.log("Using site URL:", baseUrl)

    // Update the auth email settings
    const { error } = await supabaseAdmin.auth.admin.updateConfig({
      email_template_forgot_password: {
        subject: "Reset your TechiusPay password",
        content: `<h2>Hello,</h2>
        <p>Click the link below to reset your TechiusPay password:</p>
        <p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>{{ .ConfirmationURL }}</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Thanks,<br>The TechiusPay Team</p>`,
      },
      email_template_magic_link: {
        subject: "Your TechiusPay Magic Link",
        content: `<h2>Hello,</h2>
        <p>Click the link below to log in to TechiusPay:</p>
        <p><a href="{{ .ConfirmationURL }}">Log In</a></p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>{{ .ConfirmationURL }}</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Thanks,<br>The TechiusPay Team</p>`,
      },
      email_template_confirmation: {
        subject: "Confirm your TechiusPay account",
        content: `<h2>Welcome to TechiusPay!</h2>
        <p>Click the link below to confirm your account:</p>
        <p><a href="{{ .ConfirmationURL }}">Confirm Account</a></p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>{{ .ConfirmationURL }}</p>
        <p>If you didn't create this account, please ignore this email.</p>
        <p>Thanks,<br>The TechiusPay Team</p>`,
      },
      email_template_change_email: {
        subject: "Confirm your new TechiusPay email",
        content: `<h2>Hello,</h2>
        <p>Click the link below to confirm your new email address:</p>
        <p><a href="{{ .ConfirmationURL }}">Confirm New Email</a></p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>{{ .ConfirmationURL }}</p>
        <p>If you didn't request this change, please ignore this email.</p>
        <p>Thanks,<br>The TechiusPay Team</p>`,
      },
      mailer_sender_name: "TechiusPay",
      mailer_autoconfirm: false,
      sms_provider: "twilio",
      sms_template_verification: "Your TechiusPay verification code is: {{ .Code }}",
      sms_template_invite: "You've been invited to TechiusPay. {{ .Code }}",
      sms_template_reset_password: "Reset your TechiusPay password. {{ .Code }}",
      sms_template_mfa: "Your TechiusPay multi-factor authentication code is: {{ .Code }}",
      redirect_urls: {
        allow_open_registration: true,
        email_confirmation_path: `${baseUrl}/auth/login?confirmation=success`,
        email_change_email_address_path: `${baseUrl}/auth/login?email_change=success`,
        reset_password_path: `${baseUrl}/auth/update-password`,
        recovery_path: `${baseUrl}/auth/update-password`,
        invite_path: `${baseUrl}/auth/signup`,
      },
    })

    if (error) {
      console.error("Error updating auth settings:", error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: "Auth settings updated successfully" }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("Unexpected error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

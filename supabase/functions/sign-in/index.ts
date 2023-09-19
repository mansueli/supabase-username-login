import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "sign-in" is up and running!`)

const options =  {
  auth: {
    flowType: 'implicit',
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
};

serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      options
    )
    const { email, password } = await req.json()
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      options
    )
    const { data: profileData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .or(`username.eq.${email},email.eq.${email}`)
      .limit(1)
      .maybeSingle();
    console.log("profileData:"+JSON.stringify(profileData, null, 2))
    if (userError) throw userError

    const { data: {session}, error } = await supabaseClient.auth.signInWithPassword({
      email: profileData.email,
      password: password,
    })
    if (error) throw error
    console.log("data:"+JSON.stringify(session, null, 2))
    return new Response(JSON.stringify(session), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

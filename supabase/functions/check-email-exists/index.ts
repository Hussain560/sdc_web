import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsJson = { ...corsHeaders, 'Content-Type': 'application/json' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'البريد الإلكتروني مطلوب' }), {
        status: 400,
        headers: corsJson,
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    let exists = false;
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;

      if (data.users.some((u) => u.email?.toLowerCase() === normalizedEmail)) {
        exists = true;
        break;
      }

      if (data.users.length < perPage) break;
      page += 1;
    }

    return new Response(JSON.stringify({ exists }), { headers: corsJson });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsJson,
    });
  }
});

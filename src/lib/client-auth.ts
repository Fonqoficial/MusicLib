const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

async function createSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Login function
async function login(email, password) {
  const supabase = await createSupabaseClient();
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export { login };
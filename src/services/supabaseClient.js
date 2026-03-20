import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://parvlcffmaufvyaoyica.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bXR2KzMrDFAeIxr9d4BLlg_DDF2OkQv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

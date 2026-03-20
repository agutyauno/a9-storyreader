// Supabase JS client initializer (browser-friendly + bundler fallback)
// Creates `window.supabaseClient` using either the CDN global `supabase`
// (recommended for simple pages) or the ESM package when available.
const SUPABASE_URL = 'https://parvlcffmaufvyaoyica.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bXR2KzMrDFAeIxr9d4BLlg_DDF2OkQv';

async function _createClient() {
  // If CDN script loaded, `window.supabase` exposes createClient
  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
      window.supabaseClient = client;
      return client;
    } catch (e) {
      console.warn('supabase-js-client: failed to init from CDN global', e);
    }
  }

  // Fallback: try dynamic import (for bundler/module environments)
  try {
    // dynamic import — rely on host bundler/environment to support it
    const mod = await import('@supabase/supabase-js');
    const createClient = mod.createClient || (mod.default && mod.default.createClient) || null;
    if (!createClient) throw new Error('createClient not found in imported module');
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    if (typeof window !== 'undefined') window.supabaseClient = client;
    return client;
  } catch (err) {
    console.warn('supabase-js-client: dynamic import failed; supabaseClient not available', err);
    return null;
  }
}

// Initialize immediately when loaded in browser
if (typeof window !== 'undefined') {
  // kick off async init but don't block
  _createClient().catch(() => {});
}

// Expose initializer for consumers (browser + CommonJS)
if (typeof window !== 'undefined') window.createSupabaseClient = _createClient;
if (typeof module !== 'undefined' && module.exports) module.exports = _createClient;

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://parvlcffmaufvyaoyica.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bXR2KzMrDFAeIxr9d4BLlg_DDF2OkQv';

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true }
});

// Centralized error handling for Unauthorized/Expired tokens
const handleAuthError = (error) => {
  const isAuthError = 
    error?.status === 401 || 
    error?.code === '401' || 
    error?.message?.toLowerCase().includes('jwt expired') ||
    error?.message?.toLowerCase().includes('invalid token') ||
    error?.message?.toLowerCase().includes('unauthorized');

  if (isAuthError) {
    console.error('Session expired or unauthorized:', error.message);
    // Clear and redirect
    client.auth.signOut().then(() => {
        if (!window.location.pathname.startsWith('/login')) {
            const currentPath = window.location.pathname;
            window.location.href = `/login?expired=true&from=${encodeURIComponent(currentPath)}`;
        }
    });
  }
};

// Proxify the client or wrap common methods
// For simplicity in this env, we'll wrap 'from' and 'functions.invoke'
const originalFrom = client.from.bind(client);
client.from = (...args) => {
    const queryBuilder = originalFrom(...args);
    // We need to wrap the final execution methods: select, insert, update, delete, etc.
    // This is complex for a deep chain, so instead we can encourage using a helper
    // or just handle it in the API layer.
    return queryBuilder;
};

// Wrapping functions.invoke is easier and very important for Edge Functions
const originalInvoke = client.functions.invoke.bind(client.functions);
client.functions.invoke = async (...args) => {
    try {
        const result = await originalInvoke(...args);
        if (result.error) handleAuthError(result.error);
        return result;
    } catch (err) {
        handleAuthError(err);
        throw err;
    }
};

export const supabase = client;

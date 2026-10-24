import { createClient } from '@supabase/supabase-js';

const PROXY_URL = 'https://a9-db-proxy.buihoainam2606.workers.dev';
const DIRECT_URL = 'https://parvlcffmaufvyaoyica.supabase.co';

const RAW_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || PROXY_URL;
const SUPABASE_URL = RAW_URL.replace(/\/+$/, '');
const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_bXR2KzMrDFAeIxr9d4BLlg_DDF2OkQv';

// Circuit breaker state for Proxy failover
let isProxyHealthy = true;
let lastProxyFailureTime = 0;
const PROXY_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes cooldown before retrying proxy

/**
 * Intelligent Fallback Fetch:
 * Prioritizes Cloudflare Worker proxy, automatically falls back to direct Supabase on any error or 5xx.
 * Enforces cache: 'no-store' and no-cache headers so browser HTTP disk/memory cache does not serve
 * stale responses when proxy returns 'Cache-Control: public, max-age=7200'.
 */
const fallbackFetch = async (input, init) => {
  const originalUrl = typeof input === 'string' ? input : (input?.url || '');
  const now = Date.now();

  // Build headers preventing browser and intermediate proxy caching
  const headers = new Headers(init?.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : {}));
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('x-bypass-cache', '1');

  const fetchInit = {
    ...init,
    cache: 'no-store',
    headers
  };

  const createTarget = (targetUrl) => {
    if (typeof Request !== 'undefined' && input instanceof Request) {
      return new Request(targetUrl, input);
    }
    return targetUrl;
  };

  // If proxy previously failed, check if cooldown period has passed
  const shouldTryProxy = isProxyHealthy || (now - lastProxyFailureTime > PROXY_COOLDOWN_MS);

  if (shouldTryProxy) {
    const proxyTargetUrl = originalUrl.replace(DIRECT_URL, PROXY_URL);
    try {
      const res = await fetch(createTarget(proxyTargetUrl), fetchInit);

      // If proxy server returns 5xx error or Cloudflare gateway error
      if (res.status >= 500) {
        console.warn(`[SupabaseClient] Proxy error HTTP ${res.status}. Switching to direct Supabase...`);
        isProxyHealthy = false;
        lastProxyFailureTime = now;
      } else {
        if (!isProxyHealthy) {
          console.log('[SupabaseClient] Proxy health restored.');
          isProxyHealthy = true;
        }
        return res;
      }
    } catch (err) {
      // Network error, CORS error, decoding failure, or timeout on proxy
      console.warn(`[SupabaseClient] Proxy network failure (${err.message}). Falling back to direct Supabase...`);
      isProxyHealthy = false;
      lastProxyFailureTime = now;
    }
  }

  // Fallback: Fetch directly from Supabase
  const directTargetUrl = originalUrl.replace(PROXY_URL, DIRECT_URL);
  return fetch(createTarget(directTargetUrl), fetchInit);
};

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Unify storage key so auth tokens are 100% shared whether using proxy or direct
    storageKey: 'sb-parvlcffmaufvyaoyica-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-bypass-cache': '1'
    },
    fetch: fallbackFetch
  }
});

let isRefreshing = false;
let refreshPromise = null;

/**
 * Attempts to silently refresh the session using the persistent refresh token.
 * Prevents multiple simultaneous refresh calls with deduplication.
 */
export const tryRefreshToken = async () => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const { data, error } = await client.auth.refreshSession();
      if (error || !data?.session) {
        return null;
      }
      return data.session;
    } catch (e) {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
};

// Centralized error handling for Unauthorized/Expired tokens
export const handleAuthError = async (error) => {
  const isAuthError =
    error?.status === 401 ||
    error?.code === '401' ||
    error?.message?.toLowerCase().includes('jwt expired') ||
    error?.message?.toLowerCase().includes('invalid token') ||
    error?.message?.toLowerCase().includes('unauthorized');

  if (isAuthError) {
    // 1. Try silent refresh first before throwing the user out!
    const newSession = await tryRefreshToken();
    if (newSession) {
      console.log('Session refreshed successfully via refresh token.');
      return newSession;
    }

    // 2. Refresh token is genuinely invalid or expired. Clear and redirect safely to HashRouter.
    console.error('Session expired and refresh failed. Redirecting to login...', error?.message);
    try {
      await client.auth.signOut();
    } catch (e) { }

    const currentHash = window.location.hash || '';
    if (!currentHash.startsWith('#/login')) {
      const returnUrl = encodeURIComponent(currentHash.replace(/^#/, ''));
      window.location.hash = `#/login?expired=true&from=${returnUrl}`;
    }
  }
  throw error;
};

// Centralized wrapper for functions.invoke with automatic token refresh and retry
const originalInvoke = client.functions.invoke.bind(client.functions);
client.functions.invoke = async (...args) => {
  try {
    const result = await originalInvoke(...args);
    if (result.error) {
      const isAuth = result.error?.status === 401 || result.error?.code === '401' || result.error?.message?.toLowerCase().includes('jwt expired');
      if (isAuth) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          return await originalInvoke(...args);
        }
      }
      await handleAuthError(result.error);
    }
    return result;
  } catch (err) {
    const isAuth = err?.status === 401 || err?.code === '401' || err?.message?.toLowerCase().includes('jwt expired');
    if (isAuth) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return await originalInvoke(...args);
      }
    }
    await handleAuthError(err);
    throw err;
  }
};

export const supabase = client;

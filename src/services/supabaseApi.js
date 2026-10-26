import { supabase, tryRefreshToken } from './supabaseClient';
import { mockDatabase } from '../utils/mockStoryData';
import { deleteFileFromGithub } from './githubService';
import { getAssetUrl } from '../utils/assetUtils';

// ─────────────────────────────────────────────────────────────────────────────
// TODO: Set to false when Supabase is fully configured.
// When false, every method calls Supabase directly.
// ─────────────────────────────────────────────────────────────────────────────
const USE_MOCK_DB = false;

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Sort any array by display_order (ascending) */
const sortByOrder = (arr) =>
  [...arr].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

/** Generate a simple timestamp-based ID */
const genId = (prefix) => `${prefix}_${Math.floor(Math.random() * 1000000)}`;
const genNumericId = () => Math.floor(Math.random() * 1000000000);

/** Generate a RFC4122 compliant UUID v4 string */
const generateUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) { }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/** Handle common Supabase errors, especially 401 Unauthorized, with auto-refresh */
const handleAuthError = async (error) => {
  const isAuthError =
    error?.status === 401 ||
    error?.code === '401' ||
    error?.message?.toLowerCase().includes('jwt expired') ||
    error?.message?.toLowerCase().includes('invalid token') ||
    error?.message?.toLowerCase().includes('unauthorized');

  if (isAuthError) {
    const newSession = await tryRefreshToken();
    if (newSession) {
      console.log('Session refreshed successfully in SupabaseAPI.');
      return newSession;
    }

    console.error('Session expired and refresh failed. Redirecting to login...', error?.message);
    try {
      await supabase.auth.signOut();
    } catch (e) { }

    const currentHash = window.location.hash || '';
    if (!currentHash.startsWith('#/login')) {
      const returnUrl = encodeURIComponent(currentHash.replace(/^#/, ''));
      window.location.hash = `#/login?expired=true&from=${returnUrl}`;
    }
  }
  throw error;
};

/** 
 * Strips the GitHub/jsDelivr prefix to store only the relative path in the DB 
 */
const cleanUrl = (url) => {
  if (!url || typeof url !== 'string') return url;

  let cleaned = url.trim().replace(/\\/g, '/');

  const prefixes = [
    'https://raw.githubusercontent.com/agutyauno/a9sr-data/main/',
    'https://raw.githubusercontent.com/agutyauno/a9-storyreader/main/',
    'https://cdn.jsdelivr.net/gh/agutyauno/a9sr-data@main/',
    'https://cdn.jsdelivr.net/gh/agutyauno/a9-storyreader@main/'
  ];

  for (const p of prefixes) {
    if (cleaned.startsWith(p)) {
      cleaned = '/' + cleaned.slice(p.length);
      break;
    }
  }
  return cleaned;
};

const cleanCombatInfo = (combatInfo) => {
  if (!combatInfo) return combatInfo;
  const cleaned = { ...combatInfo };
  if (Array.isArray(cleaned.skills)) {
    cleaned.skills = cleaned.skills.map(s => s ? { ...s, icon: cleanUrl(s.icon) } : s);
  }
  if (Array.isArray(cleaned.modules)) {
    cleaned.modules = cleaned.modules.map(m => m ? { ...m, icon: cleanUrl(m.icon), imageUrl: cleanUrl(m.imageUrl) } : m);
  }
  if (Array.isArray(cleaned.baseSkills)) {
    cleaned.baseSkills = cleaned.baseSkills.map(b => b ? { ...b, icon: cleanUrl(b.icon) } : b);
  }
  if (cleaned.token && cleaned.token.imageUrl) {
    cleaned.token = { ...cleaned.token, imageUrl: cleanUrl(cleaned.token.imageUrl) };
  }
  return cleaned;
};

// ─── TTL CONFIGURATION (ms) ───────────────────────────────────────────────────
export const API_CACHE_TTL = {
  REGIONS_ARCS: 60 * 60 * 1000,      // 1 hour max hard TTL
  EVENTS: 60 * 60 * 1000,            // 1 hour max hard TTL
  CHARACTERS: 60 * 60 * 1000,        // 1 hour max hard TTL
  ASSETS: 60 * 60 * 1000,            // 1 hour max hard TTL
  GALLERY: 60 * 60 * 1000,           // 1 hour max hard TTL
  STORIES_META: 60 * 60 * 1000,      // 1 hour max hard TTL
  STORY_CONTENT: 60 * 60 * 1000,     // 1 hour max hard TTL
};

// Stale-While-Revalidate window: after this duration, cached data is still served
// instantly (0ms) but an asynchronous background check runs to update any additions/deletions/edits
export const API_CACHE_STALE_TTL = {
  REGIONS_ARCS: 30 * 1000,           // 30 seconds
  EVENTS: 30 * 1000,                 // 30 seconds
  STORIES_META: 30 * 1000,           // 30 seconds
  CHARACTERS: 60 * 1000,             // 1 minute
  ASSETS: 60 * 1000,                 // 1 minute
  GALLERY: 60 * 1000,                // 1 minute
  STORY_CONTENT: 5 * 60 * 1000,      // 5 minutes
};

// Summary columns for story listings - excludes large 'story_content' JSON script
export const STORY_SUMMARY_COLUMNS = 'story_id, event_id, name, description, display_order, status';

const STORAGE_CACHE_PREFIX = 'a9_api_cache_';
const memoryCache = new Map();
const inFlightPromises = new Map();
const revalidatingKeys = new Set();

// Cross-tab broadcast synchronization
const CACHE_CHANNEL_NAME = 'ced_api_cache_sync';
let broadcastChannel = null;

if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    broadcastChannel = new BroadcastChannel(CACHE_CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      const msg = event.data;
      if (!msg) return;

      if (msg.type === 'invalidate' && msg.prefix) {
        const prefix = msg.prefix;
        for (const k of memoryCache.keys()) {
          if (k.startsWith(prefix)) memoryCache.delete(k);
        }
        inFlightPromises.clear();
        try {
          if (window.sessionStorage) {
            for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
              const k = window.sessionStorage.key(i);
              if (k && k.startsWith(STORAGE_CACHE_PREFIX + prefix)) {
                window.sessionStorage.removeItem(k);
              }
            }
          }
        } catch (e) { }

        // Local event for active components in this tab
        window.dispatchEvent(new CustomEvent('cedCacheInvalidated', { detail: { prefix } }));
      } else if (msg.type === 'clearAll') {
        memoryCache.clear();
        inFlightPromises.clear();
        try {
          if (window.sessionStorage) {
            for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
              const k = window.sessionStorage.key(i);
              if (k && k.startsWith(STORAGE_CACHE_PREFIX)) {
                window.sessionStorage.removeItem(k);
              }
            }
          }
        } catch (e) { }
        window.dispatchEvent(new CustomEvent('cedCacheInvalidated', { detail: { prefix: '' } }));
      } else if (msg.type === 'update' && msg.key && msg.data) {
        setCachedData(msg.key, msg.data);
        window.dispatchEvent(new CustomEvent('cedDataUpdated', { detail: { key: msg.key, data: msg.data } }));
      }
    };
  } catch (e) {
    broadcastChannel = null;
  }
}

function getCacheItem(key, ttl) {
  let mem = memoryCache.get(key);
  if (!mem) {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const raw = window.sessionStorage.getItem(STORAGE_CACHE_PREFIX + key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Date.now() - (parsed.time || 0) < ttl) {
            mem = parsed;
            memoryCache.set(key, parsed);
          } else {
            window.sessionStorage.removeItem(STORAGE_CACHE_PREFIX + key);
          }
        }
      }
    } catch (e) { }
  }

  if (mem && (Date.now() - (mem.time || 0) < ttl)) {
    return mem;
  }
  return null;
}

function getCachedData(key, ttl) {
  const item = getCacheItem(key, ttl);
  return item ? item.data : null;
}

function setCachedData(key, data) {
  const item = { data, time: Date.now() };
  memoryCache.set(key, item);
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(STORAGE_CACHE_PREFIX + key, JSON.stringify(item));
    }
  } catch (e) { }
}

function isDataEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const itemA = a[i];
      const itemB = b[i];
      if (itemA === itemB) continue;
      if (!itemA || !itemB) return false;
      const idA = itemA.id ?? itemA.region_id ?? itemA.arc_id ?? itemA.event_id ?? itemA.story_id ?? itemA.asset_id ?? itemA.character_id ?? itemA.gallery_id;
      const idB = itemB.id ?? itemB.region_id ?? itemB.arc_id ?? itemB.event_id ?? itemB.story_id ?? itemB.asset_id ?? itemB.character_id ?? itemB.gallery_id;
      if (idA !== undefined && idB !== undefined && idA !== idB) return false;
    }
  }
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (e) {
    return false;
  }
}

async function revalidateInBackground(key, fetcher, oldData) {
  if (revalidatingKeys.has(key)) return;
  revalidatingKeys.add(key);

  try {
    const freshResult = await fetcher();
    if (freshResult !== undefined && freshResult !== null) {
      const changed = !isDataEqual(oldData, freshResult);
      setCachedData(key, freshResult);

      if (changed) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cedDataUpdated', {
            detail: { key, data: freshResult }
          }));
        }
        if (broadcastChannel) {
          try {
            broadcastChannel.postMessage({ type: 'update', key, data: freshResult });
          } catch (e) { }
        }
      }
    }
  } catch (err) {
    console.warn(`[SupabaseAPI Cache] Background revalidation failed for ${key}:`, err?.message || err);
  } finally {
    revalidatingKeys.delete(key);
  }
}

export function invalidateCacheByPrefix(prefix) {
  for (const k of memoryCache.keys()) {
    if (k.startsWith(prefix)) memoryCache.delete(k);
  }
  inFlightPromises.clear();
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith(STORAGE_CACHE_PREFIX + prefix)) {
          window.sessionStorage.removeItem(k);
        }
      }
    }
  } catch (e) { }

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'invalidate', prefix });
    } catch (e) { }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cedCacheInvalidated', { detail: { prefix } }));
  }
}

export function clearAllApiCache() {
  memoryCache.clear();
  inFlightPromises.clear();
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith(STORAGE_CACHE_PREFIX)) {
          window.sessionStorage.removeItem(k);
        }
      }
    }
  } catch (e) { }

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'clearAll' });
    } catch (e) { }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cedCacheInvalidated', { detail: { prefix: '' } }));
  }
}

export function invalidateStoryTreeCache() {
  invalidateCacheByPrefix('tree');
  invalidateCacheByPrefix('regions');
  invalidateCacheByPrefix('arcs');
  invalidateCacheByPrefix('events');
  invalidateCacheByPrefix('stories');
}

export function invalidateAssetsCache() {
  invalidateCacheByPrefix('assets');
  invalidateCacheByPrefix('asset_');
  invalidateCacheByPrefix('characters');
  invalidateCacheByPrefix('character_');
  invalidateCacheByPrefix('expressions');
  invalidateCacheByPrefix('gallery');
}

async function fetchWithCache(key, ttl, fetcher, force = false, staleMs = 30 * 1000) {
  if (!force) {
    const item = getCacheItem(key, ttl);
    if (item !== null) {
      const age = Date.now() - (item.time || 0);
      // Fresh cache: return instantly
      if (age < staleMs) {
        return item.data;
      }
      // Stale cache: return cached data immediately (0ms) and revalidate in background (SWR)
      revalidateInBackground(key, fetcher, item.data);
      return item.data;
    }

    if (inFlightPromises.has(key)) {
      return inFlightPromises.get(key);
    }
  } else {
    memoryCache.delete(key);
    inFlightPromises.delete(key);
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(STORAGE_CACHE_PREFIX + key);
      }
    } catch (e) { }
  }

  const promise = (async () => {
    try {
      const result = await fetcher();
      if (result !== undefined && result !== null) {
        setCachedData(key, result);
      }
      return result;
    } finally {
      inFlightPromises.delete(key);
    }
  })();

  inFlightPromises.set(key, promise);
  return promise;
}

const SupabaseAPI_Raw = {
  // ===========================================================================
  // REGIONS
  // ===========================================================================
  async getRegions(options = {}) {
    const { force = false } = typeof options === 'boolean' ? { force: options } : options;
    return fetchWithCache('regions_all', API_CACHE_TTL.REGIONS_ARCS, async () => {
      if (USE_MOCK_DB) return sortByOrder(mockDatabase.regions);
      const { data, error } = await supabase.from('regions').select('*').order('display_order');
      if (error) throw error;
      return data || [];
    }, force);
  },

  async getRegion(regionId) {
    if (USE_MOCK_DB)
      return mockDatabase.regions.find(r => r.region_id === regionId) || null;
    try {
      const regions = await this.getRegions();
      return regions.find(r => r.region_id === regionId) || null;
    } catch (err) {
      throw err;
    }
  },

  async createRegion(payload) {
    invalidateCacheByPrefix('regions');
    invalidateCacheByPrefix('tree');
    if (USE_MOCK_DB) {
      const newItem = { region_id: genId('region'), display_order: 0, ...payload };
      mockDatabase.regions.push(newItem);
      return newItem;
    }
    const cleanPayload = { ...payload };
    if (cleanPayload.icon_url) cleanPayload.icon_url = cleanUrl(cleanPayload.icon_url);

    const { data, error } = await supabase.from('regions').insert(cleanPayload).select().single();
    if (error) throw error;
    return data;
  },

  async updateRegion(regionId, payload) {
    invalidateCacheByPrefix('regions');
    invalidateCacheByPrefix('tree');
    if (USE_MOCK_DB) {
      const idx = mockDatabase.regions.findIndex(r => r.region_id === regionId);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.regions[idx], payload);
      return mockDatabase.regions[idx];
    }
    const cleanPayload = { ...payload };
    if (cleanPayload.icon_url) cleanPayload.icon_url = cleanUrl(cleanPayload.icon_url);

    const { data, error } = await supabase.from('regions').update(cleanPayload).eq('region_id', regionId).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async deleteRegion(regionId) {
    invalidateCacheByPrefix('regions');
    invalidateCacheByPrefix('tree');
    if (USE_MOCK_DB) {
      mockDatabase.regions = mockDatabase.regions.filter(r => r.region_id !== regionId);
      return;
    }
    const { error } = await supabase.from('regions').delete().eq('region_id', regionId);
    if (error) throw error;
  },

  // ===========================================================================
  // ARCS
  // ===========================================================================
  async getArcsByRegion(regionId) {
    return fetchWithCache(`arcs_region_${regionId}`, API_CACHE_TTL.REGIONS_ARCS, async () => {
      if (USE_MOCK_DB)
        return sortByOrder(mockDatabase.arcs.filter(a => a.region_id === regionId));
      const { data, error } = await supabase.from('arcs').select('*').eq('region_id', regionId).order('display_order');
      if (error) throw error;
      return data || [];
    });
  },

  async getArcs(options = {}) {
    const { force = false } = typeof options === 'boolean' ? { force: options } : options;
    return fetchWithCache('arcs_all', API_CACHE_TTL.REGIONS_ARCS, async () => {
      if (USE_MOCK_DB) return sortByOrder(mockDatabase.arcs);
      const { data, error } = await supabase.from('arcs').select('*').order('display_order');
      if (error) throw error;
      return data || [];
    }, force);
  },

  async getArc(arcId) {
    if (USE_MOCK_DB)
      return mockDatabase.arcs.find(a => a.arc_id === arcId) || null;
    return fetchWithCache(`arc_${arcId}`, API_CACHE_TTL.REGIONS_ARCS, async () => {
      const { data, error } = await supabase.from('arcs').select('*').eq('arc_id', arcId).limit(1);
      if (error) throw error;
      return data?.[0] || null;
    });
  },

  async createArc(payload) {
    invalidateCacheByPrefix('arcs');
    invalidateCacheByPrefix('tree');
    if (USE_MOCK_DB) {
      const newItem = { arc_id: genId('arc'), display_order: 0, ...payload };
      mockDatabase.arcs.push(newItem);
      return newItem;
    }
    const { data, error } = await supabase.from('arcs').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateArc(arcId, payload) {
    invalidateCacheByPrefix('arcs');
    invalidateCacheByPrefix('tree');
    if (USE_MOCK_DB) {
      const idx = mockDatabase.arcs.findIndex(a => a.arc_id === arcId);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.arcs[idx], payload);
      return mockDatabase.arcs[idx];
    }
    const { data, error } = await supabase.from('arcs').update(payload).eq('arc_id', arcId).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async deleteArc(arcId) {
    invalidateCacheByPrefix('arcs');
    invalidateCacheByPrefix('tree');
    if (USE_MOCK_DB) {
      mockDatabase.arcs = mockDatabase.arcs.filter(a => a.arc_id !== arcId);
      return;
    }
    const { error } = await supabase.from('arcs').delete().eq('arc_id', arcId);
    if (error) throw error;
  },

  // ===========================================================================
  // EVENTS
  // ===========================================================================
  async getEventsByArc(arcId) {
    return fetchWithCache(`events_arc_${arcId}`, API_CACHE_TTL.EVENTS, async () => {
      if (USE_MOCK_DB)
        return sortByOrder(mockDatabase.events.filter(e => e.arc_id === arcId)).map(e => this._enrichEvent(e));
      const { data, error } = await supabase.from('events').select('*').eq('arc_id', arcId).order('display_order');
      if (error) throw error;
      return (data || []).map(e => this._enrichEvent(e));
    });
  },

  _enrichEvent(event) {
    if (!event) return null;
    const enriched = { ...event };
    if (!enriched.bgm_url && enriched.description) {
      const match = enriched.description.match(/\[bgm:\s*([^\]]+)\]/i);
      if (match) {
        enriched.bgm_url = match[1].trim();
        enriched.description = enriched.description.replace(/\[bgm:\s*[^\]]+\]/gi, '').trim();
      }
    }
    return enriched;
  },

  async getEvents(options = {}) {
    const { force = false } = typeof options === 'boolean' ? { force: options } : options;
    return fetchWithCache('events_all', API_CACHE_TTL.EVENTS, async () => {
      if (USE_MOCK_DB) return sortByOrder(mockDatabase.events).map(e => this._enrichEvent(e));
      const { data, error } = await supabase.from('events').select('*').order('display_order');
      if (error) throw error;
      return (data || []).map(e => this._enrichEvent(e));
    }, force);
  },

  async getEvent(eventId) {
    if (USE_MOCK_DB) {
      const found = mockDatabase.events.find(e => e.event_id === eventId);
      return found ? this._enrichEvent(found) : null;
    }
    return fetchWithCache(`event_${eventId}`, API_CACHE_TTL.EVENTS, async () => {
      const { data, error } = await supabase.from('events').select('*').eq('event_id', eventId).limit(1);
      if (error) throw error;
      return data?.[0] ? this._enrichEvent(data[0]) : null;
    });
  },

  async createEvent(payload) {
    invalidateCacheByPrefix('events');
    invalidateCacheByPrefix('tree');
    if (USE_MOCK_DB) {
      const newItem = { event_id: genId('event'), display_order: 0, ...payload };
      mockDatabase.events.push(newItem);
      return this._enrichEvent(newItem);
    }
    const cleanPayload = { ...payload };
    if (cleanPayload.image_url) cleanPayload.image_url = cleanUrl(cleanPayload.image_url);
    if (cleanPayload.banner_url) cleanPayload.banner_url = cleanUrl(cleanPayload.banner_url);
    if (cleanPayload.wallpaper_url) cleanPayload.wallpaper_url = cleanUrl(cleanPayload.wallpaper_url);

    try {
      const { data, error } = await supabase.from('events').insert(cleanPayload).select().single();
      if (error) {
        if (error.code === 'PGRST204' && cleanPayload.bgm_url !== undefined) {
          const bgmVal = cleanPayload.bgm_url;
          delete cleanPayload.bgm_url;
          if (bgmVal) {
            cleanPayload.description = cleanPayload.description
              ? `${cleanPayload.description}\n[bgm: ${bgmVal}]`
              : `[bgm: ${bgmVal}]`;
          }
          const retry = await supabase.from('events').insert(cleanPayload).select().single();
          if (retry.error) throw retry.error;
          return this._enrichEvent(retry.data);
        }
        throw error;
      }
      return this._enrichEvent(data);
    } catch (err) {
      throw err;
    }
  },

  async updateEvent(eventId, payload) {
    invalidateCacheByPrefix('events');
    invalidateCacheByPrefix('tree');
    if (USE_MOCK_DB) {
      const idx = mockDatabase.events.findIndex(e => e.event_id === eventId);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.events[idx], payload);
      return this._enrichEvent(mockDatabase.events[idx]);
    }
    const cleanPayload = { ...payload };
    if (cleanPayload.image_url) cleanPayload.image_url = cleanUrl(cleanPayload.image_url);
    if (cleanPayload.banner_url) cleanPayload.banner_url = cleanUrl(cleanPayload.banner_url);
    if (cleanPayload.wallpaper_url) cleanPayload.wallpaper_url = cleanUrl(cleanPayload.wallpaper_url);

    try {
      const { data, error } = await supabase.from('events').update(cleanPayload).eq('event_id', eventId).select();
      if (error) {
        if (error.code === 'PGRST204' && cleanPayload.bgm_url !== undefined) {
          const bgmVal = cleanPayload.bgm_url;
          delete cleanPayload.bgm_url;

          // Fetch current event to retain description
          const currentEv = await this.getEvent(eventId);
          let desc = (cleanPayload.description !== undefined ? cleanPayload.description : currentEv?.description) || '';
          desc = desc.replace(/\[bgm:\s*[^\]]+\]/gi, '').trim();
          if (bgmVal) {
            desc = desc ? `${desc}\n[bgm: ${bgmVal}]` : `[bgm: ${bgmVal}]`;
          }
          cleanPayload.description = desc;
          const retryRes = await supabase.from('events').update(cleanPayload).eq('event_id', eventId).select();
          if (retryRes.error) throw retryRes.error;
          return this._enrichEvent(retryRes.data?.[0]);
        }
        throw error;
      }
      return this._enrichEvent(data?.[0]);
    } catch (err) {
      throw err;
    }
  },

  async deleteEvent(eventId) {
    invalidateCacheByPrefix('events');
    invalidateCacheByPrefix('tree');
    if (USE_MOCK_DB) {
      mockDatabase.events = mockDatabase.events.filter(e => e.event_id !== eventId);
      return;
    }
    const { error } = await supabase.from('events').delete().eq('event_id', eventId);
    if (error) throw error;
  },

  // ===========================================================================
  // STORIES
  // ===========================================================================
  async getStoriesByEvent(eventId, options = {}) {
    const { includeDrafts = false } = typeof options === 'boolean' ? { includeDrafts: options } : options;
    const cacheKey = `stories_event_${eventId}_drafts_${includeDrafts}`;
    return fetchWithCache(cacheKey, API_CACHE_TTL.STORIES_META, async () => {
      if (USE_MOCK_DB) {
        let list = mockDatabase.stories.filter(s => s.event_id === eventId);
        if (!includeDrafts) list = list.filter(s => s.status !== 'draft');
        return sortByOrder(list);
      }
      let query = supabase.from('stories').select(STORY_SUMMARY_COLUMNS).eq('event_id', eventId);
      if (!includeDrafts) {
        query = query.neq('status', 'draft');
      }
      const { data, error } = await query.order('display_order');
      if (error) throw error;
      return (data || []).map(s => ({ ...s, status: s.status || 'published' }));
    });
  },

  async getStories(options = {}) {
    const { includeDrafts = false, force = false } = typeof options === 'boolean' ? { includeDrafts: options } : options;
    const cacheKey = `stories_all_drafts_${includeDrafts}`;
    return fetchWithCache(cacheKey, API_CACHE_TTL.STORIES_META, async () => {
      if (USE_MOCK_DB) {
        let list = mockDatabase.stories;
        if (!includeDrafts) list = list.filter(s => s.status !== 'draft');
        return sortByOrder(list);
      }
      let query = supabase.from('stories').select(STORY_SUMMARY_COLUMNS);
      if (!includeDrafts) {
        query = query.neq('status', 'draft');
      }
      const { data, error } = await query.order('display_order');
      if (error) throw error;
      return (data || []).map(s => ({ ...s, status: s.status || 'published' }));
    }, force);
  },

  async getStory(storyId) {
    if (USE_MOCK_DB)
      return mockDatabase.stories.find(s => s.story_id === storyId) || null;
    return fetchWithCache(`story_single_${storyId}`, API_CACHE_TTL.STORY_CONTENT, async () => {
      const { data, error } = await supabase.from('stories').select('*').eq('story_id', storyId).limit(1);
      if (error) throw error;
      if (!data?.[0]) return null;
      return { ...data[0], status: data[0].status || 'published' };
    });
  },

  async createStory(payload) {
    invalidateCacheByPrefix('stories');
    invalidateCacheByPrefix('story_single_');
    invalidateCacheByPrefix('tree');
    if (USE_MOCK_DB) {
      const newItem = {
        story_id: genId('story'),
        display_order: 0,
        status: payload.status || 'published',
        story_content: { characters: {}, sections: [] },
        ...payload
      };
      mockDatabase.stories.push(newItem);
      return newItem;
    }
    const { data, error } = await supabase.from('stories').insert({
      status: 'published',
      ...payload
    }).select().single();
    if (error) throw error;
    return data;
  },

  async updateStory(storyId, payload) {
    invalidateCacheByPrefix('stories');
    invalidateCacheByPrefix(`story_single_${storyId}`);
    invalidateCacheByPrefix('tree');
    if (USE_MOCK_DB) {
      const idx = mockDatabase.stories.findIndex(s => s.story_id === storyId);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.stories[idx], payload);
      return mockDatabase.stories[idx];
    }
    const { data, error } = await supabase.from('stories').update(payload).eq('story_id', storyId).select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Cập nhật cốt truyện thất bại (0 hàng được thay đổi). Phiên đăng nhập có thể đã hết hạn hoặc bạn chưa có quyền ghi vào bảng stories.');
    }
    return data[0];
  },

  async toggleStoryStatus(storyId, status) {
    invalidateCacheByPrefix('stories');
    invalidateCacheByPrefix(`story_single_${storyId}`);
    invalidateCacheByPrefix('tree');
    const { data, error } = await supabase
      .from('stories')
      .update({ status })
      .eq('story_id', storyId)
      .select('story_id, status')
      .single();
    if (error) throw error;
    return data;
  },

  async deleteStory(storyId) {
    invalidateCacheByPrefix('stories');
    invalidateCacheByPrefix(`story_single_${storyId}`);
    invalidateCacheByPrefix('tree');
    if (USE_MOCK_DB) {
      mockDatabase.stories = mockDatabase.stories.filter(s => s.story_id !== storyId);
      return;
    }
    const { error } = await supabase.from('stories').delete().eq('story_id', storyId);
    if (error) throw error;
  },

  async getFullStoryTree(options = {}) {
    const { force = false } = typeof options === 'boolean' ? { force: options } : options;
    if (force) {
      this.invalidateStoryTreeCache();
    }
    return fetchWithCache('tree_story_full', API_CACHE_TTL.STORIES_META, async () => {
      const [regions, arcs, events, stories] = await Promise.all([
        this.getRegions({ force }),
        this.getArcs({ force }),
        this.getEvents({ force }),
        this.getStories({ includeDrafts: true, force }),
      ]);

      const storiesByEvent = {};
      (stories || []).forEach(s => {
        const eid = s.event_id;
        if (!storiesByEvent[eid]) storiesByEvent[eid] = [];
        storiesByEvent[eid].push({
          type: 'story',
          parentId: eid,
          parentType: 'event',
          ...s,
          id: s.story_id,
          children: []
        });
      });

      const eventsByArc = {};
      (events || []).forEach(e => {
        const aid = e.arc_id;
        if (!eventsByArc[aid]) eventsByArc[aid] = [];
        eventsByArc[aid].push({
          type: 'event',
          parentId: aid,
          parentType: 'arc',
          ...e,
          id: e.event_id,
          children: storiesByEvent[e.event_id] || []
        });
      });

      const arcsByRegion = {};
      (arcs || []).forEach(a => {
        const rid = a.region_id;
        if (!arcsByRegion[rid]) arcsByRegion[rid] = [];
        arcsByRegion[rid].push({
          type: 'arc',
          parentId: rid,
          parentType: 'region',
          ...a,
          id: a.arc_id,
          children: eventsByArc[a.arc_id] || []
        });
      });

      return (regions || []).map(r => ({
        type: 'region',
        parentId: null,
        parentType: null,
        ...r,
        id: r.region_id,
        children: arcsByRegion[r.region_id] || []
      }));
    });
  },

  // ===========================================================================
  // CHARACTERS
  // ===========================================================================
  // Helper to attach expressions to characters
  async _enrichCharactersWithExpressions(characters) {
    if (!characters?.length) return [];

    const charIds = characters.map(c => c.character_id).filter(Boolean);
    if (!charIds.length) return characters;

    try {
      const exprMap = await this.getExpressionsByCharacters(charIds);
      return characters.map(c => {
        const exprList = exprMap[c.character_id] || [];
        // Convert to object for renderer
        const expressions = {};
        exprList.forEach(e => {
          if (e.name) expressions[e.name] = e;
        });

        // Use 'default' expression (case-insensitive) or first one
        const defKey = Object.keys(expressions).find(k => k.toLowerCase() === 'default');
        const def = defKey ? expressions[defKey] : (exprList[0] || {});

        // Map common fields for compatibility
        return {
          ...c,
          avatar_url: def.avatar_url || '',
          image_url: def.full_url || '',  // For EventPage
          full_url: def.full_url || '',    // For Editor
          expressions,
          expressionList: exprList
        };
      });
    } catch (err) {
      console.warn('Failed to enrich characters with expressions:', err);
      return characters;
    }
  },

  async getCharacters(options = {}) {
    const { force = false } = typeof options === 'boolean' ? { force: options } : options;
    return fetchWithCache('characters_all', API_CACHE_TTL.CHARACTERS, async () => {
      if (USE_MOCK_DB) return this._enrichCharactersWithExpressions([...mockDatabase.characters]);
      const { data, error } = await supabase.from('characters').select('*');
      if (error) throw error;
      return this._enrichCharactersWithExpressions(data || []);
    }, force);
  },

  async getCharacter(characterId) {
    if (USE_MOCK_DB)
      return mockDatabase.characters.find(c => c.character_id === characterId) || null;
    return fetchWithCache(`character_${characterId}`, API_CACHE_TTL.CHARACTERS, async () => {
      const { data, error } = await supabase.from('characters').select('*').eq('character_id', characterId).limit(1);
      if (error) throw error;
      return data?.[0] || null;
    });
  },

  async createCharacter(payload) {
    invalidateCacheByPrefix('characters');
    const { expressions, ...charData } = payload;

    // Determine the character identifier, prioritizing 'id' then 'character_id' then 'asset_id'
    const charId = payload.character_id;

    if (USE_MOCK_DB) {
      const newItem = {
        id: genNumericId(),
        character_id: charId || genId('char'),
        name: charData.name,
        description: charData.description
      };
      mockDatabase.characters.push(newItem);

      if (expressions?.length) {
        expressions.forEach(e => {
          mockDatabase.character_expressions.push({
            id: genNumericId(),
            character_id: newItem.character_id,
            name: e.name,
            avatar_url: e.avatar_url,
            full_url: e.full_url
          });
        });
      }
      return { ...newItem, expressions: expressions || [] };
    }

    if (!charId) {
      throw new Error('Character ID (identifier) is required but was not provided.');
    }

    // For real Supabase, we map the custom ID
    const dbPayload = {
      character_id: charId,
      name: charData.name || charId,
      description: charData.description || ''
    };

    console.log('Inserting character with payload:', dbPayload);

    const { data: char, error } = await supabase.from('characters').insert(dbPayload).select().single();
    if (error) {
      console.error('Supabase Character Insert Error:', error);
      throw error;
    }

    if (expressions?.length) {
      const exprData = expressions.map(e => ({
        character_id: char.character_id,
        name: e.name,
        avatar_url: e.avatar_url,
        full_url: e.full_url
      }));
      const { error: exprErr } = await supabase.from('character_expressions').insert(exprData);
      if (exprErr) throw exprErr;
    }

    return char;
  },

  async updateCharacter(characterId, payload) {
    invalidateCacheByPrefix('characters');
    if (USE_MOCK_DB) {
      const idx = mockDatabase.characters.findIndex(c => c.character_id === characterId);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.characters[idx], payload);
      return mockDatabase.characters[idx];
    }
    const { data, error } = await supabase.from('characters').update(payload).eq('character_id', characterId).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async deleteCharacter(characterId) {
    invalidateCacheByPrefix('characters');
    if (USE_MOCK_DB) {
      mockDatabase.characters = mockDatabase.characters.filter(c => c.character_id !== characterId);
      return;
    }
    console.log(`Starting deletion for character: ${characterId}`);

    // 1. Delete associated references in event_characters (join table)
    try {
      await supabase.from('event_characters').delete().eq('character_id', characterId);
    } catch (err) {
      console.warn('Warning: Failed to clean up event_characters:', err.message);
    }

    // 2. Clean up GitHub files for all expressions (non-blocking)
    const expressions = await this.getExpressionsByCharacter(characterId);
    if (expressions.length > 0) {
      console.log(`Cleaning up files for ${expressions.length} expressions...`);
      for (const expr of expressions) {
        // We only need to clean up files here, DB cleanup is bulked later
        const urls = [expr.avatar_url, expr.full_url].filter(Boolean);
        for (const url of urls) {
          try {
            const res = await deleteFileFromGithub(url);
            if (!res.success) {
              console.warn(`GitHub cleanup skipped/failed: ${url} (ignoring for character delete)`);
            }
          } catch (e) {
            console.warn(`GitHub process failed: ${url} (ignoring)`);
          }
        }
      }
    }

    // 3. Bulk delete all expressions from DB
    console.log(`Executing bulk DB delete for expressions: ${characterId}`);
    const { error: exprDelErr } = await supabase.from('character_expressions').delete().eq('character_id', characterId);
    if (exprDelErr) throw exprDelErr;

    // 4. Verification: Check if expressions are actually gone (RLS might silently fail)
    const { count, error: checkErr } = await supabase.from('character_expressions')
      .select('*', { count: 'exact', head: true })
      .eq('character_id', characterId);

    if (!checkErr && count > 0) {
      throw new Error(`DB Policy Violation: Found ${count} expressions remaining for "${characterId}". The "anon" key used by the app likely lacks "DELETE" permissions on "character_expressions", even if you can delete them from the Supabase dashboard. Please enable the "DELETE" policy for this table.`);
    }

    // 5. Delete character
    console.log(`Deleting character record: ${characterId}`);
    const { error } = await supabase.from('characters').delete().eq('character_id', characterId);
    if (error) throw error;
  },

  /** Fetch characters for an event (via event_characters join table) */
  async getCharactersByEvent(eventId) {
    return fetchWithCache(`characters_event_${eventId}`, API_CACHE_TTL.CHARACTERS, async () => {
      if (USE_MOCK_DB) {
        if (!mockDatabase.event_characters) return [];
        const links = mockDatabase.event_characters.filter(ec => ec.event_id === eventId);
        const results = links.map(link => {
          const char = mockDatabase.characters.find(c => c.character_id === link.character_id);
          return { ...char, ...link };
        });
        return this._enrichCharactersWithExpressions(sortByOrder(results));
      }

      const { data, error } = await supabase
        .from('event_characters')
        .select('*, characters(*)')
        .eq('event_id', eventId)
        .order('display_order');
      if (error) throw error;

      const characters = (data || []).map(row => ({
        ...row.characters,
        ...row
      }));

      return this._enrichCharactersWithExpressions(characters);
    });
  },

  // ===========================================================================
  // CHARACTER EXPRESSIONS
  // ===========================================================================
  async getExpressionsByCharacter(characterId) {
    return fetchWithCache(`expressions_char_${characterId}`, API_CACHE_TTL.CHARACTERS, async () => {
      if (USE_MOCK_DB)
        return mockDatabase.character_expressions.filter(e => e.character_id === characterId);
      const { data, error } = await supabase.from('character_expressions').select('*').eq('character_id', characterId);
      if (error) throw error;
      return data || [];
    });
  },

  /**
   * Batch fetch expressions for multiple characters.
   * Returns a map: character_id -> array of expressions
   * @param {string[]} characterIds
   */
  async getExpressionsByCharacters(characterIds) {
    if (!characterIds?.length) return {};
    const unique = [...new Set(characterIds)].sort();
    const cacheKey = `expressions_chars_${unique.join('_')}`;
    return fetchWithCache(cacheKey, API_CACHE_TTL.CHARACTERS, async () => {
      if (USE_MOCK_DB) {
        const rows = mockDatabase.character_expressions.filter(e => unique.includes(e.character_id));
        const map = {};
        for (const r of rows) {
          map[r.character_id] = map[r.character_id] || [];
          map[r.character_id].push(r);
        }
        return map;
      }
      const { data, error } = await supabase.from('character_expressions').select('*').in('character_id', unique);
      if (error) throw error;
      const map = {};
      (data || []).forEach(r => {
        map[r.character_id] = map[r.character_id] || [];
        map[r.character_id].push(r);
      });
      return map;
    });
  },

  async createExpression(payload) {
    invalidateCacheByPrefix('characters');
    invalidateCacheByPrefix('expressions_');
    if (USE_MOCK_DB) {
      const maxId = Math.max(0, ...mockDatabase.character_expressions.map(e => e.id));
      const newItem = { id: maxId + 1, ...payload };
      mockDatabase.character_expressions.push(newItem);
      return newItem;
    }
    const cleanPayload = { ...payload };
    if (cleanPayload.avatar_url) cleanPayload.avatar_url = cleanUrl(cleanPayload.avatar_url);
    if (cleanPayload.full_url) cleanPayload.full_url = cleanUrl(cleanPayload.full_url);

    const { data, error } = await supabase.from('character_expressions')
      .upsert(cleanPayload, { onConflict: 'character_id,name' })
      .select();
    if (error) throw error;
    return data?.[0] || cleanPayload;
  },

  async updateExpression(characterId, name, payload) {
    invalidateCacheByPrefix('characters');
    invalidateCacheByPrefix('expressions_');
    if (USE_MOCK_DB) {
      const idx = mockDatabase.character_expressions.findIndex(e => e.character_id === characterId && e.name === name);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.character_expressions[idx], payload);
      return mockDatabase.character_expressions[idx];
    }
    const cleanPayload = { ...payload };
    if (cleanPayload.avatar_url) cleanPayload.avatar_url = cleanUrl(cleanPayload.avatar_url);
    if (cleanPayload.full_url) cleanPayload.full_url = cleanUrl(cleanPayload.full_url);

    const { data, error } = await supabase.from('character_expressions')
      .update(cleanPayload)
      .match({ character_id: characterId, name: name })
      .select();
    if (error) throw error;

    // If no row was matched/updated (e.g. name changed or not found in DB), fallback to upsert
    if (!data || data.length === 0) {
      return this.createExpression(cleanPayload);
    }
    return data[0];
  },

  async deleteExpression(characterId, name, forceDbDelete = false) {
    invalidateCacheByPrefix('characters');
    invalidateCacheByPrefix('expressions_');
    if (USE_MOCK_DB) {
      mockDatabase.character_expressions = mockDatabase.character_expressions.filter(e => !(e.character_id === characterId && e.name === name));
      return;
    }
    // 1. Fetch URLs for GitHub deletion
    const { data: expr } = await supabase.from('character_expressions')
      .select('*')
      .match({ character_id: characterId, name: name })
      .maybeSingle();
    if (expr) {
      const urls = [expr.avatar_url, expr.full_url].filter(Boolean);
      for (const url of urls) {
        try {
          const res = await deleteFileFromGithub(url);
          if (!res.success) {
            const errTxt = String(res.error || '').toLowerCase();
            const isAlreadyGone = errTxt.includes('404') || errTxt.includes('not found') || errTxt.includes('not exist');
            if (!isAlreadyGone) {
              if (forceDbDelete) {
                console.warn(`GitHub delete failed (ignored): ${url} - ${res.error}`);
              } else {
                throw new Error(`GitHub delete failed for ${url}: ${res.error}`);
              }
            } else {
              console.warn(`GitHub file already missing, allowing DB delete: ${url}`);
            }
          }
        } catch (err) {
          if (forceDbDelete) {
            console.warn(`GitHub delete process failed (ignored): ${url} - ${err.message}`);
          } else {
            throw err;
          }
        }
      }
    }
    // 2. Delete from DB
    const { error } = await supabase.from('character_expressions')
      .delete()
      .match({ character_id: characterId, name: name });
    if (error) throw error;
  },

  async getAssets(options = {}) {
    const { force = false } = typeof options === 'boolean' ? { force: options } : options;
    return fetchWithCache('assets_all', API_CACHE_TTL.ASSETS, async () => {
      if (USE_MOCK_DB) return [...mockDatabase.assets];
      let allAssets = [];
      let page = 0;
      const pageSize = 1000;
      while (true) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .order('id', { ascending: false })
          .range(from, to);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allAssets.push(...data);
        if (data.length < pageSize) break;
        page++;
      }
      return allAssets;
    }, force);
  },

  async getAssetsByCategory(category) {
    return fetchWithCache(`assets_cat_${category}`, API_CACHE_TTL.ASSETS, async () => {
      if (USE_MOCK_DB)
        return mockDatabase.assets.filter(a => a.category === category);
      const { data, error } = await supabase.from('assets').select('*').eq('category', category);
      if (error) throw error;
      return data || [];
    });
  },

  async getAssetsByType(type) {
    return fetchWithCache(`assets_type_${type}`, API_CACHE_TTL.ASSETS, async () => {
      if (USE_MOCK_DB)
        return mockDatabase.assets.filter(a => a.type === type);
      const { data, error } = await supabase.from('assets').select('*').eq('type', type);
      if (error) throw error;
      return data || [];
    });
  },

  async getAsset(assetId) {
    if (USE_MOCK_DB)
      return mockDatabase.assets.find(a => a.asset_id === assetId) || null;
    return fetchWithCache(`asset_${assetId}`, API_CACHE_TTL.ASSETS, async () => {
      const { data, error } = await supabase.from('assets').select('*').eq('asset_id', assetId).limit(1);
      if (error) throw error;
      return data?.[0] || null;
    });
  },

  async createAsset(payload) {
    invalidateCacheByPrefix('assets');
    invalidateCacheByPrefix('gallery');
    if (USE_MOCK_DB) {
      if (mockDatabase.assets.find(a => a.asset_id === payload.asset_id)) throw new Error('duplicate-asset');
      const newItem = { ...payload };
      mockDatabase.assets.push(newItem);
      return newItem;
    }
    const cleanPayload = {
      asset_id: payload.asset_id,
      type: payload.type,
      category: payload.category,
      url: payload.url ? cleanUrl(payload.url) : ''
    };

    const { data, error } = await supabase.from('assets').insert(cleanPayload).select().single();
    if (error) throw error;
    return data;
  },

  async updateAsset(assetId, payload) {
    invalidateCacheByPrefix('assets');
    invalidateCacheByPrefix('gallery');
    if (USE_MOCK_DB) {
      const idx = mockDatabase.assets.findIndex(a => a.asset_id === assetId);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.assets[idx], payload);
      return mockDatabase.assets[idx];
    }
    const cleanPayload = {};
    if (payload.category !== undefined) cleanPayload.category = payload.category;
    if (payload.type !== undefined) cleanPayload.type = payload.type;
    if (payload.url !== undefined) cleanPayload.url = cleanUrl(payload.url);

    const { data, error } = await supabase.from('assets').update(cleanPayload).eq('asset_id', assetId).select().single();
    if (error) throw error;
    return data;
  },

  async deleteAsset(assetId) {
    invalidateCacheByPrefix('assets');
    invalidateCacheByPrefix('gallery');
    if (USE_MOCK_DB) {
      mockDatabase.assets = mockDatabase.assets.filter(a => a.asset_id !== assetId);
      return;
    }
    // 1. Fetch asset to get URL for GitHub deletion
    const { data: asset } = await supabase.from('assets').select('url').eq('asset_id', assetId).single();
    if (asset?.url) {
      const res = await deleteFileFromGithub(asset.url);
      if (!res.success) {
        const errTxt = String(res.error || '').toLowerCase();
        const isAlreadyGone = errTxt.includes('404') || errTxt.includes('not found') || errTxt.includes('not exist');
        if (!isAlreadyGone) {
          console.warn(`Warning: GitHub delete failed for ${asset.url}: ${res.error}`);
        } else {
          console.warn(`GitHub file already missing, allowing DB delete: ${asset.url}`);
        }
      }
    }
    // 2. Delete from DB
    const { error } = await supabase.from('assets').delete().eq('asset_id', assetId);
    if (error) throw error;
  },

  // ===========================================================================
  // GALLERY
  // ===========================================================================
  async getGalleryByEvent(eventId) {
    return fetchWithCache(`gallery_event_${eventId}`, API_CACHE_TTL.GALLERY, async () => {
      if (USE_MOCK_DB) {
        if (!mockDatabase.gallery) return [];
        const list = sortByOrder(mockDatabase.gallery.filter(g => g.event_id === eventId));
        return list.map(g => {
          const asset = mockDatabase.assets?.find(a => a.asset_id === g.gallery_id);
          return asset ? { ...g, image_url: asset.url || g.image_url } : g;
        });
      }
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return [];

      try {
        const galleryIds = data.map(g => g.gallery_id).filter(Boolean);
        if (galleryIds.length > 0) {
          const { data: assetMatches } = await supabase
            .from('assets')
            .select('asset_id, name, url')
            .in('asset_id', galleryIds);

          if (assetMatches && assetMatches.length > 0) {
            const assetMap = Object.fromEntries(assetMatches.map(a => [a.asset_id, a]));
            return data.map(g => {
              const matched = assetMap[g.gallery_id];
              if (!matched) return g;
              return {
                ...g,
                image_url: matched.url || g.image_url,
                title: g.title || matched.name
              };
            });
          }
        }
      } catch (enrichErr) {
        console.warn('Failed to enrich gallery with asset data:', enrichErr);
      }

      return data || [];
    });
  },

  async getAllGallery(options = {}) {
    const { force = false } = typeof options === 'boolean' ? { force: options } : options;
    return fetchWithCache('gallery_all', API_CACHE_TTL.GALLERY, async () => {
      if (USE_MOCK_DB) {
        return [...(mockDatabase.gallery || [])];
      }
      const { data, error } = await supabase.from('gallery').select('*');
      if (error) throw error;
      return data || [];
    }, force);
  },

  async createGallery(payload) {
    invalidateCacheByPrefix('gallery');
    const galleryId = payload.gallery_id || payload.asset_id || payload.id;
    if (USE_MOCK_DB) {
      const existingIdx = (mockDatabase.gallery || []).findIndex(g => g.gallery_id === galleryId);
      const newItem = {
        id: existingIdx >= 0 ? mockDatabase.gallery[existingIdx].id : genNumericId(),
        gallery_id: galleryId || genId('gallery'),
        display_order: payload.display_order || 0,
        event_id: payload.event_id || null,
        title: payload.title,
        image_url: payload.image_url || '',
      };
      if (existingIdx >= 0) mockDatabase.gallery[existingIdx] = newItem;
      else mockDatabase.gallery.push(newItem);
      return newItem;
    }

    const dbPayload = {
      gallery_id: galleryId,
      event_id: payload.event_id,
      title: payload.title,
      image_url: cleanUrl(payload.image_url),
      display_order: payload.display_order || 0
    };

    const { data, error } = await supabase.from('gallery')
      .upsert(dbPayload, { onConflict: 'gallery_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteGallery(galleryId) {
    invalidateCacheByPrefix('gallery');
    if (USE_MOCK_DB) {
      if (!mockDatabase.gallery) return;
      mockDatabase.gallery = mockDatabase.gallery.filter(g => g.gallery_id !== galleryId);
      return;
    }
    // Delete from DB only
    // Note: We DO NOT delete the file from Github here because the asset 
    // is tied to the Asset Manager. The gallery is simply a reference.
    const { error } = await supabase.from('gallery').delete().eq('gallery_id', galleryId);
    if (error) throw error;
  },

  async updateGallery(galleryId, payload) {
    invalidateCacheByPrefix('gallery');
    if (USE_MOCK_DB) {
      const idx = mockDatabase.gallery.findIndex(g => g.gallery_id === galleryId);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.gallery[idx], payload);
      return mockDatabase.gallery[idx];
    }
    const cleanPayload = { ...payload };
    if (cleanPayload.image_url) cleanPayload.image_url = cleanUrl(cleanPayload.image_url);

    const { data, error } = await supabase.from('gallery')
      .update(cleanPayload)
      .eq('gallery_id', galleryId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ===========================================================================
  // SUGGESTIONS
  // ===========================================================================
  async getSuggestionsByArc(arcId) {
    return fetchWithCache(`suggestions_arc_${arcId}`, API_CACHE_TTL.EVENTS, async () => {
      if (USE_MOCK_DB) return []; // no mock data for suggestions
      const { data, error } = await supabase.from('suggestions').select('*').eq('arc_id', arcId).order('position');
      if (error) throw error;
      return data || [];
    });
  },

  async getSuggestedEvents(arcId) {
    const suggestions = await this.getSuggestionsByArc(arcId);
    if (!suggestions.length) return [];
    const events = [];
    for (const s of suggestions) {
      const ev = await this.getEvent(s.target_event_id);
      if (ev) events.push({ ...ev, suggestion_position: s.position, suggestion_type: s.type || 'next', suggestion_id: s.id });
    }
    return events;
  },

  async createSuggestion(payload) {
    const cleanPayload = { type: 'next', ...payload };
    if (USE_MOCK_DB) {
      const newItem = { id: genNumericId(), position: 0, ...cleanPayload };
      if (!mockDatabase.suggestions) mockDatabase.suggestions = [];
      mockDatabase.suggestions.push(newItem);
      return newItem;
    }
    const { data, error } = await supabase.from('suggestions').insert(cleanPayload).select().single();
    if (error) throw error;
    return data;
  },

  async deleteSuggestion(id) {
    if (USE_MOCK_DB) {
      if (!mockDatabase.suggestions) return;
      mockDatabase.suggestions = mockDatabase.suggestions.filter(s => s.id !== id);
      return;
    }
    const { error } = await supabase.from('suggestions').delete().eq('id', id);
    if (error) throw error;
  },

  async updateSuggestion(id, payload) {
    if (USE_MOCK_DB) {
      const idx = mockDatabase.suggestions.findIndex(s => s.id === id);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.suggestions[idx], payload);
      return mockDatabase.suggestions[idx];
    }
    const { data, error } = await supabase.from('suggestions').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  /** Batch sync suggestions for an arc */
  async saveSuggestions(arcId, targetEventIds) {
    if (USE_MOCK_DB) {
      if (!mockDatabase.suggestions) mockDatabase.suggestions = [];
      const existing = mockDatabase.suggestions.filter(s => s.arc_id === arcId);
      const existingMap = Object.fromEntries(existing.map(s => [s.target_event_id, s]));
      const newEventSet = new Set(targetEventIds);

      // Remove suggestions that are no longer in the list
      mockDatabase.suggestions = mockDatabase.suggestions.filter(
        s => s.arc_id !== arcId || newEventSet.has(s.target_event_id)
      );

      // Update positions or insert new items
      const result = [];
      targetEventIds.forEach((eid, idx) => {
        const pos = idx + 1;
        if (existingMap[eid]) {
          const item = mockDatabase.suggestions.find(s => s.arc_id === arcId && s.target_event_id === eid);
          if (item) {
            item.position = pos;
            result.push(item);
          }
        } else {
          const newItem = { id: genNumericId(), arc_id: arcId, target_event_id: eid, position: pos };
          mockDatabase.suggestions.push(newItem);
          result.push(newItem);
        }
      });
      return result;
    }

    // 1. Fetch current suggestions for this arc
    const { data: current } = await supabase.from('suggestions').select('id, target_event_id').eq('arc_id', arcId);
    const existingMap = Object.fromEntries((current || []).map(s => [s.target_event_id, s.id]));
    const newEventSet = new Set(targetEventIds);

    // 2. Delete suggestions that are no longer in the list
    const idsToDelete = (current || [])
      .filter(s => !newEventSet.has(s.target_event_id))
      .map(s => s.id);
    if (idsToDelete.length) {
      await supabase.from('suggestions').delete().in('id', idsToDelete);
    }

    // 3. Upsert (insert new, update existing position)
    const rows = targetEventIds.map((eid, idx) => ({
      ...(existingMap[eid] ? { id: existingMap[eid] } : {}),
      arc_id: arcId,
      target_event_id: eid,
      position: idx + 1
    }));
    const { data, error } = await supabase.from('suggestions').insert(rows).select();
    if (error) throw error;
    return data;
  },

  // ===========================================================================
  // EVENT CHARACTERS
  // ===========================================================================

  async addCharacterToEvent(eventId, characterId, displayOrder = 0) {
    if (USE_MOCK_DB) {
      if (!mockDatabase.event_characters) mockDatabase.event_characters = [];
      const exists = mockDatabase.event_characters.find(ec => ec.event_id === eventId && ec.character_id === characterId);
      if (exists) return exists;

      const newItem = { event_id: eventId, character_id: characterId, display_order: displayOrder };
      mockDatabase.event_characters.push(newItem);
      return newItem;
    }
    const { data, error } = await supabase.from('event_characters').insert({ event_id: eventId, character_id: characterId, display_order: displayOrder }).select().single();
    if (error) throw error;
    return data;
  },

  async removeCharacterFromEvent(eventId, characterId) {
    if (USE_MOCK_DB) {
      if (!mockDatabase.event_characters) return;
      mockDatabase.event_characters = mockDatabase.event_characters.filter(ec => !(ec.event_id === eventId && ec.character_id === characterId));
      return;
    }
    const { error } = await supabase.from('event_characters').delete().eq('event_id', eventId).eq('character_id', characterId);
    if (error) throw error;
  },

  async updateEventCharacter(eventId, characterId, payload) {
    if (USE_MOCK_DB) {
      const idx = mockDatabase.event_characters.findIndex(ec => ec.event_id === eventId && ec.character_id === characterId);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.event_characters[idx], payload);
      return mockDatabase.event_characters[idx];
    }
    const { data, error } = await supabase
      .from('event_characters')
      .update(payload)
      .eq('event_id', eventId)
      .eq('character_id', characterId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ===========================================================================
  // BATCH HELPERS  (used by storyParser.js for bulk ID→URL resolution)
  // ===========================================================================
  /**
   * Fetch multiple assets by asset_id in one query.
   * @param {string[]} assetIds
   * @returns {Object} Map: asset_id → asset row
   */
  async getAssetsByIds(assetIds) {
    if (!assetIds?.length) return {};
    if (USE_MOCK_DB) {
      const assets = mockDatabase.assets
        .filter(a => assetIds.includes(a.asset_id))
        .map(a => [a.asset_id, a]);

      const gallery = (mockDatabase.gallery || [])
        .filter(g => assetIds.includes(g.gallery_id))
        .map(g => [g.gallery_id, {
          asset_id: g.gallery_id,
          url: g.image_url,
          name: g.title,
          type: 'image',
          category: 'gallery'
        }]);

      return Object.fromEntries([...assets, ...gallery]);
    }

    const unique = [...new Set(assetIds)];

    // Query both tables in parallel
    const [assetRes, galleryRes] = await Promise.all([
      supabase.from('assets').select('*').in('asset_id', unique),
      supabase.from('gallery').select('*').in('gallery_id', unique)
    ]);

    if (assetRes.error) throw assetRes.error;
    if (galleryRes.error) throw galleryRes.error;

    const assetMap = Object.fromEntries((assetRes.data || []).map(a => [a.asset_id, a]));
    const galleryMap = Object.fromEntries((galleryRes.data || []).map(g => [
      g.gallery_id,
      {
        asset_id: g.gallery_id,
        url: g.image_url,
        name: g.title,
        type: 'image',
        category: 'gallery'
      }
    ]));

    // Merge: asset table takes priority if IDs collide
    return { ...galleryMap, ...assetMap };
  },

  /**
   * Fetch multiple characters + their default expression in one batch.
   * @param {string[]} characterIds
   * @returns {Object} Map: character_id → { character_id, name, avatar_url, full_url }
   */
  async getCharactersWithExpressionsByIds(characterIds) {
    if (!characterIds?.length) return {};
    if (USE_MOCK_DB) {
      const map = {};
      mockDatabase.characters
        .filter(c => characterIds.includes(c.character_id))
        .forEach(c => {
          const exprs = mockDatabase.character_expressions.filter(e => e.character_id === c.character_id);
          const def = exprs.find(e => e.name?.toLowerCase() === 'default') || exprs[0] || {};

          // Build expressions map
          const expressions = {};
          exprs.forEach(e => {
            expressions[e.name] = { avatar_url: e.avatar_url, full_url: e.full_url };
          });

          map[c.character_id] = {
            character_id: c.character_id,
            name: c.name,
            avatar_url: def.avatar_url || '',
            full_url: def.full_url || '',
            expressions
          };
        });
      return map;
    }
    const unique = [...new Set(characterIds)];
    const [charRes, exprRes] = await Promise.all([
      supabase.from('characters').select('*').in('character_id', unique),
      supabase.from('character_expressions').select('*').in('character_id', unique),
    ]);
    if (charRes.error) throw charRes.error;
    if (exprRes.error) throw exprRes.error;

    const exprMap = {};
    (exprRes.data || []).forEach(e => {
      (exprMap[e.character_id] = exprMap[e.character_id] || []).push(e);
    });

    return Object.fromEntries(
      (charRes.data || []).map(c => {
        const exprs = exprMap[c.character_id] || [];
        const def = exprs.find(e => e.name?.toLowerCase() === 'default') || exprs[0] || {};

        const expressions = {};
        exprs.forEach(e => {
          expressions[e.name] = { avatar_url: e.avatar_url, full_url: e.full_url };
        });

        return [c.character_id, {
          character_id: c.character_id,
          name: c.name,
          avatar_url: def.avatar_url || '',
          full_url: def.full_url || '',
          expressions
        }];
      })
    );
  },

  // ===========================================================================
  // OPERATORS
  // ===========================================================================
  async getOperators(options = {}) {
    const { includeDrafts = false } = typeof options === 'boolean' ? { includeDrafts: options } : options;
    try {
      let query = supabase
        .from('operators')
        .select('*');

      if (!includeDrafts) {
        query = query.neq('status', 'draft');
      }

      const { data, error } = await query
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('getOperators warning:', error.message);
        return [];
      }
      if (!data || data.length === 0) return [];

      // Fetch default skins for thumbnails
      const { data: skins } = await supabase
        .from('operator_skins')
        .select('operator_id, avatar_url, full_url, is_default');

      const skinMap = {};
      (skins || []).forEach(s => {
        const existing = skinMap[s.operator_id];
        if (!existing) {
          skinMap[s.operator_id] = s;
        } else if (s.is_default && s.avatar_url) {
          skinMap[s.operator_id] = s;
        } else if (!existing.is_default && s.is_default) {
          skinMap[s.operator_id] = s;
        } else if (!existing.avatar_url && s.avatar_url) {
          skinMap[s.operator_id] = s;
        }
      });

      return data.map(op => {
        const rawAvatar = skinMap[op.operator_id]?.avatar_url || '';
        const rawFull = skinMap[op.operator_id]?.full_url || '';
        return {
          ...op,
          status: op.status || 'published',
          id: op.operator_id,
          class: op.class_id,
          subclass: op.sub_class_id,
          faction: (op.factions && op.factions.length > 0) ? op.factions[0] : null,
          avatar_url: rawAvatar ? getAssetUrl(rawAvatar) : '',
          full_url: rawFull ? getAssetUrl(rawFull) : '',
          portraitUrl: getAssetUrl(rawFull || rawAvatar || '')
        };
      });
    } catch (err) {
      console.warn('getOperators failed:', err);
      return [];
    }
  },

  async getOperator(operatorId) {
    try {
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .eq('operator_id', operatorId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      // Fetch skins and dialogues in parallel
      const [skinsRes, dialoguesRes] = await Promise.all([
        supabase.from('operator_skins').select('*').eq('operator_id', operatorId).order('display_order', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('operator_dialogues').select('*').eq('operator_id', operatorId).order('display_order', { ascending: true }).order('created_at', { ascending: true })
      ]);

      const skins = (skinsRes.data || []).map(s => ({
        ...s,
        id: s.skin_id,
        avatar_url: s.avatar_url ? getAssetUrl(s.avatar_url) : '',
        full_url: s.full_url ? getAssetUrl(s.full_url) : '',
        portraitUrl: getAssetUrl(s.full_url || s.avatar_url || ''),
        avatarUrl: s.avatar_url ? getAssetUrl(s.avatar_url) : ''
      }));

      const defaultSkin = skins.find(s => s.is_default) || skins[0];

      return {
        ...data,
        status: data.status || 'published',
        id: data.operator_id,
        class: data.class_id,
        subclass: data.sub_class_id,
        faction: (data.factions && data.factions.length > 0) ? data.factions[0] : null,
        portraitUrl: defaultSkin?.portraitUrl || '',
        avatarUrl: defaultSkin?.avatarUrl || '',
        description: data.combat_info?.description || data.combat_info?.overview || data.description || '',
        skins: skins,
        dialogues: (dialoguesRes.data || []).map(d => ({
          ...d,
          id: d.dialogue_id,
          content: d.text_content,
          voiceLines: {
            JP: d.audio_url_jp ? getAssetUrl(d.audio_url_jp, 'audio') : '',
            EN: d.audio_url_en ? getAssetUrl(d.audio_url_en, 'audio') : '',
            CN: d.audio_url_cn ? getAssetUrl(d.audio_url_cn, 'audio') : ''
          }
        })),
        talents: data.combat_info?.talents || [],
        skills: (data.combat_info?.skills || []).map(sk => ({
          ...sk,
          icon: sk.icon ? getAssetUrl(sk.icon) : ''
        })),
        modules: (data.combat_info?.modules || []).map(m => ({
          ...m,
          icon: m.icon ? getAssetUrl(m.icon) : '',
          imageUrl: m.imageUrl ? getAssetUrl(m.imageUrl) : ''
        })),
        baseSkills: (data.combat_info?.base_skills || data.combat_info?.baseSkills || []).map(bs => ({
          ...bs,
          icon: bs.icon ? getAssetUrl(bs.icon) : ''
        })),
        token: data.combat_info?.token ? {
          ...data.combat_info.token,
          imageUrl: data.combat_info.token.imageUrl ? getAssetUrl(data.combat_info.token.imageUrl) : ''
        } : null,
        profiles: data.lore_info?.profiles || []
      };
    } catch (err) {
      console.warn(`getOperator ${operatorId} failed:`, err);
      return null;
    }
  },

  async createOperator(payload) {
    const cleanPayload = { ...payload };
    cleanPayload.updated_at = new Date().toISOString();
    this.invalidateOperatorsCache();
    if (cleanPayload.display_order === undefined || cleanPayload.display_order === null) {
      cleanPayload.display_order = 0;
    }
    if (cleanPayload.rarity) {
      cleanPayload.rarity = Number(cleanPayload.rarity) || 5;
    }
    if (cleanPayload.status) {
      cleanPayload.status = cleanPayload.status || 'published';
    }
    if (cleanPayload.combat_info) {
      cleanPayload.combat_info = cleanCombatInfo(cleanPayload.combat_info);
    }
    const { data, error } = await supabase
      .from('operators')
      .upsert(cleanPayload, { onConflict: 'operator_id' })
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Tạo cán viên không thành công (0 hàng được tạo). Vui lòng kiểm tra lại phiên đăng nhập hoặc quyền hạn cơ sở dữ liệu.');
    }
    return data[0];
  },

  async updateOperator(operatorId, payload) {
    this.invalidateOperatorsCache();
    const cleanPayload = { ...payload };
    cleanPayload.updated_at = new Date().toISOString();
    if (cleanPayload.combat_info) {
      cleanPayload.combat_info = cleanCombatInfo(cleanPayload.combat_info);
    }
    // Tránh gửi lại operator_id nếu không thay đổi để không kích hoạt ràng buộc khóa chính
    if (cleanPayload.operator_id === operatorId) {
      delete cleanPayload.operator_id;
    }
    const { data, error } = await supabase
      .from('operators')
      .update(cleanPayload)
      .eq('operator_id', operatorId)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Cập nhật cán viên thất bại (0 hàng được thay đổi). Phiên đăng nhập có thể đã hết hạn hoặc bạn chưa có quyền ghi vào bảng operators.');
    }
    return data[0];
  },

  async toggleOperatorStatus(operatorId, status) {
    this.invalidateOperatorsCache();
    const { data, error } = await supabase
      .from('operators')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('operator_id', operatorId)
      .select('operator_id, status');
    if (error) throw error;
    return data?.[0] || null;
  },

  async deleteOperator(operatorId) {
    this.invalidateOperatorsCache();
    // 1. Delete associated records, dialogues, skins first to avoid foreign key violations
    try {
      await supabase.from('operator_records').delete().eq('operator_id', operatorId);
    } catch (e) {
      console.warn('Cascade delete operator_records warning:', e.message);
    }

    try {
      await supabase.from('operator_dialogues').delete().eq('operator_id', operatorId);
    } catch (e) {
      console.warn('Cascade delete operator_dialogues warning:', e.message);
    }

    try {
      await supabase.from('operator_skins').delete().eq('operator_id', operatorId);
    } catch (e) {
      console.warn('Cascade delete operator_skins warning:', e.message);
    }

    // 2. Delete parent operator row
    const { error } = await supabase
      .from('operators')
      .delete()
      .eq('operator_id', operatorId);
    if (error) throw error;
  },

  // ===========================================================================
  // OPERATOR SKINS
  // ===========================================================================
  async getOperatorSkins(operatorId) {
    try {
      const { data, error } = await supabase
        .from('operator_skins')
        .select('*')
        .eq('operator_id', operatorId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) {
        if (error.status === 401 || error.code === '401' || error.message?.includes('JWT expired'));
        console.warn('getOperatorSkins warning:', error.message);
        return [];
      }
      return (data || []).map(s => ({
        ...s,
        avatar_url: s.avatar_url ? getAssetUrl(s.avatar_url) : '',
        full_url: s.full_url ? getAssetUrl(s.full_url) : '',
        avatarUrl: s.avatar_url ? getAssetUrl(s.avatar_url) : '',
        portraitUrl: getAssetUrl(s.full_url || s.avatar_url || '')
      }));
    } catch (err) {
      console.warn('getOperatorSkins failed:', err);
      return [];
    }
  },

  async createOperatorSkin(payload) {
    const cleanPayload = { ...payload };
    if (!cleanPayload.skin_id || String(cleanPayload.skin_id).startsWith('temp_')) {
      cleanPayload.skin_id = generateUuid();
    }
    if (cleanPayload.avatar_url) cleanPayload.avatar_url = cleanUrl(cleanPayload.avatar_url);
    if (cleanPayload.full_url) cleanPayload.full_url = cleanUrl(cleanPayload.full_url);
    cleanPayload.display_order = Number(cleanPayload.display_order) || 0;
    cleanPayload.is_default = Boolean(cleanPayload.is_default);
    const { data, error } = await supabase
      .from('operator_skins')
      .upsert(cleanPayload, { onConflict: 'skin_id' })
      .select();
    if (error) throw error;
    return data?.[0] || cleanPayload;
  },

  async updateOperatorSkin(skinId, payload) {
    const cleanPayload = { ...payload };
    if (cleanPayload.avatar_url) cleanPayload.avatar_url = cleanUrl(cleanPayload.avatar_url);
    if (cleanPayload.full_url) cleanPayload.full_url = cleanUrl(cleanPayload.full_url);
    const { data, error } = await supabase
      .from('operator_skins')
      .update(cleanPayload)
      .eq('skin_id', skinId)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      return this.createOperatorSkin({ ...cleanPayload, skin_id: skinId });
    }
    return data[0];
  },

  async deleteOperatorSkin(skinId) {
    const { error } = await supabase
      .from('operator_skins')
      .delete()
      .eq('skin_id', skinId);
    if (error) throw error;
  },

  // ===========================================================================
  // OPERATOR DIALOGUES
  // ===========================================================================
  async getOperatorDialogues(operatorId) {
    try {
      const { data, error } = await supabase
        .from('operator_dialogues')
        .select('*')
        .eq('operator_id', operatorId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) {
        if (error.status === 401 || error.code === '401' || error.message?.includes('JWT expired'));
        console.warn('getOperatorDialogues warning:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('getOperatorDialogues failed:', err);
      return [];
    }
  },

  async createOperatorDialogue(payload) {
    if (payload.operator_id) invalidateCacheByPrefix(`operator_single_${payload.operator_id}`);
    const cleanPayload = { ...payload };
    if (!cleanPayload.dialogue_id || String(cleanPayload.dialogue_id).startsWith('temp_')) {
      cleanPayload.dialogue_id = generateUuid();
    }
    if (cleanPayload.audio_url_jp) cleanPayload.audio_url_jp = cleanUrl(cleanPayload.audio_url_jp);
    if (cleanPayload.audio_url_en) cleanPayload.audio_url_en = cleanUrl(cleanPayload.audio_url_en);
    if (cleanPayload.audio_url_cn) cleanPayload.audio_url_cn = cleanUrl(cleanPayload.audio_url_cn);
    cleanPayload.display_order = Number(cleanPayload.display_order) || 1;
    const { data, error } = await supabase
      .from('operator_dialogues')
      .upsert(cleanPayload, { onConflict: 'dialogue_id' })
      .select();
    if (error) throw error;
    return data?.[0] || cleanPayload;
  },

  async updateOperatorDialogue(dialogueId, payload) {
    invalidateCacheByPrefix('operator_single_');
    const cleanPayload = { ...payload };
    if (cleanPayload.audio_url_jp) cleanPayload.audio_url_jp = cleanUrl(cleanPayload.audio_url_jp);
    if (cleanPayload.audio_url_en) cleanPayload.audio_url_en = cleanUrl(cleanPayload.audio_url_en);
    if (cleanPayload.audio_url_cn) cleanPayload.audio_url_cn = cleanUrl(cleanPayload.audio_url_cn);
    const { data, error } = await supabase
      .from('operator_dialogues')
      .update(cleanPayload)
      .eq('dialogue_id', dialogueId)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      return this.createOperatorDialogue({ ...cleanPayload, dialogue_id: dialogueId });
    }
    return data[0];
  },

  async deleteOperatorDialogue(dialogueId) {
    invalidateCacheByPrefix('operator_single_');
    const { error } = await supabase
      .from('operator_dialogues')
      .delete()
      .eq('dialogue_id', dialogueId);
    if (error) throw error;
  },

  // ===========================================================================
  // OPERATOR RECORDS (STORIES)
  // ===========================================================================
  async getOperatorRecords(operatorId) {
    try {
      const { data, error } = await supabase
        .from('operator_records')
        .select('*')
        .eq('operator_id', operatorId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) {
        console.warn('getOperatorRecords warning:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('getOperatorRecords failed:', err);
      return [];
    }
  },

  async getOperatorRecord(recordId) {
    try {
      const { data, error } = await supabase
        .from('operator_records')
        .select('*')
        .eq('record_id', recordId)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    } catch (err) {
      console.warn(`getOperatorRecord ${recordId} failed:`, err);
      return null;
    }
  },

  async createOperatorRecord(payload) {
    const cleanPayload = { ...payload };
    if (!cleanPayload.record_id || String(cleanPayload.record_id).startsWith('temp_')) {
      cleanPayload.record_id = generateUuid();
    }
    cleanPayload.display_order = Number(cleanPayload.display_order) || 1;
    cleanPayload.updated_at = new Date().toISOString();
    invalidateCacheByPrefix('tree_operator_story');
    const { data, error } = await supabase
      .from('operator_records')
      .upsert(cleanPayload, { onConflict: 'record_id' })
      .select();
    if (error) throw error;
    return data?.[0] || cleanPayload;
  },

  async updateOperatorRecord(recordId, payload) {
    invalidateCacheByPrefix('tree_operator_story');
    const cleanPayload = { ...payload };
    cleanPayload.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('operator_records')
      .update(cleanPayload)
      .eq('record_id', recordId)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      return this.createOperatorRecord({ ...cleanPayload, record_id: recordId });
    }
    return data[0];
  },

  async deleteOperatorRecord(recordId) {
    invalidateCacheByPrefix('tree_operator_story');
    const { error } = await supabase
      .from('operator_records')
      .delete()
      .eq('record_id', recordId);
    if (error) throw error;
  },

  async getOperatorStoryTree() {
    return fetchWithCache('tree_operator_story', API_CACHE_TTL.STORIES_META, async () => {
      try {
        const [opsRes, recsRes] = await Promise.all([
          supabase.from('operators').select('operator_id, name, appellation, rarity, class_id, factions').order('name'),
          supabase.from('operator_records').select('record_id, operator_id, name, display_order').order('display_order', { ascending: true })
        ]);

        const operators = opsRes.data || [];
        const records = recsRes.data || [];

        // Group records by operator_id
        const recordsMap = {};
        records.forEach(r => {
          if (!recordsMap[r.operator_id]) recordsMap[r.operator_id] = [];
          recordsMap[r.operator_id].push(r);
        });

        return operators.map(op => ({
          ...op,
          records: recordsMap[op.operator_id] || []
        }));
      } catch (err) {
        console.warn('getOperatorStoryTree failed:', err);
        return [];
      }
    });
  },

  invalidateStoryTreeCache() {
    invalidateStoryTreeCache();
  },

  invalidateAssetsCache() {
    invalidateAssetsCache();
  },

  invalidateOperatorsCache() {
    invalidateCacheByPrefix('operators_');
    invalidateCacheByPrefix('operator_single_');
    invalidateCacheByPrefix('tree_operator_story');
  },

  clearCache() {
    clearAllApiCache();
  },
};

// Proxy to wrap all SupabaseAPI methods with auth error handling and auto-retry
export const SupabaseAPI = new Proxy(SupabaseAPI_Raw, {
  get(target, prop) {
    const original = target[prop];
    if (typeof original === 'function') {
      return async (...args) => {
        try {
          return await original.apply(target, args);
        } catch (err) {
          const isAuthError =
            err?.status === 401 ||
            err?.code === '401' ||
            err?.message?.toLowerCase().includes('jwt expired');
          if (isAuthError) {
            const refreshed = await tryRefreshToken();
            if (refreshed) {
              // Retry once with refreshed token
              return await original.apply(target, args);
            }
          }
          return await handleAuthError(err);
        }
      };
    }
    return original;
  }
});

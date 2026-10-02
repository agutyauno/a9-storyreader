import { SupabaseAPI } from './supabaseApi';

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes
const STORAGE_PREFIX = 'ced_editor_cache_';

// In-Memory Cache (RAM Map for instantaneous 0ms access across components)
const memoryCache = new Map();

/**
 * Helper to get item from sessionStorage with TTL check
 */
function getSessionItem(key) {
    try {
        const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        if (Date.now() - (parsed.timestamp || 0) > (parsed.ttl || DEFAULT_TTL_MS)) {
            sessionStorage.removeItem(STORAGE_PREFIX + key);
            return null;
        }
        return parsed.data;
    } catch (e) {
        return null;
    }
}

/**
 * Helper to set item in sessionStorage with TTL
 */
function setSessionItem(key, data, ttl = DEFAULT_TTL_MS) {
    try {
        sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify({
            data,
            timestamp: Date.now(),
            ttl
        }));
    } catch (e) {
        // Ignore quota exceeded or storage disabled
    }
}

/**
 * Helper to remove item from sessionStorage
 */
function removeSessionItem(key) {
    try {
        sessionStorage.removeItem(STORAGE_PREFIX + key);
    } catch (e) {
        // Ignore
    }
}

/**
 * Editor Cache Service
 * Centralizes caching and reactive cache invalidation for assets, characters, gallery and story tree.
 */
export const EditorCache = {
    /**
     * Get combined assets bundle: { assets, characters, gallery }
     * @param {Object} options
     * @param {boolean} options.force - Force re-fetch from Supabase
     * @returns {Promise<{ assets: Array, characters: Array, gallery: Array, timestamp: number }>}
     */
    async getAssetsBundle({ force = false } = {}) {
        const cacheKey = 'assets_bundle';

        if (!force) {
            // Check memory cache first (0ms)
            if (memoryCache.has(cacheKey)) {
                return memoryCache.get(cacheKey);
            }
            // Check sessionStorage
            const sessionData = getSessionItem(cacheKey);
            if (sessionData) {
                memoryCache.set(cacheKey, sessionData);
                return sessionData;
            }
        }

        // Fetch fresh data in parallel
        const [assetData, charData, galleryData] = await Promise.all([
            SupabaseAPI.getAssets(),
            SupabaseAPI.getCharacters(),
            SupabaseAPI.getAllGallery(),
        ]);

        const rawAssets = assetData || [];
        const rawChars = charData || [];
        const rawGallery = galleryData || [];

        // Filter out gallery entries that already exist in assets
        const existingAssetIds = new Set(rawAssets.map(a => a.asset_id).filter(Boolean));
        const mappedGallery = rawGallery
            .filter(g => g.gallery_id && !existingAssetIds.has(g.gallery_id))
            .map(g => ({
                asset_id: g.gallery_id,
                name: g.title || g.gallery_id,
                url: g.image_url,
                type: 'image',
                category: 'gallery'
            }));

        const combinedAssets = [...rawAssets, ...mappedGallery];

        const bundle = {
            assets: combinedAssets,
            characters: rawChars,
            gallery: rawGallery,
            timestamp: Date.now()
        };

        // Save to caches
        memoryCache.set(cacheKey, bundle);
        setSessionItem(cacheKey, bundle);

        // Notify listeners if this was a forced reload
        if (force) {
            this.notifyUpdated('assets');
        }

        return bundle;
    },

    /**
     * Get full hierarchical story tree
     * @param {Object} options
     * @param {boolean} options.force - Force re-fetch from Supabase
     * @returns {Promise<Array>}
     */
    async getStoryTree({ force = false } = {}) {
        const cacheKey = 'story_tree';

        if (!force) {
            if (memoryCache.has(cacheKey)) {
                return memoryCache.get(cacheKey);
            }
            const sessionData = getSessionItem(cacheKey);
            if (sessionData) {
                memoryCache.set(cacheKey, sessionData);
                return sessionData;
            }
        }

        const data = await SupabaseAPI.getFullStoryTree();
        const tree = data || [];

        memoryCache.set(cacheKey, tree);
        setSessionItem(cacheKey, tree);

        if (force) {
            this.notifyUpdated('storyTree');
        }

        return tree;
    },

    /**
     * Invalidate assets cache
     */
    invalidateAssets() {
        memoryCache.delete('assets_bundle');
        removeSessionItem('assets_bundle');
        this.notifyUpdated('assets');
    },

    /**
     * Invalidate story tree cache
     */
    invalidateStoryTree() {
        memoryCache.delete('story_tree');
        removeSessionItem('story_tree');
        this.notifyUpdated('storyTree');
    },

    /**
     * Invalidate all editor caches
     */
    invalidateAll() {
        memoryCache.clear();
        removeSessionItem('assets_bundle');
        removeSessionItem('story_tree');
        this.notifyUpdated('all');
    },

    /**
     * Broadcast update event to all active editor components
     */
    notifyUpdated(type) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cedEditorCacheUpdated', {
                detail: { type, timestamp: Date.now() }
            }));
        }
    }
};

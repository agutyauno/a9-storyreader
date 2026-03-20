// Service stub for assets
// Exports: list(filter), get(assetId), create(meta, file), update(id, meta, file), delete(id)
// Uses window.APP_CONFIG.useMockData to choose mock behavior (if preserved) or call Supabase APIs.

const useMock = window.APP_CONFIG?.useMockData ?? true;

async function list(filter = {}) {
    if (useMock) {
        // mockAssets is defined in script.js
        await new Promise(r => setTimeout(r, 100));
        return mockAssets.filter(a => {
            if (filter.type && a.type !== filter.type) return false;
            if (filter.category && a.category !== filter.category) return false;
            return true;
        });
    }
    try {
        const supabase = window.supabaseClient;
        if (!supabase) throw new Error('supabase client not available');
        let q = supabase.from('assets').select('*');
        if (filter.type) q = q.eq('type', filter.type);
        if (filter.category) q = q.eq('category', filter.category);
        const { data, error } = await q;
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.warn('Assets.list(): supabase fetch failed', err);
        return [];
    }
}

async function get(assetId) {
    if (useMock) {
        await new Promise(r => setTimeout(r, 50));
        return mockAssets.find(a => a.asset_id === assetId || a.id === assetId) || null;
    }
    try {
        const supabase = window.supabaseClient;
        if (!supabase) throw new Error('supabase client not available');
        // attempt to find by asset_id or id
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .or(`asset_id.eq.${assetId},id.eq.${assetId}`)
            .limit(1);
        if (error) throw error;
        return Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (err) {
        console.warn('Assets.get(): supabase fetch failed', err);
        return null;
    }
}

// upload handled centrally via `window.Services.uploadFile`
// (assets-specific upload helper removed: call window.Services.uploadFile(file, folderPath))

async function create(meta = {}, file = null) {
    if (useMock) {
        // simulate upload then create
        let url = meta.url || '';
        if (file) {
            // Prefer central service upload
            if (window.Services?.uploadFile) {
                const res = await window.Services.uploadFile(file, 'images/thumbnails');
                url = res.url;
            } else {
                // fallback to object URL
                url = URL.createObjectURL(file);
            }
        }
        const newAsset = {
            id: mockAssets.length > 0 ? Math.max(...mockAssets.map(a => a.id)) + 1 : 1,
            asset_id: meta.asset_id || `asset-${Date.now()}`,
            type: meta.type || 'image',
            category: meta.category || null,
            url
        };
        mockAssets.push(newAsset);
        return newAsset;
    }

    try {
        const supabase = window.supabaseClient;
        let url = meta.url || '';
        if (file) {
            if (window.Services?.uploadFile) {
                const res = await window.Services.uploadFile(file, 'images/thumbnails');
                url = res.url;
            } else {
                url = URL.createObjectURL(file);
            }
        }
        if (!supabase) throw new Error('supabase client not available');
        const payload = { asset_id: meta.asset_id, type: meta.type, category: meta.category, url };
        const { data, error } = await supabase.from('assets').insert([payload]).select().single();
        if (error) throw error;
        return data;
    } catch (err) {
        console.warn('Assets.create(): supabase insert failed', err);
        return null;
    }
}

async function update(id, meta = {}, file = null) {
    if (useMock) {
        const asset = mockAssets.find(a => a.id === id || a.asset_id === id);
        if (!asset) throw new Error('not-found');
        if (meta.type) asset.type = meta.type;
        if (meta.category !== undefined) asset.category = meta.category;
        if (meta.url) asset.url = meta.url;
        if (file) {
            if (window.Services?.uploadFile) {
                const res = await window.Services.uploadFile(file, 'images/thumbnails');
                asset.url = res.url;
            } else {
                asset.url = URL.createObjectURL(file);
            }
        }
        return asset;
    }

    try {
        const supabase = window.supabaseClient;
        let url = meta.url || undefined;
        if (file) {
            if (window.Services?.uploadFile) {
                const res = await window.Services.uploadFile(file, 'images/thumbnails');
                url = res.url;
            } else {
                url = URL.createObjectURL(file);
            }
        }
        if (!supabase) throw new Error('supabase client not available');

        const updatePayload = { ...meta };
        if (url !== undefined) updatePayload.url = url;

        // try numeric id first, then asset_id
        let result;
        if (typeof id === 'number') {
            result = await supabase.from('assets').update(updatePayload).match({ id });
        } else {
            result = await supabase.from('assets').update(updatePayload).match({ asset_id: id });
        }
        if (result.error) throw result.error;
        return Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : null;
    } catch (err) {
        console.warn('Assets.update(): supabase update failed', err);
        return null;
    }
}

async function remove(id) {
    if (useMock) {
        const idx = mockAssets.findIndex(a => a.id === id || a.asset_id === id);
        if (idx !== -1) mockAssets.splice(idx, 1);
        return;
    }

    try {
        const supabase = window.supabaseClient;
        if (!supabase) throw new Error('supabase client not available');
        if (typeof id === 'number') {
            await supabase.from('assets').delete().match({ id });
        } else {
            await supabase.from('assets').delete().match({ asset_id: id });
        }
        return;
    } catch (err) {
        console.warn('Assets.remove(): supabase delete failed', err);
    }
}

export default {
    list,
    get,
    create,
    update,
    delete: remove,
    // upload handled via `window.Services.uploadFile`
};


// Service stub for characters and character_expressions
// Exports: list(), get(character_id), create(meta), update(id, meta), delete(id)
// Exports expression helpers: listExpressions(character_id), createExpression(character_id, meta, avatarFile, fullFile)

const useMock = window.APP_CONFIG?.useMockData ?? false;

// Simple in-memory caches to avoid repeated REST calls during UI preview
const _charCache = { list: null };
const _exprCache = new Map(); // key: character_id -> Array<expressions>

function _ensureMock() {
    if (typeof window.mockCharacters === 'undefined') {
        if (typeof mockCharacters !== 'undefined') window.mockCharacters = mockCharacters;
        else window.mockCharacters = [];
    }
    if (typeof window.mockExpressions === 'undefined') {
        if (typeof mockExpressions !== 'undefined') window.mockExpressions = mockExpressions;
        else window.mockExpressions = [];
    }
    return { chars: window.mockCharacters, exprs: window.mockExpressions };
}

async function list() {
    if (useMock) {
        await new Promise(r => setTimeout(r, 80));
        const { chars } = _ensureMock();
        return [...chars];
    }
    // Return cached list when available
    if (_charCache.list) return _charCache.list;

    // Prefer SupabaseAPI if available
    try {
        if (typeof SupabaseAPI !== 'undefined' && SupabaseAPI.getCharacters) {
            const res = await SupabaseAPI.getCharacters();
            _charCache.list = res;
            return res;
        }
        // Fallback to supabase-js client
        const supabase = window.supabaseClient;
        if (supabase) {
            const { data, error } = await supabase.from('characters').select('*');
            if (error) throw error;
            _charCache.list = data || [];
            return _charCache.list;
        }
    } catch (err) {
        console.warn('Characters.list(): supabase fetch failed', err);
    }

    // Last resort: any window mock data
    if (typeof window.mockCharacters !== 'undefined') {
        console.warn('Characters.list(): using window.mockCharacters fallback');
        return [...window.mockCharacters];
    }
    return [];
}

async function get(characterId) {
    if (useMock) {
        const { chars } = _ensureMock();
        return chars.find(c => c.character_id === characterId || c.id === characterId) || null;
    }

    // Try cache first
    if (_charCache.list) {
        const cached = _charCache.list.find(c => c.character_id === characterId || c.id === characterId);
        if (cached) return cached;
    }

    try {
        if (typeof SupabaseAPI !== 'undefined' && SupabaseAPI.getCharacter) {
            return await SupabaseAPI.getCharacter(characterId);
        }
        const supabase = window.supabaseClient;
        if (supabase) {
            const { data, error } = await supabase.from('characters').select('*').eq('character_id', characterId).limit(1);
            if (error) throw error;
            return Array.isArray(data) && data.length > 0 ? data[0] : null;
        }
    } catch (err) {
        console.warn('Characters.get(): supabase fetch failed', err);
    }

    if (typeof window.mockCharacters !== 'undefined') return window.mockCharacters.find(c => c.character_id === characterId || c.id === characterId) || null;
    return null;
}

async function create(meta = {}) {
    if (useMock) {
        const { chars } = _ensureMock();
        const newChar = {
            id: chars.length > 0 ? Math.max(...chars.map(c => c.id)) + 1 : 1,
            character_id: meta.character_id || `char-${Date.now()}`,
            name: meta.name || meta.character_id || 'Unnamed',
            description: meta.description || ''
        };
        chars.push(newChar);
        // update cache
        if (_charCache.list) _charCache.list = [..._charCache.list, newChar];
        return newChar;
    }

    try {
        const supabase = window.supabaseClient;
        if (!supabase) throw new Error('supabase client not available');
        const { data, error } = await supabase.from('characters').insert([meta]).select().single();
        if (error) throw error;
        const inserted = data || null;
        if (inserted && _charCache.list) _charCache.list = [..._charCache.list, inserted];
        return inserted;
    } catch (err) {
        console.warn('Characters.create(): supabase insert failed', err);
    }

    return null;
}

async function update(idOrCharacterId, meta = {}) {
    if (useMock) {
        const { chars } = _ensureMock();
        const char = chars.find(c => c.id === idOrCharacterId || c.character_id === idOrCharacterId);
        if (!char) throw new Error('not-found');
        if (meta.name) char.name = meta.name;
        if (meta.description !== undefined) char.description = meta.description;
        // update cache entry
        if (_charCache.list) {
            _charCache.list = _charCache.list.map(c => (c.character_id === (char.character_id || idOrCharacterId) ? { ...c, ...meta } : c));
        }
        return char;
    }

    try {
        const supabase = window.supabaseClient;
        if (!supabase) throw new Error('supabase client not available');
        // determine match key
        let result;
        if (typeof idOrCharacterId === 'number') {
            result = await supabase.from('characters').update(meta).match({ id: idOrCharacterId }).select();
        } else {
            result = await supabase.from('characters').update(meta).match({ character_id: idOrCharacterId }).select();
        }
        if (result.error) throw result.error;
        const updated = Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : null;
        if (updated && _charCache.list) {
            _charCache.list = _charCache.list.map(c => (c.character_id === (updated.character_id || idOrCharacterId) ? updated : c));
        }
        return updated;
    } catch (err) {
        console.warn('Characters.update(): supabase update failed', err);
    }

    return null;
}

async function remove(idOrCharacterId) {
    if (useMock) {
        const { chars, exprs } = _ensureMock();
        const idx = chars.findIndex(c => c.id === idOrCharacterId || c.character_id === idOrCharacterId);
        if (idx !== -1) {
            const removedCharId = chars[idx].character_id;
            chars.splice(idx, 1);
            // remove expressions for the removed character
            for (let i = exprs.length - 1; i >= 0; i--) {
                if (exprs[i].character_id === removedCharId) exprs.splice(i, 1);
            }
            // invalidate caches
            _exprCache.delete(removedCharId);
            if (_charCache.list) _charCache.list = _charCache.list.filter(c => c.character_id !== removedCharId);
        }
        return;
    }

    // Supabase delete character and its expressions
    try {
        const supabase = window.supabaseClient;
        if (!supabase) throw new Error('supabase client not available');
        // delete expressions first
        await supabase.from('charater_expressions').delete().match({ character_id: idOrCharacterId });
        // delete character
        await supabase.from('characters').delete().match({ character_id: idOrCharacterId });
        // invalidate caches
        _exprCache.delete(idOrCharacterId);
        if (_charCache.list) _charCache.list = _charCache.list.filter(c => c.character_id !== idOrCharacterId);
        return;
    } catch (err) {
        console.warn('Characters.remove(): supabase delete failed', err);
    }
}

async function listExpressions(characterId) {
    if (useMock) {
        const { exprs } = _ensureMock();
        const results = exprs.filter(e => e.character_id === characterId);
        // cache mock results as well
        _exprCache.set(characterId, results);
        return results;
    }

    // Return cached expressions when present
    if (_exprCache.has(characterId)) {
        console.debug('Characters.listExpressions(): cache hit for', characterId);
        return _exprCache.get(characterId);
    }
    console.debug('Characters.listExpressions(): cache miss for', characterId);

    try {
        let expressions = [];
        if (typeof SupabaseAPI !== 'undefined' && SupabaseAPI.getExpressionsByCharacter) {
            expressions = await SupabaseAPI.getExpressionsByCharacter(characterId);
        } else {
            const supabase = window.supabaseClient;
            if (!supabase) throw new Error('supabase client not available');
            const { data, error } = await supabase.from('charater_expressions').select('*').eq('character_id', characterId);
            if (error) throw error;
            expressions = data || [];
        }
        // cache result (even empty) to avoid repeated calls
        _exprCache.set(characterId, expressions || []);
        console.debug('Characters.listExpressions(): cached', characterId, (expressions || []).length, 'items');
        return expressions || [];
    } catch (err) {
        console.warn('Characters.listExpressions(): supabase fetch failed', err);
    }

    if (typeof window.mockExpressions !== 'undefined') {
        console.warn('Characters.listExpressions(): using window.mockExpressions fallback for', characterId);
        return window.mockExpressions.filter(e => e.character_id === characterId);
    }
    return [];
}

async function createExpression(characterId, meta = {}, avatarFile = null, fullFile = null) {
    if (useMock) {
        const { exprs } = _ensureMock();
        let avatar = meta.avatar_url || '';
        let full = meta.full_url || '';
        if (avatarFile) {
            if (window.Services?.uploadFile) {
                const res = await window.Services.uploadFile(avatarFile, 'images/char_avatars');
                avatar = res.url;
            } else {
                avatar = URL.createObjectURL(avatarFile);
            }
        }
        if (fullFile) {
            if (window.Services?.uploadFile) {
                const res = await window.Services.uploadFile(fullFile, 'images/characters');
                full = res.url;
            } else {
                full = URL.createObjectURL(fullFile);
            }
        }
        const newExpr = { character_id: characterId, name: meta.name || 'default', avatar_url: avatar, full_url: full };
        exprs.push(newExpr);
        // update cache
        if (_exprCache.has(characterId)) {
            _exprCache.set(characterId, [..._exprCache.get(characterId), newExpr]);
        }
        return newExpr;
    }

    try {
        // Upload files if provided
        let avatar = meta.avatar_url || '';
        let full = meta.full_url || '';
        if (avatarFile) {
            if (window.Services?.uploadFile) {
                const res = await window.Services.uploadFile(avatarFile, 'images/char_avatars');
                avatar = res.url;
            } else {
                avatar = URL.createObjectURL(avatarFile);
            }
        }
        if (fullFile) {
            if (window.Services?.uploadFile) {
                const res = await window.Services.uploadFile(fullFile, 'images/characters');
                full = res.url;
            } else {
                full = URL.createObjectURL(fullFile);
            }
        }

        const payload = { character_id: characterId, name: meta.name || 'default', avatar_url: avatar, full_url: full };
        try {
            const supabase = window.supabaseClient;
            if (!supabase) throw new Error('supabase client not available');
            const { data, error } = await supabase.from('charater_expressions').insert([payload]).select().single();
            if (error) throw error;
            const inserted = data || null;
            if (inserted) {
                if (_exprCache.has(characterId)) _exprCache.set(characterId, [..._exprCache.get(characterId), inserted]);
            }
            return inserted;
        } catch (err) {
            console.warn('Characters.createExpression(): supabase insert failed', err);
        }
    } catch (err) {
        console.warn('Characters.createExpression(): supabase insert failed', err);
    }

    return null;
}

export default {
    list,
    get,
    create,
    update,
    delete: remove,
    listExpressions,
    createExpression
};

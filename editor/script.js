/* ================================================================================================= */
/* Story Editor - Tree Sidebar Manager */
/* ================================================================================================= */

/* ================================================================================================= */
/* Supabase Auth - simple email/password sign-in using Supabase GoTrue endpoints                */
/* ================================================================================================= */
async function supabaseSignIn(email, password) {
    // Prefer supabase-js client when available
    if (window.supabaseClient && window.supabaseClient.auth && typeof window.supabaseClient.auth.signInWithPassword === 'function') {
        const resp = await window.supabaseClient.auth.signInWithPassword({ email, password });
        if (resp.error) throw resp.error;
        const session = resp.data?.session || resp.data;
        const user = resp.data?.user || null;
        const token = session?.access_token || null;
        if (token) {
            // best-effort: set session on SDK
            try {
                if (window.supabaseClient && window.supabaseClient.auth && typeof window.supabaseClient.auth.setSession === 'function') {
                    window.supabaseClient.auth.setSession({ access_token: token });
                }
            } catch (e) { /* ignore */ }
            localStorage.setItem('supabase_access_token', token);
            localStorage.setItem('supabase_refresh_token', session?.refresh_token || '');
            if (user) localStorage.setItem('supabase_user', JSON.stringify(user));
            // keep legacy wrapper in sync if present
            if (typeof SupabaseClient !== 'undefined' && typeof SupabaseClient.setAuthToken === 'function') {
                try { SupabaseClient.setAuthToken(token); } catch (e) { /* ignore */ }
            }
        }
        return resp;
    }

    // Fallback: REST token flow
    const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
        const msg = data?.error_description || data?.error || 'Sign in failed';
        throw new Error(msg);
    }

    const token = data.access_token;
    localStorage.setItem('supabase_access_token', token);
    localStorage.setItem('supabase_refresh_token', data.refresh_token || '');
    localStorage.setItem('supabase_user', JSON.stringify(data.user || {}));
    // sync legacy wrapper if present
    if (typeof SupabaseClient !== 'undefined' && typeof SupabaseClient.setAuthToken === 'function') {
        try { SupabaseClient.setAuthToken(token); } catch (e) { /* ignore */ }
    }
    return data;
}

function supabaseSignOut() {
    // clear SDK session if available
    try {
        if (window.supabaseClient && window.supabaseClient.auth && typeof window.supabaseClient.auth.signOut === 'function') {
            window.supabaseClient.auth.signOut().catch(() => {});
        }
    } catch (e) { /* ignore */ }
    // legacy wrapper sync
    if (typeof SupabaseClient !== 'undefined' && typeof SupabaseClient.setAuthToken === 'function') {
        try { SupabaseClient.setAuthToken(null); } catch (e) { /* ignore */ }
    }
    localStorage.removeItem('supabase_access_token');
    localStorage.removeItem('supabase_refresh_token');
    localStorage.removeItem('supabase_user');
    window.location.href = 'login.html';
}
function checkAuthRedirect() {
    const existing = localStorage.getItem('supabase_access_token');
    if (existing) {
        // set SDK session when possible
        try {
            if (window.supabaseClient && window.supabaseClient.auth && typeof window.supabaseClient.auth.setSession === 'function') {
                window.supabaseClient.auth.setSession({ access_token: existing });
            }
        } catch (e) { /* ignore */ }
        // keep legacy wrapper in sync if present
        if (typeof SupabaseClient !== 'undefined' && typeof SupabaseClient.setAuthToken === 'function') {
            try { SupabaseClient.setAuthToken(existing); } catch (e) { /* ignore */ }
        }
    } else {
        window.location.href = 'login.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try { checkAuthRedirect(); initLogoutButton(); } catch (e) { console.error('auth check', e); }
});

function initLogoutButton() {
    const btn = document.getElementById('logout-btn');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        try {
            supabaseSignOut();
        } catch (err) {
            console.error('signout', err);
            // fallback: clear tokens and redirect
            localStorage.removeItem('supabase_access_token');
            localStorage.removeItem('supabase_refresh_token');
            localStorage.removeItem('supabase_user');
            window.location.href = 'login.html';
        }
    });

    // Optionally hide the button if not logged in
    const existing = localStorage.getItem('supabase_access_token');
    btn.style.display = existing ? 'inline-flex' : 'none';
}


// Mock asset data matching Supabase assets table
const mockAssets = [
    // Thumbnails (for region/event images)
    {
        id: 1,
        asset_id: 'icon-dreambind',
        type: 'image',
        category: 'thumbnail',
        url: '../assets/images/icon/dreambind castle.png'
    },
    {
        id: 2,
        asset_id: 'icon-dreambind-b',
        type: 'image',
        category: 'thumbnail',
        url: '../assets/images/icon/dreambind castle_b.png'
    },
    {
        id: 3,
        asset_id: 'logo-main',
        type: 'image',
        category: 'thumbnail',
        url: '../assets/images/logo/logo.png'
    },
    // Backgrounds
    {
        id: 10,
        asset_id: 'bg-amiya-awakening',
        type: 'image',
        category: 'background',
        url: '../assets/images/art gallery/Amiya_Awakening.png'
    },
    // Character images
    {
        id: 20,
        asset_id: 'char-amiya-avatar',
        type: 'image',
        category: 'character',
        url: '../assets/images/character/avg_npc_417/avg_npc_417.png'
    },
    {
        id: 21,
        asset_id: 'char-doctor-avatar',
        type: 'image',
        category: 'character',
        url: '../assets/images/character/doctor/doctor.png'
    },
    {
        id: 22,
        asset_id: 'char-hibiscus-avatar',
        type: 'image',
        category: 'character',
        url: '../assets/images/character/hibiscus/hibiscus.png'
    },
    // BGM
    {
        id: 30,
        asset_id: 'bgm-tense-loop',
        type: 'audio',
        category: 'bgm',
        url: '../assets/audio/bgm/m_avg_tense_loop.wav'
    },
    {
        id: 31,
        asset_id: 'bgm-tense-intro',
        type: 'audio',
        category: 'bgm',
        url: '../assets/audio/bgm/music_act15d0d0_m_avg_tense_intro.wav'
    },
    {
        id: 32,
        asset_id: 'bgm-jealous-intro',
        type: 'audio',
        category: 'bgm',
        url: '../assets/audio/bgm/music_act15d0d0_m_avg_jealous_intro.wav'
    },
    // SFX
    {
        id: 40,
        asset_id: 'sfx-footstep',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/avg_d_avg_footstep_stonestep.wav'
    },
    {
        id: 41,
        asset_id: 'sfx-applause',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/avg_d_avg_applause.wav'
    },
    {
        id: 42,
        asset_id: 'sfx-glass-break',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/avg_d_avg_glass_break.wav'
    },
    {
        id: 43,
        asset_id: 'sfx-sword-swing',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/avg_d_avg_swordy.wav'
    },
    {
        id: 44,
        asset_id: 'sfx-sword-tsing',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/avg_d_avg_swordtsing1.wav'
    },
    {
        id: 45,
        asset_id: 'sfx-sword-exsheath',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/avg_d_avg_swordexsheath.wav'
    },
    {
        id: 46,
        asset_id: 'sfx-magic',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/avg_d_avg_magic_1.wav'
    },
    {
        id: 47,
        asset_id: 'sfx-monster-roar',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/avg_d_avg_monsterroar.wav'
    },
    {
        id: 48,
        asset_id: 'sfx-walk-fast',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/avg_d_avg_walkfast.wav'
    },
    {
        id: 49,
        asset_id: 'sfx-walk-water',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/avg_d_avg_walk_water.wav'
    },
    {
        id: 50,
        asset_id: 'sfx-walk-stage',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/avg_d_avg_walk_stage.wav'
    },
    {
        id: 51,
        asset_id: 'sfx-walk-gen',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/avg_d_gen_walk_n.wav'
    },
    {
        id: 52,
        asset_id: 'sfx-bowstring',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/avg_d_avg_bowstring.wav'
    },
    {
        id: 53,
        asset_id: 'sfx-originium-cast',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/avg_d_avg_originiumcastshort.wav'
    },
    {
        id: 54,
        asset_id: 'sfx-audience-chaos',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/avg_d_avg_audience_chaos.wav'
    },
    {
        id: 55,
        asset_id: 'sfx-crowns-flash',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/enemy_e_skill_e_skill_crownsflash.wav'
    },
    {
        id: 56,
        asset_id: 'sfx-assault-rifle',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/player_p_imp_p_imp_assaultrifle_n.wav'
    },
    {
        id: 57,
        asset_id: 'sfx-mon3tr-aoe',
        type: 'audio',
        category: 'sfx',
        url: '../assets/audio/sfx/player_p_aoe_p_aoe_Mon3tr2_n.wav'
    },
    // Videos
    {
        id: 70,
        asset_id: 'video-chap10-pv',
        type: 'video',
        category: 'video',
        url: '../assets/videos/ak_chap10_pv.mp4'
    },
    // Gallery
    {
        id: 60,
        asset_id: 'gallery-amiya-awakening',
        type: 'image',
        category: 'gallery',
        url: '../assets/images/art gallery/Amiya_Awakening.png'
    }
];

/* ================================================================================================= */
/* Mock API - simulates DB and GitHub upload */
const MockAssetAPI = {
    /**
     * Get all assets, optionally filtered by type and/or category
     */
    async getAssets(type = null, category = null) {
        await new Promise(r => setTimeout(r, 200));
        return mockAssets.filter(a => {
            if (type && a.type !== type) return false;
            if (category && a.category !== category) return false;
            return true;
        });
    },

    /**
     * Upload image file to GitHub repo (mock) and create asset record in DB
     * In production: POST file to GitHub API, then INSERT url into assets table
     * @param {File} file - The image file from user's device
     * @returns {Promise<Object>} - The new asset record
     */
    async uploadAndCreateAsset(file) {
        // Simulate upload delay
        await new Promise(r => setTimeout(r, 500));

        // Mock: convert file to a local object URL to simulate a stored URL
        // In production this would be the raw GitHub URL after upload
        const fakeGitHubUrl = URL.createObjectURL(file);

        const newAsset = {
            id: mockAssets.length > 0 ? Math.max(...mockAssets.map(a => a.id)) + 1 : 1,
            asset_id: `asset-thumb-${Date.now()}`,
            type: 'image',
            category: 'thumbnail',
            url: fakeGitHubUrl
        };

        // Add to mock DB
        mockAssets.push(newAsset);
        return newAsset;
    },

    /**
     * Update an existing asset record in mock DB. If file provided, replace URL.
     * @param {Object} meta - { asset_id, type, category, name, url }
     * @param {File|null} file
     */
    async updateAsset(meta = {}, file = null) {
        await new Promise(r => setTimeout(r, 200));
        const asset = mockAssets.find(a => a.asset_id === meta.asset_id || a.id === meta.id);
        if (!asset) throw new Error('not-found');
        if (meta.type) asset.type = meta.type;
        if (meta.category !== undefined) asset.category = meta.category;
        if (meta.url) asset.url = meta.url;
        if (meta.name) asset.name = meta.name;
        if (file) {
            asset.url = URL.createObjectURL(file);
        }
        return asset;
    },

    /**
     * Create a generic asset (image/audio/video) or character-related records.
     * @param {Object} meta - { asset_id, type, category, name, description }
     * @param {File|null} file - optional file to upload (will use objectURL in mock)
     */
    async createAsset(meta = {}, file = null) {
        // Simulate delay
        await new Promise(r => setTimeout(r, 300));

        // Duplicate check
        if (meta.type === 'character') {
            const exists = mockCharacters.find(c => c.character_id === meta.asset_id);
            if (exists) throw new Error('duplicate-character');

            const newChar = {
                id: mockCharacters.length > 0 ? Math.max(...mockCharacters.map(c => c.id)) + 1 : 1,
                character_id: meta.asset_id,
                name: meta.name || meta.asset_id,
                description: meta.description || ''
            };
            mockCharacters.push(newChar);
            return newChar;
        }

        const assetExists = mockAssets.find(a => a.asset_id === meta.asset_id);
        if (assetExists) throw new Error('duplicate-asset');

        const url = file ? URL.createObjectURL(file) : (meta.url || '');
        const newAsset = {
            id: mockAssets.length > 0 ? Math.max(...mockAssets.map(a => a.id)) + 1 : 1,
            asset_id: meta.asset_id,
            type: meta.type || (meta.category === 'sfx' || meta.category === 'bgm' ? 'audio' : 'image'),
            category: meta.category || null,
            url
        };
        mockAssets.push(newAsset);
        return newAsset;
    },

    /**
     * Delete an asset by id (mock)
     */
    async deleteAsset(assetId) {
        await new Promise(r => setTimeout(r, 100));
        const idx = mockAssets.findIndex(a => a.id === assetId);
        if (idx !== -1) mockAssets.splice(idx, 1);
    }
};

/* ================================================================================================= */
/* Asset Resolver - converts between asset_id and url                                                */
/* ================================================================================================= */
const AssetResolver = {
    /**
     * Resolve an asset_id to its URL. If not found, return the input as-is (treat as raw URL).
     * @param {string} idOrUrl
     * @returns {string} resolved URL
     */
    toUrl(idOrUrl) {
        if (!idOrUrl) return '';
        const asset = mockAssets.find(a => a.asset_id === idOrUrl);
        return asset ? asset.url : idOrUrl;
    },

    /**
     * Convert a URL to its asset_id. If not found, return the URL as-is.
     * @param {string} url
     * @returns {string} asset_id or original URL
     */
    toId(url) {
        if (!url) return '';
        const asset = mockAssets.find(a => a.url === url);
        return asset ? asset.asset_id : url;
    }
};

/* ================================================================================================= */
/* Mock Characters & Expressions (matching DB tables: characters + charater_expressions)              */
/* ================================================================================================= */
const mockCharacters = [
    { id: 1, character_id: 'char-amiya', name: 'Amiya', description: 'Leader of Rhodes Island' },
    { id: 2, character_id: 'char-doctor', name: 'Doctor', description: 'The player character' },
    { id: 3, character_id: 'char-hibiscus', name: 'Hibiscus', description: 'Medic operator' }
];

const mockExpressions = [
    // Amiya expressions
    { character_id: 'char-amiya', name: 'default', avatar_url: '../assets/images/character/avg_npc_417/avg_npc_417_avatar.webp', full_url: '../assets/images/character/avg_npc_417/avg_npc_417.png' },
    { character_id: 'char-amiya', name: 'happy', avatar_url: '../assets/images/character/avg_npc_417/avg_npc_417.png', full_url: '' },
    { character_id: 'char-amiya', name: 'sad', avatar_url: '../assets/images/character/avg_npc_417/avg_npc_417.png', full_url: '' },
    // Doctor expressions
    { character_id: 'char-doctor', name: 'default', avatar_url: '../assets/images/character/doctor/doctor.png', full_url: '' },
    // Hibiscus expressions
    { character_id: 'char-hibiscus', name: 'default', avatar_url: '../assets/images/character/hibiscus/hibiscus.png', full_url: '' },
    { character_id: 'char-hibiscus', name: 'smile', avatar_url: '../assets/images/character/hibiscus/hibiscus.png', full_url: '' }
];

const MockCharacterAPI = {
    /** Get all characters */
    async getCharacters() {
        await new Promise(r => setTimeout(r, 100));
        return [...mockCharacters];
    },

    /** Get a character by character_id */
    getCharacter(characterId) {
        return mockCharacters.find(c => c.character_id === characterId) || null;
    },

    /** Get all expressions for a character_id */
    getExpressions(characterId) {
        return mockExpressions.filter(e => e.character_id === characterId);
    },

    /** Get a specific expression */
    getExpression(characterId, expressionName) {
        return mockExpressions.find(
            e => e.character_id === characterId && e.name === expressionName
        ) || null;
    },

    /** Find character by display name (e.g. "Amiya") */
    findByName(name) {
        return mockCharacters.find(c => c.name === name) || null;
    }
};

/**
 * CharacterResolver — resolves character + expression names to avatar/full URLs
 *
 * Script syntax:
 *   @char Amiya id="char-amiya"         → loads all expressions from DB
 *   Amiya.happy [Amiya.happy, Doctor]: text  → uses expression "happy"
 *   Amiya [Amiya, Doctor]: text              → uses expression "default"
 *
 * In story_content JSON characters map:
 *   "Amiya"       → default expression avatar/full
 *   "Amiya.happy" → happy expression avatar/full
 */
const CharacterResolver = {
    /**
     * Build the characters map for story_content JSON from @char declarations.
     * Returns { "Name": {avatar, full_image}, "Name.expr": {avatar, full_image}, ... }
     * @param {Array} charDeclarations - [{name: "Amiya", character_id: "char-amiya"}, ...]
     * @returns {Object}
     */
    async buildCharacterMap(charDeclarations) {
        const map = {};
        for (const decl of charDeclarations) {
            let expressions = [];
            if (window.Services?.Characters?.listExpressions) {
                try {
                    expressions = await window.Services.Characters.listExpressions(decl.character_id);
                } catch (err) {
                    console.warn('Failed to load expressions from service for', decl.character_id, err);
                    expressions = MockCharacterAPI.getExpressions(decl.character_id);
                }
            } else {
                expressions = MockCharacterAPI.getExpressions(decl.character_id);
            }

            for (const expr of expressions) {
                const key = expr.name === 'default' ? decl.name : `${decl.name}.${expr.name}`;
                map[key] = {
                    avatar: expr.avatar_url || expr.avatar || '',
                    full_image: expr.full_url || expr.full_image || ''
                };
            }
        }
        return map;
    },

    /**
     * Reverse-lookup: given a characters map key like "Amiya" or "Amiya.happy",
     * find the character_id. Returns { character_id, expression } or null.
     */
    resolveKey(key) {
        const dotIdx = key.indexOf('.');
        const displayName = dotIdx >= 0 ? key.substring(0, dotIdx) : key;
        const exprName = dotIdx >= 0 ? key.substring(dotIdx + 1) : 'default';

        const char = MockCharacterAPI.findByName(displayName);
        if (!char) return null;
        return { character_id: char.character_id, name: displayName, expression: exprName };
    }
};

// Mock data structure matching Supabase database schema
const mockStoryData = [
    {
        // Region 1
        id: 1,
        region_id: 'region-rhodes',
        name: 'Rhodes Island',
        type: 'region',
        description: 'The mobile city-state Rhodes Island, dedicated to helping the Infected',
        icon_url: '../assets/images/icon/dreambind castle.png',
        display_order: 2,
        children: [
            {
                // Arc 1
                id: 101,
                arc_id: 'arc-rhodes-main',
                region_id: 'region-rhodes',
                name: 'Main Theme',
                type: 'arc',
                description: 'The main storyline of Rhodes Island',
                image_url: '../assets/images/logo/logo.png',
                display_order: 1,
                children: [
                    {
                        // Event 1
                        id: 1001,
                        event_id: 'event-rhodes-01',
                        arc_id: 'arc-rhodes-main',
                        name: 'Awakening',
                        type: 'event',
                        description: 'The Doctor awakens from cryosleep',
                        image_url: null,
                        display_order: 1,
                        children: [
                            {
                                // Story 1
                                id: 10001,
                                story_id: 'story-rhodes-01-01',
                                event_id: 'event-rhodes-01',
                                name: 'Prologue - Emergency',
                                type: 'story',
                                description: 'The beginning of the journey',
                                display_order: 1,
                                story_content: {
                                    characters: {
                                        'Amiya': {
                                            avatar: '../assets/images/character/avg_npc_417/avg_npc_417.png',
                                            full_image: ''
                                        },
                                        'Amiya.happy': {
                                            avatar: '../assets/images/character/avg_npc_417/avg_npc_417.png',
                                            full_image: ''
                                        },
                                        'Amiya.sad': {
                                            avatar: '../assets/images/character/avg_npc_417/avg_npc_417.png',
                                            full_image: ''
                                        },
                                        'Doctor': {
                                            avatar: '../assets/images/character/doctor/doctor.png',
                                            full_image: ''
                                        }
                                    },
                                    sections: [
                                        {
                                            type: 'dialogue_section',
                                            elements: [
                                                {
                                                    type: 'background',
                                                    image: '../assets/images/art gallery/bg_rhodes.jpg',
                                                    bgm: { id: 'bgm_main', intro: '', loop: '' },
                                                    dialogues: [
                                                        { type: 'dialogue', name: 'Amiya', text: 'Doctor, you are finally awake!', left: 'Amiya.happy', right: 'Doctor' },
                                                        { type: 'dialogue', name: 'Doctor', text: 'Where... am I?', left: 'Amiya', right: 'Doctor' },
                                                        { type: 'decision', group_id: 'intro-choice', choices: ['Ask about Rhodes Island', 'Stay silent'], left: 'Doctor', right: 'Amiya' },
                                                        { type: 'choice_response', group_id: 'intro-choice', choice_value: '1', name: 'Amiya', text: 'This is Rhodes Island, Doctor. Welcome home.', left: 'Amiya.happy', right: 'Doctor' },
                                                        { type: 'choice_response', group_id: 'intro-choice', choice_value: '2', name: 'Amiya', text: '...It is okay. Take your time.', left: 'Amiya.sad', right: 'Doctor' }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            },
                            {
                                // Story 2
                                id: 10002,
                                story_id: 'story-rhodes-01-02',
                                event_id: 'event-rhodes-01',
                                name: 'First Mission',
                                type: 'story',
                                description: 'Meeting the operators',
                                display_order: 2,
                                story_content: {
                                    sections: [],
                                    characters: {}
                                }
                            }
                        ]
                    },
                    {
                        // Event 2
                        id: 1002,
                        event_id: 'event-rhodes-02',
                        arc_id: 'arc-rhodes-main',
                        name: 'Chernobog',
                        type: 'event',
                        description: 'The tragedy at Chernobog',
                        image_url: null,
                        display_order: 2,
                        children: [
                            {
                                // Story 3
                                id: 10003,
                                story_id: 'story-rhodes-02-01',
                                event_id: 'event-rhodes-02',
                                name: 'Escape Plan',
                                type: 'story',
                                description: 'Planning the escape from Chernobog',
                                display_order: 1,
                                story_content: {
                                    sections: [],
                                    characters: {}
                                }
                            }
                        ]
                    }
                ]
            },
            {
                // Arc 2
                id: 102,
                arc_id: 'arc-rhodes-side',
                region_id: 'region-rhodes',
                name: 'Side Stories',
                type: 'arc',
                description: 'Stories of individual operators',
                image_url: null,
                display_order: 2,
                children: [
                    {
                        // Event 3
                        id: 1003,
                        event_id: 'event-rhodes-side-01',
                        arc_id: 'arc-rhodes-side',
                        name: 'Operator Records',
                        type: 'event',
                        description: 'Personal stories of operators',
                        image_url: null,
                        display_order: 1,
                        children: [
                            {
                                // Story 4
                                id: 10004,
                                story_id: 'story-rhodes-side-01-01',
                                event_id: 'event-rhodes-side-01',
                                name: 'Amiya - Leader',
                                type: 'story',
                                description: 'Amiya\'s path as a leader',
                                display_order: 1,
                                story_content: {
                                    sections: [],
                                    characters: {}
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        // Region 2
        id: 2,
        region_id: 'region-lungmen',
        name: 'Lungmen',
        type: 'region',
        description: 'The prosperous mobile city of Lungmen',
        icon_url: null,
        display_order: 3,
        children: [
            {
                // Arc 3
                id: 201,
                arc_id: 'arc-lungmen-main',
                region_id: 'region-lungmen',
                name: 'Lungmen Downtown',
                type: 'arc',
                description: 'Events in Lungmen\'s city center',
                image_url: null,
                display_order: 1,
                children: [
                    {
                        // Event 4
                        id: 2001,
                        event_id: 'event-lungmen-01',
                        arc_id: 'arc-lungmen-main',
                        name: 'City Incident',
                        type: 'event',
                        description: 'A crisis in the heart of Lungmen',
                        image_url: null,
                        display_order: 1,
                        children: [
                            {
                                // Story 5
                                id: 20001,
                                story_id: 'story-lungmen-01-01',
                                event_id: 'event-lungmen-01',
                                name: 'Arrival at Lungmen',
                                type: 'story',
                                description: 'Rhodes Island arrives at Lungmen',
                                display_order: 1,
                                story_content: {
                                    sections: [],
                                    characters: {}
                                }
                            },
                            {
                                // Story 6
                                id: 20002,
                                story_id: 'story-lungmen-01-02',
                                event_id: 'event-lungmen-01',
                                name: 'Meeting Ch\'en',
                                type: 'story',
                                description: 'First encounter with the Chief of Police',
                                display_order: 2,
                                story_content: {
                                    sections: [],
                                    characters: {}
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        // Region 3
        id: 3,
        region_id: 'region-victoria',
        name: 'Victoria',
        type: 'region',
        description: 'The nation of Victoria and its territories',
        icon_url: null,
        display_order: 4,
        children: [
            {
                // Arc 4
                id: 301,
                arc_id: 'arc-victoria-main',
                region_id: 'region-victoria',
                name: 'Victorian Crisis',
                type: 'arc',
                description: 'The political turmoil in Victoria',
                image_url: null,
                display_order: 1,
                children: [
                    {
                        // Event 5
                        id: 3001,
                        event_id: 'event-victoria-01',
                        arc_id: 'arc-victoria-main',
                        name: 'Shadows Over Victoria',
                        type: 'event',
                        description: 'Dark forces moving in Victoria',
                        image_url: null,
                        display_order: 1,
                        children: [
                            {
                                // Story 7
                                id: 30001,
                                story_id: 'story-victoria-01-01',
                                event_id: 'event-victoria-01',
                                name: 'Investigation Begins',
                                type: 'story',
                                description: 'Starting the investigation in Victoria',
                                display_order: 1,
                                story_content: {
                                    sections: [],
                                    characters: {}
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }
];

// Current selected item
let currentSelected = null;

/* ================================================================================================= */
/* Initialize on DOM load */
document.addEventListener('DOMContentLoaded', initializeEditor);

async function initializeEditor() {
    // Setup tab switching
    setupTabSwitching();
    
    // Render the story tree
    renderStoryTree();
    
    // Setup tree interactions
    setupTreeInteractions();
    
    // Setup toolbar buttons
    setupToolbarButtons();
    
    // Setup modal
    setupModal();
    
    // Setup image picker modal
    setupImagePickerModal();
    // Setup add-asset modal
    setupAssetModal();
    // Setup edit-asset modal
    setupEditAssetModal();
    
    // Setup asset browser
    // Load service stubs (Assets, Characters, Stories, ...)
    try {
        window.Services = (await import('./services/index.js')).default;
    } catch (e) {
        console.warn('Failed to load services index', e);
        window.Services = null;
    }

    // If services are available, seed the in-memory mock arrays so existing code paths
    // (which depend on mockAssets/mockCharacters/mockExpressions/mockStoryData) continue to work.
        if (window.Services) {
            try {
                if (window.Services.Assets?.list) {
                    const assets = await window.Services.Assets.list();
                    if (Array.isArray(assets) && typeof mockAssets !== 'undefined') {
                        mockAssets.length = 0;
                        mockAssets.push(...assets);
                    }
                }

                if (window.Services.Characters?.list) {
                    const chars = await window.Services.Characters.list();
                    if (Array.isArray(chars) && typeof mockCharacters !== 'undefined') {
                        mockCharacters.length = 0;
                        mockCharacters.push(...chars);
                    }

                    if (window.Services.Characters?.listExpressions && typeof mockExpressions !== 'undefined') {
                        console.log('Seeding mockExpressions from Services.Characters.listExpressions for', mockCharacters.length, 'characters');
                        mockExpressions.length = 0;
                        for (const c of mockCharacters) {
                            try {
                                const exprs = await window.Services.Characters.listExpressions(c.character_id);
                                console.log('Seed expressions for', c.character_id, exprs);
                                if (Array.isArray(exprs)) {
                                    for (const e of exprs) {
                                        mockExpressions.push({ character_id: e.character_id || c.character_id, name: e.name, avatar_url: e.avatar_url || e.avatar || '', full_url: e.full_url || e.full_image || '' });
                                    }
                                }
                            } catch (err) {
                                console.warn('Failed to load expressions for', c.character_id, err);
                            }
                        }
                    }
                }

                if (window.Services.Stories?.listRegions && typeof mockStoryData !== 'undefined') {
                    try {
                        const regions = await window.Services.Stories.listRegions();
                        if (Array.isArray(regions)) {
                            mockStoryData.length = 0;
                            mockStoryData.push(...regions);
                        }
                    } catch (err) {
                        console.warn('Failed to seed story data', err);
                    }
                }
            } catch (err) {
                console.warn('Seeding mock arrays from services failed', err);
            }
    }

    AssetBrowser.init();
}

/* ================================================================================================= */
/* Asset Browser                                                                                     */
/* ================================================================================================= */
const AssetBrowser = {
    // Categories shown in the asset browser grid
    categories: [
        { key: 'character', label: 'Characters' },
        { key: 'background', label: 'Backgrounds', type: 'image', category: 'background' },
        { key: 'image', label: 'Images', type: 'image', category: 'thumbnail' },
        { key: 'gallery', label: 'Gallery', type: 'image', category: 'gallery' },
        { key: 'video', label: 'Videos', type: 'video' },
        { key: 'bgm', label: 'BGM', type: 'audio', category: 'bgm' },
        { key: 'sfx', label: 'SFX', type: 'audio', category: 'sfx' }
    ],

    init() {
        // renderCategoryGrid may be async now; call and ignore Promise
        this.renderCategoryGrid();
        this.setupSearch();
    },

    /* ---- Category Grid ---- */
    async renderCategoryGrid() {
        const grid = document.getElementById('asset-category-grid');
        // build cards asynchronously to support service-based counts
        const parts = await Promise.all(this.categories.map(async (cat) => {
            const count = await this.getCategoryCount(cat);
            return `
                <div class="asset-cat-card" data-cat="${cat.key}">
                    <span class="asset-cat-label">${cat.label}</span>
                    <span class="asset-cat-count">${count}</span>
                </div>
            `;
        }));
        grid.innerHTML = parts.join('');

        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.asset-cat-card');
            if (!card) return;
            this.openCategory(card.dataset.cat);
        });
    },

    async getCategoryCount(cat) {
        try {
            if (cat.key === 'character') {
                if (window.Services?.Characters?.list) {
                    const list = await window.Services.Characters.list();
                    return Array.isArray(list) ? list.length : 0;
                }
                return (typeof mockCharacters !== 'undefined') ? mockCharacters.length : 0;
            }

            if (window.Services?.Assets?.list) {
                const filter = {};
                if (cat.type) filter.type = cat.type;
                if (cat.category) filter.category = cat.category;
                const assets = await window.Services.Assets.list(filter);
                return Array.isArray(assets) ? assets.length : 0;
            }

            // Fallback to mock arrays
            if (cat.key === 'gallery') return (mockAssets || []).filter(a => a.category === 'gallery').length;
            if (cat.key === 'video') return (mockAssets || []).filter(a => a.type === 'video').length;
            if (cat.key === 'image') return (mockAssets || []).filter(a => a.type === 'image' && a.category === 'thumbnail').length;
            return (mockAssets || []).filter(a => {
                if (cat.type && a.type !== cat.type) return false;
                if (cat.category && a.category !== cat.category) return false;
                return true;
            }).length;
        } catch (err) {
            console.warn('getCategoryCount failed', err);
            return 0;
        }
    },

    /* ---- Open / Close Category ---- */
    openCategory(key) {
        this.currentCategory = key;
        const cat = this.categories.find(c => c.key === key);
        if (!cat) return;

        // Show nav header
        document.getElementById('asset-nav-header').style.display = 'flex';
        document.getElementById('asset-nav-title').textContent = cat.label;

        // Hide grid, show list
        document.getElementById('asset-category-grid').style.display = 'none';
        document.getElementById('asset-list').style.display = 'block';

        // Back button
        const backBtn = document.getElementById('asset-back-btn');
        backBtn.onclick = () => this.closeCategory();

        // Clear search
        document.getElementById('asset-search-input').value = '';

        this.renderAssetList(key);
    },

    closeCategory() {
        this.currentCategory = null;
        document.getElementById('asset-nav-header').style.display = 'none';
        document.getElementById('asset-category-grid').style.display = 'grid';
        document.getElementById('asset-list').style.display = 'none';
        document.getElementById('asset-search-input').value = '';
    },

    /* ---- Asset List per Category ---- */
    async getAssetsForCategory(key) {
        if (window.Services?.Assets?.list) {
            switch (key) {
                case 'bgm':        return await window.Services.Assets.list({ type: 'audio', category: 'bgm' });
                case 'sfx':        return await window.Services.Assets.list({ type: 'audio', category: 'sfx' });
                case 'background': return await window.Services.Assets.list({ type: 'image', category: 'background' });
                case 'image':      return await window.Services.Assets.list({ type: 'image', category: 'thumbnail' });
                case 'video':      return await window.Services.Assets.list({ type: 'video' });
                case 'gallery':    return await window.Services.Assets.list({ category: 'gallery' });
                default:           return [];
            }
        }

        // Fallback to mock
        switch (key) {
            case 'bgm':        return (mockAssets || []).filter(a => a.type === 'audio' && a.category === 'bgm');
            case 'sfx':        return (mockAssets || []).filter(a => a.type === 'audio' && a.category === 'sfx');
            case 'background': return (mockAssets || []).filter(a => a.type === 'image' && a.category === 'background');
            case 'image':      return (mockAssets || []).filter(a => a.type === 'image' && a.category === 'thumbnail');
            case 'video':      return (mockAssets || []).filter(a => a.type === 'video');
            case 'gallery':    return (mockAssets || []).filter(a => a.category === 'gallery');
            default:           return [];
        }
    },

    async renderAssetList(key, filter = '') {
        const listContainer = document.getElementById('asset-list');
        const filterLower = filter.toLowerCase();

        if (key === 'character') {
            this.renderCharacterList(listContainer, filterLower);
            return;
        }

        const assets = await this.getAssetsForCategory(key);
        const filtered = filterLower
            ? assets.filter(a => (a.asset_id || '').toLowerCase().includes(filterLower))
            : assets;

        if (!filtered || filtered.length === 0) {
            listContainer.innerHTML = '<div class="asset-list-empty">No assets found</div>';
            return;
        }

        listContainer.innerHTML = filtered.map(a => {
            const thumb = (a.type === 'image')
                ? `<img class="asset-list-thumb" src="${escapeHtml(a.url)}" alt="">`
                : '';
            return `
                <div class="asset-list-item" data-asset-id="${escapeHtml(a.asset_id || '')}">
                    ${thumb}
                    <span class="asset-item-name">${escapeHtml(a.asset_id || a.name || '')}</span>
                </div>
            `;
        }).join('');

        // Click handler
        listContainer.onclick = (e) => {
            const item = e.target.closest('.asset-list-item');
            if (!item) return;
            const assetId = item.dataset.assetId;
            // Try resolving via services if available
            let asset = null;
            if (window.Services?.Assets?.get) {
                asset = mockAssets.find(a => a.asset_id === assetId) || null;
            } else {
                asset = mockAssets.find(a => a.asset_id === assetId);
            }
            if (asset) this.showAssetPreview(asset);
        };
    },

    async renderCharacterList(container, filter) {
        // Load character list (from service or mock)
        let chars = [];
        try {
            if (window.Services?.Characters?.list) chars = await window.Services.Characters.list();
            else chars = (typeof mockCharacters !== 'undefined') ? mockCharacters : [];
        } catch (err) {
            console.warn('Failed to load characters from service', err);
            chars = (typeof mockCharacters !== 'undefined') ? mockCharacters : [];
        }

        if (filter) {
            const f = filter.toLowerCase();
            chars = chars.filter(c => c.name.toLowerCase().includes(f) || c.character_id.toLowerCase().includes(f));
        }

        if (chars.length === 0) {
            container.innerHTML = '<div class="asset-list-empty">No characters found</div>';
            return;
        }

        // Build groups asynchronously to fetch expressions per character when service available
        const parts = await Promise.all(chars.map(async (c) => {
            let exprs = [];
            try {
                if (window.Services?.Characters?.listExpressions) exprs = await window.Services.Characters.listExpressions(c.character_id);
                else exprs = (typeof mockExpressions !== 'undefined') ? mockExpressions.filter(e => e.character_id === c.character_id) : [];
            } catch (err) {
                console.warn('Failed to load expressions for', c.character_id, err);
                exprs = (typeof mockExpressions !== 'undefined') ? mockExpressions.filter(e => e.character_id === c.character_id) : [];
            }

            const exprItems = exprs.map(ex => `
                <div class="asset-list-subitem" data-char-id="${escapeHtml(c.character_id)}" data-expr="${escapeHtml(ex.name)}">
                    <img class="asset-expr-thumb" src="${escapeHtml(ex.avatar_url || ex.avatar || '')}" alt="">
                    <span>${escapeHtml(ex.name)}</span>
                </div>
            `).join('');

            return `
                <div class="asset-char-group">
                    <div class="asset-list-item asset-char-header" data-char-id="${escapeHtml(c.character_id)}">
                        <span class="asset-item-name">${escapeHtml(c.name)}</span>
                        <span class="asset-cat-count">${exprs.length}</span>
                        <span class="asset-char-toggle">▶</span>
                    </div>
                    <div class="asset-char-expressions" style="display: none;">
                        ${exprItems}
                    </div>
                </div>
            `;
        }));

        container.innerHTML = parts.join('');

        // Toggle expressions and click handlers
        container.onclick = async (e) => {
            const header = e.target.closest('.asset-char-header');
            if (header) {
                const group = header.closest('.asset-char-group');
                const exprsDiv = group.querySelector('.asset-char-expressions');
                const toggle = header.querySelector('.asset-char-toggle');
                const visible = exprsDiv.style.display !== 'none';
                exprsDiv.style.display = visible ? 'none' : 'block';
                toggle.textContent = visible ? '▶' : '▼';
                return;
            }

            const subitem = e.target.closest('.asset-list-subitem');
            if (subitem) {
                const charId = subitem.dataset.charId;
                const exprName = subitem.dataset.expr;
                // Resolve char and expr from either service cache or mocks
                let char = null;
                try {
                    if (window.Services?.Characters?.get) char = await window.Services.Characters.get(charId);
                } catch (err) { /* ignore */ }
                if (!char) char = (typeof mockCharacters !== 'undefined') ? mockCharacters.find(c => c.character_id === charId) : null;

                let expr = null;
                try {
                    if (window.Services?.Characters?.listExpressions) {
                        const exprs = await window.Services.Characters.listExpressions(charId);
                        expr = (exprs || []).find(e => e.name === exprName) || null;
                    }
                } catch (err) { /* ignore */ }
                if (!expr) expr = (typeof mockExpressions !== 'undefined') ? mockExpressions.find(e => e.character_id === charId && e.name === exprName) : null;

                if (char && expr) this.showCharacterPreview(char, expr);
            }
        };
    },



    /* ---- Search ---- */
    setupSearch() {
        const input = document.getElementById('asset-search-input');
        input.addEventListener('input', () => {
            const query = input.value.trim();

            if (this.currentCategory) {
                // Filter within current category
                this.renderAssetList(this.currentCategory, query);
            } else if (query.length >= 2) {
                // Global search across all assets
                this.renderSearchResults(query);
            } else {
                // Back to grid
                document.getElementById('asset-category-grid').style.display = 'grid';
                document.getElementById('asset-list').style.display = 'none';
                document.getElementById('asset-nav-header').style.display = 'none';
            }
        });
    },

    renderSearchResults(query) {
        const lower = query.toLowerCase();

        // Search assets
        const matchedAssets = mockAssets.filter(a =>
            a.asset_id.toLowerCase().includes(lower)
        );

        // Search characters
        const matchedChars = mockCharacters.filter(c =>
            c.name.toLowerCase().includes(lower) ||
            c.character_id.toLowerCase().includes(lower)
        );

        const listContainer = document.getElementById('asset-list');

        if (matchedAssets.length === 0 && matchedChars.length === 0) {
            document.getElementById('asset-category-grid').style.display = 'none';
            listContainer.style.display = 'block';
            document.getElementById('asset-nav-header').style.display = 'none';
            listContainer.innerHTML = '<div class="asset-list-empty">No results</div>';
            return;
        }

        let html = '';

        // Group assets by category
        const grouped = {};
        matchedAssets.forEach(a => {
            const catKey = a.category || a.type;
            if (!grouped[catKey]) grouped[catKey] = [];
            grouped[catKey].push(a);
        });

        for (const [catKey, assets] of Object.entries(grouped)) {
            html += `<div class="asset-search-group-label">${escapeHtml(catKey)}</div>`;
            html += assets.map(a => `
                <div class="asset-list-item" data-asset-id="${escapeHtml(a.asset_id)}">
                    <span class="asset-item-name">${escapeHtml(a.asset_id)}</span>
                </div>
            `).join('');
        }

        if (matchedChars.length > 0) {
            html += '<div class="asset-search-group-label">characters</div>';
            html += matchedChars.map(c => `
                <div class="asset-list-item" data-char-id="${escapeHtml(c.character_id)}">
                    <span class="asset-item-name">${escapeHtml(c.name)}</span>
                </div>
            `).join('');
        }

        document.getElementById('asset-category-grid').style.display = 'none';
        listContainer.style.display = 'block';
        document.getElementById('asset-nav-header').style.display = 'none';
        listContainer.innerHTML = html;

        listContainer.onclick = (e) => {
            const item = e.target.closest('.asset-list-item');
            if (!item) return;
            const assetId = item.dataset.assetId;
            const charId = item.dataset.charId;
            if (assetId) {
                const asset = mockAssets.find(a => a.asset_id === assetId);
                if (asset) this.showAssetPreview(asset);
            } else if (charId) {
                const char = mockCharacters.find(c => c.character_id === charId);
                const expr = mockExpressions.find(e => e.character_id === charId && e.name === 'default');
                if (char) this.showCharacterPreview(char, expr);
            }
        };
    },

    /* ---- Preview Modal ---- */
    showAssetPreview(asset) {
        const modal = document.getElementById('asset-preview-modal');
        const title = document.getElementById('asset-preview-title');
        const media = document.getElementById('asset-preview-media');
        const info = document.getElementById('asset-preview-info');

        title.textContent = asset.asset_id;
        media.innerHTML = this.buildMediaPreview(asset);
        info.innerHTML = `
            <table class="asset-info-table">
                <tr><td>ID</td><td>${escapeHtml(asset.asset_id)}</td></tr>
                <tr><td>Type</td><td>${escapeHtml(asset.type)}</td></tr>
                <tr><td>Category</td><td>${escapeHtml(asset.category)}</td></tr>
                <tr><td>URL</td><td class="asset-info-url">${escapeHtml(asset.url)}</td></tr>
            </table>
        `;

        this.setupCopyButton(asset.asset_id);
        modal.style.display = 'flex';
        modal.onclick = (e) => { if (e.target === modal) this.closePreview(); };
        document.getElementById('asset-preview-close-btn').onclick = () => this.closePreview();

        // Setup edit/delete handlers
        const editBtn = document.getElementById('asset-preview-edit-btn');
        const deleteBtn = document.getElementById('asset-preview-delete-btn');
        editBtn.onclick = () => openEditAssetEditor({ kind: 'asset', record: asset });
        deleteBtn.onclick = async () => {
            if (!confirm(`Delete asset ${asset.asset_id}? This cannot be undone in mock.`)) return;
            if (window.Services?.Assets?.delete) {
                await window.Services.Assets.delete(asset.id || asset.asset_id);
            } else {
                await MockAssetAPI.deleteAsset(asset.id);
            }
            this.closePreview();
            this.renderCategoryGrid();
            if (this.currentCategory) this.renderAssetList(this.currentCategory);
        };
    },

    showCharacterPreview(character, expression) {
        const modal = document.getElementById('asset-preview-modal');
        const title = document.getElementById('asset-preview-title');
        const media = document.getElementById('asset-preview-media');
        const info = document.getElementById('asset-preview-info');

        title.textContent = character.name;

        let mediaHtml = '';
        if (expression) {
            if (expression.full_url) {
                mediaHtml = `<img class="asset-preview-img" src="${escapeHtml(expression.full_url)}" alt="full">`;
            } else if (expression.avatar_url) {
                mediaHtml = `<img class="asset-preview-img" src="${escapeHtml(expression.avatar_url)}" alt="avatar">`;
            }
        }
        media.innerHTML = mediaHtml;

        const exprLabel = expression ? expression.name : '-';
        info.innerHTML = `
            <table class="asset-info-table">
                <tr><td>Character ID</td><td>${escapeHtml(character.character_id)}</td></tr>
                <tr><td>Name</td><td>${escapeHtml(character.name)}</td></tr>
                <tr><td>Expression</td><td>${escapeHtml(exprLabel)}</td></tr>
            </table>
        `;

        this.setupCopyButton(character.character_id);
        modal.style.display = 'flex';
        modal.onclick = (e) => { if (e.target === modal) this.closePreview(); };
        document.getElementById('asset-preview-close-btn').onclick = () => this.closePreview();

        // Setup edit/delete handlers for character
        const editBtn = document.getElementById('asset-preview-edit-btn');
        const deleteBtn = document.getElementById('asset-preview-delete-btn');
        editBtn.onclick = () => openEditAssetEditor({ kind: 'character', record: character });
        deleteBtn.onclick = () => {
            if (!confirm(`Delete character ${character.character_id}? This will remove expressions.`)) return;
            // remove character
            const idx = mockCharacters.findIndex(c => c.character_id === character.character_id);
            if (idx !== -1) mockCharacters.splice(idx, 1);
            // remove expressions
            for (let i = mockExpressions.length - 1; i >= 0; i--) {
                if (mockExpressions[i].character_id === character.character_id) mockExpressions.splice(i, 1);
            }
            this.closePreview();
            this.renderCategoryGrid();
            if (this.currentCategory === 'character') this.renderAssetList('character');
        };
    },

    buildMediaPreview(asset) {
        const url = AssetResolver.toUrl(asset.asset_id);
        if (!url) return '<div class="asset-preview-none">No preview available</div>';

        const filename = url.split('/').pop();

        if (asset.type === 'image') {
            return `<img class="asset-preview-img" src="${escapeHtml(url)}" alt="">`;
        }
        if (asset.type === 'audio') {
            return `
                <div class="asset-preview-audio-wrap">
                    <div class="asset-preview-audio-label">${escapeHtml(filename)}</div>
                    <audio class="asset-preview-audio" controls src="${escapeHtml(url)}"></audio>
                </div>
            `;
        }
        if (asset.type === 'video') {
            return `
                <div class="asset-preview-video-wrap">
                    <video class="asset-preview-video" controls src="${escapeHtml(url)}"></video>
                    <div class="asset-preview-video-label">${escapeHtml(filename)}</div>
                </div>
            `;
        }
        return '<div class="asset-preview-none">No preview available</div>';
    },

    setupCopyButton(id) {
        const btn = document.getElementById('asset-preview-copy-btn');
        btn.onclick = () => {
            navigator.clipboard.writeText(id).then(() => {
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.textContent = 'Copy Asset ID'; }, 1500);
            });
        };
    },

    closePreview() {
        const modal = document.getElementById('asset-preview-modal');
        modal.style.display = 'none';
        // Stop any playing media
        const audio = modal.querySelector('audio');
        const video = modal.querySelector('video');
        if (audio) audio.pause();
        if (video) video.pause();
    }
};

/* ================================================================================================= */
/* Tab Switching */
function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.sidebar-tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName, button);
        });
    });
}

function switchTab(tabName, clickedButton) {
    // Update button states
    document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    clickedButton.classList.add('active');
    
    // Update tab content visibility
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const tabContent = document.querySelector(`.${tabName}_tab`);
    if (tabContent) {
        tabContent.classList.add('active');
    }
}

/* ================================================================================================= */
/* Tree Rendering */
function renderStoryTree() {
    const treeContainer = document.getElementById('story-tree');
    // Preserve expanded state and selection before re-rendering
    const expandedNodes = Array.from(document.querySelectorAll('.tree-item.expanded')).map(el => el.getAttribute('data-id'));
    const expandedSet = new Set(expandedNodes.filter(Boolean));
    const selectedEl = document.querySelector('.tree-item-content.selected');
    const selectedId = selectedEl ? selectedEl.closest('.tree-item').getAttribute('data-id') : null;

    treeContainer.innerHTML = '';
    
    // Sort regions by display_order before rendering
    const sortedRegions = sortByDisplayOrder([...mockStoryData]);
    
    sortedRegions.forEach(item => {
        const treeItemElement = createTreeItemElement(item, 0, expandedSet);
        treeContainer.appendChild(treeItemElement);
    });

    // Restore selection if present
    if (selectedId) {
        const newSelected = treeContainer.querySelector(`.tree-item[data-id="${selectedId}"] > .tree-item-content`);
        if (newSelected) {
            document.querySelectorAll('.tree-item-content.selected').forEach(el => el.classList.remove('selected'));
            newSelected.classList.add('selected');
            currentSelected = newSelected.closest('.tree-item');
            // Update toolbar state to reflect current selection
            updateToolbarState(currentSelected.getAttribute('data-type'));
        }
    }
}

function createTreeItemElement(item, depth = 0, expandedSet = new Set()) {
    const li = document.createElement('li');
    li.className = 'tree-item';
    // Use DB id if present, otherwise use temporary client_id
    li.setAttribute('data-id', item.id ?? item.client_id ?? '');
    li.setAttribute('data-type', item.type);
    li.setAttribute('data-name', item.name);
    li.setAttribute('data-description', item.description || '');
    
    // Store the appropriate ID field based on type
    if (item.type === 'region') li.setAttribute('data-region-id', item.region_id || '');
    if (item.type === 'arc') li.setAttribute('data-arc-id', item.arc_id || '');
    if (item.type === 'event') li.setAttribute('data-event-id', item.event_id || '');
    if (item.type === 'story') li.setAttribute('data-story-id', item.story_id || '');
    
    // Store display order and image URLs
    if (item.display_order) li.setAttribute('data-display-order', item.display_order);
    if (item.image_url) li.setAttribute('data-image-url', item.image_url);
    if (item.icon_url) li.setAttribute('data-icon-url', item.icon_url);
    
    // Create content wrapper
    const contentDiv = document.createElement('div');
    contentDiv.className = 'tree-item-content';
    
    // Create toggle button (only if has children)
    if (item.children && item.children.length > 0) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'tree-toggle';
        toggleBtn.innerHTML = '▶';
        // If this item's id or client_id was expanded before, restore it
        const id = String(item.id ?? item.client_id ?? '');
        if (expandedSet.has(id)) {
            li.classList.add('expanded');
            toggleBtn.setAttribute('aria-expanded', 'true');
        } else {
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
        contentDiv.appendChild(toggleBtn);
    } else {
        const emptySpace = document.createElement('div');
        emptySpace.className = 'tree-toggle hidden';
        contentDiv.appendChild(emptySpace);
    }
    
    // Create label
    const labelSpan = document.createElement('span');
    labelSpan.className = 'tree-item-label';
    labelSpan.textContent = item.name;
    contentDiv.appendChild(labelSpan);
    
    li.appendChild(contentDiv);
    
    // Create children container if has children
    if (item.children && item.children.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'tree-children';
        
        // Sort children by display_order before rendering
        const sortedChildren = sortByDisplayOrder([...item.children]);
        
        sortedChildren.forEach(child => {
            const childElement = createTreeItemElement(child, depth + 1, expandedSet);
            ul.appendChild(childElement);
        });
        
        li.appendChild(ul);
    }
    
    return li;
}

/* ================================================================================================= */
/* Tree Interactions */
function setupTreeInteractions() {
    const sidebar = document.getElementById('left-sidebar');
    
    // Event delegation for tree toggle buttons
    sidebar.addEventListener('click', (event) => {
        const toggleBtn = event.target.closest('.tree-toggle');
        const contentDiv = event.target.closest('.tree-item-content');
        
        if (toggleBtn) {
            event.stopPropagation();
            handleTreeToggle(toggleBtn);
        } else if (contentDiv) {
            event.stopPropagation();
            handleTreeItemSelect(contentDiv);
        }
    });
}

function handleTreeToggle(toggleBtn) {
    const li = toggleBtn.closest('.tree-item');
    
    if (!li) return;
    
    const isExpanded = li.classList.contains('expanded');
    
    if (isExpanded) {
        li.classList.remove('expanded');
        toggleBtn.setAttribute('aria-expanded', 'false');
    } else {
        li.classList.add('expanded');
        toggleBtn.setAttribute('aria-expanded', 'true');
    }
}

function handleTreeItemSelect(contentDiv) {
    const li = contentDiv.closest('.tree-item');
    
    if (!li) return;
    
    // Remove previous selection
    document.querySelectorAll('.tree-item-content.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Add selection to clicked item
    contentDiv.classList.add('selected');
    currentSelected = li;
    
    // Update toolbar state based on selected type
    const selectedType = li.getAttribute('data-type');
    updateToolbarState(selectedType);
    
    // Load into editor (placeholder for future implementation)
    loadItemIntoEditor(li);
}

function loadItemIntoEditor(treeItemElement) {
    const id = treeItemElement.getAttribute('data-id');
    const type = treeItemElement.getAttribute('data-type');
    const item = findItemById(id);
    
    if (!item) return;
    
    const editorSection = document.getElementById('editor');
    
    if (type === 'story') {
        StoryEditor.init(editorSection, item);
        return;
    }
    
    editorSection.innerHTML = buildEditorForm(item, type);
    setupEditorFormHandlers(item, type);
}

/* ================================================================================================= */
/* Editor Form Builder */
function buildEditorForm(item, type) {
    const specificId = getSpecificId(item, type);
    
    let imageField = '';
    if (type === 'region') {
        const currentUrl = item.icon_url || '';
        imageField = `
            <div class="editor-form-group">
                <label class="editor-label">Icon Image</label>
                <div class="editor-image-picker">
                    <input type="hidden" id="editor-icon-url" value="${escapeHtml(currentUrl)}">
                    <div class="editor-image-picker-actions">
                        <button type="button" class="editor-btn editor-btn-secondary" id="editor-pick-from-db">Browse Assets</button>
                        <button type="button" class="editor-btn editor-btn-secondary" id="editor-upload-file">Upload from Device</button>
                        ${currentUrl ? '<button type="button" class="editor-btn editor-btn-danger" id="editor-clear-image">Clear</button>' : ''}
                    </div>
                    <input type="file" id="editor-image-file-input" accept="image/*" style="display:none;">
                    ${currentUrl ? `<div class="editor-image-preview"><img src="${escapeHtml(currentUrl)}" alt="Icon preview"></div>` : '<div class="editor-image-preview" style="display:none;"><img src="" alt="Preview"></div>'}
                </div>
            </div>
        `;
    } else if (type === 'event') {
        const currentUrl = item.image_url || '';
        imageField = `
            <div class="editor-form-group">
                <label class="editor-label">Event Image</label>
                <div class="editor-image-picker">
                    <input type="hidden" id="editor-image-url" value="${escapeHtml(currentUrl)}">
                    <div class="editor-image-picker-actions">
                        <button type="button" class="editor-btn editor-btn-secondary" id="editor-pick-from-db">Browse Assets</button>
                        <button type="button" class="editor-btn editor-btn-secondary" id="editor-upload-file">Upload from Device</button>
                        ${currentUrl ? '<button type="button" class="editor-btn editor-btn-danger" id="editor-clear-image">Clear</button>' : ''}
                    </div>
                    <input type="file" id="editor-image-file-input" accept="image/*" style="display:none;">
                    ${currentUrl ? `<div class="editor-image-preview"><img src="${escapeHtml(currentUrl)}" alt="Image preview"></div>` : '<div class="editor-image-preview" style="display:none;"><img src="" alt="Preview"></div>'}
                </div>
            </div>
        `;
    }

    return `
        <div class="editor-panel">
            <div class="editor-header-bar">
                <h2 class="editor-title">${escapeHtml(item.name)}</h2>
                <span class="editor-type-label">${capitalizeType(type)}</span>
            </div>
            <form id="editor-form" class="editor-form">
                <div class="editor-form-row">
                    <div class="editor-form-group">
                        <label class="editor-label">${capitalizeType(type)} ID</label>
                        <input type="text" class="editor-input editor-input-readonly" value="${escapeHtml(specificId)}" readonly>
                    </div>
                    <div class="editor-form-group">
                        <label class="editor-label">Display Order</label>
                        <input type="number" class="editor-input" id="editor-display-order" value="${item.display_order ?? ''}" min="0" placeholder="0">
                    </div>
                </div>
                <div class="editor-form-group">
                    <label class="editor-label">Name <span class="required">*</span></label>
                    <input type="text" class="editor-input" id="editor-name" value="${escapeHtml(item.name)}" required placeholder="Enter name">
                </div>
                <div class="editor-form-group">
                    <label class="editor-label">Description</label>
                    <textarea class="editor-textarea" id="editor-description" rows="4" placeholder="Enter description">${escapeHtml(item.description || '')}</textarea>
                </div>
                ${imageField}
                <div class="editor-form-actions">
                    <button type="button" class="editor-btn editor-btn-secondary" id="editor-reset-btn">Reset</button>
                    <button type="submit" class="editor-btn editor-btn-primary" id="editor-save-btn">Save Changes</button>
                </div>
            </form>
        </div>
    `;
}

function getSpecificId(item, type) {
    if (type === 'region') return item.region_id;
    if (type === 'arc') return item.arc_id;
    if (type === 'event') return item.event_id;
    if (type === 'story') return item.story_id;
    return '';
}

function setupEditorFormHandlers(item, type) {
    const form = document.getElementById('editor-form');
    const resetBtn = document.getElementById('editor-reset-btn');
    
    // Image picker handlers (Browse Assets / Upload from Device / Clear)
    const hiddenUrlInput = document.getElementById('editor-icon-url') || document.getElementById('editor-image-url');
    const pickFromDbBtn = document.getElementById('editor-pick-from-db');
    const uploadFileBtn = document.getElementById('editor-upload-file');
    const clearImageBtn = document.getElementById('editor-clear-image');
    const fileInput = document.getElementById('editor-image-file-input');

    if (pickFromDbBtn) {
        pickFromDbBtn.addEventListener('click', () => {
            showImagePickerModal((selectedUrl) => {
                hiddenUrlInput.value = selectedUrl;
                updateEditorImagePreview(hiddenUrlInput, selectedUrl);
            });
        });
    }

    if (uploadFileBtn && fileInput) {
        uploadFileBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            uploadFileBtn.disabled = true;
            uploadFileBtn.textContent = 'Uploading...';
            try {
                const asset = await (window.Services?.Assets?.create ? window.Services.Assets.create({}, file) : MockAssetAPI.uploadAndCreateAsset(file));
                hiddenUrlInput.value = asset?.url || asset?.url || '';
                updateEditorImagePreview(hiddenUrlInput, asset.url);
            } finally {
                uploadFileBtn.disabled = false;
                uploadFileBtn.textContent = 'Upload from Device';
                fileInput.value = '';
            }
        });
    }

    if (clearImageBtn) {
        clearImageBtn.addEventListener('click', () => {
            hiddenUrlInput.value = '';
            updateEditorImagePreview(hiddenUrlInput, '');
        });
    }
    
    // Reset button
    resetBtn.addEventListener('click', () => {
        loadItemIntoEditor(currentSelected);
    });
    
    // Save
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveEditorForm(item, type);
    });
}

function saveEditorForm(item, type) {
    const name = document.getElementById('editor-name').value.trim();
    if (!name) return;
    
    const description = document.getElementById('editor-description').value.trim();
    const displayOrder = document.getElementById('editor-display-order').value;
    
    // Update item data
    item.name = name;
    item.description = description || null;
    item.display_order = displayOrder !== '' ? parseInt(displayOrder) : null;
    
    // Update type-specific image fields
    if (type === 'region') {
        const iconUrl = document.getElementById('editor-icon-url');
        if (iconUrl) item.icon_url = iconUrl.value.trim() || null;
    } else if (type === 'event') {
        const imageUrl = document.getElementById('editor-image-url');
        if (imageUrl) item.image_url = imageUrl.value.trim() || null;
    }
    
    // Re-render tree to reflect changes
    renderStoryTree();
    
    // Re-select the item in the tree
    const treeItem = document.querySelector(`.tree-item[data-id="${item.id ?? item.client_id ?? ''}"]`);
    if (treeItem) {
        // Expand parents
        expandParents(treeItem);
        
        const content = treeItem.querySelector(':scope > .tree-item-content');
        if (content) {
            content.classList.add('selected');
        }
        currentSelected = treeItem;
        updateToolbarState(type);
        
        // Reload editor with updated data
        loadItemIntoEditor(treeItem);
    }
    
    showSaveNotification();

    // Export current story data as JSON and log it for debugging/inspection
    try {
        const exported = JSON.stringify(mockStoryData, null, 2);
        console.log('Exported story JSON:', exported);
    } catch (err) {
        console.error('Failed to serialize story data to JSON', err);
    }
}

function expandParents(element) {
    let parent = element.parentElement;
    while (parent) {
        if (parent.classList && parent.classList.contains('tree-item')) {
            parent.classList.add('expanded');
        }
        parent = parent.parentElement;
    }
}

function showSaveNotification() {
    // Remove existing notification
    const existing = document.querySelector('.save-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'save-notification';
    notification.textContent = 'Changes saved successfully';
    document.body.appendChild(notification);
    
    // Trigger animation
    requestAnimationFrame(() => notification.classList.add('show'));
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

/* ================================================================================================= */
/* Utility Functions */
function sortByDisplayOrder(items) {
    return items.sort((a, b) => {
        // If both have display_order, sort by it
        if (a.display_order !== null && a.display_order !== undefined && 
            b.display_order !== null && b.display_order !== undefined) {
            return a.display_order - b.display_order;
        }
        // Items with display_order come before items without
        if (a.display_order !== null && a.display_order !== undefined) return -1;
        if (b.display_order !== null && b.display_order !== undefined) return 1;
        // If neither has display_order, maintain original order (stable sort)
        return 0;
    });
}

function capitalizeType(type) {
    return type
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ================================================================================================= */
/* Editor Image Preview Helper */
function updateEditorImagePreview(hiddenInput, url) {
    const group = hiddenInput.closest('.editor-form-group');
    const previewDiv = group.querySelector('.editor-image-preview');
    if (url) {
        if (previewDiv) {
            previewDiv.style.display = '';
            previewDiv.querySelector('img').src = url;
        }
    } else if (previewDiv) {
        previewDiv.style.display = 'none';
        previewDiv.querySelector('img').src = '';
    }
    // Toggle clear button visibility
    let clearBtn = group.querySelector('#editor-clear-image');
    if (url && !clearBtn) {
        const actionsDiv = group.querySelector('.editor-image-picker-actions');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'editor-btn editor-btn-danger';
        btn.id = 'editor-clear-image';
        btn.textContent = 'Clear';
        btn.addEventListener('click', () => {
            hiddenInput.value = '';
            updateEditorImagePreview(hiddenInput, '');
        });
        actionsDiv.appendChild(btn);
    } else if (!url && clearBtn) {
        clearBtn.remove();
    }
}

/* ================================================================================================= */
/* Image Picker Modal */
let imagePickerCallback = null;
let imagePickerFilter = { type: 'image', category: 'thumbnail' };

async function showImagePickerModal(onSelect, type = 'image', category = 'thumbnail') {
    imagePickerCallback = onSelect;
    imagePickerFilter = { type, category };
    const modal = document.getElementById('image-picker-modal');
    const grid = document.getElementById('image-picker-grid');

    // Show loading
    grid.innerHTML = '<div class="image-picker-loading">Loading assets...</div>';
    modal.style.display = 'flex';

    // Fetch assets from services (or mock DB fallback)
    const assets = await (window.Services?.Assets?.list ? window.Services.Assets.list({ type, category }) : MockAssetAPI.getAssets(type, category));

    if (assets.length === 0) {
        grid.innerHTML = '<div class="image-picker-empty">No images found. Upload one!</div>';
    } else {
        grid.innerHTML = '';
        assets.forEach(asset => {
            const card = document.createElement('div');
            card.className = 'image-picker-card';
            card.setAttribute('data-url', asset.url);
            card.setAttribute('data-asset-id', asset.asset_id);
            card.innerHTML = `
                <img src="${escapeHtml(asset.url)}" alt="${escapeHtml(asset.asset_id)}">
                <span class="image-picker-card-label">${escapeHtml(asset.asset_id)}</span>
            `;
            card.addEventListener('click', () => {
                // Deselect all
                grid.querySelectorAll('.image-picker-card.selected').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
            grid.appendChild(card);
        });
    }
}

function hideImagePickerModal() {
    const modal = document.getElementById('image-picker-modal');
    modal.style.display = 'none';
    imagePickerCallback = null;
}

function setupImagePickerModal() {
    const modal = document.getElementById('image-picker-modal');
    const closeBtn = document.getElementById('image-picker-close-btn');
    const cancelBtn = document.getElementById('image-picker-cancel-btn');
    const selectBtn = document.getElementById('image-picker-select-btn');
    const uploadBtn = document.getElementById('image-picker-upload-btn');
    const fileInput = document.getElementById('image-picker-file');

    closeBtn.addEventListener('click', hideImagePickerModal);
    cancelBtn.addEventListener('click', hideImagePickerModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideImagePickerModal();
    });

    // Select button
    selectBtn.addEventListener('click', async () => {
        const selected = document.querySelector('#image-picker-grid .image-picker-card.selected');
        if (!selected) return;
        const url = selected.getAttribute('data-url');
        const assetId = selected.getAttribute('data-asset-id');
        let asset = null;
        if (window.Services?.Assets?.get) {
            asset = await window.Services.Assets.get(assetId);
        }
        if (!asset) asset = mockAssets.find(a => (a.url === url) || (a.asset_id === assetId));
        if (imagePickerCallback) imagePickerCallback(asset || url);
        hideImagePickerModal();
    });

    // Upload button within picker now opens the Add Asset modal instead of direct file upload
    uploadBtn.addEventListener('click', () => {
        const addBtn = document.getElementById('add-asset-btn');
        hideImagePickerModal();
        if (addBtn) addBtn.click();
    });
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';
        try {
            const asset = await (window.Services?.Assets?.create ? window.Services.Assets.create({}, file) : MockAssetAPI.uploadAndCreateAsset(file));
            // Refresh the grid
            if (imagePickerCallback) {
                await showImagePickerModal(imagePickerCallback, imagePickerFilter.type, imagePickerFilter.category);
            }
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload New Image';
            fileInput.value = '';
        }
    });
}

/* ================================================================================================= */
/* Add Asset Modal (prototype)                                                */
/* ================================================================================================= */
function setupAssetModal() {
    // Ensure modal elements exist and wire open/close handlers
    const openBtn = document.getElementById('add-asset-btn');
    const modal = document.getElementById('add-asset-modal');
    const closeBtn = document.getElementById('add-asset-modal-close');
    const cancelBtn = document.getElementById('add-asset-cancel');
    const typeSelect = document.getElementById('asset-type');
    const charSection = document.getElementById('asset-character-section');
    const mediaSection = document.getElementById('asset-media-section');
    const fileInput = document.getElementById('asset-file-input');
    const fileName = document.getElementById('asset-file-name');
    const mediaLabel = document.getElementById('media-label');
    const mediaPreview = document.getElementById('media-preview');
    const addExprBtn = document.getElementById('add-expression-btn');

    const chooseBtn = document.getElementById('choose-asset-btn');
    const clearBtn = document.getElementById('clear-asset-btn');
    const assetIdInput = document.getElementById('item-image-asset-id');
    const imagePreviewEl = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const previewAssetId = document.getElementById('preview-asset-id');

    if (openBtn) openBtn.addEventListener('click', () => showAddAssetModal());
    if (closeBtn) closeBtn.addEventListener('click', () => hideAddAssetModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => hideAddAssetModal());
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) hideAddAssetModal(); });

    if (chooseBtn) {
        chooseBtn.addEventListener('click', () => {
            console.log('Choose asset clicked');
            const itemType = document.getElementById('item-type')?.value || 'region';
            const category = itemType === 'event' ? 'background' : 'thumbnail';

            showImagePickerModal((selected) => {
                if (!selected) return;
                if (assetIdInput) assetIdInput.value = selected.asset_id || selected.assetId || '';
                if (previewImg) previewImg.src = selected.url || selected;
                if (previewAssetId) previewAssetId.textContent = selected.asset_id || '';
                if (imagePreviewEl) imagePreviewEl.style.display = 'block';
                if (clearBtn) clearBtn.style.display = 'inline-block';
            }, 'image', category);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (assetIdInput) assetIdInput.value = '';
            if (previewImg) previewImg.src = '';
            if (previewAssetId) previewAssetId.textContent = '';
            if (imagePreviewEl) imagePreviewEl.style.display = 'none';
            clearBtn.style.display = 'none';
        });
    }

    // Toggle sections and file input accept based on selected asset type
    if (typeSelect) {
        typeSelect.addEventListener('change', () => {
            const val = typeSelect.value;
            if (val === 'character') {
                if (charSection) charSection.style.display = '';
                if (mediaSection) mediaSection.style.display = 'none';
            } else {
                if (charSection) charSection.style.display = 'none';
                if (mediaSection) mediaSection.style.display = '';
                // adjust file accept and label
                if (fileInput) {
                    if (val === 'video') fileInput.accept = 'video/*';
                    else if (val === 'bgm' || val === 'sfx') fileInput.accept = 'audio/*';
                    else fileInput.accept = 'image/*';
                }
                if (mediaLabel) {
                    if (val === 'video') mediaLabel.textContent = 'Video File *';
                    else if (val === 'bgm' || val === 'sfx') mediaLabel.textContent = 'Audio File *';
                    else mediaLabel.textContent = 'Media File *';
                }
            }
            // clear file preview when switching types
            if (fileInput) { fileInput.value = ''; }
            if (mediaPreview) { mediaPreview.style.display = 'none'; mediaPreview.innerHTML = ''; }
        });
    }

    function showAddAssetModal() {
        // Reset form
        const form = document.getElementById('add-asset-form');
        if (form) form.reset();
        const exprList = document.getElementById('expressions-list'); if (exprList) exprList.innerHTML = '';
        if (fileName) fileName.textContent = '';
        if (mediaPreview) { mediaPreview.style.display = 'none'; mediaPreview.innerHTML = ''; }
        if (charSection) charSection.style.display = 'none';
        if (mediaSection) mediaSection.style.display = 'none';
        // clear editing state
        formRemoveEditingFlag();
        if (modal) modal.style.display = 'flex';
    }

    function hideAddAssetModal() { if (modal) modal.style.display = 'none'; }

    // Editing helpers
    function setEditingState(kind, id) {
        const form = document.getElementById('add-asset-form');
        if (!form) return;
        form.dataset.editing = '1';
        form.dataset.editKind = kind;
        form.dataset.editId = id;
    }

    function formRemoveEditingFlag() {
        const form = document.getElementById('add-asset-form');
        if (!form) return;
        delete form.dataset.editing;
        delete form.dataset.editKind;
        delete form.dataset.editId;
    }

    function getEditingState() {
        const form = document.getElementById('add-asset-form');
        if (!form || !form.dataset.editing) return null;
        return { kind: form.dataset.editKind, id: form.dataset.editId };
    }

    // Open editor prefilled for asset or character
    window.openAssetEditor = function ({ kind, record }) {
        showAddAssetModal();
        const typeSelectEl = document.getElementById('asset-type');
        const idEl = document.getElementById('asset-id');
        const nameEl = document.getElementById('asset-name');
        const descEl = document.getElementById('asset-desc');

        if (kind === 'asset') {
            // asset types: audio, image, video
            let sel = 'image';
            if (record.type === 'audio') sel = record.category === 'bgm' ? 'bgm' : 'sfx';
            if (record.type === 'video') sel = 'video';
            if (record.type === 'image' && record.category === 'background') sel = 'background';
            if (record.type === 'image' && record.category === 'gallery') sel = 'gallery';
            if (record.type === 'image' && record.category === 'thumbnail') sel = 'image';
            if (typeSelectEl) { typeSelectEl.value = sel; typeSelectEl.dispatchEvent(new Event('change')); }
            if (idEl) { idEl.value = record.asset_id; idEl.disabled = true; }
            if (nameEl) nameEl.value = record.name || '';
            // preview
            const previewContainer = document.getElementById('media-preview');
            previewContainer.style.display = '';
            if (record.type === 'audio') previewContainer.innerHTML = `<audio controls src="${escapeHtml(record.url)}"></audio>`;
            else if (record.type === 'video') previewContainer.innerHTML = `<video controls src="${escapeHtml(record.url)}" style="max-width:100%;"></video>`;
            else previewContainer.innerHTML = `<img src="${escapeHtml(record.url)}" style="max-width:100%;">`;
            setEditingState('asset', record.asset_id);
        } else if (kind === 'character') {
            typeSelectEl.value = 'character';
            typeSelectEl.dispatchEvent(new Event('change'));
            idEl.value = record.character_id;
            idEl.disabled = true;
            nameEl.value = record.name || '';
            descEl.value = record.description || '';
            // populate expressions
            const list = document.getElementById('expressions-list');
            list.innerHTML = '';
            const exprs = mockExpressions.filter(e => e.character_id === record.character_id);
            for (const ex of exprs) {
                const row = document.createElement('div');
                row.className = 'form-group';
                row.innerHTML = `
                    <div class="expr-row">
                        <div class="expr-col expr-col-name">
                            <input type="text" placeholder="expression name (e.g. default, happy)" class="editor-input expr-name" value="${escapeHtml(ex.name)}">
                        </div>
                        <div class="expr-col expr-col-avatar">
                            <label class="expr-label">Avatar</label>
                            <input type="file" accept="image/*" class="expr-avatar">
                            <div class="expr-preview avatar-preview">${ex.avatar_url ? `<img src="${escapeHtml(ex.avatar_url)}">` : ''}</div>
                        </div>
                        <div class="expr-col expr-col-full">
                            <label class="expr-label">Full</label>
                            <input type="file" accept="image/*" class="expr-full">
                            <div class="expr-preview full-preview">${ex.full_url ? `<img src="${escapeHtml(ex.full_url)}">` : ''}</div>
                        </div>
                        <div class="expr-col expr-col-actions">
                            <button type="button" class="btn-secondary expr-remove">Remove</button>
                        </div>
                    </div>
                `;
                list.appendChild(row);
                row.querySelector('.expr-remove').addEventListener('click', () => row.remove());
            }
            setEditingState('character', record.character_id);
        }
    };

    fileInput.addEventListener('change', handleAssetFileChange);
    addExprBtn.addEventListener('click', addExpressionRow);

    const form = document.getElementById('add-asset-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await submitAddAssetForm();
        } catch (err) {
            alert(err.message || 'Failed to create asset');
        }
    });

    function handleAssetFileChange(e) {
        const f = e.target.files[0];
        if (!f) {
            fileName.textContent = '';
            mediaPreview.style.display = 'none';
            mediaPreview.innerHTML = '';
            return;
        }
        fileName.textContent = `${f.name} (${Math.round(f.size/1024)} KB)`;
        // preview depending on type
        const val = typeSelect.value;
        mediaPreview.style.display = '';
        if (val === 'video') {
            mediaPreview.innerHTML = `<video controls style="max-width:100%;" src="${URL.createObjectURL(f)}"></video>`;
        } else if (val === 'bgm' || val === 'sfx') {
            mediaPreview.innerHTML = `<audio controls src="${URL.createObjectURL(f)}"></audio>`;
        } else {
            mediaPreview.innerHTML = `<img src="${URL.createObjectURL(f)}" style="max-width:100%; max-height:240px; object-fit:contain;" alt="preview">`;
        }
    }

    function addExpressionRow() {
        const list = document.getElementById('expressions-list');
        const idx = list.children.length;
        const row = document.createElement('div');
        row.className = 'form-group';
        row.innerHTML = `
            <div class="expr-row">
                <div class="expr-col expr-col-name">
                    <input type="text" placeholder="expression name (e.g. default, happy)" class="editor-input expr-name">
                </div>
                <div class="expr-col expr-col-avatar">
                    <label class="expr-label">Avatar</label>
                    <input type="file" accept="image/*" class="expr-avatar">
                    <div class="expr-preview avatar-preview"></div>
                </div>
                <div class="expr-col expr-col-full">
                    <label class="expr-label">Full</label>
                    <input type="file" accept="image/*" class="expr-full">
                    <div class="expr-preview full-preview"></div>
                </div>
                <div class="expr-col expr-col-actions">
                    <button type="button" class="btn-secondary expr-remove">Remove</button>
                </div>
            </div>
        `;
        list.appendChild(row);
        // remove handler
        row.querySelector('.expr-remove').addEventListener('click', () => row.remove());
    }

    // Live preview for newly added expression file inputs (add modal)
    const expressionsListEl = document.getElementById('expressions-list');
    if (expressionsListEl) {
        expressionsListEl.addEventListener('change', (e) => {
            const input = e.target;
            if (!input) return;
            const row = input.closest('.form-group');
            if (!row) return;
            if (input.classList.contains('expr-avatar')) {
                const preview = row.querySelector('.avatar-preview');
                if (input.files && input.files[0]) {
                    preview.innerHTML = `<img src="${URL.createObjectURL(input.files[0])}">`;
                } else {
                    preview.innerHTML = '';
                }
            }
            if (input.classList.contains('expr-full')) {
                const preview = row.querySelector('.full-preview');
                if (input.files && input.files[0]) {
                    preview.innerHTML = `<img src="${URL.createObjectURL(input.files[0])}">`;
                } else {
                    preview.innerHTML = '';
                }
            }
        });
    }

    async function submitAddAssetForm() {
        const type = document.getElementById('asset-type').value;
        const assetId = document.getElementById('asset-id').value.trim();
        const name = document.getElementById('asset-name').value.trim();
        if (!name) return alert('Display name is required');
        if (!type || !assetId) return alert('Type and Asset ID are required');
        // Duplicate checks across assets and characters
        if (mockAssets.find(a => a.asset_id === assetId) || mockCharacters.find(c => c.character_id === assetId)) {
            return alert('Asset ID already exists');
        }

        if (type === 'character') {
            // editing character?
            const editing = getEditingState();
            if (editing && editing.kind === 'character' && editing.id === assetId) {
                // update character
                const char = mockCharacters.find(c => c.character_id === assetId);
                if (char) {
                    char.name = name || char.name;
                    char.description = document.getElementById('asset-desc').value.trim() || char.description;
                }

                // Merge expressions instead of blind replace.
                // Build maps of existing and submitted expressions.
                const existing = mockExpressions.filter(e => e.character_id === assetId).reduce((m, e) => { m[e.name] = e; return m; }, {});
                const submittedRows = Array.from(document.querySelectorAll('#expressions-list .form-group'));
                const submitted = [];
                for (const row of submittedRows) {
                    const exprName = row.querySelector('.expr-name').value.trim() || 'default';
                    const avatarInput = row.querySelector('.expr-avatar');
                    const fullInput = row.querySelector('.expr-full');
                    submitted.push({ name: exprName, avatarInput, fullInput });
                }

                // Determine differences for confirmation message
                const existingNames = Object.keys(existing);
                const submittedNames = submitted.map(s => s.name);
                const toAdd = submittedNames.filter(n => !existingNames.includes(n));
                const toRemove = existingNames.filter(n => !submittedNames.includes(n));
                const toUpdate = submittedNames.filter(n => existingNames.includes(n));

                if (toAdd.length || toRemove.length || toUpdate.length) {
                    let msg = 'You are about to apply expression changes:';
                    if (toAdd.length) msg += `\nAdd: ${toAdd.join(', ')}`;
                    if (toUpdate.length) msg += `\nUpdate: ${toUpdate.join(', ')}`;
                    if (toRemove.length) msg += `\nRemove: ${toRemove.join(', ')}`;
                    msg += '\n\nProceed?';
                    if (!confirm(msg)) return; // abort if user cancels
                }

                // Apply changes: update existing entries, add new ones, remove missing ones
                // Update or add
                for (const s of submitted) {
                    const nameKey = s.name;
                    let avatarUrl = '';
                    let fullUrl = '';
                    if (s.avatarInput && s.avatarInput.files && s.avatarInput.files[0]) {
                        const f = s.avatarInput.files[0];
                        const uploaded = await (window.Services?.Assets?.create ? window.Services.Assets.create({}, f) : MockAssetAPI.uploadAndCreateAsset(f));
                        avatarUrl = uploaded?.url || '';
                    }
                    if (s.fullInput && s.fullInput.files && s.fullInput.files[0]) {
                        const f2 = s.fullInput.files[0];
                        const uploaded2 = await (window.Services?.Assets?.create ? window.Services.Assets.create({}, f2) : MockAssetAPI.uploadAndCreateAsset(f2));
                        fullUrl = uploaded2?.url || '';
                    }

                    if (existing[nameKey]) {
                        // update avatar/full only if new uploaded, otherwise keep existing
                        if (avatarUrl) existing[nameKey].avatar_url = avatarUrl;
                        if (fullUrl) existing[nameKey].full_url = fullUrl;
                    } else {
                        mockExpressions.push({ character_id: assetId, name: nameKey, avatar_url: avatarUrl, full_url: fullUrl });
                    }
                }

                // Remove expressions that are no longer present
                for (const rem of toRemove) {
                    const idx = mockExpressions.findIndex(e => e.character_id === assetId && e.name === rem);
                    if (idx !== -1) mockExpressions.splice(idx, 1);
                }

                hideAddAssetModal();
                AssetBrowser.renderCategoryGrid();
                AssetBrowser.openCategory('character');
                return;
            }

            // create character
            const desc = document.getElementById('asset-desc').value.trim();

            // gather expressions and validate: at least one expression and each must have an avatar image file
            const exprRows = Array.from(document.querySelectorAll('#expressions-list .form-group'));
            if (!exprRows.length) return alert('Please add at least one expression with an avatar image for the character.');
            for (const row of exprRows) {
                const avatarInput = row.querySelector('.expr-avatar');
                if (!avatarInput || !avatarInput.files || !avatarInput.files[0]) {
                    return alert('Each expression must include an avatar image file. Please choose an avatar image for every expression.');
                }
            }

            // create character record first
            await (window.Services?.Assets?.create ? window.Services.Assets.create({ asset_id: assetId, type: 'character', name, description: desc }, null) : MockAssetAPI.createAsset({ asset_id: assetId, type: 'character', name, description: desc }, null));

            // upload expressions (images are required per above validation)
            for (const row of exprRows) {
                const exprName = row.querySelector('.expr-name').value.trim();
                const avatarInput = row.querySelector('.expr-avatar');
                const fullInput = row.querySelector('.expr-full');
                let avatarUrl = '';
                let fullUrl = '';
                const f = avatarInput.files[0];
                const uploaded = await (window.Services?.Assets?.create ? window.Services.Assets.create({}, f) : MockAssetAPI.uploadAndCreateAsset(f));
                avatarUrl = uploaded?.url || '';
                if (fullInput && fullInput.files && fullInput.files[0]) {
                    const f2 = fullInput.files[0];
                    const uploaded2 = await (window.Services?.Assets?.create ? window.Services.Assets.create({}, f2) : MockAssetAPI.uploadAndCreateAsset(f2));
                    fullUrl = uploaded2?.url || '';
                }
                mockExpressions.push({ character_id: assetId, name: exprName || 'default', avatar_url: avatarUrl, full_url: fullUrl });
            }

            hideAddAssetModal();
            AssetBrowser.renderCategoryGrid();
            AssetBrowser.openCategory('character');
            return;
        }

        // media types
        const file = document.getElementById('asset-file-input').files[0];
        if (!file) return alert('Please select a media file');

        let meta = { asset_id: assetId, name };
        if (type === 'sfx' || type === 'bgm') {
            meta.type = 'audio';
            meta.category = type; // 'sfx' or 'bgm'
        } else if (type === 'video') {
            meta.type = 'video';
            meta.category = 'video';
        } else if (type === 'image') {
            meta.type = 'image';
            meta.category = 'thumbnail';
        } else if (type === 'gallery') {
            meta.type = 'image';
            meta.category = 'gallery';
        } else if (type === 'background') {
            meta.type = 'image';
            meta.category = 'background';
        } else {
            meta.type = 'image';
        }

        const editing = getEditingState();
        if (editing && editing.kind === 'asset' && editing.id === assetId) {
            // update existing asset (use service if available)
            if (window.Services?.Assets?.update) {
                await window.Services.Assets.update(assetId, { asset_id: assetId, type: meta.type, category: meta.category, name: name }, file);
            } else {
                await MockAssetAPI.updateAsset({ asset_id: assetId, type: meta.type, category: meta.category, name: name }, file);
            }
            hideAddAssetModal();
            AssetBrowser.renderCategoryGrid();
            if (AssetBrowser.currentCategory) AssetBrowser.renderAssetList(AssetBrowser.currentCategory);
            return;
        }

        const created = await (window.Services?.Assets?.create ? window.Services.Assets.create(meta, file) : MockAssetAPI.createAsset(meta, file));
        hideAddAssetModal();
        AssetBrowser.renderCategoryGrid();
        // open the correct category tab if applicable
        const openKey = (type === 'image' ? 'image' : type === 'gallery' ? 'gallery' : type === 'background' ? 'background' : type === 'video' ? 'video' : type === 'sfx' ? 'sfx' : type === 'bgm' ? 'bgm' : null);
        if (openKey) AssetBrowser.openCategory(openKey);
        return;
    }

}

/* ================================================================================================= */
/* Edit Asset Modal (separate)                                                                    */
/* ================================================================================================= */
function setupEditAssetModal() {
    const modal = document.getElementById('edit-asset-modal');
    const closeBtn = document.getElementById('edit-asset-modal-close');
    const cancelBtn = document.getElementById('edit-asset-cancel');
    const typeEl = document.getElementById('edit-asset-type');
    const idEl = document.getElementById('edit-asset-id');
    const nameEl = document.getElementById('edit-asset-name');
    const descEl = document.getElementById('edit-asset-desc');
    const charSection = document.getElementById('edit-asset-character-section');
    const mediaSection = document.getElementById('edit-asset-media-section');
    const fileInput = document.getElementById('edit-asset-file-input');
    const fileName = document.getElementById('edit-asset-file-name');
    const mediaPreview = document.getElementById('edit-media-preview');
    const addExprBtn = document.getElementById('edit-add-expression-btn');

    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    cancelBtn.addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    fileInput.addEventListener('change', (e) => {
        const f = e.target.files[0];
        if (!f) { fileName.textContent = ''; mediaPreview.style.display = 'none'; mediaPreview.innerHTML = ''; return; }
        fileName.textContent = `${f.name} (${Math.round(f.size/1024)} KB)`;
        // preview
        if (f.type.startsWith('image/')) mediaPreview.innerHTML = `<img src="${URL.createObjectURL(f)}" style="max-width:100%;">`;
        else if (f.type.startsWith('audio/')) mediaPreview.innerHTML = `<audio controls src="${URL.createObjectURL(f)}"></audio>`;
        else if (f.type.startsWith('video/')) mediaPreview.innerHTML = `<video controls src="${URL.createObjectURL(f)}" style="max-width:100%;"></video>`;
        mediaPreview.style.display = '';
    });

    addExprBtn.addEventListener('click', () => {
        const list = document.getElementById('edit-expressions-list');
        const row = document.createElement('div');
        row.className = 'form-group';
        row.innerHTML = `
            <div class="expr-row">
                <div class="expr-col expr-col-name">
                    <input type="text" placeholder="expression name" class="editor-input expr-name">
                </div>
                <div class="expr-col expr-col-avatar">
                    <label class="expr-label">Avatar</label>
                    <input type="file" accept="image/*" class="expr-avatar">
                    <div class="expr-preview avatar-preview"></div>
                </div>
                <div class="expr-col expr-col-full">
                    <label class="expr-label">Full</label>
                    <input type="file" accept="image/*" class="expr-full">
                    <div class="expr-preview full-preview"></div>
                </div>
                <div class="expr-col expr-col-actions">
                    <button type="button" class="btn-secondary expr-remove">Remove</button>
                </div>
            </div>
        `;
        list.appendChild(row);
        row.querySelector('.expr-remove').addEventListener('click', () => row.remove());
    });

    // Live preview for edit expressions file inputs (edit modal)
    const editExpressionsListEl = document.getElementById('edit-expressions-list');
    if (editExpressionsListEl) {
        editExpressionsListEl.addEventListener('change', (e) => {
            const input = e.target;
            if (!input) return;
            const row = input.closest('.form-group');
            if (!row) return;
            if (input.classList.contains('expr-avatar')) {
                const preview = row.querySelector('.avatar-preview');
                if (input.files && input.files[0]) {
                    preview.innerHTML = `<img src="${URL.createObjectURL(input.files[0])}">`;
                } else {
                    preview.innerHTML = '';
                }
            }
            if (input.classList.contains('expr-full')) {
                const preview = row.querySelector('.full-preview');
                if (input.files && input.files[0]) {
                    preview.innerHTML = `<img src="${URL.createObjectURL(input.files[0])}">`;
                } else {
                    preview.innerHTML = '';
                }
            }
        });
    }

    const form = document.getElementById('edit-asset-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const kind = document.getElementById('edit-asset-type').value;
        const assetId = document.getElementById('edit-asset-id').value.trim();
        const name = document.getElementById('edit-asset-name').value.trim();
        if (!name) return alert('Display name is required');

        if (!assetId) return alert('Missing asset id');

        if (kind === 'character') {
            // update character
            const char = mockCharacters.find(c => c.character_id === assetId);
            if (!char) return alert('Character not found');
            char.name = name || char.name;
            char.description = document.getElementById('edit-asset-desc').value.trim() || char.description;

            // Merge expressions (similar to create modal behavior)
            const existing = mockExpressions.filter(e => e.character_id === assetId).reduce((m, e) => { m[e.name] = e; return m; }, {});
            const rows = Array.from(document.querySelectorAll('#edit-expressions-list .form-group'));
            const submitted = [];
            for (const row of rows) {
                const exprName = row.querySelector('.expr-name').value.trim() || 'default';
                const avatarInput = row.querySelector('.expr-avatar');
                const fullInput = row.querySelector('.expr-full');
                submitted.push({ name: exprName, avatarInput, fullInput });
            }

            const existingNames = Object.keys(existing);
            const submittedNames = submitted.map(s => s.name);
            const toAdd = submittedNames.filter(n => !existingNames.includes(n));
            const toRemove = existingNames.filter(n => !submittedNames.includes(n));
            const toUpdate = submittedNames.filter(n => existingNames.includes(n));

            if (toAdd.length || toRemove.length || toUpdate.length) {
                let msg = 'You are about to apply expression changes:';
                if (toAdd.length) msg += `\nAdd: ${toAdd.join(', ')}`;
                if (toUpdate.length) msg += `\nUpdate: ${toUpdate.join(', ')}`;
                if (toRemove.length) msg += `\nRemove: ${toRemove.join(', ')}`;
                msg += '\n\nProceed?';
                if (!confirm(msg)) return;
            }

            for (const s of submitted) {
                const nameKey = s.name;
                let avatarUrl = '';
                let fullUrl = '';
                if (s.avatarInput && s.avatarInput.files && s.avatarInput.files[0]) {
                    const f = s.avatarInput.files[0];
                    const uploaded = await (window.Services?.Assets?.create ? window.Services.Assets.create({}, f) : MockAssetAPI.uploadAndCreateAsset(f));
                    avatarUrl = uploaded?.url || '';
                }
                if (s.fullInput && s.fullInput.files && s.fullInput.files[0]) {
                    const f2 = s.fullInput.files[0];
                    const uploaded2 = await (window.Services?.Assets?.create ? window.Services.Assets.create({}, f2) : MockAssetAPI.uploadAndCreateAsset(f2));
                    fullUrl = uploaded2?.url || '';
                }
                if (existing[nameKey]) {
                    if (avatarUrl) existing[nameKey].avatar_url = avatarUrl;
                    if (fullUrl) existing[nameKey].full_url = fullUrl;
                } else {
                    mockExpressions.push({ character_id: assetId, name: nameKey, avatar_url: avatarUrl, full_url: fullUrl });
                }
            }
            for (const rem of toRemove) {
                const idx = mockExpressions.findIndex(e => e.character_id === assetId && e.name === rem);
                if (idx !== -1) mockExpressions.splice(idx, 1);
            }

            modal.style.display = 'none';
            AssetBrowser.renderCategoryGrid();
            AssetBrowser.openCategory('character');
            return;
        }

        // asset media update
        const file = document.getElementById('edit-asset-file-input').files[0] || null;
        // determine meta (type/category) from displayed type
        let meta = { asset_id: assetId, name };
        const t = document.getElementById('edit-asset-type').value;
        if (t === 'bgm' || t === 'sfx') { meta.type = 'audio'; meta.category = t; }
        else if (t === 'video') { meta.type = 'video'; meta.category = 'video'; }
        else if (t === 'image') { meta.type = 'image'; meta.category = 'thumbnail'; }
        else if (t === 'gallery') { meta.type = 'image'; meta.category = 'gallery'; }
        else if (t === 'background') { meta.type = 'image'; meta.category = 'background'; }

        try {
            if (window.Services?.Assets?.update) {
                await window.Services.Assets.update(file ? (file.name || file) : meta.asset_id, meta, file);
            } else {
                await MockAssetAPI.updateAsset(meta, file);
            }
            modal.style.display = 'none';
            AssetBrowser.renderCategoryGrid();
            if (AssetBrowser.currentCategory) AssetBrowser.renderAssetList(AssetBrowser.currentCategory);
        } catch (err) {
            alert(err.message || 'Failed to update asset');
        }
    });
}

/* Helper to open edit modal with record */
function openEditAssetEditor({ kind, record }) {
    const modal = document.getElementById('edit-asset-modal');
    const typeEl = document.getElementById('edit-asset-type');
    const idEl = document.getElementById('edit-asset-id');
    const nameEl = document.getElementById('edit-asset-name');
    const descEl = document.getElementById('edit-asset-desc');
    const charSection = document.getElementById('edit-asset-character-section');
    const mediaSection = document.getElementById('edit-asset-media-section');
    const fileInput = document.getElementById('edit-asset-file-input');
    const fileName = document.getElementById('edit-asset-file-name');
    const mediaPreview = document.getElementById('edit-media-preview');

    // Reset
    document.getElementById('edit-expressions-list').innerHTML = '';
    fileInput.value = ''; fileName.textContent = ''; mediaPreview.style.display = 'none'; mediaPreview.innerHTML = '';

    if (kind === 'asset') {
        // map record to friendly type
        let friendly = 'image';
        if (record.type === 'audio') friendly = record.category === 'bgm' ? 'bgm' : 'sfx';
        else if (record.type === 'video') friendly = 'video';
        else if (record.type === 'image' && record.category === 'background') friendly = 'background';
        else if (record.type === 'image' && record.category === 'gallery') friendly = 'gallery';
        else if (record.type === 'image') friendly = 'image';

        typeEl.value = friendly;
        idEl.value = record.asset_id;
        nameEl.value = record.name || '';
        descEl.value = '';
        charSection.style.display = 'none';
        mediaSection.style.display = '';
        // preview current file
        mediaPreview.style.display = '';
        if (record.type === 'audio') mediaPreview.innerHTML = `<audio controls src="${escapeHtml(record.url)}"></audio>`;
        else if (record.type === 'video') mediaPreview.innerHTML = `<video controls src="${escapeHtml(record.url)}" style="max-width:100%;"></video>`;
        else mediaPreview.innerHTML = `<img src="${escapeHtml(record.url)}" style="max-width:100%;">`;
    } else if (kind === 'character') {
        typeEl.value = 'character';
        idEl.value = record.character_id;
        nameEl.value = record.name || '';
        descEl.value = record.description || '';
        charSection.style.display = '';
        mediaSection.style.display = 'none';
        const exprs = mockExpressions.filter(e => e.character_id === record.character_id);
        const list = document.getElementById('edit-expressions-list');
        list.innerHTML = '';
        for (const ex of exprs) {
            const row = document.createElement('div');
            row.className = 'form-group';
            row.innerHTML = `
                <div style="display:flex; gap:8px; align-items:center;">
                    <input type="text" placeholder="expression name" class="editor-input expr-name" style="flex:1;" value="${escapeHtml(ex.name)}">
                    <div style="display:flex; gap:6px; align-items:center;">
                        <label style="font-size:12px; color:var(--color-text-tertiary);">Avatar</label>
                        <input type="file" accept="image/*" class="expr-avatar" style="width:160px;">
                    </div>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <label style="font-size:12px; color:var(--color-text-tertiary);">Full</label>
                        <input type="file" accept="image/*" class="expr-full" style="width:160px;">
                    </div>
                    <button type="button" class="btn-secondary expr-remove">Remove</button>
                </div>
                <div style="display:flex; gap:8px; margin-top:6px;">
                    ${ex.avatar_url ? `<img src="${escapeHtml(ex.avatar_url)}" style="height:40px; border-radius:4px; object-fit:cover;">` : ''}
                    ${ex.full_url ? `<img src="${escapeHtml(ex.full_url)}" style="height:40px; border-radius:4px; object-fit:cover;">` : ''}
                </div>
            `;
            list.appendChild(row);
            row.querySelector('.expr-remove').addEventListener('click', () => row.remove());
        }
    }

    modal.style.display = 'flex';
}

/* ================================================================================================= */
/* Toolbar Management */
function setupToolbarButtons() {
    const addRegionBtn = document.getElementById('add-region-btn');
    const addArcBtn = document.getElementById('add-arc-btn');
    const addEventBtn = document.getElementById('add-event-btn');
    const addStoryBtn = document.getElementById('add-story-btn');
    
    addRegionBtn.addEventListener('click', () => showAddModal('region', null));
    addArcBtn.addEventListener('click', () => {
        if (!currentSelected) return;

        const selType = currentSelected.getAttribute('data-type');
        if (selType === 'region') {
            // add child arc under selected region
            showAddModal('arc', currentSelected);
            return;
        }

        if (selType === 'arc') {
            // add sibling arc under the same parent region
            const parentRegion = getParentTreeItemByType(currentSelected, 'region');
            if (parentRegion) showAddModal('arc', parentRegion);
            return;
        }
    });
    addEventBtn.addEventListener('click', () => {
        if (!currentSelected) return;

        const selType = currentSelected.getAttribute('data-type');
        if (selType === 'arc') {
            // add child event under selected arc
            showAddModal('event', currentSelected);
            return;
        }

        if (selType === 'event') {
            // add sibling event under the same parent arc
            const parentArc = getParentTreeItemByType(currentSelected, 'arc');
            if (parentArc) showAddModal('event', parentArc);
            return;
        }
    });
    addStoryBtn.addEventListener('click', () => {
        if (!currentSelected) return;

        const selectedType = currentSelected.getAttribute('data-type');
        if (selectedType === 'event') {
            showAddModal('story', currentSelected);
            return;
        }

        // If a story is selected, add a sibling story under its parent event.
        if (selectedType === 'story') {
            const parentEvent = getParentTreeItemByType(currentSelected, 'event');
            if (parentEvent) {
                showAddModal('story', parentEvent);
            }
        }
    });
}

function updateToolbarState(selectedType) {
    const addRegionBtn = document.getElementById('add-region-btn');
    const addArcBtn = document.getElementById('add-arc-btn');
    const addEventBtn = document.getElementById('add-event-btn');
    const addStoryBtn = document.getElementById('add-story-btn');

    // // Reset all
    if (addRegionBtn) addRegionBtn.disabled = true;
    if (addArcBtn) addArcBtn.disabled = true;
    if (addEventBtn) addEventBtn.disabled = true;
    if (addStoryBtn) addStoryBtn.disabled = true;

    // Default: allow adding root regions when nothing selected
    if (!selectedType) {
        if (addRegionBtn) addRegionBtn.disabled = false;
        return;
    }

    // Enable corresponding add (same level) and the add button for the child datatype
    // region -> enable Add Region (sibling) and Add Arc (child)
    if (selectedType === 'region') {
        if (addRegionBtn) addRegionBtn.disabled = false;
        if (addArcBtn) addArcBtn.disabled = false;
        return;
    }

    // arc -> enable Add Arc (sibling) and Add Event (child)
    if (selectedType === 'arc') {
        if (addArcBtn) addArcBtn.disabled = false;
        if (addEventBtn) addEventBtn.disabled = false;
        return;
    }

    // event -> enable Add Event (sibling) and Add Story (child)
    if (selectedType === 'event') {
        if (addEventBtn) addEventBtn.disabled = false;
        if (addStoryBtn) addStoryBtn.disabled = false;
        return;
    }

    // story -> enable Add Story (sibling); stories have no child type
    if (selectedType === 'story') {
        if (addStoryBtn) addStoryBtn.disabled = false;
        return;
    }
}

function getParentTreeItemByType(treeItem, expectedType) {
    let current = treeItem.parentElement;

    while (current) {
        if (current.classList && current.classList.contains('tree-item')) {
            const type = current.getAttribute('data-type');
            if (type === expectedType) {
                return current;
            }
        }
        current = current.parentElement;
    }

    return null;
}

/* ================================================================================================= */
/* Modal Management */
function setupModal() {
    const modal = document.getElementById('add-item-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const form = document.getElementById('add-item-form');
    
    closeBtn.addEventListener('click', hideModal);
    cancelBtn.addEventListener('click', hideModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });
    
    // Handle form submission
    form.addEventListener('submit', handleAddItem);
    
    // Setup image upload handlers
    setupImageUploadHandlers();
}

function showAddModal(itemType, parentElement) {
    const modal = document.getElementById('add-item-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('add-item-form');
    const itemTypeInput = document.getElementById('item-type');
    const parentIdInput = document.getElementById('parent-id');
    const imageUploadGroup = document.getElementById('image-upload-group');
    const imagePreview = document.getElementById('image-preview');
    const assetIdInput = document.getElementById('item-image-asset-id');
    const previewImg = document.getElementById('preview-img');
    const previewAssetId = document.getElementById('preview-asset-id');

    // Reset form
    form.reset();
    // Clear asset selection/preview
    if (assetIdInput) assetIdInput.value = '';
    if (previewImg) previewImg.src = '';
    if (previewAssetId) previewAssetId.textContent = '';
    if (imagePreview) imagePreview.style.display = 'none';
    
    // Set type and parent
    itemTypeInput.value = itemType;
    parentIdInput.value = parentElement ? parentElement.getAttribute('data-id') : '';
    
    // Show/hide image upload field based on item type
    if (itemType === 'region' || itemType === 'event') {
        imageUploadGroup.style.display = 'block';
    } else {
        imageUploadGroup.style.display = 'none';
    }
    
    // Update title
    modalTitle.textContent = `Add New ${capitalizeType(itemType)}`;
    
    // Show modal
    modal.style.display = 'flex';
}

function hideModal() {
    const modal = document.getElementById('add-item-modal');
    modal.style.display = 'none';
}

function setupImageUploadHandlers() {
    // New asset-chooser handlers. Old file/URL upload UI may not exist anymore.
    const chooseBtn = document.getElementById('choose-asset-btn');
    const clearBtn = document.getElementById('clear-asset-btn');
    const assetIdInput = document.getElementById('item-image-asset-id');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const previewAssetId = document.getElementById('preview-asset-id');

    if (chooseBtn) {
        chooseBtn.addEventListener('click', () => {
            console.log('Choose asset clicked (setupImageUploadHandlers)');
            const itemType = document.getElementById('item-type')?.value || 'region';
            const category = itemType === 'event' ? 'background' : 'thumbnail';

            showImagePickerModal((selected) => {
                if (!selected) return;
                if (assetIdInput) assetIdInput.value = selected.asset_id || selected.assetId || '';
                if (previewImg) previewImg.src = selected.url || selected;
                if (previewAssetId) previewAssetId.textContent = selected.asset_id || '';
                if (imagePreview) imagePreview.style.display = 'block';
                if (clearBtn) clearBtn.style.display = 'inline-block';
            }, 'image', category);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (assetIdInput) assetIdInput.value = '';
            if (previewImg) previewImg.src = '';
            if (previewAssetId) previewAssetId.textContent = '';
            if (imagePreview) imagePreview.style.display = 'none';
            clearBtn.style.display = 'none';
        });
    }
}

function handleAddItem(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const itemType = formData.get('type');
    const parentId = formData.get('parentId');
    const name = formData.get('name');
    const description = formData.get('description');
    let displayOrder = formData.get('displayOrder');
    const providedSpecificId = (formData.get('specificId') || '').trim();
    
    // Auto-calculate display_order if not provided
    if (!displayOrder || displayOrder === '') {
        displayOrder = getNextDisplayOrder(itemType, parentId);
    } else {
        displayOrder = parseInt(displayOrder);
    }
    
    // Get image asset id from picker (preferred) and resolve to URL, otherwise no image
    const selectedAssetId = (document.getElementById('item-image-asset-id') || {}).value || null;
    const imageUrl = selectedAssetId ? AssetResolver.toUrl(selectedAssetId) : null;

    // Require specific ID (no auto-generation)
    if (!providedSpecificId) {
        alert('ID is required. Please enter a unique ID for the item.');
        return;
    }

    // Validate uniqueness
    if (!isSpecificIdUnique(providedSpecificId, itemType)) {
        alert('Provided ID already exists. Please choose a unique ID.');
        return;
    }

    // Create new item using the provided specific ID
    const newItem = createNewItem(itemType, name, description, displayOrder, parentId, imageUrl, providedSpecificId);

    // Add to data structure
    addItemToDataStructure(newItem, parentId);

    // Update UI
    finalizeAddItem(newItem);
}

function addItemToDataStructure(newItem, parentId) {
    if (parentId) {
        addItemToParent(newItem, parentId);
    } else {
        // Add as root (region)
        mockStoryData.push(newItem);
    }
}

function finalizeAddItem(newItem) {
    // Re-render tree (event listeners already exist via delegation, no need to re-setup)
    renderStoryTree();
    
    // Clear selection and reset toolbar
    currentSelected = null;
    updateToolbarState(null);
    document.querySelectorAll('.tree-item-content.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Hide modal
    hideModal();
    
    // Show success message (you can implement a toast notification here)
    console.log('Item added successfully:', newItem);
}

function createNewItem(type, name, description, displayOrder, parentId, imageUrl, providedSpecificId) {
    // DB id will be assigned by server. Create a temporary client-side id for UI operations.
    const dbId = null;
    const clientId = generateClientId();
    const specificId = (providedSpecificId && providedSpecificId.trim() !== '') ? providedSpecificId.trim() : (function(){ throw new Error('specificId required'); })();
    
    const item = {
        id: dbId,
        client_id: clientId,
        name: name,
        type: type,
        description: description || null,
        display_order: displayOrder,
        children: []
    };
    
    // Add type-specific fields
    if (type === 'region') {
        item.region_id = specificId;
        item.icon_url = imageUrl || null;
    } else if (type === 'arc') {
        item.arc_id = specificId;
        item.region_id = getParentSpecificId(parentId, 'region');
        item.image_url = null;
    } else if (type === 'event') {
        item.event_id = specificId;
        item.arc_id = getParentSpecificId(parentId, 'arc');
        item.image_url = imageUrl || null;
    } else if (type === 'story') {
        item.story_id = specificId;
        item.event_id = getParentSpecificId(parentId, 'event');
        item.story_content = { sections: [], characters: {} };
    }
    
    return item;
}

function isSpecificIdUnique(specificId, type) {
    if (!specificId) return true;
    // Walk the data tree and check existing specific IDs
    for (const region of mockStoryData) {
        if (region.region_id === specificId) return false;
        for (const arc of region.children || []) {
            if (arc.arc_id === specificId) return false;
            for (const event of arc.children || []) {
                if (event.event_id === specificId) return false;
                for (const story of event.children || []) {
                    if (story.story_id === specificId) return false;
                }
            }
        }
    }
    return true;
}

// NOTE: DB ids are assigned by the server. Client no longer generates DB ids.
function generateClientId() {
    return `c-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function getParentSpecificId(parentDbId, expectedType) {
    // Find parent and return its specific ID
    const parent = findItemById(parentDbId);
    if (parent) {
        if (expectedType === 'region') return parent.region_id;
        if (expectedType === 'arc') return parent.arc_id;
        if (expectedType === 'event') return parent.event_id;
    }
    return null;
}

function findItemById(idOrClientId) {
    // Accept either numeric DB id or temporary client_id string
    if (idOrClientId === null || idOrClientId === undefined) return null;

    // Normalize: if it's a numeric-looking value (and not a client id starting with 'c-'), treat as DB id
    const asNumber = Number(idOrClientId);
    const useDbId = Number.isFinite(asNumber) && String(idOrClientId).trim() !== '' && !String(idOrClientId).startsWith('c-');

    for (const region of mockStoryData) {
        if (useDbId) {
            if (region.id === asNumber) return region;
        } else {
            if (region.client_id === idOrClientId) return region;
        }

        for (const arc of region.children || []) {
            if (useDbId) {
                if (arc.id === asNumber) return arc;
            } else {
                if (arc.client_id === idOrClientId) return arc;
            }

            for (const event of arc.children || []) {
                if (useDbId) {
                    if (event.id === asNumber) return event;
                } else {
                    if (event.client_id === idOrClientId) return event;
                }

                for (const story of event.children || []) {
                    if (useDbId) {
                        if (story.id === asNumber) return story;
                    } else {
                        if (story.client_id === idOrClientId) return story;
                    }
                }
            }
        }
    }
    return null;
}

function addItemToParent(newItem, parentDbId) {
    const parent = findItemById(parentDbId);
    if (parent && parent.children) {
        parent.children.push(newItem);
    }
}

function getNextDisplayOrder(itemType, parentId) {
    let siblings = [];
    
    if (!parentId) {
        // Getting next display order for regions (root level)
        siblings = mockStoryData;
    } else {
        // Getting next display order for children
        const parent = findItemById(parentId);
        if (parent && parent.children) {
            siblings = parent.children;
        }
    }
    
    // Find max display_order among siblings
    const maxOrder = siblings.reduce((max, item) => {
        const order = item.display_order;
        if (order !== null && order !== undefined && order > max) {
            return order;
        }
        return max;
    }, 0);
    
    return maxOrder + 1;
}

/* ================================================================================================= */

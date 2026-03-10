/* ================================================================================================= */
/* Story Editor - Tree Sidebar Manager */
/* ================================================================================================= */

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
    buildCharacterMap(charDeclarations) {
        const map = {};
        for (const decl of charDeclarations) {
            const expressions = MockCharacterAPI.getExpressions(decl.character_id);
            for (const expr of expressions) {
                const key = expr.name === 'default' ? decl.name : `${decl.name}.${expr.name}`;
                map[key] = {
                    avatar: expr.avatar_url || '',
                    full_image: expr.full_url || ''
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
                                    scenes: [],
                                    characters: ['char-amiya', 'char-doctor']
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
                                    scenes: [],
                                    characters: []
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
                                    scenes: [],
                                    characters: ['char-amiya']
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
                                    scenes: [],
                                    characters: []
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
                                    scenes: [],
                                    characters: ['char-chen']
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
                                    scenes: [],
                                    characters: []
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

function initializeEditor() {
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
    
    // Setup asset browser
    AssetBrowser.init();
}

/* ================================================================================================= */
/* Asset Browser                                                                                     */
/* ================================================================================================= */
const AssetBrowser = {
    currentCategory: null,

    categories: [
        { key: 'bgm',        label: 'BGM',        type: 'audio', category: 'bgm' },
        { key: 'sfx',        label: 'SFX',        type: 'audio', category: 'sfx' },
        { key: 'background', label: 'Backgrounds', type: 'image', category: 'background' },
        { key: 'image',      label: 'Images',      type: 'image', category: 'thumbnail' },
        { key: 'video',      label: 'Videos',      type: 'video', category: null },
        { key: 'character',  label: 'Characters',  type: null,    category: null },
        { key: 'gallery',    label: 'Gallery',     type: null,    category: null },
    ],

    init() {
        this.renderCategoryGrid();
        this.setupSearch();
    },

    /* ---- Category Grid ---- */
    renderCategoryGrid() {
        const grid = document.getElementById('asset-category-grid');
        grid.innerHTML = this.categories.map(cat => {
            const count = this.getCategoryCount(cat);
            return `
                <div class="asset-cat-card" data-cat="${cat.key}">
                    <span class="asset-cat-label">${cat.label}</span>
                    <span class="asset-cat-count">${count}</span>
                </div>
            `;
        }).join('');

        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.asset-cat-card');
            if (!card) return;
            this.openCategory(card.dataset.cat);
        });
    },

    getCategoryCount(cat) {
        if (cat.key === 'character') return mockCharacters.length;
        if (cat.key === 'gallery') {
            // Count unique gallery-like assets or placeholder
            return mockAssets.filter(a => a.category === 'gallery').length;
        }
        if (cat.key === 'video') return mockAssets.filter(a => a.type === 'video').length;
        if (cat.key === 'image') {
            // "Images" = thumbnails + any image not in background/character/gallery
            return mockAssets.filter(a => a.type === 'image' && a.category === 'thumbnail').length;
        }
        return mockAssets.filter(a => {
            if (cat.type && a.type !== cat.type) return false;
            if (cat.category && a.category !== cat.category) return false;
            return true;
        }).length;
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
    getAssetsForCategory(key) {
        switch (key) {
            case 'bgm':        return mockAssets.filter(a => a.type === 'audio' && a.category === 'bgm');
            case 'sfx':        return mockAssets.filter(a => a.type === 'audio' && a.category === 'sfx');
            case 'background': return mockAssets.filter(a => a.type === 'image' && a.category === 'background');
            case 'image':      return mockAssets.filter(a => a.type === 'image' && a.category === 'thumbnail');
            case 'video':      return mockAssets.filter(a => a.type === 'video');
            case 'gallery':    return mockAssets.filter(a => a.category === 'gallery');
            default:           return [];
        }
    },

    renderAssetList(key, filter = '') {
        const listContainer = document.getElementById('asset-list');
        const filterLower = filter.toLowerCase();

        if (key === 'character') {
            this.renderCharacterList(listContainer, filterLower);
            return;
        }

        const assets = this.getAssetsForCategory(key);
        const filtered = filterLower
            ? assets.filter(a => a.asset_id.toLowerCase().includes(filterLower))
            : assets;

        if (filtered.length === 0) {
            listContainer.innerHTML = '<div class="asset-list-empty">No assets found</div>';
            return;
        }

        listContainer.innerHTML = filtered.map(a => {
            const thumb = (a.type === 'image')
                ? `<img class="asset-list-thumb" src="${escapeHtml(a.url)}" alt="">`
                : '';
            return `
                <div class="asset-list-item" data-asset-id="${escapeHtml(a.asset_id)}">
                    ${thumb}
                    <span class="asset-item-name">${escapeHtml(a.asset_id)}</span>
                </div>
            `;
        }).join('');

        // Click handler
        listContainer.onclick = (e) => {
            const item = e.target.closest('.asset-list-item');
            if (!item) return;
            const assetId = item.dataset.assetId;
            const asset = mockAssets.find(a => a.asset_id === assetId);
            if (asset) this.showAssetPreview(asset);
        };
    },

    renderCharacterList(container, filter) {
        const chars = filter
            ? mockCharacters.filter(c =>
                c.name.toLowerCase().includes(filter) ||
                c.character_id.toLowerCase().includes(filter))
            : mockCharacters;

        if (chars.length === 0) {
            container.innerHTML = '<div class="asset-list-empty">No characters found</div>';
            return;
        }

        container.innerHTML = chars.map(c => {
            const exprs = mockExpressions.filter(e => e.character_id === c.character_id);
            const defaultExpr = exprs.find(e => e.name === 'default') || exprs[0];
            const avatarUrl = defaultExpr ? defaultExpr.avatar_url : '';
            const exprItems = exprs.map(ex => `
                <div class="asset-list-subitem" data-char-id="${escapeHtml(c.character_id)}" data-expr="${escapeHtml(ex.name)}">
                    <img class="asset-expr-thumb" src="${escapeHtml(ex.avatar_url)}" alt="">
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
        }).join('');

        // Toggle expressions
        container.onclick = (e) => {
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
                const char = mockCharacters.find(c => c.character_id === charId);
                const expr = mockExpressions.find(e => e.character_id === charId && e.name === exprName);
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
    treeContainer.innerHTML = '';
    
    // Sort regions by display_order before rendering
    const sortedRegions = sortByDisplayOrder([...mockStoryData]);
    
    sortedRegions.forEach(item => {
        const treeItemElement = createTreeItemElement(item);
        treeContainer.appendChild(treeItemElement);
    });
}

function createTreeItemElement(item, depth = 0) {
    const li = document.createElement('li');
    li.className = 'tree-item';
    li.setAttribute('data-id', item.id);
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
        toggleBtn.setAttribute('aria-expanded', 'false');
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
            const childElement = createTreeItemElement(child, depth + 1);
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
    const item = findItemById(parseInt(id));
    
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
                const asset = await MockAssetAPI.uploadAndCreateAsset(file);
                hiddenUrlInput.value = asset.url;
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
    const treeItem = document.querySelector(`.tree-item[data-id="${item.id}"]`);
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

    // Fetch assets from mock DB
    const assets = await MockAssetAPI.getAssets(type, category);

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
    selectBtn.addEventListener('click', () => {
        const selected = document.querySelector('#image-picker-grid .image-picker-card.selected');
        if (!selected) return;
        const url = selected.getAttribute('data-url');
        if (imagePickerCallback) imagePickerCallback(url);
        hideImagePickerModal();
    });

    // Upload button within picker
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';
        try {
            const asset = await MockAssetAPI.uploadAndCreateAsset(file);
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
/* Toolbar Management */
function setupToolbarButtons() {
    const addRegionBtn = document.getElementById('add-region-btn');
    const addArcBtn = document.getElementById('add-arc-btn');
    const addEventBtn = document.getElementById('add-event-btn');
    const addStoryBtn = document.getElementById('add-story-btn');
    
    addRegionBtn.addEventListener('click', () => showAddModal('region', null));
    addArcBtn.addEventListener('click', () => {
        if (currentSelected && currentSelected.getAttribute('data-type') === 'region') {
            showAddModal('arc', currentSelected);
        }
    });
    addEventBtn.addEventListener('click', () => {
        if (currentSelected && currentSelected.getAttribute('data-type') === 'arc') {
            showAddModal('event', currentSelected);
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
    const addArcBtn = document.getElementById('add-arc-btn');
    const addEventBtn = document.getElementById('add-event-btn');
    const addStoryBtn = document.getElementById('add-story-btn');
    
    // Reset all
    addArcBtn.disabled = true;
    addEventBtn.disabled = true;
    addStoryBtn.disabled = true;
    
    // Enable based on selection
    if (selectedType === 'region') {
        addArcBtn.disabled = false;
    } else if (selectedType === 'arc') {
        addEventBtn.disabled = false;
    } else if (selectedType === 'event' || selectedType === 'story') {
        addStoryBtn.disabled = false;
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
    const fileNameDisplay = document.getElementById('file-name-display');
    
    // Reset form
    form.reset();
    fileNameDisplay.textContent = '';
    imagePreview.style.display = 'none';
    
    // Reset to file upload option
    document.querySelectorAll('.image-option-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.option === 'file');
    });
    document.getElementById('file-upload-section').style.display = 'block';
    document.getElementById('url-input-section').style.display = 'none';
    
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
    const imageOptionBtns = document.querySelectorAll('.image-option-btn');
    const fileUploadSection = document.getElementById('file-upload-section');
    const urlInputSection = document.getElementById('url-input-section');
    const chooseFileBtn = document.getElementById('choose-file-btn');
    const fileInput = document.getElementById('item-image-file');
    const urlInput = document.getElementById('item-image-url');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const fileNameDisplay = document.getElementById('file-name-display');
    
    // Toggle between file and URL options
    imageOptionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const option = btn.dataset.option;
            
            // Update button states
            imageOptionBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide sections
            if (option === 'file') {
                fileUploadSection.style.display = 'block';
                urlInputSection.style.display = 'none';
                urlInput.value = '';
            } else {
                fileUploadSection.style.display = 'none';
                urlInputSection.style.display = 'block';
                fileInput.value = '';
                fileNameDisplay.textContent = '';
            }
            
            // Hide preview when switching
            imagePreview.style.display = 'none';
        });
    });
    
    // File input handling
    chooseFileBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Show file name
            fileNameDisplay.textContent = `Selected: ${file.name}`;
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (event) => {
                previewImg.src = event.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // URL input preview
    urlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
            previewImg.src = url;
            imagePreview.style.display = 'block';
            
            // Handle image load error
            previewImg.onerror = () => {
                imagePreview.style.display = 'none';
            };
        } else {
            imagePreview.style.display = 'none';
        }
    });
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
    
    // Auto-calculate display_order if not provided
    if (!displayOrder || displayOrder === '') {
        displayOrder = getNextDisplayOrder(itemType, parentId);
    } else {
        displayOrder = parseInt(displayOrder);
    }
    
    // Get image: either from file upload or URL input
    const fileInput = document.getElementById('item-image-file');
    const urlInput = document.getElementById('item-image-url');
    const activeOption = document.querySelector('.image-option-btn.active');
    
    if (activeOption && activeOption.dataset.option === 'file' && fileInput.files[0]) {
        // File upload: read as base64
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            // Generate new item with image data
            const newItem = createNewItem(itemType, name, description, displayOrder, parentId, imageData);
            
            // Add to data structure
            addItemToDataStructure(newItem, parentId);
            
            // Update UI
            finalizeAddItem(newItem);
        };
        
        reader.readAsDataURL(file);
    } else {
        // URL input or no image
        const imageUrl = urlInput.value.trim() || null;
        
        // Generate new item
        const newItem = createNewItem(itemType, name, description, displayOrder, parentId, imageUrl);
        
        // Add to data structure
        addItemToDataStructure(newItem, parentId);
        
        // Update UI
        finalizeAddItem(newItem);
    }
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

function createNewItem(type, name, description, displayOrder, parentId, imageUrl) {
    // Generate IDs
    const dbId = generateDbId(type);
    const specificId = generateSpecificId(type);
    
    const item = {
        id: dbId,
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
        item.story_content = { scenes: [], characters: [] };
    }
    
    return item;
}

function generateDbId(type) {
    // Get max ID from existing items of this type
    let maxId = 0;
    
    if (type === 'region') {
        maxId = Math.max(...mockStoryData.map(r => r.id), 0);
        return maxId + 1;
    } else if (type === 'arc') {
        mockStoryData.forEach(region => {
            region.children.forEach(arc => {
                maxId = Math.max(maxId, arc.id);
            });
        });
        return maxId + 1;
    } else if (type === 'event') {
        mockStoryData.forEach(region => {
            region.children.forEach(arc => {
                arc.children.forEach(event => {
                    maxId = Math.max(maxId, event.id);
                });
            });
        });
        return maxId + 1;
    } else if (type === 'story') {
        mockStoryData.forEach(region => {
            region.children.forEach(arc => {
                arc.children.forEach(event => {
                    event.children.forEach(story => {
                        maxId = Math.max(maxId, story.id);
                    });
                });
            });
        });
        return maxId + 1;
    }
    
    return maxId + 1;
}

function generateSpecificId(type) {
    // Generate a unique ID string
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${type}-${timestamp}-${random}`;
}

function getParentSpecificId(parentDbId, expectedType) {
    // Find parent and return its specific ID
    const parent = findItemById(parseInt(parentDbId));
    if (parent) {
        if (expectedType === 'region') return parent.region_id;
        if (expectedType === 'arc') return parent.arc_id;
        if (expectedType === 'event') return parent.event_id;
    }
    return null;
}

function findItemById(dbId) {
    // Recursively search for item by database ID
    for (const region of mockStoryData) {
        if (region.id === dbId) return region;
        
        for (const arc of region.children || []) {
            if (arc.id === dbId) return arc;
            
            for (const event of arc.children || []) {
                if (event.id === dbId) return event;
                
                for (const story of event.children || []) {
                    if (story.id === dbId) return story;
                }
            }
        }
    }
    return null;
}

function addItemToParent(newItem, parentDbId) {
    const parent = findItemById(parseInt(parentDbId));
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
        const parent = findItemById(parseInt(parentId));
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

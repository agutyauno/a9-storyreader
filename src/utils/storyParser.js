import { SupabaseAPI } from '../services/supabaseApi';

/**
 * Utilities for extracting properties from script parameter strings.
 */
export const ScriptUtils = {
    /** 
     * Parse key="value" pairs from a string into an object 
     * @param {string} str - e.g. 'src="bg_01" loop="bgm_01"'
     * @returns {Object} map of parsed parameters
     */
    parseParams(str) {
        if (!str) return {};
        const params = {};
        const regex = /(\w+)="([^"]*)"/g;
        let match;
        while ((match = regex.exec(str)) !== null) {
            params[match[1]] = match[2];
        }
        return params;
    }
};

/**
 * Parses VNScript text format into structured `story_content` JSON.
 * 
 * Two modes:
 *  - `parse(scriptText)` — synchronous, keeps raw IDs as-is (for fast local editing)
 *  - `parseWithDB(scriptText)` — async, resolves character_id & asset_id → real URLs from Supabase
 */
export const StoryScriptParser = {

    /**
     * Synchronous parse — keeps raw IDs/values from the script text.
     * Used for quick local previews or when DB is unavailable.
     * @param {string} scriptText
     * @returns {Object} story_content JSON
     */
    parse(scriptText) {
        if (!scriptText) return { characters: {}, sections: [] };
        return this._buildStructure(scriptText);
    },

    /**
     * Async parse — resolves all character_id and asset_id to real URLs from Supabase.
     * Used for live preview and final save output.
     * @param {string} scriptText
     * @param {Object} [cachedChars] - optional map: character_id -> { avatar_url, full_url, expressions }
     * @param {Object} [cachedAssets] - optional map: asset_id -> { url }
     * @returns {Promise<Object>} story_content JSON with real URLs
     */
    async parseWithDB(scriptText, cachedChars, cachedAssets) {
        if (!scriptText) return { characters: {}, sections: [] };

        // Step 1: Build the raw structure (sync)
        const result = this._buildStructure(scriptText);

        // Step 2: Collect all IDs that need resolving, filtering out already cached ones
        const characterIdsToFetch = new Set();
        const assetIdsToFetch = new Set();
        
        const characterIdsNeeded = new Set();
        const assetIdsNeeded = new Set();

        // From @char declarations
        for (const [, data] of Object.entries(result.characters)) {
            if (data.character_id) characterIdsNeeded.add(data.character_id);
        }

        // From sections
        for (const section of result.sections) {
            for (const el of (section.elements || [])) {
                if (el.type === 'background' && el.image) assetIdsNeeded.add(el.image);
                if (el.type === 'video' && el.src) assetIdsNeeded.add(el.src);
                if (el.bgm) {
                    if (el.bgm.id) assetIdsNeeded.add(el.bgm.id);
                    if (el.bgm.intro) assetIdsNeeded.add(el.bgm.intro);
                    if (el.bgm.loop) assetIdsNeeded.add(el.bgm.loop);
                }
                for (const d of (el.dialogues || [])) {
                    if (d.type === 'sfx' && d.src) assetIdsNeeded.add(d.src);
                }
            }
        }

        // Check cache
        for (const id of characterIdsNeeded) if (!cachedChars?.[id]) characterIdsToFetch.add(id);
        for (const id of assetIdsNeeded) if (!cachedAssets?.[id]) assetIdsToFetch.add(id);

        // Step 3: Batch fetch from DB (only what's missing)
        let charMap = { ...cachedChars };
        let assetMap = { ...cachedAssets };

        try {
            const fetches = [];
            if (characterIdsToFetch.size > 0) fetches.push(SupabaseAPI.getCharactersWithExpressionsByIds([...characterIdsToFetch]));
            else fetches.push(Promise.resolve({}));

            if (assetIdsToFetch.size > 0) fetches.push(SupabaseAPI.getAssetsByIds([...assetIdsToFetch]));
            else fetches.push(Promise.resolve({}));

            const [newChars, newAssets] = await Promise.all(fetches);
            charMap = { ...charMap, ...newChars };
            assetMap = { ...assetMap, ...newAssets };
        } catch (err) {
            console.warn('StoryParser: DB fetch failed, using raw IDs as fallback.', err);
            return result; // Return unresolved result as fallback
        }

        // Step 4: Resolve — replace IDs with real URLs
        const resolveAssetUrl = (id) => assetMap[id]?.url || id;

        // Resolve characters
        for (const [name, data] of Object.entries(result.characters)) {
            const dbChar = data.character_id ? charMap[data.character_id] : null;
            if (dbChar) {
                result.characters[name] = {
                    character_id: data.character_id,
                    avatar: dbChar.avatar_url || data.avatar,
                    full_image: dbChar.full_url || data.full_image,
                    color: data.color || null,
                    expressions: dbChar.expressions || {}
                };
            }
        }

        // Resolve assets in sections
        for (const section of result.sections) {
            for (const el of (section.elements || [])) {
                if (el.type === 'background' && el.image) {
                    el._asset_id = el.image;  // Preserve original ID for serializer
                    el.image = resolveAssetUrl(el.image);
                }
                if (el.type === 'video' && el.src) {
                    el._asset_id = el.src;
                    el.src = resolveAssetUrl(el.src);
                }
                if (el.bgm) {
                    el.bgm._id = el.bgm.id; // Preserve
                    if (el.bgm.id) el.bgm.id = resolveAssetUrl(el.bgm.id);
                    if (el.bgm.intro) el.bgm.intro = resolveAssetUrl(el.bgm.intro);
                    if (el.bgm.loop) el.bgm.loop = resolveAssetUrl(el.bgm.loop);
                }
                for (const d of (el.dialogues || [])) {
                    if (d.type === 'sfx' && d.src) {
                        d._asset_id = d.src;
                        d.src = resolveAssetUrl(d.src);
                    }
                }
            }
        }

        return result;
    },

    /**
     * Internal: Build the raw JSON structure from vnscript text.
     * @param {string} scriptText
     * @returns {Object}
     */
    _buildStructure(scriptText) {
        const lines = scriptText.split('\n');
        const result = { characters: {}, sections: [] };

        let currentSection = null;
        let currentBackground = null;
        
        // Stack for nested elements (like contents of a @response)
        // Each entry is { elements: [], type: 'root'|'response'|'narrator', target: object }
        const stack = [];

        // First pass: collect @char declarations
        for (const line of lines) {
            const trimmed = line.trim();
            const charMatch = trimmed.match(/^@char\s+(\S+)\s*(.*)/);
            if (charMatch) {
                const name = charMatch[1];
                let paramsRaw = charMatch[2].trim();
                
                // Support unified bracket format: @char Name [id="...", color="..."]
                if (paramsRaw.startsWith('[') && paramsRaw.endsWith(']')) {
                    paramsRaw = paramsRaw.slice(1, -1);
                }
                
                const params = ScriptUtils.parseParams(paramsRaw);
                result.characters[name] = {
                    character_id: params.id || null,
                    avatar: params.avatar || '',
                    full_image: params.full || '',
                    color: params.color || null
                };
            }
        }

        const pushToParent = (element) => {
            if (stack.length > 0) {
                const top = stack[stack.length - 1];
                if (top.type === 'narrator') {
                    // Narrator blocks ignore other elements, just treat as text if not @end
                    return; 
                }
                top.elements.push(element);
            } else if (currentBackground) {
                currentBackground.dialogues.push(element);
            }
        };

        // Second pass: parse content
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // skip empty lines only if not in a block, and always skip comments/@char here
            if (trimmed.startsWith('#') || trimmed.startsWith('@char')) continue;
            if (!trimmed && stack.length === 0) continue; 


            // Handle Block End
            if (trimmed === '}') {
                if (stack.length > 0) stack.pop();
                continue;
            }

            // If we are inside a narrator block, everything is text until '}'
            if (stack.length > 0 && stack[stack.length - 1].type === 'narrator') {
                const top = stack[stack.length - 1];
                top.target.text = (top.target.text ? top.target.text + '\n' : '') + trimmed;
                continue;
            }

            // @section
            if (trimmed === '@section') {
                if (currentBackground && currentSection) {
                    currentSection.elements.push(currentBackground);
                    currentBackground = null;
                }
                currentSection = { type: 'dialogue_section', elements: [] };
                result.sections.push(currentSection);
                stack.length = 0; // Clear stack on new section
                continue;
            }

            if (!currentSection) {
                currentSection = { type: 'dialogue_section', elements: [] };
                result.sections.push(currentSection);
            }

            // @video
            const videoMatch = trimmed.match(/^@video\s*(.*)/);
            if (videoMatch) {
                if (currentBackground) {
                    currentSection.elements.push(currentBackground);
                    currentBackground = null;
                }
                const params = ScriptUtils.parseParams(videoMatch[1]);
                const video = { type: 'video', src: params.src || '' };
                currentSection.elements.push(video);
                continue;
            }

            // @bg
            const bgMatch = trimmed.match(/^@bg\s+"([^"]*)"/);
            if (bgMatch) {
                if (currentBackground) {
                    currentSection.elements.push(currentBackground);
                }
                currentBackground = { type: 'background', image: bgMatch[1], dialogues: [] };
                stack.length = 0; 
                continue;
            }

            // @bgm
            const bgmMatch = trimmed.match(/^@bgm\s+(.*)/);
            if (bgmMatch && currentBackground) {
                const params = ScriptUtils.parseParams(bgmMatch[1]);
                currentBackground.bgm = {
                    id: params.id || '',
                    intro: params.intro || '',
                    loop: params.loop || ''
                };
                continue;
            }

            // @sfx
            const sfxMatch = trimmed.match(/^@sfx\s+"([^"]*)"\s*(.*)/);
            if (sfxMatch && currentBackground) {
                const params = ScriptUtils.parseParams(sfxMatch[2]);
                pushToParent({
                    type: 'sfx',
                    name: sfxMatch[1],
                    src: params.src || ''
                });
                continue;
            }

            // @narrator: text OR @narrator {
            const narratorMatch = trimmed.match(/^@narrator:?\s*(.*)/);
            if (narratorMatch && currentBackground) {
                const content = narratorMatch[1].trim();
                const narrator = { type: 'narrator', text: '' };
                
                if (content === '{') {
                    pushToParent(narrator);
                    stack.push({ type: 'narrator', target: narrator });
                } else {
                    narrator.text = content.replace(/^:/, '').trim();
                    pushToParent(narrator);
                }
                continue;
            }

            // @decision
            const decisionMatch = trimmed.match(/^@decision\s+"([^"]*)"\s*(?:\[([^\]]*)\])?\s*/);
            if (decisionMatch && currentBackground) {
                const chars = decisionMatch[2] ? decisionMatch[2].split(',').map(s => s.trim()) : [];
                const choices = [];
                while (i + 1 < lines.length) {
                    const nextTrimmed = lines[i + 1].trim();
                    if (nextTrimmed.startsWith('- ')) {
                        choices.push(nextTrimmed.substring(2).trim());
                        i++;
                    } else {
                        break;
                    }
                }
                const decision = { type: 'decision', group_id: decisionMatch[1], choices };
                if (chars[0]) decision.left = chars[0];
                if (chars[1]) decision.right = chars[1];
                pushToParent(decision);
                continue;
            }

            // @response
            const responseMatch = trimmed.match(/^@response\s+"([^"]*)"\s+(\d+)\s*(\{?)/);
            if (responseMatch) {
                const response = {
                    type: 'choice_response',
                    group_id: responseMatch[1],
                    choice_value: responseMatch[2],
                    elements: []
                };
                pushToParent(response);
                if (responseMatch[3] === '{') {
                    stack.push({ type: 'response', elements: response.elements, target: response });
                }
                continue;
            }

            // Dialogue: Name [left, right]: text
            const dialogueMatch = trimmed.match(/^(.+?)\s*\[([^\]]*)\]\s*:\s*(.+)/);
            if (dialogueMatch && currentBackground) {
                const name = dialogueMatch[1].trim();
                const bracketContent = dialogueMatch[2];
                const text = dialogueMatch[3];

                // Support both positional [left, right] and named [color="red"]
                const commaParts = bracketContent.split(',').map(s => s.trim());
                const left = (commaParts[0] && !commaParts[0].includes('=')) ? commaParts[0] : '';
                const right = (commaParts[1] && !commaParts[1].includes('=')) ? commaParts[1] : '';
                
                const namedParams = ScriptUtils.parseParams(bracketContent);
                const color = namedParams.color || null;

                pushToParent({
                    type: 'dialogue', name, text,
                    left, right, color
                });
                continue;
            }

            // Simple dialogue: Name: text
            const simpleMatch = trimmed.match(/^(\S+):\s+(.+)/);
            if (simpleMatch && currentBackground && !trimmed.startsWith('@')) {
                const name = simpleMatch[1];
                const text = simpleMatch[2];
                pushToParent({
                    type: 'dialogue', name, text, left: '', right: ''
                });
                continue;
            }
        }

        // Finalize last background
        if (currentBackground && currentSection) {
            currentSection.elements.push(currentBackground);
        }

        return result;
    }
};

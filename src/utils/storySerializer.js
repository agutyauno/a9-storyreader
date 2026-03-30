/**
 * Serializes `story_content` JSON back into VNScript text format.
 * 
 * When data comes from `parseWithDB()`, uses `_asset_id` fields to output IDs
 * instead of resolved URLs. Falls back to the raw value if `_asset_id` is absent.
 */
export const StoryScriptSerializer = {
    /**
     * Convert story_content JSON into VN script text
     * @param {Object} storyContent
     * @returns {string}
     */
    serialize(storyContent) {
        if (!storyContent) return '';
        const lines = [];

        // Header Comments
        if (Array.isArray(storyContent.header_comments)) {
            storyContent.header_comments.forEach(c => lines.push(`# ${c}`));
            if (storyContent.header_comments.length > 0) lines.push('');
        }

        // Characters
        const characters = storyContent.characters;
        if (characters && typeof characters === 'object' && !Array.isArray(characters)) {
            const entries = Object.entries(characters);
            if (entries.length > 0) {
                for (const [name, data] of entries) {
                    if (name.includes('.')) continue; // skip expression variants

                    const params = [];
                    if (data.character_id) params.push(`id="${data.character_id}"`);
                    if (data.color) params.push(`color="${data.color}"`);
                    
                    const paramPart = params.length > 0 ? ` [${params.join(', ')}]` : '';
                    lines.push(`@char ${name}${paramPart}`);
                }
                lines.push('');
            }
        }

        // Sections
        const sections = storyContent.sections || [];
        sections.forEach((section) => {
            (section.elements || []).forEach(element => {
                if (element.type === 'video') {
                    this.serializeVideo(element, lines);
                } else if (element.type === 'background') {
                    this.serializeBackground(element, lines);
                } else if (element.type === 'comment') {
                    this.serializeComment(element, lines);
                }
            });
        });

        // Cleanup extra newlines
        return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    },

    serializeVideo(el, lines) {
        let line = '@video';
        // Prefer _asset_id (original ID) over resolved src URL
        const src = el._asset_id || el.src;
        if (src) line += ` src="${src}"`;
        lines.push(line);
        lines.push('');
    },

    serializeBackground(el, lines) {
        // Prefer _asset_id (original ID) over resolved image URL
        const imageId = el._asset_id || el.image || '';
        lines.push(`@bg "${imageId}"`);

        if (el.bgm && (el.bgm.id || el.bgm._id || el.bgm.intro || el.bgm.loop)) {
            let bgmLine = '@bgm';
            // Prefer _id (original) for the bgm id field
            const bgmId = el.bgm._id || el.bgm.id;
            if (bgmId) bgmLine += ` id="${bgmId}"`;
            if (el.bgm.intro) bgmLine += ` intro="${el.bgm.intro}"`;
            if (el.bgm.loop) bgmLine += ` loop="${el.bgm.loop}"`;
            lines.push(bgmLine);
        }

        this.serializeElements(el.dialogues || [], lines, 0);
        lines.push('');
    },

    serializeComment(el, lines, indentLevel = 0) {
        const indent = '  '.repeat(indentLevel);
        lines.push(`${indent}# ${el.text || ''}`);
    },

    serializeElements(elements, lines, indentLevel = 0) {
        const indent = '  '.repeat(indentLevel);
        elements.forEach(d => {
            switch (d.type) {
                case 'dialogue':
                    lines.push(indent + this.formatDialogueLine(d));
                    break;
                case 'narrator':
                    if (d.text?.includes('\n')) {
                        lines.push(`${indent}@narrator {`);
                        d.text.split('\n').forEach(line => lines.push(`${indent}  ${line}`));
                        lines.push(`${indent}}`);
                    } else {
                        lines.push(`${indent}@narrator: ${d.text || ''}`);
                    }
                    break;
                case 'sfx': {
                    const sfxSrc = d._asset_id || d.src || '';
                    lines.push(`${indent}@sfx "${d.name || ''}" src="${sfxSrc}"`);
                    break;
                }
                case 'decision':
                    this.serializeDecision(d, lines, indentLevel);
                    break;
                case 'choice_response': {
                    lines.push(`${indent}@response "${d.group_id || ''}" ${d.choice_value || 0} {`);
                    this.serializeElements(d.elements || [], lines, indentLevel + 1);
                    lines.push(`${indent}}`);
                    break;
                }
                case 'comment': {
                    this.serializeComment(d, lines, indentLevel);
                    break;
                }
            }
        });
    },

    serializeDecision(d, lines, indentLevel = 0) {
        const indent = '  '.repeat(indentLevel);
        let line = `${indent}@decision "${d.group_id || ''}"`;
        if (d.left || d.right) {
            line += ` [${d.left || ''}, ${d.right || ''}]`;
        }
        lines.push(line);
        (d.choices || []).forEach(choice => lines.push(`${indent}- ${choice}`));
    },

    formatDialogueLine(d) {
        const params = [];
        if (d.left || d.right || d.color) {
            if (d.color && !d.left && !d.right) {
                // If only color is present, we can just use named param
                params.push(`color="${d.color}"`);
            } else {
                // If left/right are present, we maintain positions
                params.push(d.left || '');
                params.push(d.right || '');
                if (d.color) params.push(`color="${d.color}"`);
            }
        }

        const charPart = params.length > 0 ? ` [${params.join(', ')}]` : '';
        return `${d.name || '???'}${charPart}: ${d.text || ''}`;
    }
};

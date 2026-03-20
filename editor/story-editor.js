/* ================================================================================================= */
/* Story Content Script Editor                                                                       */
/* Uses CodeMirror 5 with a custom VN script syntax                                                  */
/* ================================================================================================= */

/*
 * Script syntax reference:
 *
 *   # This is a comment
 *
 *   @char Amiya id="char-amiya"
 *   @char Doctor id="char-doctor"
 *
 *   @section
 *
 *   @video src="asset_id" bgm="asset_id"
 *
 *   @bg "asset_id"
 *   @bgm id="theme" intro="asset_id" loop="asset_id"
 *
 *   Amiya [Amiya, Doctor]: Welcome back, Doctor.
 *   Amiya.happy [Amiya.happy, Doctor]: I'm so glad!
 *   @sfx "footstep" src="asset_id"
 *   Doctor [Amiya, Doctor]: Where am I?
 *
 *   @decision "group_id" [Doctor, Amiya]
 *   - Fight
 *   - Run
 *
 *   @response "group_id" 1
 *   Amiya [Amiya, Doctor]: Let's fight together!
 */

/* ================================================================================================= */
/* CodeMirror Mode: vnscript                                                                         */
/* ================================================================================================= */
CodeMirror.defineMode('vnscript', function () {
    return {
        startState: function () {
            return { context: 'default' };
        },
        token: function (stream, state) {
            if (stream.sol()) {
                state.context = 'default';

                // Comment
                if (stream.match(/^#.*/)) return 'comment';

                // Directive (@keyword)
                if (stream.match(/^@\w+/)) {
                    state.context = 'directive';
                    return 'keyword';
                }

                // Choice line (- text)
                if (stream.match(/^-\s+/)) {
                    stream.skipToEnd();
                    return 'string-2';
                }

                // Dialogue name — text before [ or : (not starting with special chars)
                if (!stream.match(/^[@#\-]/, false) && stream.match(/^[^\[\]:]+(?=\s*[\[:])/)) {
                    state.context = 'dialogue';
                    return 'variable-2';
                }
            }

            // Quoted strings
            if (stream.peek() === '"') {
                stream.next();
                stream.eatWhile(/[^"]/);
                if (stream.peek() === '"') stream.next();
                return 'string';
            }

            // Square brackets [left, right]
            if (stream.peek() === '[') {
                stream.next();
                stream.eatWhile(/[^\]]/);
                if (stream.peek() === ']') stream.next();
                return 'bracket';
            }

            // Param name before = in directive context
            if (state.context === 'directive' && stream.match(/\w+(?==)/)) {
                return 'def';
            }

            // =
            if (stream.match(/^=/)) return 'operator';

            // Colon (dialogue separator)
            if (stream.match(/^:\s*/)) return 'operator';

            // Numbers
            if (stream.match(/^\d+/)) return 'number';

            // Whitespace
            if (stream.eatSpace()) return null;

            stream.next();
            return null;
        }
    };
});

/* ================================================================================================= */
/* Script → JSON Parser                                                                              */
/* ================================================================================================= */
const StoryScriptParser = {
    /**
     * Parse VN script text into story_content JSON
     * @param {string} scriptText
     * @returns {Object} story_content JSON
     */
    async parse(scriptText) {
        const lines = scriptText.split('\n');
        const charDeclarations = [];
        const result = { characters: {}, sections: [] };

        let currentSection = null;
        let currentBackground = null;
        let pendingResponse = null;

        // First pass: collect @char declarations
        for (const line of lines) {
            const trimmed = line.trim();
            const charMatch = trimmed.match(/^@char\s+(\S+)\s*(.*)/);
            if (charMatch) {
                const params = this.parseParams(charMatch[2]);
                if (params.id) {
                    charDeclarations.push({ name: charMatch[1], character_id: params.id });
                } else {
                    // Fallback: manual avatar/full (legacy)
                    charDeclarations.push({
                        name: charMatch[1],
                        character_id: null,
                        avatar: AssetResolver.toUrl(params.avatar || ''),
                        full_image: AssetResolver.toUrl(params.full || '')
                    });
                }
            }
        }

        // Build characters map from declarations
        for (const decl of charDeclarations) {
            if (decl.character_id) {
                // CharacterResolver.buildCharacterMap is async now
                const exprMap = await CharacterResolver.buildCharacterMap([decl]);
                Object.assign(result.characters, exprMap);
            } else {
                // Legacy manual avatar/full
                result.characters[decl.name] = {
                    avatar: decl.avatar || '',
                    full_image: decl.full_image || ''
                };
            }
        }

        // Second pass: parse content
        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();

            // Skip empty lines, comments, and @char (already processed)
            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('@char')) continue;

            // @section
            if (trimmed === '@section') {
                if (currentBackground && currentSection) {
                    currentSection.elements.push(currentBackground);
                    currentBackground = null;
                }
                currentSection = { type: 'dialogue_section', elements: [] };
                result.sections.push(currentSection);
                continue;
            }

            // Auto-create section if none exists
            if (!currentSection) {
                currentSection = { type: 'dialogue_section', elements: [] };
                result.sections.push(currentSection);
            }

            // @video src="url"
            const videoMatch = trimmed.match(/^@video\s*(.*)/);
            if (videoMatch) {
                if (currentBackground) {
                    currentSection.elements.push(currentBackground);
                    currentBackground = null;
                }
                const params = this.parseParams(videoMatch[1]);
                const video = { type: 'video', src: AssetResolver.toUrl(params.src || '') };
                currentSection.elements.push(video);
                continue;
            }

            // @bg "url"
            const bgMatch = trimmed.match(/^@bg\s+"([^"]*)"/);
            if (bgMatch) {
                if (currentBackground) {
                    currentSection.elements.push(currentBackground);
                }
                currentBackground = { type: 'background', image: AssetResolver.toUrl(bgMatch[1]), dialogues: [] };
                continue;
            }

            // @bgm id="id" intro="url" loop="url"
            const bgmMatch = trimmed.match(/^@bgm\s+(.*)/);
            if (bgmMatch && currentBackground) {
                const params = this.parseParams(bgmMatch[1]);
                currentBackground.bgm = {
                    id: params.id || '',
                    intro: AssetResolver.toUrl(params.intro || ''),
                    loop: AssetResolver.toUrl(params.loop || '')
                };
                continue;
            }

            // @sfx "name" src="url"
            const sfxMatch = trimmed.match(/^@sfx\s+"([^"]*)"\s*(.*)/);
            if (sfxMatch && currentBackground) {
                const params = this.parseParams(sfxMatch[2]);
                currentBackground.dialogues.push({
                    type: 'sfx',
                    name: sfxMatch[1],
                    src: AssetResolver.toUrl(params.src || '')
                });
                continue;
            }

            // @decision "group_id" [left, right]
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
                currentBackground.dialogues.push(decision);
                continue;
            }

            // @response "group_id" choice_value
            const responseMatch = trimmed.match(/^@response\s+"([^"]*)"\s+(\d+)/);
            if (responseMatch) {
                pendingResponse = {
                    group_id: responseMatch[1],
                    choice_value: responseMatch[2]
                };
                continue;
            }

            // Dialogue with brackets: Name [left, right]: text
            const dialogueMatch = trimmed.match(/^(.+?)\s*\[([^\]]*)\]\s*:\s*(.+)/);
            if (dialogueMatch && currentBackground) {
                const name = dialogueMatch[1].trim();
                const chars = dialogueMatch[2].split(',').map(s => s.trim());
                const text = dialogueMatch[3];

                if (pendingResponse) {
                    currentBackground.dialogues.push({
                        type: 'choice_response',
                        group_id: pendingResponse.group_id,
                        choice_value: pendingResponse.choice_value,
                        name, text,
                        left: chars[0] || '', right: chars[1] || ''
                    });
                    pendingResponse = null;
                } else {
                    currentBackground.dialogues.push({
                        type: 'dialogue', name, text,
                        left: chars[0] || '', right: chars[1] || ''
                    });
                }
                continue;
            }

            // Simple dialogue without brackets: Name: text
            const simpleMatch = trimmed.match(/^(\S+):\s+(.+)/);
            if (simpleMatch && currentBackground && !trimmed.startsWith('@')) {
                const name = simpleMatch[1];
                const text = simpleMatch[2];
                if (pendingResponse) {
                    currentBackground.dialogues.push({
                        type: 'choice_response',
                        group_id: pendingResponse.group_id,
                        choice_value: pendingResponse.choice_value,
                        name, text, left: '', right: ''
                    });
                    pendingResponse = null;
                } else {
                    currentBackground.dialogues.push({
                        type: 'dialogue', name, text, left: '', right: ''
                    });
                }
                continue;
            }
        }

        // Finalize last background
        if (currentBackground && currentSection) {
            currentSection.elements.push(currentBackground);
        }

        return result;
    },

    /** Parse key="value" pairs from a string */
    parseParams(str) {
        const params = {};
        const regex = /(\w+)="([^"]*)"/g;
        let match;
        while ((match = regex.exec(str)) !== null) {
            params[match[1]] = match[2];
        }
        return params;
    }
};

/* ================================================================================================= */
/* JSON → Script Serializer                                                                          */
/* ================================================================================================= */
const StoryScriptSerializer = {
    /**
     * Convert story_content JSON into VN script text
     * @param {Object} storyContent
     * @returns {string}
     */
    serialize(storyContent) {
        if (!storyContent) return '';
        const lines = [];

        // Characters — reverse-lookup to produce @char Name id="character_id"
        const characters = storyContent.characters;
        if (characters && typeof characters === 'object' && !Array.isArray(characters)) {
            const entries = Object.entries(characters);
            if (entries.length > 0) {
                // Deduplicate: find unique character base names and their character_ids
                const declared = new Map(); // displayName → character_id
                for (const [key] of entries) {
                    const resolved = CharacterResolver.resolveKey(key);
                    if (resolved && !declared.has(resolved.name)) {
                        declared.set(resolved.name, resolved.character_id);
                    }
                }

                if (declared.size > 0) {
                    lines.push('# Characters');
                    for (const [name, charId] of declared) {
                        lines.push(`@char ${name} id="${charId}"`);
                    }
                    lines.push('');
                } else {
                    // Fallback: legacy format for characters not found in DB
                    lines.push('# Characters');
                    for (const [name, data] of entries) {
                        if (name.includes('.')) continue; // skip expression variants
                        let line = `@char ${name}`;
                        if (data.avatar) line += ` avatar="${AssetResolver.toId(data.avatar)}"`;
                        if (data.full_image) line += ` full="${AssetResolver.toId(data.full_image)}"`;
                        lines.push(line);
                    }
                    lines.push('');
                }
            }
        }

        // Sections
        const sections = storyContent.sections || [];
        sections.forEach((section) => {
            lines.push('@section');
            lines.push('');

            (section.elements || []).forEach(element => {
                if (element.type === 'video') {
                    this.serializeVideo(element, lines);
                } else if (element.type === 'background') {
                    this.serializeBackground(element, lines);
                }
            });
        });

        return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    },

    serializeVideo(el, lines) {
        let line = '@video';
        if (el.src) line += ` src="${AssetResolver.toId(el.src)}"`;
        lines.push(line);
        lines.push('');
    },

    serializeBackground(el, lines) {
        lines.push(`@bg "${AssetResolver.toId(el.image || '')}"`);

        if (el.bgm && (el.bgm.id || el.bgm.intro || el.bgm.loop)) {
            let bgmLine = '@bgm';
            if (el.bgm.id) bgmLine += ` id="${el.bgm.id}"`;
            if (el.bgm.intro) bgmLine += ` intro="${AssetResolver.toId(el.bgm.intro)}"`;
            if (el.bgm.loop) bgmLine += ` loop="${AssetResolver.toId(el.bgm.loop)}"`;
            lines.push(bgmLine);
        }

        (el.dialogues || []).forEach(d => {
            switch (d.type) {
                case 'dialogue':
                    lines.push(this.formatDialogueLine(d.name, d.left, d.right, d.text));
                    break;
                case 'sfx':
                    lines.push(`@sfx "${d.name || ''}" src="${AssetResolver.toId(d.src || '')}"`);
                    break;
                case 'decision':
                    this.serializeDecision(d, lines);
                    break;
                case 'choice_response':
                    lines.push(`@response "${d.group_id || ''}" ${d.choice_value || 0}`);
                    lines.push(this.formatDialogueLine(d.name, d.left, d.right, d.text));
                    break;
            }
        });
        lines.push('');
    },

    serializeDecision(d, lines) {
        let line = `@decision "${d.group_id || ''}"`;
        if (d.left || d.right) {
            line += ` [${d.left || ''}, ${d.right || ''}]`;
        }
        lines.push(line);
        (d.choices || []).forEach(choice => lines.push(`- ${choice}`));
    },

    formatDialogueLine(name, left, right, text) {
        const charPart = (left || right) ? ` [${left || ''}, ${right || ''}]` : '';
        return `${name || '???'}${charPart}: ${text || ''}`;
    }
};

/* ================================================================================================= */
/* Story Editor (manages CodeMirror instance)                                                        */
/* ================================================================================================= */
const StoryEditor = {
    editor: null,
    currentItem: null,

    /**
     * Initialize the story editor inside a container element
     * @param {HTMLElement} container - The #editor section
     * @param {Object} item - The story data item from mockStoryData
     */
    init(container, item) {
        this.destroy();
        this.currentItem = item;

        container.innerHTML = this.buildHTML(item);

        // Initialize CodeMirror
        const textarea = document.getElementById('story-script-textarea');
        this.editor = CodeMirror.fromTextArea(textarea, {
            mode: 'vnscript',
            theme: 'material-darker',
            lineNumbers: true,
            lineWrapping: true,
            indentUnit: 2,
            tabSize: 2,
            autofocus: true,
            styleActiveLine: true,
            matchBrackets: true
        });

        // Load content
        const scriptText = StoryScriptSerializer.serialize(item.story_content);
        this.editor.setValue(scriptText);

        this.setupHandlers();

        // Refresh after DOM settles (CodeMirror needs this when inserted dynamically)
        setTimeout(() => this.editor.refresh(), 50);
    },

    buildHTML(item) {
        return `
            <div class="story-editor-panel">
                <div class="editor-header-bar">
                    <h2 class="editor-title">${escapeHtml(item.name)}</h2>
                    <span class="editor-type-label">Story</span>
                    <button type="button" id="story-meta-toggle" class="meta-toggle-btn" aria-expanded="true">Hide Meta ▾</button>
                </div>

                <div class="story-editor-meta">
                    <div class="meta-row meta-name">
                        <label class="meta-label">Name</label>
                        <input type="text" id="story-editor-name" class="meta-input" value="${escapeHtml(item.name)}">
                    </div>
                    <div class="meta-row meta-order">
                        <label class="meta-label">Display Order</label>
                        <input type="number" id="story-editor-display-order" class="meta-input" value="${item.display_order ?? ''}" min="0">
                    </div>
                    <div class="meta-row meta-desc">
                        <label class="meta-label">Description</label>
                        <textarea id="story-editor-description" rows="3" class="meta-input">${escapeHtml(item.description || '')}</textarea>
                    </div>
                </div>

                <div class="story-editor-toolbar">
                    <button type="button" class="se-toolbar-btn" data-insert="char" title="Insert character definition">
                        <span class="se-btn-icon">+</span> Char
                    </button>
                    <span class="se-toolbar-sep"></span>
                    <button type="button" class="se-toolbar-btn" data-insert="section" title="Insert new section">
                        <span class="se-btn-icon">+</span> Section
                    </button>
                    <button type="button" class="se-toolbar-btn" data-insert="bg" title="Insert background">
                        <span class="se-btn-icon">+</span> BG
                    </button>
                    <button type="button" class="se-toolbar-btn" data-insert="bgm" title="Insert BGM">
                        <span class="se-btn-icon">+</span> BGM
                    </button>
                    <button type="button" class="se-toolbar-btn" data-insert="video" title="Insert video">
                        <span class="se-btn-icon">+</span> Video
                    </button>
                    <span class="se-toolbar-sep"></span>
                    <button type="button" class="se-toolbar-btn" data-insert="dialogue" title="Insert dialogue line">
                        <span class="se-btn-icon">+</span> Dialogue
                    </button>
                    <button type="button" class="se-toolbar-btn" data-insert="sfx" title="Insert SFX">
                        <span class="se-btn-icon">+</span> SFX
                    </button>
                    <button type="button" class="se-toolbar-btn" data-insert="decision" title="Insert decision block">
                        <span class="se-btn-icon">+</span> Decision
                    </button>
                    <button type="button" class="se-toolbar-btn" data-insert="response" title="Insert choice response">
                        <span class="se-btn-icon">+</span> Response
                    </button>
                    <span class="se-toolbar-sep"></span>
                    <button type="button" class="se-toolbar-btn" id="story-editor-preview" title="Preview story">
                        <span class="se-btn-icon">▶</span> Preview
                    </button>
                </div>
                <div id="story-editor-cm-container">
                    <textarea id="story-script-textarea"></textarea>
                </div>
                <div class="story-editor-statusbar">
                    <span class="se-status-hint">Ctrl+S to save</span>
                    <div class="se-status-actions">
                        <button type="button" class="editor-btn editor-btn-secondary" id="story-editor-reset">Reset</button>
                        <button type="button" class="editor-btn editor-btn-primary" id="story-editor-save">Save</button>
                    </div>
                </div>
            </div>
        `;
    },

    setupHandlers() {
        document.getElementById('story-editor-save').addEventListener('click', () => this.save());
        document.getElementById('story-editor-reset').addEventListener('click', () => this.reset());

        this.editor.setOption('extraKeys', {
            'Ctrl-S': () => { this.save(); return false; }
        });

        document.querySelectorAll('.se-toolbar-btn').forEach(btn => {
            btn.addEventListener('click', () => this.insertTemplate(btn.dataset.insert));
        });

        // Preview button (open story page with sessionStorage preview data)
        const previewBtn = document.getElementById('story-editor-preview');
        if (previewBtn) previewBtn.addEventListener('click', () => this.preview());

        // Meta toggle (collapse/expand metadata section)
        const metaToggle = document.getElementById('story-meta-toggle');
        if (metaToggle) {
            metaToggle.addEventListener('click', () => {
                const meta = document.querySelector('.story-editor-meta');
                if (!meta) return;
                const hidden = meta.style.display === 'none';
                if (hidden) {
                    meta.style.display = '';
                    metaToggle.textContent = 'Hide Meta ▾';
                    metaToggle.setAttribute('aria-expanded', 'true');
                } else {
                    meta.style.display = 'none';
                    metaToggle.textContent = 'Show Meta ▸';
                    metaToggle.setAttribute('aria-expanded', 'false');
                }
                // Refresh editor layout after toggling
                setTimeout(() => { if (this.editor) this.editor.refresh(); }, 60);
            });
        }
    },

    async save() {
        // Update metadata fields (name, description, display_order) if present
        const nameInput = document.getElementById('story-editor-name');
        const descInput = document.getElementById('story-editor-description');
        const orderInput = document.getElementById('story-editor-display-order');
        if (nameInput) {
            const newName = nameInput.value.trim();
            if (!newName) return; // require a name
            this.currentItem.name = newName;
            const titleEl = document.querySelector('#editor .editor-title');
            if (titleEl) titleEl.textContent = newName;
        }
        if (descInput) this.currentItem.description = descInput.value.trim() || null;
        if (orderInput) this.currentItem.display_order = orderInput.value !== '' ? parseInt(orderInput.value) : null;

        // Update story content
        const scriptText = this.editor.getValue();
        const parsed = await StoryScriptParser.parse(scriptText);
        this.currentItem.story_content = parsed;

        // Re-render tree to reflect metadata changes (if available)
        if (typeof renderStoryTree === 'function') renderStoryTree();

        showSaveNotification();

        // Log only the current story item for debugging
        try {
            console.log('Exported story (current item):', JSON.stringify(this.currentItem, null, 2));
        } catch (err) {
            console.error('Failed to serialize story item to JSON', err);
        }
    },

    reset() {
        // Restore metadata fields
        const nameInput = document.getElementById('story-editor-name');
        const descInput = document.getElementById('story-editor-description');
        const orderInput = document.getElementById('story-editor-display-order');
        if (nameInput) nameInput.value = this.currentItem.name || '';
        if (descInput) descInput.value = this.currentItem.description || '';
        if (orderInput) orderInput.value = this.currentItem.display_order ?? '';

        const scriptText = StoryScriptSerializer.serialize(this.currentItem.story_content);
        this.editor.setValue(scriptText);
    },

    insertTemplate(type) {
        const templates = {
            char:     '@char Name id=""',
            section:  '\n@section\n',
            bg:       '@bg ""',
            bgm:      '@bgm id="" intro="" loop=""',
            video:    '@video src=""',
            dialogue: 'Name [, ]: ',
            sfx:      '@sfx "" src=""',
            decision: '@decision "" [, ]\n- Choice 1\n- Choice 2',
            response: '@response "" 1\nName [, ]: '
        };

        const template = templates[type];
        if (!template) return;

        const cursor = this.editor.getCursor();
        const lineContent = this.editor.getLine(cursor.line);
        const prefix = lineContent.trim() ? '\n' : '';
        this.editor.replaceRange(prefix + template + '\n', cursor);
        this.editor.focus();
    },

    async preview() {
        // Prepare preview object (do not modify currentItem on disk)
        const scriptText = this.editor.getValue();
        const parsed = await StoryScriptParser.parse(scriptText);
        const previewObj = Object.assign({}, this.currentItem || {});
        previewObj.story_content = parsed;

        try {
            sessionStorage.setItem('preview_story', JSON.stringify(previewObj));
            const previewUrl = '../story_page/index.html?preview=1';
            window.open(previewUrl, '_blank');
        } catch (err) {
            console.error('Failed to open preview', err);
            alert('Không thể mở preview. Kiểm tra console để biết chi tiết.');
        }
    },

    destroy() {
        if (this.editor) {
            this.editor.toTextArea();
            this.editor = null;
        }
        this.currentItem = null;
    }
};

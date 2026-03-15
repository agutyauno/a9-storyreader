/* ================================================================================================= */
/* Story Content Renderer */
/* Renders story_content JSONB from Supabase into HTML */
/* ================================================================================================= */

const StoryRenderer = {
	// Character map for current story
	characters: {},

	/**
	 * Render story content from JSONB data
	 * @param {Object} storyContent - The story_content JSONB
	 * @returns {string} - HTML string
	 */
	render(storyContent) {
		// Normalize legacy data shapes before rendering:
		// - ensure `sections` is an array and `characters` is an object
		if (!storyContent) {
			return '<p class="no-data">Không có nội dung truyện.</p>';
		}

		// Ensure sections exist and are an array
		if (!Array.isArray(storyContent.sections)) {
			storyContent.sections = [];
		}

		// Store character map for use in rendering
		this.characters = storyContent.characters || {};

		return storyContent.sections.map(section => this.renderSection(section)).join('');
	},

	/**
	 * Get character avatar URL by name
	 * @param {string} name - Character name or direct URL
	 * @returns {string} - Avatar URL
	 */
	getAvatar(name) {
		if (!name) return '../assets/images/character/blank.png';
		// If it's a URL (contains /), return as-is
		if (name.includes('/')) return name;
		// Look up exact key first (e.g. "Amiya.happy")
		if (this.characters[name]) {
			return this.characters[name].avatar || '../assets/images/character/blank.png';
		}
		// Fallback: try base name without expression (e.g. "Amiya")
		const baseName = name.includes('.') ? name.split('.')[0] : name;
		const char = this.characters[baseName];
		return char?.avatar || '../assets/images/character/blank.png';
	},

	/**
	 * Get character full image URL by name
	 * @param {string} name - Character name or direct URL
	 * @returns {string} - Full image URL or empty string
	 */
	getFullImage(name) {
		if (!name) return '';
		// If it's a URL, return as-is
		if (name.includes('/')) return name;
		// Look up exact key first (e.g. "Amiya.happy")
		if (this.characters[name]) {
			return this.characters[name].full_image || '';
		}
		// Fallback: try base name without expression
		const baseName = name.includes('.') ? name.split('.')[0] : name;
		const char = this.characters[baseName];
		return char?.full_image || '';
	},

	/**
	 * Render a section
	 */
	renderSection(section) {
		if (section.type === 'dialogue_section') {
			const elements = (section.elements || []).map(el => this.renderElement(el)).join('');
			return `<section class="dialogue-section">${elements}</section>`;
		}
		return '';
	},

	/**
	 * Render an element (video, background, etc.)
	 */
	renderElement(element) {
		switch (element.type) {
			case 'video':
				return this.renderVideo(element);
			case 'background':
				return this.renderBackground(element);
			default:
				return '';
		}
	},

	/**
	 * Render video box
	 * No bgm here because video elements are meant for cutscenes and should not have bgm controls
	 */
	renderVideo(element) {
		return `
			<div class="dialogue-video-box" data-bgm-id="">
				<video src="${element.src}" controls></video>
			</div>
		`;
	},

	/**
	 * Render background section with dialogues
	 */
	renderBackground(element) {
		let bgmAttrs = '';
		if (element.bgm) {
			bgmAttrs = `data-bgm-id="${element.bgm.id || ''}"`;
			if (element.bgm.intro) bgmAttrs += ` data-bgm-intro="${element.bgm.intro}"`;
			if (element.bgm.loop) bgmAttrs += ` data-bgm-loop="${element.bgm.loop}"`;
		}

		const dialogues = (element.dialogues || []).map(d => this.renderDialogue(d)).join('');

		return `
			<section class="dialogue-background" ${bgmAttrs}>
				<div class="background-wrapper">
					<img class="background-image" src="${element.image}" alt="">
					<img class="expand-icon" src="../assets/images/web icon/expand.png" alt="">
				</div>
				<div class="dialogue-container">
					${dialogues}
				</div>
			</section>
		`;
	},

	/**
	 * Render a dialogue element
	 */
	renderDialogue(dialogue) {
		switch (dialogue.type) {
			case 'dialogue':
				return this.renderDialogueBox(dialogue);
			case 'sfx':
				return this.renderSFX(dialogue);
			case 'decision':
				return this.renderDecision(dialogue);
			case 'choice_response':
				return this.renderChoiceResponse(dialogue);
			default:
				return '';
		}
	},

	/**
	 * Render a normal dialogue box
	 */
	renderDialogueBox(dialogue) {
		const leftAvatar = this.getAvatar(dialogue.left);
		const rightAvatar = this.getAvatar(dialogue.right);
		const leftFull = this.getFullImage(dialogue.left);
		const rightFull = this.getFullImage(dialogue.right);

		return `
			<div class="dialogue-box">
				<img class="character_avt" src="${leftAvatar}" ${leftFull ? `data-full-image="${leftFull}"` : ''} alt="">
				<div class="dialogue-content">
					<p class="character_name">${dialogue.name || ''}</p>
					<p class="dialogue">${dialogue.text || ''}</p>
				</div>
				<img class="character_avt" src="${rightAvatar}" ${rightFull ? `data-full-image="${rightFull}"` : ''} alt="">
			</div>
		`;
	},

	/**
	 * Render SFX element
	 */
	renderSFX(sfx) {
		return `
			<div class="sfx_player" data-sfx-src="${sfx.src}" data-sfx-name="${sfx.name || ''}">
			</div>
		`;
	},

	/**
	 * Render decision group
	 */
	renderDecision(decision) {
		const leftAvatar = this.getAvatar(decision.left || 'Doctor');
		const rightAvatar = this.getAvatar(decision.right);
		const leftFull = this.getFullImage(decision.left || 'Doctor');
		const rightFull = this.getFullImage(decision.right);

		const choices = (decision.choices || []).map((choice, index) => {
			return `<p class="decision" data-choice-value="${index + 1}">${choice}</p>`;
		}).join('');

		return `
			<div class="dialogue-box decision-group" data-choice-group="${decision.group_id}">
				<img class="character_avt" src="${leftAvatar}" ${leftFull ? `data-full-image="${leftFull}"` : ''} alt="">
				<div class="dialogue-content decision-choice">
					${choices}
				</div>
				<img class="character_avt" src="${rightAvatar}" ${rightFull ? `data-full-image="${rightFull}"` : ''} alt="">
			</div>
		`;
	},

	/**
	 * Render choice response
	 */
	renderChoiceResponse(response) {
		const leftAvatar = this.getAvatar(response.left);
		const rightAvatar = this.getAvatar(response.right);
		const leftFull = this.getFullImage(response.left);
		const rightFull = this.getFullImage(response.right);

		return `
			<div class="dialogue-box choice-response" data-choice-response="${response.choice_value}" data-choice-group="${response.group_id}">
				<img class="character_avt" src="${leftAvatar}" ${leftFull ? `data-full-image="${leftFull}"` : ''} alt="">
				<div class="dialogue-content">
					<p class="character_name">${response.name || ''}</p>
					<p class="dialogue">${response.text || ''}</p>
				</div>
				<img class="character_avt" src="${rightAvatar}" ${rightFull ? `data-full-image="${rightFull}"` : ''} alt="">
			</div>
		`;
	}
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
	module.exports = StoryRenderer;
}

/* ================================================================================================= */
/* Story Content Renderer */
/* Renders story_content JSONB from Supabase into HTML */
/* ================================================================================================= */

/**
 * Story Content Schema (expected JSONB structure):
 * {
 *   sections: [
 *     {
 *       type: "dialogue_section",
 *       elements: [
 *         {
 *           type: "video",
 *           src: "video_url",
 *           bgm_id?: "bgm_id"
 *         },
 *         {
 *           type: "background",
 *           image: "image_url",
 *           bgm?: { id: "bgm_id", intro: "intro.wav", loop: "loop.wav" },
 *           dialogues: [
 *             {
 *               type: "dialogue",
 *               left_avatar: "avatar_url",
 *               right_avatar: "avatar_url",
 *               character_name: "Name",
 *               text: "Dialogue text with Dr.@nickname support"
 *             },
 *             {
 *               type: "sfx",
 *               src: "sfx_file.wav",
 *               name: "SFX Name"
 *             },
 *             {
 *               type: "decision",
 *               group_id: "choice1",
 *               left_avatar: "avatar_url",
 *               right_avatar: "avatar_url",
 *               choices: ["Option 1", "Option 2", "Option 3"]
 *             },
 *             {
 *               type: "choice_response",
 *               group_id: "choice1",
 *               choice_value: 1,
 *               left_avatar: "avatar_url",
 *               right_avatar: "avatar_url",
 *               character_name: "Name",
 *               text: "Response text"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

const StoryRenderer = {
	/**
	 * Render story content from JSONB data
	 * @param {Object} storyContent - The story_content JSONB
	 * @returns {string} - HTML string
	 */
	render(storyContent) {
		if (!storyContent || !storyContent.sections) {
			return '<p class="no-data">Không có nội dung truyện.</p>';
		}

		return storyContent.sections.map(section => this.renderSection(section)).join('');
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
	 */
	renderVideo(element) {
		const bgmAttr = element.bgm_id ? `data-bgm-id="${element.bgm_id}"` : '';
		return `
			<div class="dialogue-video-box" ${bgmAttr}>
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
		const leftAvatar = dialogue.left_avatar || '../assets/images/character/blank.png';
		const rightAvatar = dialogue.right_avatar || '../assets/images/character/blank.png';

		return `
			<div class="dialogue-box">
				<img class="character_avt" src="${leftAvatar}" alt="">
				<div class="dialogue-content">
					<p class="character_name">${dialogue.character_name || ''}</p>
					<p class="dialogue">${dialogue.text || ''}</p>
				</div>
				<img class="character_avt" src="${rightAvatar}" alt="">
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
		const leftAvatar = decision.left_avatar || '../assets/images/character/doctor/doctor_avatar.png';
		const rightAvatar = decision.right_avatar || '../assets/images/character/blank.png';

		const choices = (decision.choices || []).map((choice, index) => {
			return `<p class="decision" data-choice-value="${index + 1}">${choice}</p>`;
		}).join('');

		return `
			<div class="dialogue-box decision-group" data-choice-group="${decision.group_id}">
				<img class="character_avt" src="${leftAvatar}" alt="">
				<div class="dialogue-content decision-choice">
					${choices}
				</div>
				<img class="character_avt" src="${rightAvatar}" alt="">
			</div>
		`;
	},

	/**
	 * Render choice response
	 */
	renderChoiceResponse(response) {
		const leftAvatar = response.left_avatar || '../assets/images/character/blank.png';
		const rightAvatar = response.right_avatar || '../assets/images/character/blank.png';

		return `
			<div class="dialogue-box choice-response" data-choice-response="${response.choice_value}" data-choice-group="${response.group_id}">
				<img class="character_avt" src="${leftAvatar}" alt="">
				<div class="dialogue-content">
					<p class="character_name">${response.character_name || ''}</p>
					<p class="dialogue">${response.text || ''}</p>
				</div>
				<img class="character_avt" src="${rightAvatar}" alt="">
			</div>
		`;
	}
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
	module.exports = StoryRenderer;
}

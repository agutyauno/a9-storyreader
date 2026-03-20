export const StoryRenderer = {
  characters: {},

  render(storyContent) {
    if (!storyContent) {
      return '<p class="no-data">Không có nội dung truyện.</p>';
    }
    if (!Array.isArray(storyContent.sections)) {
      storyContent.sections = [];
    }
    this.characters = storyContent.characters || {};
    return storyContent.sections.map((section) => this.renderSection(section)).join('');
  },

  getAvatar(name) {
    if (!name) return '/assets/images/character/blank.png';
    if (name.includes('/')) return name;
    if (this.characters[name]) {
      return this.characters[name].avatar || '/assets/images/character/blank.png';
    }
    const baseName = name.includes('.') ? name.split('.')[0] : name;
    const char = this.characters[baseName];
    return char?.avatar || '/assets/images/character/blank.png';
  },

  getFullImage(name) {
    if (!name) return '';
    if (name.includes('/')) return name;
    if (this.characters[name]) {
      return this.characters[name].full_image || '';
    }
    const baseName = name.includes('.') ? name.split('.')[0] : name;
    const char = this.characters[baseName];
    return char?.full_image || '';
  },

  renderSection(section) {
    if (section.type === 'dialogue_section') {
      const elements = (section.elements || []).map((el) => this.renderElement(el)).join('');
      return `<section class="dialogue-section">${elements}</section>`;
    }
    return '';
  },

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

  renderVideo(element) {
    return `
      <div class="dialogue-video-box" data-bgm-id="">
        <video src="${element.src}" controls></video>
      </div>
    `;
  },

  renderBackground(element) {
    let bgmAttrs = '';
    if (element.bgm) {
      bgmAttrs = `data-bgm-id="${element.bgm.id || ''}"`;
      if (element.bgm.intro) bgmAttrs += ` data-bgm-intro="${element.bgm.intro}"`;
      if (element.bgm.loop) bgmAttrs += ` data-bgm-loop="${element.bgm.loop}"`;
    }

    const dialogues = (element.dialogues || []).map((d) => this.renderDialogue(d)).join('');
    return `
      <section class="dialogue-background" ${bgmAttrs}>
        <div class="background-wrapper">
          <img class="background-image" src="${element.image}" alt="">
          <img class="expand-icon" src="/assets/images/web icon/expand.png" alt="">
        </div>
        <div class="dialogue-container">
          ${dialogues}
        </div>
      </section>
    `;
  },

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

  renderSFX(sfx) {
    return `
      <div class="sfx_player" data-sfx-src="${sfx.src}" data-sfx-name="${sfx.name || ''}">
      </div>
    `;
  },

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

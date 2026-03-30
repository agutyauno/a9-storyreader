import { getAssetUrl } from './assetUtils';

function cx(classNames, styles) {
  if (!classNames) return '';
  return String(classNames).split(' ').filter(Boolean).map(c => `${c} ${styles[c] || ''}`.trim()).join(' ').trim();
}

export const StoryRenderer = {
  characters: {},
  
  _resolveCharAndExpr(nameWithExpr) {
    if (!nameWithExpr) return { char: null, expr: null };
    const nameLower = nameWithExpr.toLowerCase();
    
    // 1. Try full match first (e.g. "Dr.Ami")
    if (this.characters[nameLower]) {
      return { char: this.characters[nameLower], expr: null };
    }
    
    // 2. Try splitting at the last dot (e.g. "Ms Ami.smile" -> "Ms Ami" + "smile")
    const lastDot = nameWithExpr.lastIndexOf('.');
    if (lastDot !== -1) {
      const name = nameWithExpr.slice(0, lastDot);
      const expr = nameWithExpr.slice(lastDot + 1);
      const char = this.characters[name.toLowerCase()];
      if (char) {
        return { char, expr };
      }
    }
    
    return { char: null, expr: null };
  },

  render(storyContent, styles = {}) {
    if (!storyContent) {
      return `<p class="${cx('no-data', styles)}">Không có nội dung truyện.</p>`;
    }
    if (!Array.isArray(storyContent.sections)) {
      storyContent.sections = [];
    }
    // Normalizing character keys to lowercase for case-insensitive lookup
    this.characters = {};
    if (storyContent.characters) {
      Object.entries(storyContent.characters).forEach(([name, data]) => {
        this.characters[name.toLowerCase()] = data;
      });
    }
    return storyContent.sections.map((section) => this.renderSection(section, styles)).join('');
  },

  getAvatar(nameWithExpr) {
    const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const defaultAvt = transparentPixel; // Use transparent pixel instead of potentially missing blank.png
    
    if (!nameWithExpr || nameWithExpr.trim() === '') return defaultAvt;
    if (nameWithExpr.includes('/')) return getAssetUrl(nameWithExpr);

    const { char, expr } = this._resolveCharAndExpr(nameWithExpr);
    
    if (char) {
      if (expr && char.expressions?.[expr]) {
        const exprData = char.expressions[expr];
        return getAssetUrl(exprData.avatar_url || char.avatar) || defaultAvt;
      }
      return getAssetUrl(char.avatar) || defaultAvt;
    }
    return defaultAvt;
  },

  getFullImage(nameWithExpr) {
    if (!nameWithExpr || nameWithExpr.trim() === '') return '';
    if (nameWithExpr.includes('/')) return getAssetUrl(nameWithExpr);

    const { char, expr } = this._resolveCharAndExpr(nameWithExpr);

    if (char) {
      if (expr && char.expressions?.[expr]) {
        const exprData = char.expressions[expr];
        return getAssetUrl(exprData.full_url || char.full_image || '');
      }
      return getAssetUrl(char.full_image || '');
    }
    return '';
  },

  renderSection(section, styles) {
    if (section.type === 'dialogue_section') {
      const elements = (section.elements || []).map((el) => this.renderElement(el, styles)).join('');
      return `<section class="${cx('dialogue-section', styles)}">${elements}</section>`;
    }
    return '';
  },

  renderElement(element, styles) {
    switch (element.type) {
      case 'video':
        return this.renderVideo(element, styles);
      case 'background':
        return this.renderBackground(element, styles);
      case 'comment':
        return '';
      default:
        return '';
    }
  },

  renderVideo(element, styles) {
    return `
      <div class="${cx('dialogue-video-box', styles)}" data-bgm-id="" data-bgm-intro="" data-bgm-loop="">
        <video src="${getAssetUrl(element.src)}" controls></video>
      </div>
    `;
  },

  renderBackground(element, styles) {
    let bgmAttrs = '';
    if (element.bgm) {
      bgmAttrs = `data-bgm-id="${element.bgm.id || ''}"`;
      if (element.bgm.intro) bgmAttrs += ` data-bgm-intro="${element.bgm.intro}"`;
      if (element.bgm.loop) bgmAttrs += ` data-bgm-loop="${element.bgm.loop}"`;
    }

    const dialogues = (element.dialogues || []).map((d) => this.renderDialogue(d, styles)).join('');
    const bgUrl = getAssetUrl(element.image);
    return `
      <section class="${cx('dialogue-background', styles)}" ${bgmAttrs}>
        <div class="${cx('background-wrapper', styles)}">
          <img class="${cx('background-blur', styles)}" src="${bgUrl}" alt="">
          <img class="${cx('background-image', styles)}" src="${bgUrl}" alt="">
          <img class="${cx('expand-icon', styles)}" src="${getAssetUrl('/assets/images/web icon/expand.png')}" alt="">
        </div>
        <div class="${cx('dialogue-container', styles)}">
          ${dialogues}
        </div>
      </section>
    `;
  },

  renderDialogue(dialogue, styles) {
    switch (dialogue.type) {
      case 'dialogue':
        return this.renderDialogueBox(dialogue, styles);
      case 'narrator':
        return this.renderNarrator(dialogue, styles);
      case 'sfx':
        return this.renderSFX(dialogue, styles);
      case 'decision':
        return this.renderDecision(dialogue, styles);
      case 'choice_response':
        return this.renderChoiceResponse(dialogue, styles);
      case 'comment':
        return '';
      default:
        return '';
    }
  },

  renderNarrator(narrator, styles) {
    return `
      <div class="${cx('dialogue-box narrator-box', styles)}">
        <div class="${cx('dialogue-content', styles)}">
          <p class="${cx('narrator-text', styles)}">${narrator.text || ''}</p>
        </div>
      </div>
    `;
  },

  renderDialogueBox(dialogue, styles) {
    const leftAvatar = this.getAvatar(dialogue.left);
    const rightAvatar = this.getAvatar(dialogue.right);
    const leftFull = this.getFullImage(dialogue.left);
    const rightFull = this.getFullImage(dialogue.right);

    return `
      <div class="${cx('dialogue-box', styles)}">
        <img class="${cx('character_avt', styles)}" src="${leftAvatar}" ${leftFull ? `data-full-image="${leftFull}"` : ''} alt="">
        <div class="${cx('dialogue-content', styles)}">
          ${(() => {
            const { char } = this._resolveCharAndExpr(dialogue.name);
            const nameColor = dialogue.color || char?.color;
            const colorStyle = nameColor ? `style="color: ${nameColor}"` : '';
            return `<p class="${cx('character_name', styles)}" ${colorStyle}>${dialogue.name || ''}</p>`;
          })()}
          <p class="${cx('dialogue', styles)}">${dialogue.text || ''}</p>
        </div>
        <img class="${cx('character_avt', styles)}" src="${rightAvatar}" ${rightFull ? `data-full-image="${rightFull}"` : ''} alt="">
      </div>
    `;
  },

  renderSFX(sfx, styles) {
    return `
      <div class="${cx('sfx_player', styles)}" data-sfx-src="${getAssetUrl(sfx.src)}" data-sfx-name="${sfx.name || ''}">
        <div class="${cx('sfx-content', styles)}">
          <span class="${cx('sfx-name', styles)}">${sfx.name || 'Sound Effect'}</span>
        </div>
      </div>
    `;
  },

  renderDecision(decision, styles) {
    const leftAvatar = this.getAvatar(decision.left || 'Doctor');
    const rightAvatar = this.getAvatar(decision.right);
    const leftFull = this.getFullImage(decision.left || 'Doctor');
    const rightFull = this.getFullImage(decision.right);

    const choices = (decision.choices || []).map((choice, index) => {
      return `<p class="${cx('decision', styles)}" data-choice-value="${index + 1}">${choice}</p>`;
    }).join('');

    return `
      <div class="${cx('dialogue-box decision-group', styles)}" data-choice-group="${decision.group_id}">
        <img class="${cx('character_avt', styles)}" src="${leftAvatar}" ${leftFull ? `data-full-image="${leftFull}"` : ''} alt="">
        <div class="${cx('dialogue-content decision-choice', styles)}">
          ${choices}
        </div>
        <img class="${cx('character_avt', styles)}" src="${rightAvatar}" ${rightFull ? `data-full-image="${rightFull}"` : ''} alt="">
      </div>
    `;
  },

  renderChoiceResponse(response, styles) {
    // A response is now a container for other dialogue elements
    const elements = (response.elements || []).map(el => this.renderDialogue(el, styles)).join('');
    
    return `
      <div class="${cx('choice-response choice-response-container', styles)}" 
           data-choice-response="${response.choice_value}" 
           data-choice-group="${response.group_id}">
        ${elements}
      </div>
    `;
  }
};

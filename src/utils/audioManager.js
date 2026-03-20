export class BGMManager {
  constructor(options = {}) {
    this.basePath = options.basePath || '/assets/audio/bgm/';
    this.fadeTime = options.fadeTime || 500;
    this.volume = options.volume || 1;
    this.introAudio = new Audio();
    this.loopAudio = new Audio();
    this.currentTrack = null;
    this.isPlaying = false;
    this.isEnabled = true;
    this.isIntroPlaying = false;
    this.onIntroEnded = this.onIntroEnded.bind(this);
    this.setupAudioElements();
    this.loadState();
  }

  setupAudioElements() {
    this.introAudio.preload = 'auto';
    this.introAudio.volume = this.volume;
    this.introAudio.addEventListener('ended', this.onIntroEnded);
    this.loopAudio.preload = 'auto';
    this.loopAudio.loop = true;
    this.loopAudio.volume = this.volume;
  }

  loadState() {
    const savedEnabled = localStorage.getItem('audio_enabled');
    const savedVolume = localStorage.getItem('audio_volume');
    if (savedEnabled !== null) this.isEnabled = savedEnabled === 'true';
    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
      this.introAudio.volume = this.volume;
      this.loopAudio.volume = this.volume;
    }
  }

  saveState() {
    localStorage.setItem('audio_enabled', this.isEnabled.toString());
    localStorage.setItem('audio_volume', this.volume.toString());
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    this.introAudio.volume = this.volume;
    this.loopAudio.volume = this.volume;
    this.saveState();
    if (window.sfxManager) window.sfxManager.setVolume(this.volume);
    this.updateUI();
  }

  toggleEnabled() {
    this.isEnabled = !this.isEnabled;
    this.saveState();
    if (this.isEnabled) {
      if (this.currentTrack && !this.isPlaying) this.play();
    } else {
      this.pause();
    }
    if (window.sfxManager) window.sfxManager.setEnabled(this.isEnabled);
    this.updateUI();
  }

  loadTrack(track) {
    if (this.currentTrack && this.currentTrack.id === track.id) return;
    this.stop();
    this.currentTrack = track;
    if (track.intro) {
      this.introAudio.src = this.basePath + track.intro;
      this.introAudio.load();
    } else {
      this.introAudio.src = '';
    }
    if (track.loop) {
      this.loopAudio.src = this.basePath + track.loop;
      this.loopAudio.load();
    } else {
      this.loopAudio.src = '';
    }
  }

  async play() {
    if (!this.currentTrack || !this.isEnabled) return;
    this.isPlaying = true;
    this.updateUI();
    try {
      if (this.currentTrack.intro && this.introAudio.src && this.introAudio.src !== window.location.href) {
        this.isIntroPlaying = true;
        this.introAudio.currentTime = 0;
        await this.introAudio.play();
      } else {
        this.startLoop();
      }
    } catch (error) {
      console.error('BGMManager: Playback failed', error);
      this.isPlaying = false;
      this.updateUI();
    }
  }

  onIntroEnded() {
    this.isIntroPlaying = false;
    if (this.isPlaying) this.startLoop();
  }

  async startLoop() {
    if (!this.currentTrack || !this.currentTrack.loop) return;
    try {
      this.loopAudio.currentTime = 0;
      await this.loopAudio.play();
    } catch (error) {
      console.error('BGMManager: Loop playback failed', error);
    }
  }

  pause() {
    this.isPlaying = false;
    this.introAudio.pause();
    this.loopAudio.pause();
    this.updateUI();
  }

  stop() {
    this.isPlaying = false;
    this.isIntroPlaying = false;
    this.introAudio.pause();
    this.introAudio.currentTime = 0;
    this.loopAudio.pause();
    this.loopAudio.currentTime = 0;
    this.updateUI();
  }

  async changeTrack(track, fadeTransition = true) {
    if (!this.isEnabled) {
      this.loadTrack(track);
      return;
    }
    if (fadeTransition && this.isPlaying) await this.fadeOut();
    this.loadTrack(track);
    if (this.isPlaying || fadeTransition) {
      await this.play();
      if (fadeTransition) await this.fadeIn();
    }
  }

  fadeOut() {
    return new Promise((resolve) => {
      const startVolume = this.volume;
      const startTime = Date.now();
      const fade = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / this.fadeTime);
        const currentVolume = startVolume * (1 - progress);
        this.introAudio.volume = currentVolume;
        this.loopAudio.volume = currentVolume;
        if (progress < 1) {
          requestAnimationFrame(fade);
        } else {
          resolve();
        }
      };
      fade();
    });
  }

  fadeIn() {
    return new Promise((resolve) => {
      const targetVolume = this.volume;
      const startTime = Date.now();
      this.introAudio.volume = 0;
      this.loopAudio.volume = 0;
      const fade = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / this.fadeTime);
        const currentVolume = targetVolume * progress;
        this.introAudio.volume = currentVolume;
        this.loopAudio.volume = currentVolume;
        if (progress < 1) {
          requestAnimationFrame(fade);
        } else {
          resolve();
        }
      };
      fade();
    });
  }

  updateUI() {
    const updateEvent = new CustomEvent('audioStateChange', {
      detail: { isEnabled: this.isEnabled, volume: this.volume }
    });
    window.dispatchEvent(updateEvent);
  }

  destroy() {
    this.stop();
    this.introAudio.removeEventListener('ended', this.onIntroEnded);
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
      this.scrollObserver = null;
    }
  }

  setupScrollTriggers(options = {}) {
    const selector = options.selector || '[data-bgm-id]';
    const threshold = options.threshold || 0.3;
    const rootMargin = options.rootMargin || '0px 0px 0px 0px';
    const triggerElements = document.querySelectorAll(selector);
    if (triggerElements.length === 0) return;

    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const trackId = el.dataset.bgmId;
          const intro = el.dataset.bgmIntro || null;
          const loop = el.dataset.bgmLoop || null;
          if (!this.currentTrack || this.currentTrack.id !== trackId) {
            this.changeTrack({ id: trackId, intro, loop }, true);
          }
        }
      });
    }, { threshold, rootMargin });

    triggerElements.forEach(el => this.scrollObserver.observe(el));
  }
}

export class SFXManager {
  constructor(options = {}) {
    this.basePath = options.basePath || '/assets/audio/sfx/';
    this.selector = options.selector || '.sfx_player';
    this.threshold = options.threshold || 0.5;
    this.rootMargin = options.rootMargin || '0px 0px -50% 0px';
    this.volume = options.volume || 1;
    this.isEnabled = true;
    this.playedElements = new Set();
    this.scrollObserver = null;
    this.currentAudio = null;
    this.isPlaying = false;
    this.sfxQueue = [];
    this.loadState();
  }

  loadState() {
    const savedEnabled = localStorage.getItem('audio_enabled');
    const savedVolume = localStorage.getItem('audio_volume');
    if (savedEnabled !== null) this.isEnabled = savedEnabled === 'true';
    if (savedVolume !== null) this.volume = parseFloat(savedVolume);
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.sfxQueue = [];
      this.isPlaying = false;
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
    }
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.currentAudio) this.currentAudio.volume = this.volume;
  }

  init() {
    const sfxElements = document.querySelectorAll(this.selector);
    if (sfxElements.length === 0) return;
    
    sfxElements.forEach((el, index) => this.setupSFXElement(el, index));
    this.setupScrollObserver();
  }

  setupSFXElement(element, index) {
    let sfxSrc = element.dataset.sfxSrc;
    let sfxName = element.dataset.sfxName || 'Sound Effect';
    let sfxAuto = element.dataset.sfxAuto !== 'false';
    const existingAudio = element.querySelector('audio');
    
    if (existingAudio && existingAudio.src) {
      sfxSrc = sfxSrc || existingAudio.getAttribute('src');
      sfxName = existingAudio.textContent || sfxName;
      existingAudio.remove();
    }
    
    if (!sfxSrc) return;
    element.dataset.sfxSrc = sfxSrc;
    element.dataset.sfxName = sfxName;
    element.dataset.sfxIndex = index;
    element.dataset.sfxAuto = sfxAuto;
    
    element.innerHTML = `<div class="sfx-content"><span class="sfx-name">${sfxName}</span></div>`;
    element.addEventListener('click', () => this.playSFX(element));
    
    if (this.scrollObserver) this.scrollObserver.observe(element);
  }

  setupScrollObserver() {
    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const index = el.dataset.sfxIndex;
          const autoPlay = el.dataset.sfxAuto !== 'false';
          if (autoPlay && !this.playedElements.has(index)) {
            this.playedElements.add(index);
            this.playSFX(el, true);
          }
        }
      });
    }, { threshold: this.threshold, rootMargin: this.rootMargin });

    document.querySelectorAll(this.selector).forEach(el => {
      if (el.dataset.sfxSrc) this.scrollObserver.observe(el);
    });
  }

  playSFX(element, isAutoTrigger = false) {
    if (!this.isEnabled) return;
    const sfxSrc = element.dataset.sfxSrc;
    if (!sfxSrc) return;
    this.sfxQueue.push(element);
    if (!this.isPlaying) this.processQueue();
  }

  async processQueue() {
    if (this.sfxQueue.length === 0 || this.isPlaying) return;
    const element = this.sfxQueue.shift();
    const sfxSrc = element.dataset.sfxSrc;
    if (!sfxSrc || !this.isEnabled) {
      this.processQueue();
      return;
    }
    this.isPlaying = true;
    element.classList.add('playing');
    
    try {
      const audio = new Audio();
      if (!sfxSrc.startsWith('http') && !sfxSrc.startsWith('../') && !sfxSrc.startsWith('/')) {
        audio.src = this.basePath + sfxSrc;
      } else {
        audio.src = sfxSrc;
      }
      audio.volume = this.volume;
      this.currentAudio = audio;
      
      audio.addEventListener('ended', () => {
        element.classList.remove('playing');
        element.classList.add('played');
        this.currentAudio = null;
        this.isPlaying = false;
        this.processQueue();
      });
      
      audio.addEventListener('error', (e) => {
        element.classList.remove('playing');
        element.classList.add('error');
        this.currentAudio = null;
        this.isPlaying = false;
        this.processQueue();
      });
      
      await audio.play();
    } catch (error) {
      element.classList.remove('playing');
      this.isPlaying = false;
      this.processQueue();
    }
  }

  resetPlayedState() {
    this.playedElements.clear();
    this.sfxQueue = [];
    this.isPlaying = false;
    document.querySelectorAll(this.selector).forEach(el => {
      el.classList.remove('played', 'playing', 'error');
    });
  }

  destroy() {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
      this.scrollObserver = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.sfxQueue = [];
    this.isPlaying = false;
    this.playedElements.clear();
  }
}

// Instantiate globally to be accessible to each other
window.bgmManager = new BGMManager();
window.sfxManager = new SFXManager();

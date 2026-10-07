import { getAssetUrl } from './assetUtils';

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
    this.isNewTrack = true;
    this.playToken = 0;
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
    try {
      const savedSettings = localStorage.getItem('ced_app_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.soundMuted !== undefined) this.isEnabled = !parsed.soundMuted;
        
        const masterVol = parsed.soundVolume ?? parsed.masterVolume ?? 50;
        const bgmVol = parsed.bgmVolume ?? 80;
        this.volume = (masterVol / 100) * (bgmVol / 100);
        
        this.introAudio.volume = this.volume;
        this.loopAudio.volume = this.volume;
        return;
      }
    } catch (e) {
      console.warn("BGMManager: Failed to parse global settings, falling back to legacy keys.");
    }

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
    this.stopAudio();
    this.currentTrack = track;
    this.isNewTrack = true;

    const resolvePath = (src) => {
      if (!src) return '';
      if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
        return getAssetUrl(this.basePath + src, 'audio');
      }
      return getAssetUrl(src, 'audio');
    };

    if (track.intro) {
      this.introAudio.src = resolvePath(track.intro);
      this.introAudio.load();
    } else {
      this.introAudio.removeAttribute('src');
      this.introAudio.load();
    }
    if (track.loop) {
      this.loopAudio.src = resolvePath(track.loop);
      this.loopAudio.load();
    } else {
      this.loopAudio.removeAttribute('src');
      this.loopAudio.load();
    }
  }

  async play() {
    if (!this.currentTrack || !this.isEnabled) return;
    this.isPlaying = true;
    this.updateUI();
    try {
      if (this.currentTrack.intro && this.introAudio.src && this.introAudio.src !== window.location.href) {
        if (this.isNewTrack) {
          this.isNewTrack = false;
          this.isIntroPlaying = true;
          this.introAudio.currentTime = 0;
          await this.introAudio.play();
        } else {
          if (this.isIntroPlaying) {
            await this.introAudio.play();
          } else {
            await this.loopAudio.play();
          }
        }
      } else {
        this.isNewTrack = false;
        this.isIntroPlaying = false;
        await this.startLoop();
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
      if (this.isNewTrack) {
        this.loopAudio.currentTime = 0;
      }
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

  stopAudio() {
    this.isPlaying = false;
    this.isIntroPlaying = false;
    this.introAudio.pause();
    this.introAudio.currentTime = 0;
    this.loopAudio.pause();
    this.loopAudio.currentTime = 0;
  }

  stop(cancelPending = true) {
    if (cancelPending) this.playToken++;
    this.stopAudio();

    document.removeEventListener('click', this.handleFirstClick);

    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
      this.scrollObserver = null;
    }

    this.currentTrack = null;
    this.updateUI();
  }

  async changeTrack(track, fadeTransition = true) {
    if (!this.isEnabled) {
      if (track.id || track.intro || track.loop) this.loadTrack(track);
      return;
    }

    const currentToken = ++this.playToken;

    if (!track.id && !track.intro && !track.loop) {
      if (fadeTransition && this.isPlaying) await this.fadeOut(currentToken);
      if (this.playToken === currentToken) {
        this.stop();
        this.currentTrack = null;
      }
      return;
    }

    if (fadeTransition && this.isPlaying) await this.fadeOut(currentToken);

    if (this.playToken !== currentToken) return;

    this.loadTrack(track);
    
    this.introAudio.volume = this.volume;
    this.loopAudio.volume = this.volume;

    await this.play();

    if (this.playToken !== currentToken) {
      this.pause();
      return;
    }

    if (fadeTransition) await this.fadeIn(currentToken);
  }

  fadeOut(token) {
    return new Promise((resolve) => {
      const startVolume = this.introAudio.volume;
      const startTime = Date.now();
      const fade = () => {
        if (token !== this.playToken) {
          resolve();
          return;
        }
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

  fadeIn(token) {
    return new Promise((resolve) => {
      const targetVolume = this.volume;
      const startTime = Date.now();
      this.introAudio.volume = 0;
      this.loopAudio.volume = 0;
      const fade = () => {
        if (token !== this.playToken) {
          resolve();
          return;
        }
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
    document.removeEventListener('click', this.handleFirstClick);
  }

  setupScrollTriggers(options = {}) {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
      this.scrollObserver = null;
    }

    const selector = options.selector || '[data-bgm-id]';
    const threshold = options.threshold || 0;
    const rootMargin = options.rootMargin || '0px 0px -50% 0px';
    const triggerElements = Array.from(document.querySelectorAll(selector));

    if (triggerElements.length === 0) {
      if (this.isPlaying) this.stop();
      return;
    }

    document.addEventListener('click', this.handleFirstClick, { once: true });

    this.intersectingElements = new Set();

    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.intersectingElements.add(entry.target);
        } else {
          this.intersectingElements.delete(entry.target);
        }
      });

      if (this.intersectingElements.size > 0) {
        let activeElement = null;
        for (const el of triggerElements) {
          if (this.intersectingElements.has(el)) {
            activeElement = el;
          }
        }

        if (activeElement) {
          const trackId = activeElement.dataset.bgmId || '';
          const intro = activeElement.dataset.bgmIntro || null;
          const loop = activeElement.dataset.bgmLoop || null;
          if (!this.currentTrack || this.currentTrack.id !== trackId || !this.isPlaying) {
            this.changeTrack({ id: trackId, intro, loop }, true);
          }
        }
      }
    }, { threshold, rootMargin });

    triggerElements.forEach(el => this.scrollObserver.observe(el));
  }
}

export class SFXManager {
  constructor(options = {}) {
    this.basePath = options.basePath || '/assets/audio/sfx/';
    this.selector = options.selector || '.sfx_player';
    this.threshold = options.threshold !== undefined ? options.threshold : 0.1;
    this.rootMargin = options.rootMargin || '0px 0px -20% 0px';
    this.volume = options.volume || 1;
    this.isEnabled = true;
    this.playedElements = new Set();
    this.scrollObserver = null;

    // Parallel playback pool (đa âm thanh đồng thời)
    this.activeAudios = new Set();
    this.maxConcurrent = 10;

    // Looping tracks (âm thanh lặp tuần hoàn)
    this.activeLoops = new Map(); // key -> { audio, element }

    // Sequential Queue (hàng đợi phát tuần tự)
    this.sfxQueue = [];
    this.isQueueProcessing = false;
    this.currentQueueAudio = null;

    this.loadState();
  }

  loadState() {
    try {
      const savedSettings = localStorage.getItem('ced_app_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.soundMuted !== undefined) this.isEnabled = !parsed.soundMuted;
        const masterVol = parsed.soundVolume ?? parsed.masterVolume ?? 50;
        const sfxVol = parsed.sfxVolume ?? 80;
        this.volume = (masterVol / 100) * (sfxVol / 100);
        return;
      }
    } catch (e) {
      console.warn("SFXManager: Failed to parse global settings, falling back to legacy keys.");
    }

    const savedEnabled = localStorage.getItem('audio_enabled');
    const savedVolume = localStorage.getItem('audio_volume');
    if (savedEnabled !== null) this.isEnabled = savedEnabled === 'true';
    if (savedVolume !== null) this.volume = parseFloat(savedVolume);
  }

  resolveSrc(sfxSrc) {
    if (!sfxSrc) return '';
    let finalSrc = sfxSrc;
    if (!sfxSrc.startsWith('http') && !sfxSrc.startsWith('/') && !sfxSrc.startsWith('data:')) {
      finalSrc = this.basePath + sfxSrc;
    }
    if (!finalSrc.startsWith('data:') && !/\.(mp3|wav|ogg|flac|aac|m4a)$/i.test(finalSrc)) {
      finalSrc = `${finalSrc}.mp3`;
    }
    return getAssetUrl(finalSrc, 'audio');
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopSFX('all');
    }
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    this.activeAudios.forEach(audio => { audio.volume = this.volume; });
    this.activeLoops.forEach(({ audio }) => { audio.volume = this.volume; });
    if (this.currentQueueAudio) this.currentQueueAudio.volume = this.volume;
  }

  init() {
    this.playedElements.clear();
    const sfxElements = document.querySelectorAll(this.selector);
    if (sfxElements.length === 0) return;

    sfxElements.forEach((el, index) => this.setupSFXElement(el, index));
    this.setupScrollObserver();
  }

  setupSFXElement(element, index) {
    const sfxStop = element.dataset.sfxStop;
    if (sfxStop) {
      element.dataset.sfxIndex = index;
      if (this.scrollObserver) this.scrollObserver.observe(element);
      return;
    }

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


    // Click handler: manual play or toggle loop
    const handleClick = () => this.playSFX(element, false);
    element.removeEventListener('click', element._sfxClickHandler);
    element._sfxClickHandler = handleClick;
    element.addEventListener('click', handleClick);

    if (this.scrollObserver) this.scrollObserver.observe(element);
  }

  setupScrollObserver() {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
      this.scrollObserver = null;
    }

    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const index = el.dataset.sfxIndex;

          if (el.dataset.sfxStop) {
            this.stopSFX(el.dataset.sfxStop);
            return;
          }

          const autoPlay = el.dataset.sfxAuto !== 'false';
          if (autoPlay && !this.playedElements.has(index)) {
            this.playedElements.add(index);
            this.playSFX(el, true);
          }
        }
      });
    }, { threshold: this.threshold, rootMargin: this.rootMargin });

    document.querySelectorAll(this.selector).forEach(el => {
      if (el.dataset.sfxSrc || el.dataset.sfxStop) this.scrollObserver.observe(el);
    });
  }

  playSFX(element, isAutoTrigger = false) {
    if (!this.isEnabled) return;

    // 1. Stop trigger
    const stopTarget = element.dataset.sfxStop;
    if (stopTarget) {
      this.stopSFX(stopTarget);
      return;
    }

    const sfxSrc = element.dataset.sfxSrc;
    if (!sfxSrc) return;

    const isLoop = element.dataset.sfxLoop === 'true';
    const isParallel = element.dataset.sfxParallel === 'true';
    const sfxKey = element.dataset.sfxIndex || sfxSrc;

    // 2. Loop Mode
    if (isLoop) {
      if (this.activeLoops.has(sfxKey)) {
        if (!isAutoTrigger) {
          // Click toggle off
          const { audio } = this.activeLoops.get(sfxKey);
          audio.pause();
          audio.currentTime = 0;
          this.activeLoops.delete(sfxKey);
          element.classList.remove('playing');
        }
        return;
      }

      try {
        const audio = new Audio();
        audio.src = this.resolveSrc(sfxSrc);
        audio.volume = this.volume;
        audio.loop = true;
        this.activeLoops.set(sfxKey, { audio, element });
        element.classList.add('playing');
        audio.play().catch(err => {
          console.warn('SFXManager loop play blocked:', err);
          element.classList.remove('playing');
          this.activeLoops.delete(sfxKey);
        });
      } catch (err) {
        console.error('SFXManager loop error:', err);
      }
      return;
    }

    // 3. Parallel Mode (Chỉ khi được chỉ định rõ ràng parallel="true" hoặc queue="false")
    if (isParallel) {
      this.playParallel(element, sfxSrc);
      return;
    }

    // 4. Default Mode: Queue (Mặc định phát tuần tự lần lượt sau khi âm trước kết thúc)
    this.sfxQueue.push(element);
    if (!this.isQueueProcessing) this.processQueue();
  }

  playParallel(element, sfxSrc) {
    if (!this.isEnabled) return;

    // Cap maximum concurrent parallel audios
    if (this.activeAudios.size >= this.maxConcurrent) {
      const oldest = this.activeAudios.values().next().value;
      if (oldest) {
        oldest.pause();
        this.activeAudios.delete(oldest);
      }
    }

    try {
      const audio = new Audio();
      audio.src = this.resolveSrc(sfxSrc);
      audio.volume = this.volume;
      this.activeAudios.add(audio);
      element.classList.add('playing');

      const cleanup = () => {
        this.activeAudios.delete(audio);
        element.classList.remove('playing');
        element.classList.add('played');
      };

      audio.addEventListener('ended', cleanup, { once: true });
      audio.addEventListener('error', () => {
        this.activeAudios.delete(audio);
        element.classList.remove('playing');
        element.classList.add('error');
      }, { once: true });

      audio.play().catch(() => {
        cleanup();
      });
    } catch (err) {
      element.classList.remove('playing');
    }
  }

  async processQueue() {
    if (this.sfxQueue.length === 0 || this.isQueueProcessing) return;
    const element = this.sfxQueue.shift();
    const sfxSrc = element?.dataset?.sfxSrc;
    if (!sfxSrc || !this.isEnabled) {
      this.processQueue();
      return;
    }

    this.isQueueProcessing = true;
    element.classList.add('playing');

    let isCleanedUp = false;
    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      this.currentQueueAudio = null;
      this.isQueueProcessing = false;
      setTimeout(() => {
        this.processQueue();
      }, 80);
    };

    try {
      const audio = new Audio();
      audio.src = this.resolveSrc(sfxSrc);
      audio.volume = this.volume;
      this.currentQueueAudio = audio;

      audio.addEventListener('ended', () => {
        element.classList.remove('playing');
        element.classList.add('played');
        cleanup();
      }, { once: true });

      audio.addEventListener('error', () => {
        element.classList.remove('playing');
        element.classList.add('error');
        cleanup();
      }, { once: true });

      await audio.play();
    } catch (error) {
      element.classList.remove('playing');
      cleanup();
    }
  }

  stopSFX(target) {
    if (!target) return;
    if (target === 'all') {
      // Dừng toàn bộ âm thanh lặp
      this.activeLoops.forEach(({ audio, element }) => {
        audio.pause();
        audio.currentTime = 0;
        if (element) element.classList.remove('playing');
      });
      this.activeLoops.clear();

      // Dừng toàn bộ âm thanh song song
      this.activeAudios.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      this.activeAudios.clear();

      // Dọn hàng đợi tuần tự
      this.sfxQueue = [];
      if (this.currentQueueAudio) {
        this.currentQueueAudio.pause();
        this.currentQueueAudio = null;
      }
      this.isQueueProcessing = false;
      return;
    }

    // Dừng âm thanh cụ thể theo target key/src/name
    this.activeLoops.forEach(({ audio, element }, key) => {
      const src = element?.dataset?.sfxSrc || '';
      const name = element?.dataset?.sfxName || '';
      if (key === target || src.includes(target) || name === target) {
        audio.pause();
        audio.currentTime = 0;
        if (element) element.classList.remove('playing');
        this.activeLoops.delete(key);
      }
    });

    // Dừng âm thanh song song cụ thể
    this.activeAudios.forEach(audio => {
      if (audio.src?.includes(target)) {
        audio.pause();
        audio.currentTime = 0;
        this.activeAudios.delete(audio);
      }
    });

    if (this.currentQueueAudio && this.currentQueueAudio.src?.includes(target)) {
      this.currentQueueAudio.pause();
      this.currentQueueAudio = null;
      this.isQueueProcessing = false;
      this.processQueue();
    }
  }

  resetPlayedState() {
    this.playedElements.clear();
    this.stopSFX('all');
    document.querySelectorAll(this.selector).forEach(el => {
      el.classList.remove('played', 'playing', 'error');
    });
  }

  destroy() {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
      this.scrollObserver = null;
    }
    this.stopSFX('all');
    this.playedElements.clear();
  }
}

// Instantiate globally to be accessible to each other
window.bgmManager = new BGMManager();
window.sfxManager = new SFXManager();

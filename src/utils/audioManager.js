import { getAssetUrl, getSafeAudioUrl, findCachedAsset } from './assetUtils';

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
    this.pendingAutoplay = false;
    this._unlockHandler = this._handleUserInteraction.bind(this);
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

    const handleCorbError = async (audioEl) => {
      const src = audioEl.src;
      if (!src || src.startsWith('blob:') || src.startsWith('data:')) return;
      try {
        const safe = await getSafeAudioUrl(src);
        if (safe && safe !== src) {
          audioEl.src = safe;
          audioEl.load();
          if (this.isPlaying) {
            audioEl.play().catch(() => {});
          }
        }
      } catch (e) {}
    };

    this.introAudio.addEventListener('error', () => handleCorbError(this.introAudio));
    this.loopAudio.addEventListener('error', () => handleCorbError(this.loopAudio));
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
      if (this.currentTrack && !this.isPlaying) {
        this.play().catch(() => {});
      }
    } else {
      this.pause();
      this.removeAutoplayUnlock();
    }
    if (window.sfxManager) window.sfxManager.setEnabled(this.isEnabled);
    this.updateUI();
  }

  setupAutoplayUnlock() {
    if (this.pendingAutoplay) return;
    this.pendingAutoplay = true;
    const events = ['click', 'pointerdown', 'keydown', 'touchstart'];
    events.forEach(evt => {
      window.addEventListener(evt, this._unlockHandler, { capture: true, once: true });
    });
  }

  removeAutoplayUnlock() {
    this.pendingAutoplay = false;
    const events = ['click', 'pointerdown', 'keydown', 'touchstart'];
    events.forEach(evt => {
      window.removeEventListener(evt, this._unlockHandler, { capture: true });
    });
  }

  async _handleUserInteraction() {
    this.removeAutoplayUnlock();
    if (this.isEnabled && this.currentTrack && !this.isPlaying) {
      await this.play();
      if (this.isPlaying) {
        this.introAudio.volume = this.volume;
        this.loopAudio.volume = this.volume;
      }
    }
  }

  async loadTrack(track, token = null) {
    if (token === null) {
      token = ++this.playToken;
    }

    const isSameTrack = this.currentTrack && (
      (track.id && this.currentTrack.id === track.id) ||
      (!track.id && this.currentTrack.intro === track.intro && this.currentTrack.loop === track.loop)
    );

    if (isSameTrack && (this.introAudio.src || this.loopAudio.src)) {
      return;
    }

    this.stopAudio();
    this.currentTrack = track;
    this.isNewTrack = true;

    const resolvePath = (src) => {
      if (!src) return '';
      const normalized = String(src).trim().replace(/\\/g, '/');

      // 1. Check cached asset directly (cross-category lookup)
      const cached = findCachedAsset(normalized);
      if (cached?.url) {
        return getAssetUrl(cached.url, 'audio');
      }

      // 2. If it is already a full path or URL
      if (normalized.startsWith('http') || normalized.startsWith('/') || normalized.startsWith('data:') || normalized.startsWith('audio/') || normalized.startsWith('assets/')) {
        return getAssetUrl(normalized, 'audio');
      }

      // 3. Fallback to basePath (/assets/audio/bgm/) with cross-folder fallback
      return getAssetUrl(this.basePath + normalized, 'audio');
    };

    let introPromise = Promise.resolve('');
    if (track.intro) {
      const introRaw = resolvePath(track.intro);
      introPromise = getSafeAudioUrl(introRaw);
    } else {
      this.introAudio.removeAttribute('src');
      this.introAudio.load();
    }

    const loopSrc = track.loop || (track.intro ? null : track.id);
    let loopPromise = Promise.resolve('');
    if (loopSrc) {
      const loopRaw = resolvePath(loopSrc);
      loopPromise = getSafeAudioUrl(loopRaw);
    } else {
      this.loopAudio.removeAttribute('src');
      this.loopAudio.load();
    }

    const [safeIntro, safeLoop] = await Promise.all([introPromise, loopPromise]);

    if (this.playToken !== token) return;

    if (safeIntro) {
      this.introAudio.src = safeIntro;
      this.introAudio.load();
    }
    if (safeLoop) {
      this.loopAudio.src = safeLoop;
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
            await this.startLoop();
          }
        }
      } else {
        this.isNewTrack = false;
        this.isIntroPlaying = false;
        await this.startLoop();
      }
      this.removeAutoplayUnlock();
    } catch (error) {
      console.warn('BGMManager: Playback failed (waiting for user interaction)', error);
      this.isPlaying = false;
      this.updateUI();

      if (error?.name === 'NotAllowedError') {
        this.setupAutoplayUnlock();
      }
    }
  }

  onIntroEnded() {
    this.isIntroPlaying = false;
    if (this.isPlaying) this.startLoop().catch(() => {});
  }

  async startLoop() {
    const hasLoop = this.currentTrack && (this.currentTrack.loop || (!this.currentTrack.intro && this.currentTrack.id) || this.loopAudio.src);
    if (!hasLoop || !this.loopAudio.src || this.loopAudio.src === window.location.href) return;
    try {
      if (this.isNewTrack) {
        this.loopAudio.currentTime = 0;
      }
      await this.loopAudio.play();
    } catch (error) {
      console.warn('BGMManager: Loop playback failed', error);
      throw error;
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
    this.removeAutoplayUnlock();

    this.currentTrack = null;
    this.updateUI();
  }

  async changeTrack(track, fadeTransition = true) {
    if (!this.isEnabled) {
      if (track.id || track.intro || track.loop) {
        await this.loadTrack(track);
      }
      return;
    }

    const currentToken = ++this.playToken;

    if (!track.id && !track.intro && !track.loop) {
      if (fadeTransition && this.isPlaying) await this.fadeOut(currentToken);
      if (this.playToken === currentToken) {
        this.stop(false);
        this.currentTrack = { id: '', intro: null, loop: null };
      }
      return;
    }

    if (fadeTransition && this.isPlaying) {
      await this.fadeOut(currentToken);
    }

    if (this.playToken !== currentToken) return;

    await this.loadTrack(track, currentToken);
    if (this.playToken !== currentToken) return;

    if (fadeTransition) {
      this.introAudio.volume = 0;
      this.loopAudio.volume = 0;
    } else {
      this.introAudio.volume = this.volume;
      this.loopAudio.volume = this.volume;
    }

    await this.play();

    if (this.playToken !== currentToken) {
      this.pause();
      return;
    }

    if (fadeTransition && this.isPlaying) {
      await this.fadeIn(currentToken);
    }
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
    this.removeAutoplayUnlock();
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

    this.setupAutoplayUnlock();

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
          const isSameTrack = this.currentTrack && this.currentTrack.id === trackId;
          const hasTrackToPlay = Boolean(trackId || intro || loop);
          if (!isSameTrack || (!this.isPlaying && hasTrackToPlay)) {
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
    const raw = String(sfxSrc).trim().replace(/\\/g, '/');

    // 1. Check cached asset directly (cross-category lookup for BGM, SFX, voices, etc.)
    const cached = findCachedAsset(raw);
    if (cached?.url) {
      return getAssetUrl(cached.url, 'audio');
    }

    // 2. If already a full path or URL
    if (raw.startsWith('http') || raw.startsWith('/') || raw.startsWith('data:') || raw.startsWith('audio/') || raw.startsWith('assets/')) {
      return getAssetUrl(raw, 'audio');
    }

    // 3. Fallback to basePath (/assets/audio/sfx/) with cross-folder fallback
    return getAssetUrl(this.basePath + raw, 'audio');
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
      audio._sfxSrc = sfxSrc;
      audio._sfxName = element?.dataset?.sfxName || '';
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
      audio._sfxSrc = sfxSrc;
      audio._sfxName = element?.dataset?.sfxName || '';
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

    const targetClean = String(target).trim();

    // Dừng âm thanh cụ thể theo target key/src/name
    this.activeLoops.forEach(({ audio, element }, key) => {
      const src = element?.dataset?.sfxSrc || '';
      const name = element?.dataset?.sfxName || '';
      if (key === targetClean || src === targetClean || src.includes(targetClean) || name === targetClean) {
        audio.pause();
        audio.currentTime = 0;
        if (element) element.classList.remove('playing');
        this.activeLoops.delete(key);
      }
    });

    // Dừng âm thanh song song cụ thể
    this.activeAudios.forEach(audio => {
      if (audio._sfxSrc === targetClean || audio._sfxName === targetClean || audio.src?.includes(targetClean)) {
        audio.pause();
        audio.currentTime = 0;
        this.activeAudios.delete(audio);
      }
    });

    if (this.currentQueueAudio && (this.currentQueueAudio._sfxSrc === targetClean || this.currentQueueAudio._sfxName === targetClean || this.currentQueueAudio.src?.includes(targetClean))) {
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

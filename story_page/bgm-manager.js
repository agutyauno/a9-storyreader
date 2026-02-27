/* ================================================================================================= */
/* BGM Manager - Background Music with Intro/Loop Support */
/* ================================================================================================= */

/**
 * BGMManager class handles background music playback with intro and loop segments.
 * Features:
 * - Plays intro once, then loops the loop segment indefinitely
 * - Simple on/off audio control with localStorage persistence
 * - Smooth transitions when changing tracks
 */
class BGMManager {
    constructor(options = {}) {
        // Configuration
        this.basePath = options.basePath || '../assets/audio/bgm/';
        this.fadeTime = options.fadeTime || 500; // ms
        this.volume = options.volume || 1;
        
        // Audio elements
        this.introAudio = new Audio();
        this.loopAudio = new Audio();
        
        // State
        this.currentTrack = null;
        this.isPlaying = false;
        this.isEnabled = true; // Audio enabled by default
        this.isIntroPlaying = false;
        
        // UI elements (will be set during init)
        this.toggleBtn = null;
        this.audioIcon = null;
        this.volumeSlider = null;
        
        // Bind methods
        this.onIntroEnded = this.onIntroEnded.bind(this);
        
        // Setup audio elements
        this.setupAudioElements();
        
        // Load saved state from localStorage
        this.loadState();
    }
    
    /**
     * Setup audio element properties
     */
    setupAudioElements() {
        // Intro audio - plays once
        this.introAudio.preload = 'auto';
        this.introAudio.volume = this.volume;
        this.introAudio.addEventListener('ended', this.onIntroEnded);
        
        // Loop audio - loops indefinitely
        this.loopAudio.preload = 'auto';
        this.loopAudio.loop = true;
        this.loopAudio.volume = this.volume;
    }
    
    /**
     * Initialize UI bindings
     */
    initUI() {
        this.toggleBtn = document.getElementById('audio-toggle');
        this.audioIcon = document.getElementById('audio-icon');
        this.volumeSlider = document.getElementById('volume-slider');
        
        if (!this.toggleBtn) {
            console.warn('BGMManager: Audio toggle button not found');
            return false;
        }
        
        // Bind click event to toggle audio
        this.toggleBtn.addEventListener('click', () => this.toggleEnabled());
        
        // Bind volume slider
        if (this.volumeSlider) {
            this.volumeSlider.value = this.volume * 100;
            this.volumeSlider.addEventListener('input', (e) => {
                this.setVolume(parseInt(e.target.value) / 100);
            });
        }
        
        // Update UI state
        this.updateUI();
        
        return true;
    }
    
    /**
     * Load saved state from localStorage
     */
    loadState() {
        const savedEnabled = localStorage.getItem('audio_enabled');
        const savedVolume = localStorage.getItem('audio_volume');
        
        if (savedEnabled !== null) {
            this.isEnabled = savedEnabled === 'true';
        }
        
        if (savedVolume !== null) {
            this.volume = parseFloat(savedVolume);
            this.introAudio.volume = this.volume;
            this.loopAudio.volume = this.volume;
        }
    }
    
    /**
     * Save current state to localStorage
     */
    saveState() {
        localStorage.setItem('audio_enabled', this.isEnabled.toString());
        localStorage.setItem('audio_volume', this.volume.toString());
    }
    
    /**
     * Set volume level
     * @param {number} value - Volume level (0-1)
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        this.introAudio.volume = this.volume;
        this.loopAudio.volume = this.volume;
        this.saveState();
        
        // Sync volume to SFX manager
        if (window.sfxManager) {
            window.sfxManager.setVolume(this.volume);
        }
        
        this.updateUI();
    }
    
    /**
     * Toggle audio enabled state (on/off)
     */
    toggleEnabled() {
        this.isEnabled = !this.isEnabled;
        this.saveState();
        
        if (this.isEnabled) {
            // Resume playback if there's a track loaded
            if (this.currentTrack && !this.isPlaying) {
                this.play();
            }
        } else {
            // Pause playback
            this.pause();
        }
        
        // Notify SFX manager about state change
        if (window.sfxManager) {
            window.sfxManager.setEnabled(this.isEnabled);
        }
        
        this.updateUI();
    }
    
    /**
     * Load a new BGM track
     * @param {Object} track - Track configuration
     * @param {string} track.id - Unique track identifier
     * @param {string} track.intro - Intro file path (relative to basePath)
     * @param {string} track.loop - Loop file path (relative to basePath)
     */
    loadTrack(track) {
        // If same track, don't reload
        if (this.currentTrack && this.currentTrack.id === track.id) {
            return;
        }
        
        // Stop current playback
        this.stop();
        
        // Store track info
        this.currentTrack = track;
        
        // Set sources
        if (track.intro) {
            this.introAudio.src = this.basePath + track.intro;
        } else {
            this.introAudio.src = '';
        }
        
        if (track.loop) {
            this.loopAudio.src = this.basePath + track.loop;
        } else {
            this.loopAudio.src = '';
        }
        
        // Preload
        if (track.intro) {
            this.introAudio.load();
        }
        if (track.loop) {
            this.loopAudio.load();
        }
    }
    
    /**
     * Start playback from beginning
     */
    async play() {
        if (!this.currentTrack || !this.isEnabled) {
            return;
        }
        
        this.isPlaying = true;
        this.updateUI();
        
        try {
            // If there's an intro, play it first
            if (this.currentTrack.intro && this.introAudio.src) {
                this.isIntroPlaying = true;
                this.introAudio.currentTime = 0;
                await this.introAudio.play();
            } else {
                // No intro, start loop directly
                this.startLoop();
            }
        } catch (error) {
            console.error('BGMManager: Playback failed', error);
            this.isPlaying = false;
            this.updateUI();
        }
    }
    
    /**
     * Called when intro ends - start the loop
     */
    onIntroEnded() {
        this.isIntroPlaying = false;
        if (this.isPlaying) {
            this.startLoop();
        }
    }
    
    /**
     * Start the loop segment
     */
    async startLoop() {
        if (!this.currentTrack || !this.currentTrack.loop) {
            console.warn('BGMManager: No loop segment defined');
            return;
        }
        
        try {
            this.loopAudio.currentTime = 0;
            await this.loopAudio.play();
        } catch (error) {
            console.error('BGMManager: Loop playback failed', error);
        }
    }
    
    /**
     * Pause playback
     */
    pause() {
        this.isPlaying = false;
        this.introAudio.pause();
        this.loopAudio.pause();
        this.updateUI();
    }
    
    /**
     * Stop playback and reset
     */
    stop() {
        this.isPlaying = false;
        this.isIntroPlaying = false;
        
        this.introAudio.pause();
        this.introAudio.currentTime = 0;
        
        this.loopAudio.pause();
        this.loopAudio.currentTime = 0;
        
        this.updateUI();
    }
    
    /**
     * Change to a new track with optional fade transition
     * @param {Object} track - New track configuration
     * @param {boolean} fadeTransition - Whether to fade between tracks
     */
    async changeTrack(track, fadeTransition = true) {
        if (!this.isEnabled) {
            // Just load the track but don't play
            this.loadTrack(track);
            return;
        }
        
        if (fadeTransition && this.isPlaying) {
            await this.fadeOut();
        }
        
        this.loadTrack(track);
        
        if (this.isPlaying || fadeTransition) {
            await this.play();
            if (fadeTransition) {
                await this.fadeIn();
            }
        }
    }
    
    /**
     * Fade out current audio
     */
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
    
    /**
     * Fade in audio
     */
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
    
    /**
     * Update UI elements to reflect current state
     */
    updateUI() {
        if (!this.toggleBtn) return;
        
        // Update enabled/disabled state
        if (this.isEnabled) {
            this.toggleBtn.classList.remove('muted');
            this.toggleBtn.title = 'Tắt âm thanh';
            if (this.audioIcon) {
                this.audioIcon.textContent = '🔊';
            }
        } else {
            this.toggleBtn.classList.add('muted');
            this.toggleBtn.title = 'Bật âm thanh';
            if (this.audioIcon) {
                this.audioIcon.textContent = '🔇';
            }
        }
    }
    
    /**
     * Destroy the manager and clean up
     */
    destroy() {
        this.stop();
        this.introAudio.removeEventListener('ended', this.onIntroEnded);
        
        // Cleanup scroll observer
        if (this.scrollObserver) {
            this.scrollObserver.disconnect();
            this.scrollObserver = null;
        }
        
        this.introAudio = null;
        this.loopAudio = null;
    }
    
    /**
     * Setup scroll-based BGM triggers
     * Watches elements with data-bgm-id attribute and changes BGM when they enter viewport
     * 
     * Usage in HTML:
     * <section data-bgm-id="calm" data-bgm-intro="calm_intro.wav" data-bgm-loop="calm_loop.wav">
     * 
     * Or with just loop (no intro):
     * <section data-bgm-id="battle" data-bgm-loop="battle_loop.wav">
     */
    setupScrollTriggers(options = {}) {
        const selector = options.selector || '[data-bgm-id]';
        const threshold = options.threshold || 0.3;
        const rootMargin = options.rootMargin || '0px 0px 0px 0px';
        
        const triggerElements = document.querySelectorAll(selector);
        
        if (triggerElements.length === 0) {
            console.info('BGMManager: No scroll trigger elements found');
            return;
        }
        
        // Create Intersection Observer
        this.scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const trackId = el.dataset.bgmId;
                    const intro = el.dataset.bgmIntro || null;
                    const loop = el.dataset.bgmLoop || null;
                    
                    // Only change if different track
                    if (!this.currentTrack || this.currentTrack.id !== trackId) {
                        console.log(`BGMManager: Scroll triggered track change to "${trackId}"`);
                        
                        this.changeTrack({
                            id: trackId,
                            intro: intro,
                            loop: loop
                        }, true);
                    }
                }
            });
        }, {
            threshold: threshold,
            rootMargin: rootMargin
        });
        
        // Observe all trigger elements
        triggerElements.forEach(el => {
            this.scrollObserver.observe(el);
        });
        
        console.log(`BGMManager: Watching ${triggerElements.length} scroll trigger(s)`);
    }
}

// Create global instance
window.bgmManager = new BGMManager();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGMManager;
}

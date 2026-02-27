/* ================================================================================================= */
/* SFX Manager - Sound Effects with Scroll Trigger Support */
/* ================================================================================================= */

/**
 * SFXManager class handles sound effects playback with scroll triggers.
 * Features:
 * - Auto-play SFX when scrolling to element
 * - Click to replay SFX
 * - Enabled state synced with BGM manager
 */
class SFXManager {
    constructor(options = {}) {
        // Configuration
        this.basePath = options.basePath || '../assets/audio/sfx/';
        this.selector = options.selector || '.sfx_player';
        this.threshold = options.threshold || 0.5;
        this.rootMargin = options.rootMargin || '0px 0px -50% 0px';
        this.volume = options.volume || 1; // Fixed volume
        
        // State
        this.isEnabled = true; // Enabled by default
        this.playedElements = new Set(); // Track which SFX have been auto-played
        this.scrollObserver = null;
        this.currentAudio = null;
        
        // Load state from localStorage
        this.loadState();
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
        }
    }
    
    /**
     * Set enabled state (called by BGM manager)
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        // Stop current audio if disabling
        if (!enabled && this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
    }
    
    /**
     * Set volume level (called by BGM manager)
     * @param {number} value - Volume level (0-1)
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        
        // Update current audio if playing
        if (this.currentAudio) {
            this.currentAudio.volume = this.volume;
        }
    }
    
    /**
     * Initialize SFX elements and setup scroll triggers
     */
    init() {
        const sfxElements = document.querySelectorAll(this.selector);
        
        if (sfxElements.length === 0) {
            console.info('SFXManager: No SFX elements found');
            return false;
        }
        
        // Setup each SFX element
        sfxElements.forEach((el, index) => {
            this.setupSFXElement(el, index);
        });
        
        // Create Intersection Observer for auto-play
        this.setupScrollObserver();
        
        console.log(`SFXManager: Initialized ${sfxElements.length} SFX element(s)`);
        return true;
    }
    
    /**
     * Setup individual SFX element with UI and click handler
     */
    setupSFXElement(element, index) {
        // Get SFX source from data attribute or existing audio element
        let sfxSrc = element.dataset.sfxSrc;
        let sfxName = element.dataset.sfxName || 'Sound Effect';
        let sfxAuto = element.dataset.sfxAuto !== 'false'; // Default true
        
        // Check for existing audio element
        const existingAudio = element.querySelector('audio');
        if (existingAudio && existingAudio.src) {
            sfxSrc = sfxSrc || existingAudio.getAttribute('src');
            sfxName = existingAudio.textContent || sfxName;
            existingAudio.remove();
        }
        
        if (!sfxSrc) {
            console.warn(`SFXManager: No source for SFX element ${index}`);
            return;
        }
        
        // Store data on element
        element.dataset.sfxSrc = sfxSrc;
        element.dataset.sfxName = sfxName;
        element.dataset.sfxIndex = index;
        element.dataset.sfxAuto = sfxAuto;
        
        // Create UI
        element.innerHTML = `
            <div class="sfx-content">
                <span class="sfx-name">${sfxName}</span>
            </div>
        `;
        
        // Add click handler for replay
        element.addEventListener('click', () => {
            this.playSFX(element);
        });
        
        // Add to observer
        if (this.scrollObserver) {
            this.scrollObserver.observe(element);
        }
    }
    
    /**
     * Setup Intersection Observer for scroll-based auto-play
     */
    setupScrollObserver() {
        this.scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const index = el.dataset.sfxIndex;
                    const autoPlay = el.dataset.sfxAuto !== 'false';
                    
                    // Only auto-play once per element, and only if auto is enabled
                    if (autoPlay && !this.playedElements.has(index)) {
                        this.playedElements.add(index);
                        this.playSFX(el, true);
                    }
                }
            });
        }, {
            threshold: this.threshold,
            rootMargin: this.rootMargin
        });
        
        // Observe all existing SFX elements
        document.querySelectorAll(this.selector).forEach(el => {
            if (el.dataset.sfxSrc) {
                this.scrollObserver.observe(el);
            }
        });
    }
    
    /**
     * Play SFX from element
     * @param {HTMLElement} element - The SFX player element
     * @param {boolean} isAutoTrigger - Whether this was auto-triggered by scroll
     */
    async playSFX(element, isAutoTrigger = false) {
        // Don't play if audio is disabled
        if (!this.isEnabled) return;
        
        const sfxSrc = element.dataset.sfxSrc;
        if (!sfxSrc) return;
        
        // Stop current audio if playing
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        
        // Update UI to playing state
        element.classList.add('playing');
        
        try {
            // Create and play audio
            const audio = new Audio();
            
            // Construct full path if relative
            if (!sfxSrc.startsWith('http') && !sfxSrc.startsWith('../') && !sfxSrc.startsWith('/')) {
                audio.src = this.basePath + sfxSrc;
            } else {
                audio.src = sfxSrc;
            }
            
            audio.volume = this.volume;
            this.currentAudio = audio;
            
            // Handle audio end
            audio.addEventListener('ended', () => {
                element.classList.remove('playing');
                element.classList.add('played');
                this.currentAudio = null;
            });
            
            // Handle audio error
            audio.addEventListener('error', (e) => {
                console.error('SFXManager: Failed to play', sfxSrc, e);
                element.classList.remove('playing');
                element.classList.add('error');
                this.currentAudio = null;
            });
            
            await audio.play();
            
        } catch (error) {
            console.error('SFXManager: Playback error', error);
            element.classList.remove('playing');
        }
    }
    
    /**
     * Reset played state to allow re-trigger on scroll
     */
    resetPlayedState() {
        this.playedElements.clear();
        document.querySelectorAll(this.selector).forEach(el => {
            el.classList.remove('played', 'playing', 'error');
        });
    }
    
    /**
     * Destroy manager and cleanup
     */
    destroy() {
        if (this.scrollObserver) {
            this.scrollObserver.disconnect();
            this.scrollObserver = null;
        }
        
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        
        this.playedElements.clear();
    }
}

// Create global SFX instance
window.sfxManager = new SFXManager();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SFXManager;
}

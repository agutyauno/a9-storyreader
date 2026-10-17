import { getAssetFallbackUrls, getSafeAudioUrl, extractDataSubpath } from './assetUtils.js';

/**
 * Global error handler to provide three-tier fallback for assets failing to load:
 * 1. GitHub CDN (GitHub Pages) -> 2. jsDelivr -> 3. GitHub Raw
 * It catches 'error' events on media elements in the capture phase,
 * and intercepts window.fetch to automatically cascade on failure.
 */
export function setupAssetFallback() {
  window.addEventListener('error', async function (e) {
    const target = e.target;

    // We only care about media elements failing to load
    if (target && (target.tagName === 'IMG' || target.tagName === 'AUDIO' || target.tagName === 'VIDEO' || target.tagName === 'SOURCE')) {
      const currentSrc = target.src || target.currentSrc;
      if (!currentSrc || currentSrc.startsWith('data:') || currentSrc.startsWith('blob:')) return;

      const subpath = extractDataSubpath(currentSrc);
      if (!subpath) return;

      const fallbacks = getAssetFallbackUrls(subpath);
      if (fallbacks.length <= 1) return;

      const currentAttempt = parseInt(target.dataset.fallbackAttempt || '0', 10);
      const nextIndex = currentAttempt + 1;

      if (nextIndex < fallbacks.length) {
        target.dataset.fallbackAttempt = String(nextIndex);
        const nextSrc = fallbacks[nextIndex];
        console.warn(`[Asset Fallback] Failed to load ${currentSrc}. Falling back to tier ${nextIndex + 1}: ${nextSrc}`);

        // For audio falling back to GitHub Raw: use safe blob URL to eliminate CORB
        if (target.tagName === 'AUDIO' && nextSrc.includes('raw.githubusercontent.com')) {
          try {
            const safeBlobUrl = await getSafeAudioUrl(nextSrc);
            target.src = safeBlobUrl;
            if (typeof target.load === 'function') target.load();
            return;
          } catch (err) {
            console.warn('[Asset Fallback] Safe audio fallback failed, using direct URL:', err);
          }
        }

        if (target.tagName === 'SOURCE') {
          target.src = nextSrc;
          if (target.parentNode && typeof target.parentNode.load === 'function') {
            target.parentNode.load();
          }
        } else {
          target.src = nextSrc;
          if (typeof target.load === 'function' && (target.tagName === 'AUDIO' || target.tagName === 'VIDEO')) {
            target.load();
          }
        }
      }
    }
  }, true);

  // Intercept global window.fetch
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else if (input && typeof input === 'object' && 'url' in input) {
      url = input.url;
    }

    if (url && typeof url === 'string') {
      const subpath = extractDataSubpath(url);
      if (subpath) {
        const fallbacks = getAssetFallbackUrls(subpath);
        const currentIndex = fallbacks.indexOf(url);

        if (currentIndex !== -1 && currentIndex < fallbacks.length - 1) {
          try {
            const response = await originalFetch(input, init);
            if (response.ok) return response;
            console.warn(`[Asset Fallback] Fetch to ${url} returned ${response.status}. Trying next tier...`);
          } catch (err) {
            console.warn(`[Asset Fallback] Fetch to ${url} threw error. Trying next tier...`, err);
          }

          // Cascade through remaining fallback tiers
          for (let i = currentIndex + 1; i < fallbacks.length; i++) {
            const fallbackUrl = fallbacks[i];
            try {
              let fallbackInput = fallbackUrl;
              if (input instanceof Request) {
                try {
                  fallbackInput = new Request(fallbackUrl, input);
                } catch (e) {
                  fallbackInput = fallbackUrl;
                }
              }
              const fbResponse = await originalFetch(fallbackInput, init);
              if (fbResponse.ok) {
                return fbResponse;
              }
            } catch (fbErr) {
              // Proceed to next fallback
            }
          }
        }
      }
    }

    return originalFetch(input, init);
  };
}



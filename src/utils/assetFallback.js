/**
 * Global error handler to provide fallbacks for assets failing to load from jsDelivr.
 * It catches 'error' events on media elements in the capture phase.
 */
export function setupAssetFallback() {
  window.addEventListener('error', function(e) {
    const target = e.target;
    
    // We only care about media elements failing to load
    if (target && (target.tagName === 'IMG' || target.tagName === 'AUDIO' || target.tagName === 'VIDEO' || target.tagName === 'SOURCE')) {
      const currentSrc = target.src || target.currentSrc;
      if (!currentSrc) return;
      
      let newSrc = null;
      
      // Fallback for a9sr-data
      if (currentSrc.includes('cdn.jsdelivr.net/gh/agutyauno/a9sr-data@main/')) {
        newSrc = currentSrc.replace(
          'https://cdn.jsdelivr.net/gh/agutyauno/a9sr-data@main/', 
          'https://raw.githubusercontent.com/agutyauno/a9sr-data/main/'
        );
      }
      
      if (newSrc && newSrc !== currentSrc && !target.dataset.fallbackAttempted) {
        // Prevent infinite loops
        target.dataset.fallbackAttempted = 'true';
        
        console.warn(`[Asset Fallback] Failed to load ${currentSrc}. Falling back to ${newSrc}`);
        
        if (target.tagName === 'SOURCE') {
          target.src = newSrc;
          if (target.parentNode && typeof target.parentNode.load === 'function') {
            target.parentNode.load();
          }
        } else {
          target.src = newSrc;
        }
      }
    }
  }, true);

  // Intercept global window.fetch
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else if (input && typeof input === 'object' && 'url' in input) {
      url = input.url;
    }

    if (url && typeof url === 'string') {
      let fallbackUrl = null;
      if (url.includes('cdn.jsdelivr.net/gh/agutyauno/a9sr-data@main/')) {
        fallbackUrl = url.replace(
          'https://cdn.jsdelivr.net/gh/agutyauno/a9sr-data@main/',
          'https://raw.githubusercontent.com/agutyauno/a9sr-data/main/'
        );
      }

      if (fallbackUrl) {
        let primaryInput = input;
        let fallbackInput = fallbackUrl;

        if (input instanceof Request) {
          primaryInput = input.clone();
          try {
            fallbackInput = new Request(fallbackUrl, input);
          } catch (e) {
            fallbackInput = fallbackUrl;
          }
        }

        try {
          const response = await originalFetch(primaryInput, init);
          if (!response.ok) {
            console.warn(`[Asset Fallback] Fetch to ${url} failed with status ${response.status}. Falling back to ${fallbackUrl}`);
            return originalFetch(fallbackInput, init);
          }
          return response;
        } catch (error) {
          console.warn(`[Asset Fallback] Fetch to ${url} failed with error. Falling back to ${fallbackUrl}`, error);
          return originalFetch(fallbackInput, init);
        }
      }
    }

    return originalFetch(input, init);
  };
}


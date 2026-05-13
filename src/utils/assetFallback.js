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
      // Fallback for a9-storyreader
      else if (currentSrc.includes('cdn.jsdelivr.net/gh/agutyauno/a9-storyreader@main/')) {
        newSrc = currentSrc.replace(
          'https://cdn.jsdelivr.net/gh/agutyauno/a9-storyreader@main/', 
          'https://raw.githubusercontent.com/agutyauno/a9-storyreader/main/'
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
}

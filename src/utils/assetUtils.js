/**
 * Utility to handle asset URL resolution correctly using Vite's BASE_URL.
 * This ensures that local paths starting with /assets/ are correctly prefixed
 * with the base path (e.g., /a9-storyreader/) in production and development.
 */

// import.meta.env.BASE_URL is provided by Vite during build/dev
const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';

// Three CDN Endpoints in exact fallback order requested:
// 1. GitHub CDN (GitHub Pages): Native static streaming, proper audio/wav headers
// 2. jsDelivr:                  Global edge CDN (best for images and files <= 20MB)
// 3. GitHub Raw:                 Direct file repository (large files wrapped in Blob)
export const CDN_PROVIDERS = {
  GITHUB_PAGES: 'https://agutyauno.github.io/a9sr-data/',
  JSDELIVR: 'https://cdn.jsdelivr.net/gh/agutyauno/a9sr-data@main/',
  GITHUB_RAW: 'https://raw.githubusercontent.com/agutyauno/a9sr-data/main/',
};

// Aliases for backward compatibility
export const GITHUB_RAW_DATA = CDN_PROVIDERS.GITHUB_RAW;
export const JSDELIVR_CDN = CDN_PROVIDERS.JSDELIVR;
export const GITHUB_PAGES_CDN = CDN_PROVIDERS.GITHUB_PAGES;

/**
 * Extracts pure subpath within a9sr-data repository regardless of input URL format.
 * (e.g. 'https://raw.githubusercontent.com/.../audio/bgm/a.wav' -> 'audio/bgm/a.wav')
 * @param {string} path - URL or path
 * @returns {string} Pure relative subpath
 */
export function extractDataSubpath(path) {
  if (!path) return '';
  let p = String(path).trim();

  // Strip known CDN domains
  p = p.replace(/^https?:\/\/agutyauno\.github\.io\/a9sr-data\/?/i, '');
  p = p.replace(/^https?:\/\/cdn\.jsdelivr\.net\/gh\/agutyauno\/a9sr-data(@main)?\/?/i, '');
  p = p.replace(/^https?:\/\/raw\.githubusercontent\.com\/agutyauno\/a9sr-data\/(main|master)\/?/i, '');
  p = p.replace(/^https?:\/\/raw\.githubusercontent\.com\/agutyauno\/a9-storyreader\/(main|master)\/?/i, '');
  p = p.replace(/^https?:\/\/cdn\.jsdelivr\.net\/gh\/agutyauno\/a9-storyreader(@main)?\/?/i, '');

  // Strip duplicated / concatenated segments
  p = p.replace('/audio/bgm/audio/bgm/', '/audio/bgm/');
  p = p.replace('/audio/sfx/audio/sfx/', '/audio/sfx/');
  p = p.replace('/assets/audio/bgm/audio/', '/audio/');
  p = p.replace('/assets/audio/sfx/audio/', '/audio/');
  p = p.replace('/assets/audio/audio/', '/audio/');

  // Clean leading slash
  if (p.startsWith('/')) p = p.slice(1);

  // If local /assets/ prefix targets shared data folders
  if (p.startsWith('assets/')) {
    if (p.startsWith('assets/audio/') || p.startsWith('assets/images/characters/') || p.startsWith('assets/images/gallery/') || p.startsWith('assets/images/background/')) {
      p = p.slice(7);
    }
  }

  return p;
}

/**
 * Returns an ordered list of fallback URLs for any asset path:
 * 1. GitHub CDN (GitHub Pages): https://agutyauno.github.io/a9sr-data/...
 * 2. jsDelivr:                  https://cdn.jsdelivr.net/gh/agutyauno/a9sr-data@main/...
 * 3. GitHub Raw:                https://raw.githubusercontent.com/agutyauno/a9sr-data/main/...
 *
 * @param {string} path - The path to resolve
 * @param {string} [type] - The type of asset (e.g., 'audio', 'image', 'video')
 * @returns {string[]} Array of URLs in fallback priority
 */
export function getAssetFallbackUrls(path, type = null) {
  if (!path) return [];
  const trimmed = String(path).trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return [trimmed];
  }

  // Handle local Vite assets (e.g. bundled icons in public/)
  if (trimmed.startsWith('/assets/') && !trimmed.startsWith('/assets/audio/') && !trimmed.includes('/characters/')) {
    const cleanBase = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
    return [`${cleanBase}${trimmed.slice(1)}`];
  }

  // External non-repo URLs (YouTube, Drive, Imgur, etc.)
  if (trimmed.startsWith('http') &&
      !trimmed.includes('agutyauno.github.io/a9sr-data') &&
      !trimmed.includes('cdn.jsdelivr.net/gh/agutyauno/a9sr-data') &&
      !trimmed.includes('raw.githubusercontent.com/agutyauno/a9sr-data')) {
    return [trimmed];
  }

  const subpath = extractDataSubpath(trimmed);
  if (!subpath) return [];

  // Three-tier fallback in order: GitHub Pages -> jsDelivr -> GitHub Raw
  return [
    `${CDN_PROVIDERS.GITHUB_PAGES}${subpath}`,
    `${CDN_PROVIDERS.JSDELIVR}${subpath}`,
    `${CDN_PROVIDERS.GITHUB_RAW}${subpath}`,
  ];
}

/**
 * Resolves a path to a full primary URL (defaulting to GitHub Pages CDN with jsDelivr/Raw fallback).
 * @param {string} path - The path to resolve
 * @param {string} [type] - The type of asset ('audio', 'image', 'video')
 * @returns {string} The resolved URL
 */
export function getAssetUrl(path, type = null) {
  if (!path) return '';
  const trimmed = String(path).trim();
  if (!trimmed) return '';

  const fallbacks = getAssetFallbackUrls(trimmed, type);
  return fallbacks[0] || '';
}

/**
 * Image onError event handler that automatically switches to the next fallback CDN.
 * Usage: <img src={getAssetUrl(url)} onError={(e) => handleImageFallback(e, url)} />
 */
export function handleImageFallback(e, originalPath) {
  const target = e?.currentTarget;
  if (!target) return;

  const fallbacks = getAssetFallbackUrls(originalPath);
  const currentSrc = target.src;

  let nextIndex = 0;
  for (let i = 0; i < fallbacks.length; i++) {
    if (currentSrc === fallbacks[i] || currentSrc.endsWith(fallbacks[i])) {
      nextIndex = i + 1;
      break;
    }
  }

  if (nextIndex < fallbacks.length) {
    target.src = fallbacks[nextIndex];
  }
}

/**
 * Extracts YouTube Video ID from various YouTube URL formats.
 * @param {string} url - The YouTube URL
 * @returns {string|null} The video ID, or null if not found
 */
export function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Extracts Google Drive File ID from various Drive URL formats.
 * @param {string} url - The Google Drive URL
 * @returns {string|null} The file ID, or null if not found
 */
export function getGoogleDriveId(url) {
    if (!url) return null;
    const regExp = /[-\w]{25,}/;
    const match = url.match(regExp);
    return match ? match[0] : null;
}

// In-memory cache for audio Blob URLs to prevent duplicate downloads
const audioBlobCache = new Map();

/**
 * Purges cached audio blob URL(s) from memory.
 * @param {string} [urlOrPath] - Optional specific URL or path to clear. If omitted, clears entire cache.
 */
export function clearAudioBlobCache(urlOrPath = null) {
  if (!urlOrPath) {
    audioBlobCache.clear();
    return;
  }
  const trimmed = String(urlOrPath).trim();
  const cacheKey = extractDataSubpath(trimmed) || trimmed;
  audioBlobCache.delete(cacheKey);
}

/**
 * Returns a safe playable URL for audio with three-tier CDN fallback:
 * 1. GitHub CDN (GitHub Pages): Native streaming, correct audio/wav headers
 * 2. jsDelivr:                  Fast edge CDN for files <= 20MB
 * 3. GitHub Raw:                Fetched as CORS blob to eliminate CORB
 *
 * @param {string} urlOrPath - Audio URL or repository relative path
 * @returns {Promise<string>} Playable URL (blob: URL or direct URL)
 */
export async function getSafeAudioUrl(urlOrPath) {
  if (!urlOrPath) return '';
  const trimmed = String(urlOrPath).trim();
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;

  const cacheKey = extractDataSubpath(trimmed) || trimmed;
  if (audioBlobCache.has(cacheKey)) return audioBlobCache.get(cacheKey);

  const candidates = getAssetFallbackUrls(trimmed, 'audio');
  if (candidates.length === 0) return trimmed;

  // Determine correct audio MIME type by extension
  let mimeType = 'audio/mpeg';
  if (/\.wav(\?.*)?$/i.test(trimmed)) mimeType = 'audio/wav';
  else if (/\.ogg(\?.*)?$/i.test(trimmed)) mimeType = 'audio/ogg';
  else if (/\.flac(\?.*)?$/i.test(trimmed)) mimeType = 'audio/flac';
  else if (/\.aac(\?.*)?$/i.test(trimmed)) mimeType = 'audio/aac';
  else if (/\.m4a(\?.*)?$/i.test(trimmed)) mimeType = 'audio/mp4';

  // Try each CDN candidate in fallback order
  for (let i = 0; i < candidates.length; i++) {
    const candidateUrl = candidates[i];
    const isGithubRaw = candidateUrl.includes('raw.githubusercontent.com');

    try {
      const res = await fetch(candidateUrl);
      if (!res.ok) {
        // e.g. 404 (Pages building) or 403 (jsDelivr > 20MB) -> proceed to next fallback
        continue;
      }

      const cType = res.headers.get('content-type') || '';
      const isAudioMime = cType.startsWith('audio/') || cType.includes('audio');

      // If served with proper audio MIME (e.g. from GitHub Pages):
      if (!isGithubRaw && isAudioMime) {
        audioBlobCache.set(cacheKey, candidateUrl);
        return candidateUrl;
      }

      // If GitHub Raw (or any provider serving application/octet-stream):
      // Convert to a typed audio Blob URL to eliminate CORB
      const rawBlob = await res.blob();
      const typedBlob = new Blob([rawBlob], { type: mimeType });
      const blobUrl = URL.createObjectURL(typedBlob);
      audioBlobCache.set(cacheKey, blobUrl);
      return blobUrl;
    } catch (err) {
      // Network error or fetch blocked -> try next candidate
    }
  }

  // Fallback to first candidate if all network attempts fail
  return candidates[0] || trimmed;
}


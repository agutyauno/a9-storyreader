/**
 * Utility to handle asset URL resolution correctly using Vite's BASE_URL.
 * This ensures that local paths starting with /assets/ are correctly prefixed
 * with the base path (e.g., /a9-storyreader/) in production and development.
 */

// import.meta.env.BASE_URL is provided by Vite during build/dev
const BASE_URL = import.meta.env.BASE_URL || '/';

/**
 * Resolves a path to a full URL relative to the application base.
 * @param {string} path - The path to resolve (e.g., '/assets/images/...')
 * @param {string} [type] - The type of asset (e.g., 'video')
 * @returns {string} The resolved URL
 */
export function getAssetUrl(path, type = null) {
  if (!path) return '';

  // Handle temporary local preview blobs (from Deferred Upload)
  if (typeof path === 'object' && path.preview) {
    return path.preview;
  }
  // Fallback to extract string if object
  if (typeof path === 'object' && path.path) {
    path = path.path;
  }

  if (typeof path !== 'string') return '';

  const isVideo = type === 'video' || path.match(/\.(mp4|webm|ogg)$/i);

  // If it is already an absolute URL or a data URI
  if (path.startsWith('http') || path.startsWith('data:')) {
    const GITHUB_RAW_DATA = 'https://raw.githubusercontent.com/agutyauno/a9sr-data/main/';
    const GITHUB_RAW_READER = 'https://raw.githubusercontent.com/agutyauno/a9-storyreader/main/';
    const JSDELIVR_CDN = 'https://cdn.jsdelivr.net/gh/agutyauno/a9sr-data@main/';

    if (isVideo) {
      // Do not convert to jsDelivr for videos. If it's already jsdelivr, convert to raw.
      if (path.startsWith(JSDELIVR_CDN)) {
        return path.replace(JSDELIVR_CDN, GITHUB_RAW_DATA);
      }
      return path;
    }

    // Legacy support: Convert any full GitHub Raw URLs to jsDelivr CDN
    if (path.startsWith(GITHUB_RAW_DATA)) {
      return path.replace(GITHUB_RAW_DATA, JSDELIVR_CDN);
    }
    if (path.startsWith(GITHUB_RAW_READER)) {
      // Some old assets might be in the reader repo's public folder
      return path.replace(GITHUB_RAW_READER, 'https://cdn.jsdelivr.net/gh/agutyauno/a9-storyreader@main/');
    }

    return path;
  }

  // Handle absolute-style relative paths (e.g. /images/...) targeting our data CDN
  if (path.startsWith('/')) {
    // If it's a local Vite asset (starts with /assets/), handle normally
    if (path.startsWith('/assets/')) {
        const cleanBase = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
        const cleanPath = path.slice(1);
        return `${cleanBase}${cleanPath}`;
    }
    
    // Otherwise, assume it's a relative path to our shared DATA repository
    if (isVideo) {
      const GITHUB_RAW_DATA = 'https://raw.githubusercontent.com/agutyauno/a9sr-data/main/';
      return `${GITHUB_RAW_DATA}${path.slice(1)}`;
    } else {
      const JSDELIVR_CDN = 'https://cdn.jsdelivr.net/gh/agutyauno/a9sr-data@main/';
      return `${JSDELIVR_CDN}${path.slice(1)}`;
    }
  }

  // Fallback for any other relative paths
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
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

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
 * @returns {string} The resolved URL
 */
export function getAssetUrl(path) {
  if (!path) return '';

  // If it's already an absolute URL (http/https) or a data URI, return as is
  if (path.startsWith('http') || path.startsWith('data:')) {
    return path;
  }

  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;

  // Idempotency check: if the path already starts with the base URL, return as is
  // (Handling both /base/path and base/path)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (normalizedPath.startsWith(cleanBase) || normalizedPath === cleanBase.slice(0, -1)) {
    return normalizedPath;
  }

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}

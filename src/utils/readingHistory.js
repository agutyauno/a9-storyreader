/**
 * Reading History & Progress tracker utility using localStorage
 */

const STORAGE_KEY_LAST_READ = 'ced_last_read';
const STORAGE_KEY_HISTORY = 'ced_reading_history';
const MAX_HISTORY_ITEMS = 10;

export function getLastRead() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_READ);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to get last read:', e);
    return null;
  }
}

export function getReadingHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to get reading history:', e);
    return [];
  }
}

export function saveReadingProgress({
  storyId,
  storyName,
  eventId,
  eventName,
  scrollPercent = 0,
  bannerUrl = null
}) {
  if (!storyId) return;

  try {
    const progressItem = {
      storyId,
      storyName: storyName || storyId,
      eventId: eventId || null,
      eventName: eventName || null,
      scrollPercent: Math.max(0, Math.min(100, Math.round(scrollPercent))),
      bannerUrl: bannerUrl || null,
      timestamp: Date.now()
    };

    // Save as last read
    localStorage.setItem(STORAGE_KEY_LAST_READ, JSON.stringify(progressItem));

    // Update history list
    const currentHistory = getReadingHistory();
    const filtered = currentHistory.filter(item => item.storyId !== storyId);
    const updatedHistory = [progressItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));

    // Dispatch event for reactive UI updates
    window.dispatchEvent(new CustomEvent('cedReadingProgressUpdate', { detail: progressItem }));
  } catch (e) {
    console.error('Failed to save reading progress:', e);
  }
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return new Date(timestamp).toLocaleDateString('vi-VN');
}

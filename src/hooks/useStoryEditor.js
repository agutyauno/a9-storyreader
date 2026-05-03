import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { StoryScriptParser } from '../utils/storyParser';
import { SupabaseAPI } from '../services/supabaseApi';

/**
 * Shared hook for all story-based editors (Game Story Editor, Operator Record Editor, etc.)
 * Encapsulates: script state, live preview, panel resize, metadata caching,
 * asset picker, beforeunload warning, and standalone preview.
 *
 * @param {object} options
 * @param {string} options.title - Display title used in preview data
 * @param {string|null} options.eventId - Optional event ID to load event-specific characters
 */
export default function useStoryEditor({ title = '', eventId = null } = {}) {
  // ── Script State ────────────────────────────────────────────────────────
  const [scriptText, setScriptText] = useState('');
  const [initialScript, setInitialScript] = useState('');
  const isDirty = scriptText !== initialScript;

  // ── Preview State ───────────────────────────────────────────────────────
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // ── Panel Visibility & Size ─────────────────────────────────────────────
  const [isSidebarVisible, setIsSidebarVisible] = useState(window.innerWidth > 1024);
  const [isPreviewVisible, setIsPreviewVisible] = useState(window.innerWidth > 1024);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [previewWidth, setPreviewWidth] = useState(420);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 1024);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingPreview, setIsResizingPreview] = useState(false);

  // ── Asset Metadata ──────────────────────────────────────────────────────
  const [allCharacters, setAllCharacters] = useState([]);
  const [eventCharacters, setEventCharacters] = useState([]);
  const [allAssets, setAllAssets] = useState([]);

  // ── Editor Ref ──────────────────────────────────────────────────────────
  const editorRef = useRef(null);

  // ── Asset Picker ────────────────────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerOptions, setPickerOptions] = useState({ filter: null, multi: false });
  const pickerCallbackRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════

  // ── Responsive Screen ───────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      const small = window.innerWidth <= 1024;
      setIsSmallScreen(small);
      if (small && isSidebarVisible && isPreviewVisible) {
        setIsSidebarVisible(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarVisible, isPreviewVisible]);

  // ── Panel Resize (drag handles) ─────────────────────────────────────────
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingSidebar) {
        setSidebarWidth(Math.max(180, Math.min(600, e.clientX)));
      } else if (isResizingPreview) {
        setPreviewWidth(Math.max(250, Math.min(800, window.innerWidth - e.clientX)));
      }
    };
    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingPreview(false);
      document.body.style.cursor = 'default';
    };
    if (isResizingSidebar || isResizingPreview) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'auto';
    };
  }, [isResizingSidebar, isResizingPreview]);

  // ── Load global metadata (characters, assets, gallery) — once ──────────
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [chars, assets, galleryData] = await Promise.all([
          SupabaseAPI.getCharacters(),
          SupabaseAPI.getAssets(),
          SupabaseAPI.getAllGallery(),
        ]);
        setAllCharacters(chars);
        const mappedGallery = (galleryData || []).map(g => ({
          asset_id: g.gallery_id,
          name: g.title,
          url: g.image_url,
          type: 'image',
          category: 'gallery',
        }));
        setAllAssets([...(assets || []), ...mappedGallery]);
      } catch (err) {
        console.error('Failed to load character/asset metadata:', err);
      }
    }
    loadMetadata();
  }, []);

  // ── Load event-specific characters (when eventId changes) ──────────────
  useEffect(() => {
    if (eventId) {
      SupabaseAPI.getCharactersByEvent(eventId)
        .then(setEventCharacters)
        .catch(err => console.error('Failed to fetch event characters:', err));
    } else {
      setEventCharacters([]);
    }
  }, [eventId]);

  // ── Cache Maps ──────────────────────────────────────────────────────────
  const charCacheMap = useMemo(() => {
    return Object.fromEntries(allCharacters.map(c => [c.character_id, c]));
  }, [allCharacters]);

  const assetCacheMap = useMemo(() => {
    return Object.fromEntries(allAssets.map(a => [a.asset_id, a]));
  }, [allAssets]);

  // ── Live Preview (debounced parse) ──────────────────────────────────────
  useEffect(() => {
    if (!scriptText) {
      setPreviewData(null);
      return;
    }
    const timerId = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const parsed = await StoryScriptParser.parseWithDB(scriptText, charCacheMap, assetCacheMap);
        setPreviewData({ name: title, story_content: parsed });
      } catch {
        try {
          const parsed = StoryScriptParser.parse(scriptText);
          setPreviewData({ name: title, story_content: parsed });
        } catch (syncErr) {
          console.warn('Live Preview failed:', syncErr);
        }
      } finally {
        setPreviewLoading(false);
      }
    }, 600);
    return () => clearTimeout(timerId);
  }, [scriptText, title, charCacheMap, assetCacheMap]);

  // ── beforeunload warning ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ═══════════════════════════════════════════════════════════════════════
  // CALLBACKS
  // ═══════════════════════════════════════════════════════════════════════

  const toggleSidebar = useCallback(() => {
    if (isSmallScreen && !isSidebarVisible) setIsPreviewVisible(false);
    setIsSidebarVisible(v => !v);
  }, [isSmallScreen, isSidebarVisible]);

  const togglePreview = useCallback(() => {
    if (isSmallScreen && !isPreviewVisible) setIsSidebarVisible(false);
    setIsPreviewVisible(v => !v);
  }, [isSmallScreen, isPreviewVisible]);

  const handleInsertTemplate = useCallback((template, isInline = false) => {
    editorRef.current?.insertText(template, isInline);
  }, []);

  const openPicker = useCallback((callback, options = {}) => {
    pickerCallbackRef.current = callback;
    setPickerOptions({
      filter: options.filter || (typeof options === 'string' ? options : null),
      multi: options.multi || false,
    });
    setPickerOpen(true);
  }, []);

  const handlePickerSelect = useCallback((assetOrAssets) => {
    pickerCallbackRef.current?.(assetOrAssets);
    pickerCallbackRef.current = null;
    setPickerOptions({ filter: null, multi: false });
    setPickerOpen(false);
  }, []);

  const handleOpenStandalonePreview = useCallback(async () => {
    try {
      const parsed = await StoryScriptParser.parseWithDB(scriptText, charCacheMap, assetCacheMap);
      sessionStorage.setItem('preview_story', JSON.stringify({ name: title, story_content: parsed }));
      window.open('#/story/preview?preview=1', '_blank');
    } catch (err) {
      console.warn('Failed to open standalone preview:', err);
    }
  }, [scriptText, title, charCacheMap, assetCacheMap]);

  // ═══════════════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════════════
  return {
    // Script
    scriptText, setScriptText,
    initialScript, setInitialScript,
    isDirty,
    // Preview
    previewData, previewLoading,
    // Panels
    isSidebarVisible, isPreviewVisible,
    sidebarWidth, previewWidth,
    isResizingSidebar, isResizingPreview,
    toggleSidebar, togglePreview,
    setIsResizingSidebar, setIsResizingPreview,
    // Metadata
    allCharacters, allAssets, eventCharacters,
    charCacheMap, assetCacheMap,
    // Editor
    editorRef, handleInsertTemplate,
    // Asset Picker
    pickerOpen, pickerOptions, openPicker, handlePickerSelect,
    // Standalone Preview
    handleOpenStandalonePreview,
  };
}

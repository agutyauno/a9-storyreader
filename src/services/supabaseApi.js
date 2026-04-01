import { supabase } from './supabaseClient';
import { mockDatabase } from '../utils/mockStoryData';
import { deleteFileFromGithub } from './githubService';

// ─────────────────────────────────────────────────────────────────────────────
// TODO: Set to false when Supabase is fully configured.
// When false, every method calls Supabase directly.
// ─────────────────────────────────────────────────────────────────────────────
const USE_MOCK_DB = false;

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Sort any array by display_order (ascending) */
const sortByOrder = (arr) =>
  [...arr].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

/** Generate a simple timestamp-based ID */
const genId = (prefix) => `${prefix}_${Math.floor(Math.random() * 1000000)}`;
const genNumericId = () => Math.floor(Math.random() * 1000000000);

/** Handle common Supabase errors, especially 401 Unauthorized */
const handleAuthError = (error) => {
  if (error?.status === 401 || error?.code === '401' || error?.message?.includes('JWT expired')) {
    console.error('Session expired or unauthorized. Redirecting to login...');
    // Sign out to clear any stale local state
    supabase.auth.signOut().then(() => {
      window.location.href = '/login?expired=true';
    });
  }
  throw error;
};

const SupabaseAPI_Raw = {
  // ===========================================================================
  // REGIONS
  // ===========================================================================
  async getRegions() {
    if (USE_MOCK_DB) return sortByOrder(mockDatabase.regions);
    const { data, error } = await supabase.from('regions').select('*').order('display_order');
    if (error) throw error;
    return data || [];
  },

  async getRegion(regionId) {
    if (USE_MOCK_DB)
      return mockDatabase.regions.find(r => r.region_id === regionId) || null;
    const { data, error } = await supabase.from('regions').select('*').eq('region_id', regionId).limit(1);
    if (error) throw error;
    return data?.[0] || null;
  },

  async createRegion(payload) {
    if (USE_MOCK_DB) {
      const newItem = { region_id: genId('region'), display_order: 0, ...payload };
      mockDatabase.regions.push(newItem);
      return newItem;
    }
    const { data, error } = await supabase.from('regions').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateRegion(regionId, payload) {
    if (USE_MOCK_DB) {
      const idx = mockDatabase.regions.findIndex(r => r.region_id === regionId);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.regions[idx], payload);
      return mockDatabase.regions[idx];
    }
    const { data, error } = await supabase.from('regions').update(payload).eq('region_id', regionId).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async deleteRegion(regionId) {
    if (USE_MOCK_DB) {
      mockDatabase.regions = mockDatabase.regions.filter(r => r.region_id !== regionId);
      return;
    }
    const { error } = await supabase.from('regions').delete().eq('region_id', regionId);
    if (error) throw error;
  },

  // ===========================================================================
  // ARCS
  // ===========================================================================
  async getArcsByRegion(regionId) {
    if (USE_MOCK_DB)
      return sortByOrder(mockDatabase.arcs.filter(a => a.region_id === regionId));
    const { data, error } = await supabase.from('arcs').select('*').eq('region_id', regionId).order('display_order');
    if (error) throw error;
    return data || [];
  },

  async getArcs() {
    if (USE_MOCK_DB) return sortByOrder(mockDatabase.arcs);
    const { data, error } = await supabase.from('arcs').select('*').order('display_order');
    if (error) throw error;
    return data || [];
  },

  async getArc(arcId) {
    if (USE_MOCK_DB)
      return mockDatabase.arcs.find(a => a.arc_id === arcId) || null;
    const { data, error } = await supabase.from('arcs').select('*').eq('arc_id', arcId).limit(1);
    if (error) throw error;
    return data?.[0] || null;
  },

  async createArc(payload) {
    if (USE_MOCK_DB) {
      const newItem = { arc_id: genId('arc'), display_order: 0, ...payload };
      mockDatabase.arcs.push(newItem);
      return newItem;
    }
    const { data, error } = await supabase.from('arcs').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateArc(arcId, payload) {
    if (USE_MOCK_DB) {
      const idx = mockDatabase.arcs.findIndex(a => a.arc_id === arcId);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.arcs[idx], payload);
      return mockDatabase.arcs[idx];
    }
    const { data, error } = await supabase.from('arcs').update(payload).eq('arc_id', arcId).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async deleteArc(arcId) {
    if (USE_MOCK_DB) {
      mockDatabase.arcs = mockDatabase.arcs.filter(a => a.arc_id !== arcId);
      return;
    }
    const { error } = await supabase.from('arcs').delete().eq('arc_id', arcId);
    if (error) throw error;
  },

  // ===========================================================================
  // EVENTS
  // ===========================================================================
  async getEventsByArc(arcId) {
    if (USE_MOCK_DB)
      return sortByOrder(mockDatabase.events.filter(e => e.arc_id === arcId));
    const { data, error } = await supabase.from('events').select('*').eq('arc_id', arcId).order('display_order');
    if (error) throw error;
    return data || [];
  },

  async getEvents() {
    if (USE_MOCK_DB) return sortByOrder(mockDatabase.events);
    const { data, error } = await supabase.from('events').select('*').order('display_order');
    if (error) throw error;
    return data || [];
  },

  async getEvent(eventId) {
    if (USE_MOCK_DB)
      return mockDatabase.events.find(e => e.event_id === eventId) || null;
    const { data, error } = await supabase.from('events').select('*').eq('event_id', eventId).limit(1);
    if (error) throw error;
    return data?.[0] || null;
  },

  async createEvent(payload) {
    if (USE_MOCK_DB) {
      const newItem = { event_id: genId('event'), display_order: 0, ...payload };
      mockDatabase.events.push(newItem);
      return newItem;
    }
    const { data, error } = await supabase.from('events').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateEvent(eventId, payload) {
    if (USE_MOCK_DB) {
      const idx = mockDatabase.events.findIndex(e => e.event_id === eventId);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.events[idx], payload);
      return mockDatabase.events[idx];
    }
    const { data, error } = await supabase.from('events').update(payload).eq('event_id', eventId).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async deleteEvent(eventId) {
    if (USE_MOCK_DB) {
      mockDatabase.events = mockDatabase.events.filter(e => e.event_id !== eventId);
      return;
    }
    const { error } = await supabase.from('events').delete().eq('event_id', eventId);
    if (error) throw error;
  },

  // ===========================================================================
  // STORIES
  // ===========================================================================
  async getStoriesByEvent(eventId) {
    if (USE_MOCK_DB)
      return sortByOrder(mockDatabase.stories.filter(s => s.event_id === eventId));
    const { data, error } = await supabase.from('stories').select('*').eq('event_id', eventId).order('display_order');
    if (error) throw error;
    return data || [];
  },

  async getStories() {
    if (USE_MOCK_DB) return sortByOrder(mockDatabase.stories);
    const { data, error } = await supabase.from('stories').select('*').order('display_order');
    if (error) throw error;
    return data || [];
  },

  async getStory(storyId) {
    if (USE_MOCK_DB)
      return mockDatabase.stories.find(s => s.story_id === storyId) || null;
    const { data, error } = await supabase.from('stories').select('*').eq('story_id', storyId).limit(1);
    if (error) throw error;
    return data?.[0] || null;
  },

  async createStory(payload) {
    if (USE_MOCK_DB) {
      const newItem = {
        story_id: genId('story'),
        display_order: 0,
        story_content: { characters: {}, sections: [] },
        ...payload
      };
      mockDatabase.stories.push(newItem);
      return newItem;
    }
    const { data, error } = await supabase.from('stories').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateStory(storyId, payload) {
    if (USE_MOCK_DB) {
      const idx = mockDatabase.stories.findIndex(s => s.story_id === storyId);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.stories[idx], payload);
      return mockDatabase.stories[idx];
    }
    const { data, error } = await supabase.from('stories').update(payload).eq('story_id', storyId).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async deleteStory(storyId) {
    if (USE_MOCK_DB) {
      mockDatabase.stories = mockDatabase.stories.filter(s => s.story_id !== storyId);
      return;
    }
    const { error } = await supabase.from('stories').delete().eq('story_id', storyId);
    if (error) throw error;
  },

  // ===========================================================================
  // CHARACTERS
  // ===========================================================================
  // Helper to attach expressions to characters
  async _enrichCharactersWithExpressions(characters) {
    if (!characters?.length) return [];

    const charIds = characters.map(c => c.character_id).filter(Boolean);
    if (!charIds.length) return characters;

    try {
      const exprMap = await this.getExpressionsByCharacters(charIds);
      return characters.map(c => {
        const exprList = exprMap[c.character_id] || [];
        // Convert to object for renderer
        const expressions = {};
        exprList.forEach(e => {
          if (e.name) expressions[e.name] = e;
        });

        // Use 'default' expression (case-insensitive) or first one
        const defKey = Object.keys(expressions).find(k => k.toLowerCase() === 'default');
        const def = defKey ? expressions[defKey] : (exprList[0] || {});

        // Map common fields for compatibility
        return {
          ...c,
          avatar_url: def.avatar_url || '',
          image_url: def.full_url || '',  // For EventPage
          full_url: def.full_url || '',    // For Editor
          expressions,
          expressionList: exprList
        };
      });
    } catch (err) {
      console.warn('Failed to enrich characters with expressions:', err);
      return characters;
    }
  },

  async getCharacters() {
    if (USE_MOCK_DB) return this._enrichCharactersWithExpressions([...mockDatabase.characters]);
    const { data, error } = await supabase.from('characters').select('*');
    if (error) throw error;
    return this._enrichCharactersWithExpressions(data || []);
  },

  async getCharacter(characterId) {
    if (USE_MOCK_DB)
      return mockDatabase.characters.find(c => c.character_id === characterId) || null;
    const { data, error } = await supabase.from('characters').select('*').eq('character_id', characterId).limit(1);
    if (error) throw error;
    return data?.[0] || null;
  },

  async createCharacter(payload) {
    const { expressions, ...charData } = payload;

    // Determine the character identifier, prioritizing 'id' then 'character_id' then 'asset_id'
    const charId = payload.character_id;

    if (USE_MOCK_DB) {
      const newItem = {
        id: genNumericId(),
        character_id: charId || genId('char'),
        name: charData.name,
        description: charData.description
      };
      mockDatabase.characters.push(newItem);

      if (expressions?.length) {
        expressions.forEach(e => {
          mockDatabase.character_expressions.push({
            id: genNumericId(),
            character_id: newItem.character_id,
            name: e.name,
            avatar_url: e.avatar_url,
            full_url: e.full_url
          });
        });
      }
      return { ...newItem, expressions: expressions || [] };
    }

    if (!charId) {
      throw new Error('Character ID (identifier) is required but was not provided.');
    }

    // For real Supabase, we map the custom ID
    const dbPayload = {
      character_id: charId,
      name: charData.name || charId,
      description: charData.description || ''
    };

    console.log('Inserting character with payload:', dbPayload);

    const { data: char, error } = await supabase.from('characters').insert(dbPayload).select().single();
    if (error) {
      console.error('Supabase Character Insert Error:', error);
      throw error;
    }

    if (expressions?.length) {
      const exprData = expressions.map(e => ({
        character_id: char.character_id,
        name: e.name,
        avatar_url: e.avatar_url,
        full_url: e.full_url
      }));
      const { error: exprErr } = await supabase.from('character_expressions').insert(exprData);
      if (exprErr) throw exprErr;
    }

    return char;
  },

  async updateCharacter(characterId, payload) {
    if (USE_MOCK_DB) {
      const idx = mockDatabase.characters.findIndex(c => c.character_id === characterId);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.characters[idx], payload);
      return mockDatabase.characters[idx];
    }
    const { data, error } = await supabase.from('characters').update(payload).eq('character_id', characterId).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async deleteCharacter(characterId) {
    if (USE_MOCK_DB) {
      mockDatabase.characters = mockDatabase.characters.filter(c => c.character_id !== characterId);
      return;
    }
    console.log(`Starting deletion for character: ${characterId}`);

    // 1. Delete associated references in event_characters (join table)
    try {
        await supabase.from('event_characters').delete().eq('character_id', characterId);
    } catch (err) {
        console.warn('Warning: Failed to clean up event_characters:', err.message);
    }

    // 2. Clean up GitHub files for all expressions (non-blocking)
    const expressions = await this.getExpressionsByCharacter(characterId);
    if (expressions.length > 0) {
        console.log(`Cleaning up files for ${expressions.length} expressions...`);
        for (const expr of expressions) {
            // We only need to clean up files here, DB cleanup is bulked later
            const urls = [expr.avatar_url, expr.full_url].filter(Boolean);
            for (const url of urls) {
                try {
                    const res = await deleteFileFromGithub(url);
                    if (!res.success) {
                        console.warn(`GitHub cleanup skipped/failed: ${url} (ignoring for character delete)`);
                    }
                } catch (e) {
                    console.warn(`GitHub process failed: ${url} (ignoring)`);
                }
            }
        }
    }

    // 3. Bulk delete all expressions from DB
    console.log(`Executing bulk DB delete for expressions: ${characterId}`);
    const { error: exprDelErr } = await supabase.from('character_expressions').delete().eq('character_id', characterId);
    if (exprDelErr) throw exprDelErr;

    // 4. Verification: Check if expressions are actually gone (RLS might silently fail)
    const { count, error: checkErr } = await supabase.from('character_expressions')
        .select('*', { count: 'exact', head: true })
        .eq('character_id', characterId);
    
    if (!checkErr && count > 0) {
        throw new Error(`DB Policy Violation: Found ${count} expressions remaining for "${characterId}". The "anon" key used by the app likely lacks "DELETE" permissions on "character_expressions", even if you can delete them from the Supabase dashboard. Please enable the "DELETE" policy for this table.`);
    }
    
    // 5. Delete character
    console.log(`Deleting character record: ${characterId}`);
    const { error } = await supabase.from('characters').delete().eq('character_id', characterId);
    if (error) throw error;
  },

  /** Fetch characters for an event (via event_characters join table) */
  async getCharactersByEvent(eventId) {
    if (USE_MOCK_DB) {
      if (!mockDatabase.event_characters) return [];
      const links = mockDatabase.event_characters.filter(ec => ec.event_id === eventId);
      const results = links.map(link => {
        const char = mockDatabase.characters.find(c => c.character_id === link.character_id);
        return { ...char, ...link };
      });
      return this._enrichCharactersWithExpressions(results);
    }

    const { data, error } = await supabase
      .from('event_characters')
      .select('*, characters(*)')
      .eq('event_id', eventId);
    if (error) throw error;

    const characters = (data || []).map(row => ({
      ...row.characters,
      ...row
    }));

    return this._enrichCharactersWithExpressions(characters);
  },

  // ===========================================================================
  // CHARACTER EXPRESSIONS
  // ===========================================================================
  async getExpressionsByCharacter(characterId) {
    if (USE_MOCK_DB)
      return mockDatabase.character_expressions.filter(e => e.character_id === characterId);
    const { data, error } = await supabase.from('character_expressions').select('*').eq('character_id', characterId);
    if (error) throw error;
    return data || [];
  },

  /**
   * Batch fetch expressions for multiple characters.
   * Returns a map: character_id -> array of expressions
   * @param {string[]} characterIds
   */
  async getExpressionsByCharacters(characterIds) {
    if (!characterIds?.length) return {};
    if (USE_MOCK_DB) {
      const rows = mockDatabase.character_expressions.filter(e => characterIds.includes(e.character_id));
      const map = {};
      for (const r of rows) {
        map[r.character_id] = map[r.character_id] || [];
        map[r.character_id].push(r);
      }
      return map;
    }
    const unique = [...new Set(characterIds)];
    const { data, error } = await supabase.from('character_expressions').select('*').in('character_id', unique);
    if (error) throw error;
    const map = {};
    (data || []).forEach(r => {
      map[r.character_id] = map[r.character_id] || [];
      map[r.character_id].push(r);
    });
    return map;
  },

  async createExpression(payload) {
    if (USE_MOCK_DB) {
      const maxId = Math.max(0, ...mockDatabase.character_expressions.map(e => e.id));
      const newItem = { id: maxId + 1, ...payload };
      mockDatabase.character_expressions.push(newItem);
      return newItem;
    }
    const { data, error } = await supabase.from('character_expressions').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateExpression(characterId, name, payload) {
    if (USE_MOCK_DB) {
      const idx = mockDatabase.character_expressions.findIndex(e => e.character_id === characterId && e.name === name);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.character_expressions[idx], payload);
      return mockDatabase.character_expressions[idx];
    }
    const { data, error } = await supabase.from('character_expressions')
        .update(payload)
        .match({ character_id: characterId, name: name })
        .select()
        .single();
    if (error) throw error;
    return data;
  },

  async deleteExpression(characterId, name, forceDbDelete = false) {
    if (USE_MOCK_DB) {
      mockDatabase.character_expressions = mockDatabase.character_expressions.filter(e => !(e.character_id === characterId && e.name === name));
      return;
    }
    // 1. Fetch URLs for GitHub deletion
    const { data: expr } = await supabase.from('character_expressions')
        .select('*')
        .match({ character_id: characterId, name: name })
        .maybeSingle();
    if (expr) {
        const urls = [expr.avatar_url, expr.full_url].filter(Boolean);
        for (const url of urls) {
            try {
                const res = await deleteFileFromGithub(url);
                if (!res.success) {
                    const errTxt = String(res.error || '').toLowerCase();
                    const isAlreadyGone = errTxt.includes('404') || errTxt.includes('not found') || errTxt.includes('not exist');
                    if (!isAlreadyGone) {
                        if (forceDbDelete) {
                            console.warn(`GitHub delete failed (ignored): ${url} - ${res.error}`);
                        } else {
                            throw new Error(`GitHub delete failed for ${url}: ${res.error}`);
                        }
                    } else {
                        console.warn(`GitHub file already missing, allowing DB delete: ${url}`);
                    }
                }
            } catch (err) {
                if (forceDbDelete) {
                    console.warn(`GitHub delete process failed (ignored): ${url} - ${err.message}`);
                } else {
                    throw err;
                }
            }
        }
    }
    // 2. Delete from DB
    const { error } = await supabase.from('character_expressions')
        .delete()
        .match({ character_id: characterId, name: name });
    if (error) throw error;
  },

  // ===========================================================================
  // ASSETS
  // ===========================================================================
  async getAssets() {
    if (USE_MOCK_DB) return [...mockDatabase.assets];
    const { data, error } = await supabase.from('assets').select('*');
    if (error) throw error;
    return data || [];
  },

  async getAssetsByCategory(category) {
    if (USE_MOCK_DB)
      return mockDatabase.assets.filter(a => a.category === category);
    const { data, error } = await supabase.from('assets').select('*').eq('category', category);
    if (error) throw error;
    return data || [];
  },

  async getAssetsByType(type) {
    if (USE_MOCK_DB)
      return mockDatabase.assets.filter(a => a.type === type);
    const { data, error } = await supabase.from('assets').select('*').eq('type', type);
    if (error) throw error;
    return data || [];
  },

  async getAsset(assetId) {
    if (USE_MOCK_DB)
      return mockDatabase.assets.find(a => a.asset_id === assetId) || null;
    const { data, error } = await supabase.from('assets').select('*').eq('asset_id', assetId).limit(1);
    if (error) throw error;
    return data?.[0] || null;
  },

  async createAsset(payload) {
    if (USE_MOCK_DB) {
      if (mockDatabase.assets.find(a => a.asset_id === payload.asset_id)) throw new Error('duplicate-asset');
      const newItem = { ...payload };
      mockDatabase.assets.push(newItem);
      return newItem;
    }
    const { data, error } = await supabase.from('assets').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateAsset(assetId, payload) {
    if (USE_MOCK_DB) {
      const idx = mockDatabase.assets.findIndex(a => a.asset_id === assetId);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.assets[idx], payload);
      return mockDatabase.assets[idx];
    }
    const { data, error } = await supabase.from('assets').update(payload).eq('asset_id', assetId).select().single();
    if (error) throw error;
    return data;
  },

  async deleteAsset(assetId) {
    if (USE_MOCK_DB) {
      mockDatabase.assets = mockDatabase.assets.filter(a => a.asset_id !== assetId);
      return;
    }
    // 1. Fetch asset to get URL for GitHub deletion
    const { data: asset } = await supabase.from('assets').select('url').eq('asset_id', assetId).single();
    if (asset?.url) {
      const res = await deleteFileFromGithub(asset.url);
      if (!res.success) {
        const errTxt = String(res.error || '').toLowerCase();
        const isAlreadyGone = errTxt.includes('404') || errTxt.includes('not found') || errTxt.includes('not exist');
        if (!isAlreadyGone) {
          throw new Error(`GitHub delete failed: ${res.error}`);
        }
        console.warn(`GitHub file already missing, allowing DB delete: ${asset.url}`);
      }
    }
    // 2. Delete from DB
    const { error } = await supabase.from('assets').delete().eq('asset_id', assetId);
    if (error) throw error;
  },

  // ===========================================================================
  // GALLERY
  // ===========================================================================
  async getGalleryByEvent(eventId) {
    if (USE_MOCK_DB) {
      if (!mockDatabase.gallery) return [];
      return sortByOrder(mockDatabase.gallery.filter(g => g.event_id === eventId));
    }
    const { data, error } = await supabase.from('gallery').select('*').eq('event_id', eventId).order('display_order');
    if (error) throw error;
    return data || [];
  },

  async getAllGallery() {
    if (USE_MOCK_DB) {
      return [...(mockDatabase.gallery || [])];
    }
    const { data, error } = await supabase.from('gallery').select('*');
    if (error) throw error;
    return data || [];
  },

  async createGallery(payload) {
    const galleryId = payload.gallery_id || payload.asset_id || payload.id;
    if (USE_MOCK_DB) {
      const existingIdx = (mockDatabase.gallery || []).findIndex(g => g.gallery_id === galleryId);
      const newItem = {
        id: existingIdx >= 0 ? mockDatabase.gallery[existingIdx].id : genNumericId(),
        gallery_id: galleryId || genId('gallery'),
        display_order: payload.display_order || 0,
        event_id: payload.event_id || null,
        title: payload.title,
        image_url: payload.image_url || '',
      };
      if (existingIdx >= 0) mockDatabase.gallery[existingIdx] = newItem;
      else mockDatabase.gallery.push(newItem);
      return newItem;
    }

    const dbPayload = {
      gallery_id: galleryId,
      event_id: payload.event_id,
      title: payload.title,
      image_url: payload.image_url,
      display_order: payload.display_order || 0
    };

    const { data, error } = await supabase.from('gallery')
      .upsert(dbPayload, { onConflict: 'gallery_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteGallery(galleryId) {
    if (USE_MOCK_DB) {
      if (!mockDatabase.gallery) return;
      mockDatabase.gallery = mockDatabase.gallery.filter(g => g.gallery_id !== galleryId);
      return;
    }
    // 1. Fetch asset to get URL for GitHub deletion
    const { data: gallery } = await supabase.from('gallery').select('image_url').eq('gallery_id', galleryId).single();
    if (gallery?.image_url) {
      const res = await deleteFileFromGithub(gallery.image_url);
      if (!res.success) {
        const errTxt = String(res.error || '').toLowerCase();
        const isAlreadyGone = errTxt.includes('404') || errTxt.includes('not found') || errTxt.includes('not exist');
        if (!isAlreadyGone) {
          throw new Error(`GitHub delete failed: ${res.error}`);
        }
        console.warn(`GitHub file already missing, allowing DB delete: ${gallery.image_url}`);
      }
    }
    // 2. Delete from DB
    const { error } = await supabase.from('gallery').delete().eq('gallery_id', galleryId);
    if (error) throw error;
  },

  async updateGallery(galleryId, payload) {
    if (USE_MOCK_DB) {
      const idx = mockDatabase.gallery.findIndex(g => g.gallery_id === galleryId);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.gallery[idx], payload);
      return mockDatabase.gallery[idx];
    }
    const { data, error } = await supabase.from('gallery')
        .update(payload)
        .eq('gallery_id', galleryId)
        .select()
        .single();
    if (error) throw error;
    return data;
  },

  // ===========================================================================
  // SUGGESTIONS
  // ===========================================================================
  async getSuggestionsByArc(arcId) {
    if (USE_MOCK_DB) return []; // no mock data for suggestions
    const { data, error } = await supabase.from('suggestions').select('*').eq('arc_id', arcId).order('position');
    if (error) throw error;
    return data || [];
  },

  async getSuggestedEvents(arcId) {
    const suggestions = await this.getSuggestionsByArc(arcId);
    if (!suggestions.length) return [];
    const events = [];
    for (const s of suggestions) {
      const ev = await this.getEvent(s.target_event_id);
      if (ev) events.push({ ...ev, suggestion_position: s.position, suggestion_id: s.id });
    }
    return events;
  },

  async createSuggestion(payload) {
    if (USE_MOCK_DB) {
      const newItem = { id: genNumericId(), position: 0, ...payload };
      if (!mockDatabase.suggestions) mockDatabase.suggestions = [];
      mockDatabase.suggestions.push(newItem);
      return newItem;
    }
    const { data, error } = await supabase.from('suggestions').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async deleteSuggestion(id) {
    if (USE_MOCK_DB) {
      if (!mockDatabase.suggestions) return;
      mockDatabase.suggestions = mockDatabase.suggestions.filter(s => s.id !== id);
      return;
    }
    const { error } = await supabase.from('suggestions').delete().eq('id', id);
    if (error) throw error;
  },

  async updateSuggestion(id, payload) {
    if (USE_MOCK_DB) {
      const idx = mockDatabase.suggestions.findIndex(s => s.id === id);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.suggestions[idx], payload);
      return mockDatabase.suggestions[idx];
    }
    const { data, error } = await supabase.from('suggestions').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  /** Batch sync suggestions for an arc */
  async saveSuggestions(arcId, targetEventIds) {
    if (USE_MOCK_DB) {
      if (!mockDatabase.suggestions) mockDatabase.suggestions = [];
      const existing = mockDatabase.suggestions.filter(s => s.arc_id === arcId);
      const existingMap = Object.fromEntries(existing.map(s => [s.target_event_id, s]));
      const newEventSet = new Set(targetEventIds);

      // Remove suggestions that are no longer in the list
      mockDatabase.suggestions = mockDatabase.suggestions.filter(
        s => s.arc_id !== arcId || newEventSet.has(s.target_event_id)
      );

      // Update positions or insert new items
      const result = [];
      targetEventIds.forEach((eid, idx) => {
        const pos = idx + 1;
        if (existingMap[eid]) {
          const item = mockDatabase.suggestions.find(s => s.arc_id === arcId && s.target_event_id === eid);
          if (item) {
            item.position = pos;
            result.push(item);
          }
        } else {
          const newItem = { id: genNumericId(), arc_id: arcId, target_event_id: eid, position: pos };
          mockDatabase.suggestions.push(newItem);
          result.push(newItem);
        }
      });
      return result;
    }

    // 1. Fetch current suggestions for this arc
    const { data: current } = await supabase.from('suggestions').select('id, target_event_id').eq('arc_id', arcId);
    const existingMap = Object.fromEntries((current || []).map(s => [s.target_event_id, s.id]));
    const newEventSet = new Set(targetEventIds);

    // 2. Delete suggestions that are no longer in the list
    const idsToDelete = (current || [])
      .filter(s => !newEventSet.has(s.target_event_id))
      .map(s => s.id);
    if (idsToDelete.length) {
      await supabase.from('suggestions').delete().in('id', idsToDelete);
    }

    // 3. Upsert (insert new, update existing position)
    const rows = targetEventIds.map((eid, idx) => ({
      ...(existingMap[eid] ? { id: existingMap[eid] } : {}),
      arc_id: arcId,
      target_event_id: eid,
      position: idx + 1
    }));
    const { data, error } = await supabase.from('suggestions').insert(rows).select();
    if (error) throw error;
    return data;
  },

  // ===========================================================================
  // EVENT CHARACTERS
  // ===========================================================================

  async addCharacterToEvent(eventId, characterId) {
    if (USE_MOCK_DB) {
      if (!mockDatabase.event_characters) mockDatabase.event_characters = [];
      const exists = mockDatabase.event_characters.find(ec => ec.event_id === eventId && ec.character_id === characterId);
      if (exists) return exists;

      const newItem = { event_id: eventId, character_id: characterId };
      mockDatabase.event_characters.push(newItem);
      return newItem;
    }
    const { data, error } = await supabase.from('event_characters').insert({ event_id: eventId, character_id: characterId }).select().single();
    if (error) throw error;
    return data;
  },

  async removeCharacterFromEvent(eventId, characterId) {
    if (USE_MOCK_DB) {
      if (!mockDatabase.event_characters) return;
      mockDatabase.event_characters = mockDatabase.event_characters.filter(ec => !(ec.event_id === eventId && ec.character_id === characterId));
      return;
    }
    const { error } = await supabase.from('event_characters').delete().eq('event_id', eventId).eq('character_id', characterId);
    if (error) throw error;
  },

  async updateEventCharacter(eventId, characterId, payload) {
    if (USE_MOCK_DB) {
      const idx = mockDatabase.event_characters.findIndex(ec => ec.event_id === eventId && ec.character_id === characterId);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.event_characters[idx], payload);
      return mockDatabase.event_characters[idx];
    }
    const { data, error } = await supabase
      .from('event_characters')
      .update(payload)
      .eq('event_id', eventId)
      .eq('character_id', characterId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ===========================================================================
  // BATCH HELPERS  (used by storyParser.js for bulk ID→URL resolution)
  // ===========================================================================
  /**
   * Fetch multiple assets by asset_id in one query.
   * @param {string[]} assetIds
   * @returns {Object} Map: asset_id → asset row
   */
  async getAssetsByIds(assetIds) {
    if (!assetIds?.length) return {};
    if (USE_MOCK_DB) {
      const assets = mockDatabase.assets
        .filter(a => assetIds.includes(a.asset_id))
        .map(a => [a.asset_id, a]);
      
      const gallery = (mockDatabase.gallery || [])
        .filter(g => assetIds.includes(g.gallery_id))
        .map(g => [g.gallery_id, { 
          asset_id: g.gallery_id, 
          url: g.image_url, 
          name: g.title, 
          type: 'image', 
          category: 'gallery' 
        }]);

      return Object.fromEntries([...assets, ...gallery]);
    }

    const unique = [...new Set(assetIds)];
    
    // Query both tables in parallel
    const [assetRes, galleryRes] = await Promise.all([
      supabase.from('assets').select('*').in('asset_id', unique),
      supabase.from('gallery').select('*').in('gallery_id', unique)
    ]);

    if (assetRes.error) throw assetRes.error;
    if (galleryRes.error) throw galleryRes.error;

    const assetMap = Object.fromEntries((assetRes.data || []).map(a => [a.asset_id, a]));
    const galleryMap = Object.fromEntries((galleryRes.data || []).map(g => [
      g.gallery_id, 
      { 
        asset_id: g.gallery_id, 
        url: g.image_url, 
        name: g.title, 
        type: 'image', 
        category: 'gallery' 
      }
    ]));

    // Merge: asset table takes priority if IDs collide
    return { ...galleryMap, ...assetMap };
  },

  /**
   * Fetch multiple characters + their default expression in one batch.
   * @param {string[]} characterIds
   * @returns {Object} Map: character_id → { character_id, name, avatar_url, full_url }
   */
  async getCharactersWithExpressionsByIds(characterIds) {
    if (!characterIds?.length) return {};
    if (USE_MOCK_DB) {
      const map = {};
      mockDatabase.characters
        .filter(c => characterIds.includes(c.character_id))
        .forEach(c => {
          const exprs = mockDatabase.character_expressions.filter(e => e.character_id === c.character_id);
          const def = exprs.find(e => e.name?.toLowerCase() === 'default') || exprs[0] || {};

          // Build expressions map
          const expressions = {};
          exprs.forEach(e => {
            expressions[e.name] = { avatar_url: e.avatar_url, full_url: e.full_url };
          });

          map[c.character_id] = {
            character_id: c.character_id,
            name: c.name,
            avatar_url: def.avatar_url || '',
            full_url: def.full_url || '',
            expressions
          };
        });
      return map;
    }
    const unique = [...new Set(characterIds)];
    const [charRes, exprRes] = await Promise.all([
      supabase.from('characters').select('*').in('character_id', unique),
      supabase.from('character_expressions').select('*').in('character_id', unique),
    ]);
    if (charRes.error) throw charRes.error;
    if (exprRes.error) throw exprRes.error;

    const exprMap = {};
    (exprRes.data || []).forEach(e => {
      (exprMap[e.character_id] = exprMap[e.character_id] || []).push(e);
    });

    return Object.fromEntries(
      (charRes.data || []).map(c => {
        const exprs = exprMap[c.character_id] || [];
        const def = exprs.find(e => e.name?.toLowerCase() === 'default') || exprs[0] || {};

        const expressions = {};
        exprs.forEach(e => {
          expressions[e.name] = { avatar_url: e.avatar_url, full_url: e.full_url };
        });

        return [c.character_id, {
          character_id: c.character_id,
          name: c.name,
          avatar_url: def.avatar_url || '',
          full_url: def.full_url || '',
          expressions
        }];
      })
    );
  },
};

// Proxy to wrap all SupabaseAPI methods with auth error handling
export const SupabaseAPI = new Proxy(SupabaseAPI_Raw, {
  get(target, prop) {
    const original = target[prop];
    if (typeof original === 'function') {
      return async (...args) => {
        try {
          return await original.apply(target, args);
        } catch (err) {
          return handleAuthError(err);
        }
      };
    }
    return original;
  }
});

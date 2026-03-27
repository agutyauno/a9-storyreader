import { supabase } from './supabaseClient';
import { mockDatabase } from '../utils/mockStoryData';

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
const genId = (prefix) => `${prefix}_${Date.now()}`;

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
    const { data, error } = await supabase.from('regions').update(payload).eq('region_id', regionId).select().single();
    if (error) throw error;
    return data;
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
    const { data, error } = await supabase.from('arcs').update(payload).eq('arc_id', arcId).select().single();
    if (error) throw error;
    return data;
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
    const { data, error } = await supabase.from('events').update(payload).eq('event_id', eventId).select().single();
    if (error) throw error;
    return data;
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
    const { data, error } = await supabase.from('stories').update(payload).eq('story_id', storyId).select().single();
    if (error) throw error;
    return data;
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
  async getCharacters() {
    if (USE_MOCK_DB) return [...mockDatabase.characters];
    const { data, error } = await supabase.from('characters').select('*');
    if (error) throw error;
    return data || [];
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
    if (USE_MOCK_DB) {
      const newItem = { 
        id: Math.max(0, ...mockDatabase.characters.map(c => c.id || 0)) + 1,
        character_id: charData.id || genId('char'), 
        name: charData.name,
        description: charData.description 
      };
      mockDatabase.characters.push(newItem);
      
      if (expressions?.length) {
        expressions.forEach(e => {
          mockDatabase.charater_expressions.push({
            id: Math.max(0, ...mockDatabase.charater_expressions.map(ex => ex.id || 0)) + 1,
            character_id: newItem.character_id,
            name: e.name,
            avatar_url: e.avatar_url,
            full_url: e.full_url
          });
        });
      }
      return newItem;
    }
    
    // For real Supabase, we transform 'id' from formData to 'character_id'
    const dbPayload = {
      character_id: charData.id,
      name: charData.name,
      description: charData.description
    };
    
    const { data: char, error } = await supabase.from('characters').insert(dbPayload).select().single();
    if (error) throw error;
    
    if (expressions?.length) {
      const exprData = expressions.map(e => ({ 
        character_id: char.character_id,
        name: e.name,
        avatar_url: e.avatar_url,
        full_url: e.full_url
      }));
      const { error: exprErr } = await supabase.from('charater_expressions').insert(exprData);
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
    const { data, error } = await supabase.from('characters').update(payload).eq('character_id', characterId).select().single();
    if (error) throw error;
    return data;
  },

  async deleteCharacter(characterId) {
    if (USE_MOCK_DB) {
      mockDatabase.characters = mockDatabase.characters.filter(c => c.character_id !== characterId);
      return;
    }
    const { error } = await supabase.from('characters').delete().eq('character_id', characterId);
    if (error) throw error;
  },

  /** Fetch characters for an event (via event_characters join table) */
  async getCharactersByEvent(eventId) {
    if (USE_MOCK_DB) {
      if (!mockDatabase.event_characters) return [];
      const ec = mockDatabase.event_characters.filter(ec => ec.event_id === eventId);
      return sortByOrder(ec);
    }
    const { data: ec, error: ecErr } = await supabase
      .from('event_characters').select('character_id').eq('event_id', eventId);
    if (ecErr) throw ecErr;
    if (!ec?.length) return [];
    const ids = ec.map(r => r.character_id);
    const { data, error } = await supabase.from('characters').select('*').in('character_id', ids);
    if (error) throw error;
    return data || [];
  },

  // ===========================================================================
  // CHARACTER EXPRESSIONS
  // ===========================================================================
  async getExpressionsByCharacter(characterId) {
    if (USE_MOCK_DB)
      return mockDatabase.charater_expressions.filter(e => e.character_id === characterId);
    const { data, error } = await supabase.from('charater_expressions').select('*').eq('character_id', characterId);
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
      const rows = mockDatabase.charater_expressions.filter(e => characterIds.includes(e.character_id));
      const map = {};
      for (const r of rows) {
        map[r.character_id] = map[r.character_id] || [];
        map[r.character_id].push(r);
      }
      return map;
    }
    const unique = [...new Set(characterIds)];
    const { data, error } = await supabase.from('charater_expressions').select('*').in('character_id', unique);
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
      const maxId = Math.max(0, ...mockDatabase.charater_expressions.map(e => e.id));
      const newItem = { id: maxId + 1, ...payload };
      mockDatabase.charater_expressions.push(newItem);
      return newItem;
    }
    const { data, error } = await supabase.from('charater_expressions').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateExpression(id, payload) {
    if (USE_MOCK_DB) {
      const idx = mockDatabase.charater_expressions.findIndex(e => e.id === id);
      if (idx < 0) throw new Error('not-found');
      Object.assign(mockDatabase.charater_expressions[idx], payload);
      return mockDatabase.charater_expressions[idx];
    }
    const { data, error } = await supabase.from('charater_expressions').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteExpression(id) {
    if (USE_MOCK_DB) {
      mockDatabase.charater_expressions = mockDatabase.charater_expressions.filter(e => e.id !== id);
      return;
    }
    const { error } = await supabase.from('charater_expressions').delete().eq('id', id);
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

  async createGallery(payload) {
    if (USE_MOCK_DB) {
      const newItem = { 
        id: Math.max(0, ...mockDatabase.gallery.map(g => g.id || 0)) + 1,
        gallery_id: payload.id || genId('gallery'), 
        display_order: payload.displayOrder || 0,
        event_id: payload.event_id || null,
        title: payload.name,
        image_url: payload.imageUrl || '',
        description: payload.description || '' // Note: schema says title, maybe add description to DB later?
      };
      mockDatabase.gallery.push(newItem);
      return newItem;
    }
    
    const dbPayload = {
      gallery_id: payload.id,
      event_id: payload.event_id,
      title: payload.name,
      image_url: payload.imageUrl,
      display_order: payload.displayOrder || 0
    };
    
    const { data, error } = await supabase.from('gallery').insert(dbPayload).select().single();
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
      if (ev) events.push({ ...ev, suggestion_position: s.position });
    }
    return events;
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
      return Object.fromEntries(
        mockDatabase.assets
          .filter(a => assetIds.includes(a.asset_id))
          .map(a => [a.asset_id, a])
      );
    }
    const unique = [...new Set(assetIds)];
    const { data, error } = await supabase.from('assets').select('*').in('asset_id', unique);
    if (error) throw error;
    return Object.fromEntries((data || []).map(a => [a.asset_id, a]));
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
          const exprs = mockDatabase.charater_expressions.filter(e => e.character_id === c.character_id);
          const def = exprs.find(e => e.name === 'default') || exprs[0] || {};
          
          // Build expressions map
          const expressions = {};
          exprs.forEach(e => {
            expressions[e.name] = { avatar_url: e.avatar_url, full_url: e.full_url };
          });

          map[c.character_id] = {
            character_id: c.character_id,
            name: c.name,
            avatar_url: def.avatar_url || '',
            full_url:   def.full_url   || '',
            expressions
          };
        });
      return map;
    }
    const unique = [...new Set(characterIds)];
    const [charRes, exprRes] = await Promise.all([
      supabase.from('characters').select('*').in('character_id', unique),
      supabase.from('charater_expressions').select('*').in('character_id', unique),
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
        const def = exprs.find(e => e.name === 'default') || exprs[0] || {};
        
        const expressions = {};
        exprs.forEach(e => {
          expressions[e.name] = { avatar_url: e.avatar_url, full_url: e.full_url };
        });

        return [c.character_id, {
          character_id: c.character_id,
          name:       c.name,
          avatar_url: def.avatar_url || '',
          full_url:   def.full_url   || '',
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

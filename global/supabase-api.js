/* ================================================================================================= */
/* Supabase API Service */
/* ================================================================================================= */

/**
 * API service for fetching data from Supabase
 * Requires supabase-client.js to be loaded first
 */
const SupabaseAPI = {
	// ============= Regions =============
	/**
	 * Get all regions ordered by display_order
	 * @returns {Promise<Array>}
	 */
	async getRegions() {
		const supabase = window.supabaseClient;
		if (!supabase) return [];
		const { data, error } = await supabase.from('regions').select('*').order('display_order', { ascending: true });
		if (error) throw error;
		return data || [];
	},

	/**
	 * Get a single region by region_id
	 * @param {string} regionId
	 * @returns {Promise<Object|null>}
	 */
	async getRegion(regionId) {
		const supabase = window.supabaseClient;
		if (!supabase) return null;
		const { data, error } = await supabase.from('regions').select('*').eq('region_id', regionId).limit(1);
		if (error) throw error;
		return Array.isArray(data) && data.length > 0 ? data[0] : null;
	},

	// ============= Arcs =============
	/**
	 * Get all arcs for a region
	 * @param {string} regionId
	 * @returns {Promise<Array>}
	 */
	async getArcsByRegion(regionId) {
		const supabase = window.supabaseClient;
		if (!supabase) return [];
		const { data, error } = await supabase.from('arcs').select('*').eq('region_id', regionId).order('display_order', { ascending: true });
		if (error) throw error;
		return data || [];
	},

	/**
	 * Get a single arc by arc_id
	 * @param {string} arcId
	 * @returns {Promise<Object|null>}
	 */
	async getArc(arcId) {
		const supabase = window.supabaseClient;
		if (!supabase) return null;
		const { data, error } = await supabase.from('arcs').select('*').eq('arc_id', arcId).limit(1);
		if (error) throw error;
		return Array.isArray(data) && data.length > 0 ? data[0] : null;
	},

	// ============= Events =============
	/**
	 * Get all events for an arc
	 * @param {string} arcId
	 * @returns {Promise<Array>}
	 */
	async getEventsByArc(arcId) {
		const supabase = window.supabaseClient;
		if (!supabase) return [];
		const { data, error } = await supabase.from('events').select('*').eq('arc_id', arcId).order('display_order', { ascending: true });
		if (error) throw error;
		return data || [];
	},

	/**
	 * Get a single event by event_id
	 * @param {string} eventId
	 * @returns {Promise<Object|null>}
	 */
	async getEvent(eventId) {
		const supabase = window.supabaseClient;
		if (!supabase) return null;
		const { data, error } = await supabase.from('events').select('*').eq('event_id', eventId).limit(1);
		if (error) throw error;
		return Array.isArray(data) && data.length > 0 ? data[0] : null;
	},

	// ============= Stories =============
	/**
	 * Get all stories for an event
	 * @param {string} eventId
	 * @returns {Promise<Array>}
	 */
	async getStoriesByEvent(eventId) {
		const supabase = window.supabaseClient;
		if (!supabase) return [];
		const { data, error } = await supabase.from('stories').select('*').eq('event_id', eventId).order('display_order', { ascending: true });
		if (error) throw error;
		return data || [];
	},

	/**
	 * Get a single story by story_id
	 * @param {string} storyId
	 * @returns {Promise<Object|null>}
	 */
	async getStory(storyId) {
		const supabase = window.supabaseClient;
		if (!supabase) return null;
		const { data, error } = await supabase.from('stories').select('*').eq('story_id', storyId).limit(1);
		if (error) throw error;
		return Array.isArray(data) && data.length > 0 ? data[0] : null;
	},

	// ============= Characters =============
	/**
	 * Get all characters
	 * @returns {Promise<Array>}
	 */
	async getCharacters() {
		const supabase = window.supabaseClient;
		if (!supabase) return [];
		const { data, error } = await supabase.from('characters').select('*');
		if (error) throw error;
		return data || [];
	},

	/**
	 * Get a single character by character_id
	 * @param {string} characterId
	 * @returns {Promise<Object|null>}
	 */
	async getCharacter(characterId) {
		const supabase = window.supabaseClient;
		if (!supabase) return null;
		const { data, error } = await supabase.from('characters').select('*').eq('character_id', characterId).limit(1);
		if (error) throw error;
		return Array.isArray(data) && data.length > 0 ? data[0] : null;
	},

	/**
	 * Get characters for an event (via event_characters junction table)
	 * @param {string} eventId
	 * @returns {Promise<Array>}
	 */
	async getCharactersByEvent(eventId) {
		// First get the character IDs from event_characters
		const supabase = window.supabaseClient;
		if (!supabase) return [];
		const { data: eventCharacters, error: evErr } = await supabase.from('event_characters').select('character_id').eq('event_id', eventId);
		if (evErr) throw evErr;

		if (!eventCharacters || eventCharacters.length === 0) return [];

		const characterIds = eventCharacters.map(ec => ec.character_id);

		// Fetch base character rows
		const { data: characters, error: chErr } = await supabase.from('characters').select('*').in('character_id', characterIds);
		if (chErr) throw chErr;

		// Fetch expressions for these characters
		const { data: expressions, error: exprErr } = await supabase.from('charater_expressions').select('*').in('character_id', characterIds);
		if (exprErr) throw exprErr;

		// Build map of default expression (or first) per character_id
		const exprMap = {};
		if (expressions && expressions.length > 0) {
			expressions.forEach(e => {
				if (!exprMap[e.character_id]) exprMap[e.character_id] = [];
				exprMap[e.character_id].push(e);
			});

			for (const cid of Object.keys(exprMap)) {
				const list = exprMap[cid];
				// prefer name === 'default'
				let chosen = list.find(x => x.name === 'default') || list[0];
				exprMap[cid] = chosen;
			}
		}

		// Merge avatar/full into character objects for convenience
		const merged = (characters || []).map(c => {
			const e = exprMap[c.character_id];
			return {
				...c,
				avatar_url: e ? (e.avatar_url || '') : '',
				image_url: e ? (e.full_url || '') : ''
			};
		});

		return merged;
	},

	// ============= Gallery =============
	/**
	 * Get gallery items for an event
	 * @param {string} eventId
	 * @returns {Promise<Array>}
	 */
	async getGalleryByEvent(eventId) {
		const supabase = window.supabaseClient;
		if (!supabase) return [];
		const { data, error } = await supabase.from('gallery').select('*').eq('event_id', eventId).order('display_order', { ascending: true });
		if (error) throw error;
		return data || [];
	},

	// ============= Suggestions =============
	/**
	 * Get all suggestions for an arc, ordered by position
	 * @param {string} arcId
	 * @returns {Promise<Array>}
	 */
	async getSuggestionsByArc(arcId) {
		const supabase = window.supabaseClient;
		if (!supabase) return [];
		const { data, error } = await supabase.from('suggestions').select('*').eq('arc_id', arcId).order('position', { ascending: true });
		if (error) throw error;
		return data || [];
	},

	/**
	 * Get the suggested events for an arc
	 * @param {string} arcId
	 * @returns {Promise<Array>}
	 */
	async getSuggestedEvents(arcId) {
		const suggestions = await this.getSuggestionsByArc(arcId);
		if (suggestions.length === 0) return [];

		const events = [];
		for (const suggestion of suggestions) {
			const event = await this.getEvent(suggestion.target_event_id);
			if (event) {
				events.push({ ...event, suggestion_position: suggestion.position });
			}
		}
		return events;
	},

	// ============= Character Expressions =============
	/**
	 * Get all expressions for a character
	 * @param {string} characterId
	 * @returns {Promise<Array>}
	 */
	async getExpressionsByCharacter(characterId) {
		const supabase = window.supabaseClient;
		if (!supabase) return [];
		const { data, error } = await supabase.from('charater_expressions').select('*').eq('character_id', characterId);
		if (error) throw error;
		return data || [];
	},

	// ============= Assets =============
	/**
	 * Get all assets
	 * @returns {Promise<Array>}
	 */
	async getAssets() {
		const supabase = window.supabaseClient;
		if (!supabase) return [];
		const { data, error } = await supabase.from('assets').select('*');
		if (error) throw error;
		return data || [];
	},

	/**
	 * Get assets by type
	 * @param {string} type
	 * @returns {Promise<Array>}
	 */
	async getAssetsByType(type) {
		const supabase = window.supabaseClient;
		if (!supabase) return [];
		const { data, error } = await supabase.from('assets').select('*').eq('type', type);
		if (error) throw error;
		return data || [];
	},

	/**
	 * Get assets by category
	 * @param {string} category
	 * @returns {Promise<Array>}
	 */
	async getAssetsByCategory(category) {
		const supabase = window.supabaseClient;
		if (!supabase) return [];
		const { data, error } = await supabase.from('assets').select('*').eq('category', category);
		if (error) throw error;
		return data || [];
	},

	/**
	 * Get a single asset by asset_id
	 * @param {string} assetId
	 * @returns {Promise<Object|null>}
	 */
	async getAsset(assetId) {
		const supabase = window.supabaseClient;
		if (!supabase) return null;
		const { data, error } = await supabase.from('assets').select('*').eq('asset_id', assetId).limit(1);
		if (error) throw error;
		return Array.isArray(data) && data.length > 0 ? data[0] : null;
	}
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
	module.exports = SupabaseAPI;
}

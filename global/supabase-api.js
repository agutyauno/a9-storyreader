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
		return SupabaseClient.get('regions', {
			order: 'display_order',
			ascending: true
		});
	},

	/**
	 * Get a single region by region_id
	 * @param {string} regionId
	 * @returns {Promise<Object|null>}
	 */
	async getRegion(regionId) {
		return SupabaseClient.getOne('regions', 'region_id', regionId);
	},

	// ============= Arcs =============
	/**
	 * Get all arcs for a region
	 * @param {string} regionId
	 * @returns {Promise<Array>}
	 */
	async getArcsByRegion(regionId) {
		return SupabaseClient.get('arcs', {
			filters: [{ column: 'region_id', operator: 'eq', value: regionId }],
			order: 'display_order',
			ascending: true
		});
	},

	/**
	 * Get a single arc by arc_id
	 * @param {string} arcId
	 * @returns {Promise<Object|null>}
	 */
	async getArc(arcId) {
		return SupabaseClient.getOne('arcs', 'arc_id', arcId);
	},

	// ============= Events =============
	/**
	 * Get all events for an arc
	 * @param {string} arcId
	 * @returns {Promise<Array>}
	 */
	async getEventsByArc(arcId) {
		return SupabaseClient.get('events', {
			filters: [{ column: 'arc_id', operator: 'eq', value: arcId }],
			order: 'display_order',
			ascending: true
		});
	},

	/**
	 * Get a single event by event_id
	 * @param {string} eventId
	 * @returns {Promise<Object|null>}
	 */
	async getEvent(eventId) {
		return SupabaseClient.getOne('events', 'event_id', eventId);
	},

	// ============= Stories =============
	/**
	 * Get all stories for an event
	 * @param {string} eventId
	 * @returns {Promise<Array>}
	 */
	async getStoriesByEvent(eventId) {
		return SupabaseClient.get('stories', {
			filters: [{ column: 'event_id', operator: 'eq', value: eventId }],
			order: 'display_order',
			ascending: true
		});
	},

	/**
	 * Get a single story by story_id
	 * @param {string} storyId
	 * @returns {Promise<Object|null>}
	 */
	async getStory(storyId) {
		return SupabaseClient.getOne('stories', 'story_id', storyId);
	},

	// ============= Characters =============
	/**
	 * Get all characters
	 * @returns {Promise<Array>}
	 */
	async getCharacters() {
		return SupabaseClient.get('characters');
	},

	/**
	 * Get a single character by character_id
	 * @param {string} characterId
	 * @returns {Promise<Object|null>}
	 */
	async getCharacter(characterId) {
		return SupabaseClient.getOne('characters', 'character_id', characterId);
	},

	/**
	 * Get characters for an event (via event_characters junction table)
	 * @param {string} eventId
	 * @returns {Promise<Array>}
	 */
	async getCharactersByEvent(eventId) {
		// First get the character IDs from event_characters
		const eventCharacters = await SupabaseClient.get('event_characters', {
			select: 'character_id',
			filters: [{ column: 'event_id', operator: 'eq', value: eventId }]
		});

		if (!eventCharacters || eventCharacters.length === 0) return [];

		const characterIds = eventCharacters.map(ec => ec.character_id);

		// Fetch base character rows
		const characters = await SupabaseClient.get('characters', {
			filters: [{ column: 'character_id', operator: 'in', value: characterIds }]
		});

		// Fetch expressions for these characters
		const expressions = await SupabaseClient.get('charater_expressions', {
			filters: [{ column: 'character_id', operator: 'in', value: characterIds }]
		});

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
		return SupabaseClient.get('gallery', {
			filters: [{ column: 'event_id', operator: 'eq', value: eventId }],
			order: 'display_order',
			ascending: true
		});
	},

	// ============= Suggestions =============
	/**
	 * Get all suggestions for an arc, ordered by position
	 * @param {string} arcId
	 * @returns {Promise<Array>}
	 */
	async getSuggestionsByArc(arcId) {
		return SupabaseClient.get('suggestions', {
			filters: [{ column: 'arc_id', operator: 'eq', value: arcId }],
			order: 'position',
			ascending: true
		});
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
		return SupabaseClient.get('charater_expressions', {
			filters: [{ column: 'character_id', operator: 'eq', value: characterId }]
		});
	},

	// ============= Assets =============
	/**
	 * Get all assets
	 * @returns {Promise<Array>}
	 */
	async getAssets() {
		return SupabaseClient.get('assets');
	},

	/**
	 * Get assets by type
	 * @param {string} type
	 * @returns {Promise<Array>}
	 */
	async getAssetsByType(type) {
		return SupabaseClient.get('assets', {
			filters: [{ column: 'type', operator: 'eq', value: type }]
		});
	},

	/**
	 * Get assets by category
	 * @param {string} category
	 * @returns {Promise<Array>}
	 */
	async getAssetsByCategory(category) {
		return SupabaseClient.get('assets', {
			filters: [{ column: 'category', operator: 'eq', value: category }]
		});
	},

	/**
	 * Get a single asset by asset_id
	 * @param {string} assetId
	 * @returns {Promise<Object|null>}
	 */
	async getAsset(assetId) {
		return SupabaseClient.getOne('assets', 'asset_id', assetId);
	}
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
	module.exports = SupabaseAPI;
}

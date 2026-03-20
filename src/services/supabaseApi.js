import { supabase } from './supabaseClient';

export const SupabaseAPI = {
	// ============= Regions =============
	async getRegions() {
		const { data, error } = await supabase.from('regions').select('*').order('display_order', { ascending: true });
		if (error) throw error;
		return data || [];
	},
	async getRegion(regionId) {
		const { data, error } = await supabase.from('regions').select('*').eq('region_id', regionId).limit(1);
		if (error) throw error;
		return Array.isArray(data) && data.length > 0 ? data[0] : null;
	},

	// ============= Arcs =============
	async getArcsByRegion(regionId) {
		const { data, error } = await supabase.from('arcs').select('*').eq('region_id', regionId).order('display_order', { ascending: true });
		if (error) throw error;
		return data || [];
	},
	async getArc(arcId) {
		const { data, error } = await supabase.from('arcs').select('*').eq('arc_id', arcId).limit(1);
		if (error) throw error;
		return Array.isArray(data) && data.length > 0 ? data[0] : null;
	},

	// ============= Events =============
	async getEventsByArc(arcId) {
		const { data, error } = await supabase.from('events').select('*').eq('arc_id', arcId).order('display_order', { ascending: true });
		if (error) throw error;
		return data || [];
	},
	async getEvent(eventId) {
		const { data, error } = await supabase.from('events').select('*').eq('event_id', eventId).limit(1);
		if (error) throw error;
		return Array.isArray(data) && data.length > 0 ? data[0] : null;
	},

	// ============= Stories =============
	async getStoriesByEvent(eventId) {
		const { data, error } = await supabase.from('stories').select('*').eq('event_id', eventId).order('display_order', { ascending: true });
		if (error) throw error;
		return data || [];
	},
	async getStory(storyId) {
		const { data, error } = await supabase.from('stories').select('*').eq('story_id', storyId).limit(1);
		if (error) throw error;
		return Array.isArray(data) && data.length > 0 ? data[0] : null;
	},

	// ============= Characters =============
	async getCharacters() {
		const { data, error } = await supabase.from('characters').select('*');
		if (error) throw error;
		return data || [];
	},
	async getCharacter(characterId) {
		const { data, error } = await supabase.from('characters').select('*').eq('character_id', characterId).limit(1);
		if (error) throw error;
		return Array.isArray(data) && data.length > 0 ? data[0] : null;
	},
	async getCharactersByEvent(eventId) {
		const { data: eventCharacters, error: evErr } = await supabase.from('event_characters').select('character_id').eq('event_id', eventId);
		if (evErr) throw evErr;
		if (!eventCharacters || eventCharacters.length === 0) return [];
		const characterIds = eventCharacters.map(ec => ec.character_id);

		const { data: characters, error: chErr } = await supabase.from('characters').select('*').in('character_id', characterIds);
		if (chErr) throw chErr;

		const { data: expressions, error: exprErr } = await supabase.from('charater_expressions').select('*').in('character_id', characterIds);
		if (exprErr) throw exprErr;

		const exprMap = {};
		if (expressions && expressions.length > 0) {
			expressions.forEach(e => {
				if (!exprMap[e.character_id]) exprMap[e.character_id] = [];
				exprMap[e.character_id].push(e);
			});
			for (const cid of Object.keys(exprMap)) {
				const list = exprMap[cid];
				exprMap[cid] = list.find(x => x.name === 'default') || list[0];
			}
		}

		return (characters || []).map(c => {
			const e = exprMap[c.character_id];
			return { ...c, avatar_url: e ? (e.avatar_url || '') : '', image_url: e ? (e.full_url || '') : '' };
		});
	},

	// ============= Gallery =============
	async getGalleryByEvent(eventId) {
		const { data, error } = await supabase.from('gallery').select('*').eq('event_id', eventId).order('display_order', { ascending: true });
		if (error) throw error;
		return data || [];
	},

	// ============= Suggestions =============
	async getSuggestionsByArc(arcId) {
		const { data, error } = await supabase.from('suggestions').select('*').eq('arc_id', arcId).order('position', { ascending: true });
		if (error) throw error;
		return data || [];
	},
	async getSuggestedEvents(arcId) {
		const suggestions = await this.getSuggestionsByArc(arcId);
		if (suggestions.length === 0) return [];
		const events = [];
		for (const suggestion of suggestions) {
			const event = await this.getEvent(suggestion.target_event_id);
			if (event) events.push({ ...event, suggestion_position: suggestion.position });
		}
		return events;
	},

	// ============= Character Expressions =============
	async getExpressionsByCharacter(characterId) {
		const { data, error } = await supabase.from('charater_expressions').select('*').eq('character_id', characterId);
		if (error) throw error;
		return data || [];
	},

	// ============= Assets =============
	async getAssets() {
		const { data, error } = await supabase.from('assets').select('*');
		if (error) throw error;
		return data || [];
	},
	async getAssetsByType(type) {
		const { data, error } = await supabase.from('assets').select('*').eq('type', type);
		if (error) throw error;
		return data || [];
	},
	async getAssetsByCategory(category) {
		const { data, error } = await supabase.from('assets').select('*').eq('category', category);
		if (error) throw error;
		return data || [];
	},
	async getAsset(assetId) {
		const { data, error } = await supabase.from('assets').select('*').eq('asset_id', assetId).limit(1);
		if (error) throw error;
		return Array.isArray(data) && data.length > 0 ? data[0] : null;
	}
};

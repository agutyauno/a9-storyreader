// Service stub for story-related tables: regions, arcs, events, stories
// Provides basic CRUD: list, get, create, update, delete

const useMock = window.APP_CONFIG?.useMockData ?? true;

// We'll expose specific helpers per resource

async function listRegions() {
    if (useMock) return mockStoryData.map(r => ({ ...r }));
    // TODO: Supabase select
    return [];
}

async function getRegion(regionId) {
    if (useMock) return mockStoryData.find(r => r.region_id === regionId || r.id === regionId) || null;
    return null;
}

async function createRegion(meta = {}) {
    if (useMock) {
        const newRegion = {
            id: mockStoryData.length > 0 ? Math.max(...mockStoryData.map(r => r.id)) + 1 : 1,
            region_id: meta.region_id || `region-${Date.now()}`,
            name: meta.name || 'Unnamed',
            description: meta.description || '',
            icon_url: meta.icon_url || ''
        };
        mockStoryData.push(newRegion);
        return newRegion;
    }
    // TODO: Supabase insert into regions
    return null;
}

// For arcs/events/stories, UI currently nests children — adaptors will be added on demand.

export default {
    listRegions,
    getRegion,
    createRegion
};

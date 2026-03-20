// Regions service stub
const useMock = window.APP_CONFIG?.useMockData ?? true;

async function list() { return await import('./stories.js').then(m => m.default.listRegions()); }
async function get(id) { return await import('./stories.js').then(m => m.default.getRegion(id)); }
async function create(meta) { return await import('./stories.js').then(m => m.default.createRegion(meta)); }
async function update(id, meta) { /* TODO */ }
async function remove(id) { /* TODO */ }

export default { list, get, create, update, delete: remove };

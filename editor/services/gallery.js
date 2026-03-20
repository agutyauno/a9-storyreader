// Gallery service stub
const useMock = window.APP_CONFIG?.useMockData ?? true;

async function list(eventId = null) { /* TODO */ return []; }
async function get(galleryId) { /* TODO */ return null; }
async function create(meta, file = null) { /* TODO */ }
async function update(id, meta, file = null) { /* TODO */ }
async function remove(id) { /* TODO */ }

export default { list, get, create, update, delete: remove };

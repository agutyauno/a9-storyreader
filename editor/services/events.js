// Event service stub
const useMock = window.APP_CONFIG?.useMockData ?? true;

async function list(arcId = null) { /* TODO */ return []; }
async function get(eventId) { /* TODO */ return null; }
async function create(meta) { /* TODO */ }
async function update(id, meta) { /* TODO */ }
async function remove(id) { /* TODO */ }

export default { list, get, create, update, delete: remove };

// Arc service stub
const useMock = window.APP_CONFIG?.useMockData ?? true;

async function list( regionId = null ) { /* TODO: implement */ return []; }
async function get(arcId) { /* TODO */ return null; }
async function create(meta) { /* TODO */ }
async function update(id, meta) { /* TODO */ }
async function remove(id) { /* TODO */ }

export default { list, get, create, update, delete: remove };

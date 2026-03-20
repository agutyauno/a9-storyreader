// Suggestions service stub
const useMock = window.APP_CONFIG?.useMockData ?? true;

async function list() { return []; }
async function get(id) { return null; }
async function create(meta) { return null; }
async function update(id, meta) { return null; }
async function remove(id) { return null; }

export default { list, get, create, update, delete: remove };

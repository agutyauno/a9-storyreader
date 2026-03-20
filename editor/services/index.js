// Aggregator for service stubs
import Assets from './assets.js';
import Characters from './characters.js';
import Stories from './stories.js';

async function uploadFile(file, folderPath) {
    // Centralized upload: convert file to data URL, then call edge/upload endpoint.
    // Use mock behavior when configured.
    const useMock = window.APP_CONFIG?.useMockData ?? false;

    // Convert file to data URL
    let dataUrl = null;
    try {
        dataUrl = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(file);
        });
    } catch (err) {
        console.warn('Services.uploadFile: failed to read file', err);
    }

    if (useMock) {
        return { path: null, url: URL.createObjectURL(file) };
    }

    // Call Supabase edge function (GitHub manager) to save file to repository
    try {
        // derive functions domain from SUPABASE_URL
        const funcHost = (typeof SUPABASE_URL === 'string') ? SUPABASE_URL.replace('.supabase.co', '.functions.supabase.co') : null;
        const functionName = 'github-manager';
        const fnUrl = funcHost ? `${funcHost}/${functionName}` : null;

        if (!fnUrl) throw new Error('No functions host available');

        const fileName = file.name || `upload-${Date.now()}`;
        const payload = {
            action: 'save',
            folderPath: folderPath,
            fileName: fileName,
            contentBase64: dataUrl,
            branch: 'main'
        };

        const token = localStorage.getItem('supabase_access_token');
        const headers = {
            'Content-Type': 'application/json',
            'apikey': typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : ''
        };
        // Only include Authorization if we have an actual access token (JWT). Do NOT send anon key as Authorization.
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(fnUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const body = await res.json().catch(() => null);
        if (!res.ok) {
            console.warn('Services.uploadFile: function responded with error', res.status, body);
            return { path: null, url: '' };
        }

        // expected response: { success:true, path, sha, commitUrl }
        const path = body?.path || null;
        const sha = body?.sha || null;
        const commitUrl = body?.commitUrl || null;

        // Public raw URL on GitHub
        const owner = 'agutyauno';
        const repo = 'a9sr-data';
        const branch = 'main';
        const url = path ? `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}` : '';

        return { path, url, sha, commitUrl };
    } catch (err) {
        console.warn('Services.uploadFile: upload failed', err);
        return { path: null, url: '' };
    }
}

export default {
    Assets,
    Characters,
    Stories,
    uploadFile
};

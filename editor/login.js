async function supabaseSignInFromPage(email, password) {
    const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
        const msg = data?.error_description || data?.error || 'Sign in failed';
        throw new Error(msg);
    }

    const token = data.access_token;
    SupabaseClient.setAuthToken(token);
    localStorage.setItem('supabase_access_token', token);
    localStorage.setItem('supabase_refresh_token', data.refresh_token || '');
    localStorage.setItem('supabase_user', JSON.stringify(data.user || {}));
    return data;
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const errEl = document.getElementById('login-error');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errEl.style.display = 'none';
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        try {
            await supabaseSignInFromPage(email, password);
            window.location.href = 'index.html';
        } catch (err) {
            errEl.textContent = err.message || 'Login failed';
            errEl.style.display = 'block';
        }
    });

    // If already logged in, go to editor
    const existing = localStorage.getItem('supabase_access_token');
    if (existing) {
        SupabaseClient.setAuthToken(existing);
        window.location.href = 'index.html';
    }
    // Submit on Enter key anywhere (except inside textarea)
    document.addEventListener('keydown', (ev) => {
        if (ev.key !== 'Enter') return;
        if (ev.shiftKey || ev.ctrlKey || ev.metaKey) return;
        const active = document.activeElement;
        if (active && active.tagName === 'TEXTAREA') return;
        // Prevent double-submission default behavior
        ev.preventDefault();
        if (form) {
            if (typeof form.requestSubmit === 'function') form.requestSubmit();
            else {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.click();
                else form.submit();
            }
        }
    });
});
